import { GameState, PlayerState, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { CardDefinition } from '../../types/CardDefinition.js';
import { EffectUtils } from '../EffectUtils.js';

/**
 * Attaques et fenêtre de Réaction.
 *
 * Déroulé pour chaque autre joueur (dans l'ordre du tour) :
 *  1. Défense passive en jeu (Phare, Gardien…) → l'attaque ne le touche pas.
 *  2. Fenêtre de Réaction : tant qu'il a des Réactions "contre une Attaque" en main
 *     (non encore révélées pour cette attaque), on lui demande s'il en révèle une.
 *     Chaque Réaction révélée applique ses `reactionEffects` ; si elle a `blocksAttack`
 *     (Douves), le joueur devient insensible à cette attaque.
 *  3. Quand il refuse (ou n'a plus de Réaction), l'attaque s'applique — sauf s'il est protégé.
 */
export class AttackEffectHandler {
    public static handleAttack(state: GameState, player: PlayerState, effect: any, context: any = {}): EffectResult {
        const attackerId = player.id;

        // Autres joueurs, dans l'ordre du tour à partir de l'attaquant
        const attackerIndex = state.players.findIndex(p => p.id === attackerId);
        const otherPlayers = [
            ...state.players.slice(attackerIndex + 1),
            ...state.players.slice(0, Math.max(attackerIndex, 0)),
        ];

        const attackEffect = effect.effect || effect.attackEffect || effect.attackEffects;
        const sourceCardInstanceId = effect.sourceCardInstanceId || context.sourceCardInstanceId;

        if (!attackEffect) {
            console.warn(`[AttackEffectHandler] Attack effect is missing for card ${sourceCardInstanceId || 'unknown'}`);
            return { state, needsChoice: false };
        }

        const attackItems = otherPlayers.map(p => ({
            type: 'EFFECT' as const,
            playerId: p.id,
            effect: { type: 'RESOLVE_ATTACK', attackEffect } as any,
            context: { attackerId, sourceCardInstanceId }
        }));

        state.effectStack.push(...attackItems.reverse());
        return { state, needsChoice: false };
    }

    /** Peut-on révéler cette carte contre une attaque, maintenant ? */
    private static canReactToAttack(player: PlayerState, def: CardDefinition | undefined): boolean {
        if (!def) return false;
        const isAttackReaction = def.blocksAttack
            || (def.isReaction && (def.reactionTrigger === 'ATTACK' || def.reactionTrigger === undefined));
        if (!isAttackReaction) return false;

        const cond = def.reactionCondition;
        if (cond?.type === 'HAND_SIZE') {
            const n = player.hand.length;
            if (cond.comparator === '>=' && !(n >= cond.value)) return false;
            if (cond.comparator === '<=' && !(n <= cond.value)) return false;
            if (cond.comparator === '==' && n !== cond.value) return false;
        }
        return true;
    }

    public static resolveAttack(state: GameState, player: PlayerState, effect: any, context: any = {}): EffectResult {
        const revealed: string[] = context.revealedReactions || [];
        const isProtected = !!context.attackBlocked;

        // 1. Défense passive (cartes Durée en jeu)
        const hasPassiveDefense = player.playArea.some(c => CardRegistry.get(c.id)?.blocksAttack
            && !CardRegistry.get(c.id)?.types.includes('REACTION'));
        if (hasPassiveDefense) {
            EffectUtils.logEvent(state, {
                actionType: 'ATTACK_BLOCKED',
                activePlayerId: player.id,
                message: `${player.name} est protégé contre l'attaque.`
            });
            return { state, needsChoice: false };
        }

        // 2. Fenêtre de Réaction
        const reactions = player.hand.filter(c =>
            !revealed.includes(c.instanceId) && this.canReactToAttack(player, CardRegistry.get(c.id)));

        if (reactions.length > 0) {
            state.pendingDecision = {
                id: `react_${Date.now()}_${Math.random()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: "Voulez-vous révéler une carte Réaction ?",
                constraints: {
                    min: 0,
                    max: 1,
                    sourceZone: 'hand',
                    filter: { cardIds: reactions.map(c => c.id) }
                },
                context: {
                    ...context,
                    specialAction: 'REACTION_DECISION',
                    attackEffect: effect,
                    attackerId: context.attackerId,
                    reactionCards: reactions.map(c => c.instanceId),
                    revealedReactions: revealed,
                    attackBlocked: isProtected
                }
            } as any;
            return { state, needsChoice: true };
        }

        // 3. Appliquer l'attaque
        return this.applyAttack(state, player, effect, context, isProtected);
    }

    /** Réponse du joueur à la fenêtre de Réaction. */
    public static resolveReactionDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;
        const ctx = decision.context || {};

        const chosenIds: string[] = payload.cardInstanceIds || payload.cardIds
            || (payload.cards || []).map((c: any) => c.instanceId) || [];
        const chosen = player.hand.find(c => chosenIds.includes(c.instanceId) && (ctx.reactionCards || []).includes(c.instanceId));

        const baseContext = {
            attackerId: ctx.attackerId,
            sourceCardInstanceId: ctx.sourceCardInstanceId,
            revealedReactions: ctx.revealedReactions || [],
            attackBlocked: !!ctx.attackBlocked,
        };

        if (!chosen) {
            // Plus de réaction : l'attaque s'applique (sauf protection)
            this.applyAttack(state, player, ctx.attackEffect, baseContext, baseContext.attackBlocked);
            return;
        }

        const def = CardRegistry.get(chosen.id);
        EffectUtils.logEvent(state, {
            actionType: 'REACTION',
            activePlayerId: player.id,
            sourceCard: chosen.id,
            message: `${player.name} révèle ${def?.name ?? chosen.id}.`
        });

        // Relancer la fenêtre de Réaction après les effets de celle-ci
        state.effectStack.push({
            type: 'EFFECT',
            playerId: player.id,
            effect: { type: 'RESOLVE_ATTACK', attackEffect: ctx.attackEffect } as any,
            context: {
                ...baseContext,
                revealedReactions: [...baseContext.revealedReactions, chosen.instanceId],
                attackBlocked: baseContext.attackBlocked || !!def?.blocksAttack,
            }
        });

        // Effets de la Réaction (résolus avant la reprise de l'attaque)
        const reactionEffects = def?.reactionEffects || def?.onReaction || [];
        const items = reactionEffects.map((e: any) => ({
            type: 'EFFECT' as const,
            playerId: player.id,
            effect: e,
            context: { sourceCardInstanceId: chosen.instanceId, sourceCardId: chosen.id, isReaction: true }
        }));
        state.effectStack.push(...items.reverse());
    }

    private static applyAttack(state: GameState, player: PlayerState, effect: any, context: any, isProtected: boolean): EffectResult {
        if (isProtected) {
            EffectUtils.logEvent(state, {
                actionType: 'ATTACK_BLOCKED',
                activePlayerId: player.id,
                message: `${player.name} n'est pas affecté par l'attaque.`
            });
            return { state, needsChoice: false };
        }

        const attackPayload = effect?.attackEffect !== undefined ? effect.attackEffect : effect;
        const effectsToApply = Array.isArray(attackPayload) ? attackPayload : [attackPayload];

        const stackItems = effectsToApply.filter(Boolean).map((e: any) => ({
            type: 'EFFECT' as const,
            playerId: player.id,
            effect: e,
            context: {
                attackerId: context.attackerId,
                sourceCardInstanceId: context.sourceCardInstanceId,
                isAttack: true
            }
        }));

        state.effectStack.push(...stackItems.reverse());
        return { state, needsChoice: false };
    }
}
