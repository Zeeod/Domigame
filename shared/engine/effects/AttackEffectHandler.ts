import { GameState, PlayerState, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';

export class AttackEffectHandler {
    public static handleAttack(state: GameState, player: PlayerState, effect: any, context: any = {}): EffectResult {
        const attackerId = player.id;
        const otherPlayers = state.players.filter(p => p.id !== attackerId);

        // Normalize effect: support both singular and plural properties
        const attackEffect = effect.effect || effect.attackEffect || effect.attackEffects;
        const sourceCardInstanceId = effect.sourceCardInstanceId || context.sourceCardInstanceId;

        if (!attackEffect) {
            console.warn(`[AttackEffectHandler] Attack effect is missing for card ${sourceCardInstanceId || 'unknown'}`);
            return { state, needsChoice: false };
        }

        // Return attack effects for each other player
        const attackEffects = otherPlayers.map(p => ({
            type: 'EFFECT' as const,
            playerId: p.id,
            effect: {
                type: 'RESOLVE_ATTACK',
                attackEffect
            } as any,
            context: { attackerId, sourceCardInstanceId }
        }));

        state.effectStack.push(...attackEffects.reverse());
        return { state, needsChoice: false };
    }

    public static resolveAttack(state: GameState, player: PlayerState, effect: any, context: any): EffectResult {
        // 1. Check for passive defenses (Lighthouse, Guardian, etc.) from Duration cards in play
        const hasPassiveDefense = player.playArea.some(c => CardRegistry.get(c.id)?.blocksAttack);
        if (hasPassiveDefense) {
            EffectUtils.log(state, `${player.name} est protégé par une défense passive.`, player.id);
            EffectUtils.logEvent(state, {
                actionType: 'ATTACK_BLOCKED',
                activePlayerId: player.id,
                message: `${player.name} est protégé contre l'attaque.`
            });
            return { state, needsChoice: false };
        }

        // 2. Check for interactive reactions (Moat, etc.)
        const reactions = player.hand.filter(c => {
            const def = CardRegistry.get(c.id);
            return def && (def.blocksAttack || def.isReaction);
        });

        if (reactions.length > 0) {
            // Create a prompt for the user
            state.pendingDecision = {
                id: `react_${Date.now()}_${Math.random()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: "Voulez-vous révéler une carte Réaction ?",
                constraints: {
                    min: 0,
                    max: 1,
                    sourceZone: 'hand',
                    filter: {
                        cardIds: reactions.map(c => c.id) // Only allow reactions
                    }
                },
                // Store the context to resume attack resolution
                context: {
                    specialAction: 'REACTION_DECISION',
                    attackEffect: effect, // Original attack effect
                    attackerId: context.attackerId,
                    reactionCards: reactions.map(c => c.instanceId),
                    ...context
                }
            };
            return { state, needsChoice: true };
        }

        // If no reactions, proceed to apply attack effect
        const attackPayload = effect.attackEffect !== undefined ? effect.attackEffect : effect;
        const effectsToApply = Array.isArray(attackPayload) ? attackPayload : [attackPayload];

        const stackItems = effectsToApply.map(e => ({
            type: 'EFFECT' as const,
            playerId: player.id,
            effect: e,
            context: { ...context, isAttack: true }
        }));

        state.effectStack.push(...stackItems.reverse());

        return { state, needsChoice: false };
    }
}
