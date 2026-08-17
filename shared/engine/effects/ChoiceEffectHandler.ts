import { GameState, PlayerState, EffectResult } from '../GameState.js';
import { PromptType } from '../prompts/Prompt.js';
import { EffectUtils } from '../EffectUtils.js';

export class ChoiceEffectHandler {
    public static handleChooseOption(state: GameState, player: PlayerState, effect: any, ctx: any = {}): EffectResult {
        const count = effect.count !== undefined ? effect.count : 1;
        let min = effect.min !== undefined ? effect.min : count;
        let max = effect.max !== undefined ? effect.max : count;

        // --- ELDER (Allies) ---
        const hasElder = state.activeRestrictions?.some(r => r.type === 'ELDER_EFFECT_ACTIVE' && r.sourcePlayerId === player.id);
        if (hasElder) {
            min++;
            max++;
        }

        state.pendingDecision = {
            id: `option_${Date.now()}`,
            playerId: player.id,
            type: PromptType.SELECT_OPTION,
            message: effect.message || 'Choisissez une option',
            options: effect.options,
            constraints: {
                min,
                max,
                sourceZone: 'hand' // Default/Neutral
            },
            context: {
                ...ctx,
                specialAction: effect.specialAction || 'CHOOSE_OPTION',
                different: effect.different,
                sourceCardInstanceId: ctx.sourceCardInstanceId
            }
        };
        return { state, needsChoice: true };
    }

    public static handleReorder(state: GameState, player: PlayerState, effect: any): EffectResult {
        const sourceZone = effect.sourceZone || 'HAND';
        const cards = sourceZone === 'HAND' ? player.hand :
            sourceZone === 'DECK' ? player.deck :
                sourceZone === 'DISCARD' ? player.discardPile :
                    player.aside;

        if (cards.length === 0) return { state, needsChoice: false };

        state.pendingDecision = {
            id: `reorder_${Date.now()}`,
            playerId: player.id,
            type: PromptType.REORDER,
            message: effect.message || 'Replacez les cartes dans l\'ordre souhaité',
            context: {
                specialAction: 'REORDER',
                sourceZone,
                destination: effect.destination || sourceZone,
                cards: cards.map(c => ({ id: c.id, instanceId: c.instanceId }))
            }
        };
        return { state, needsChoice: true };
    }
    public static handleChooseFromZone(state: GameState, player: PlayerState, effect: any, ctx: any = {}): EffectResult {
        const sourceZoneRaw = effect.sourceZone || 'HAND';
        const sourceZone = sourceZoneRaw.toUpperCase();
        const maxAmount = effect.max !== undefined ? effect.max : EffectUtils.getAmount(state, player, effect.amount || 1);
        const minAmount = effect.min !== undefined ? effect.min : (effect.optional ? 0 : maxAmount);

        let availableCards = sourceZone === 'HAND' ? player.hand :
            sourceZone === 'DECK' ? player.deck :
                (sourceZone === 'DISCARD' || sourceZone === 'DISCARDPILE') ? player.discardPile :
                    sourceZone === 'LIMBO' ? player.limbo :
                        (sourceZone === 'PLAYAREA' || sourceZone === 'PLAY_AREA') ? player.playArea :
                            sourceZone === 'SUPPLY' ? Object.keys(state.supply || {}).filter(k => (state.supply[k]?.count || 0) > 0).map(k => ({ id: k, instanceId: k })) :
                                player.aside;

        availableCards = availableCards || [];
        const validCards = EffectUtils.filterCards(availableCards, effect.filter);

        if (validCards.length === 0 || (validCards.length < minAmount && effect.onNoMatch)) {
            // Cannot fulfill constraint, skip choice. Apply fallback if it exists.
            if (effect.onNoMatch && validCards.length < minAmount) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: effect.onNoMatch,
                    context: ctx
                });
            }
            return { state, needsChoice: false };
        }

        state.pendingDecision = {
            id: `choose_zone_${Date.now()}`,
            playerId: player.id,
            type: PromptType.CHOOSE_CARDS,
            message: effect.message || `Choisissez jusqu'à ${maxAmount} carte(s) depuis votre ${sourceZone}`,
            constraints: {
                min: minAmount,
                max: maxAmount,
                sourceZone: (effect.sourceZone || sourceZoneRaw || 'hand') as any,
                filter: effect.filter
            },
            context: {
                ...ctx,
                specialAction: effect.specialAction || 'ZONE_CHOICE',
                destination: effect.destination,
                sourceCardInstanceId: ctx.sourceCardInstanceId,
                sourceZone: (effect.sourceZone || sourceZoneRaw || 'hand') as any,
                action: effect.action,
                position: effect.position,
                effects: effect.effects,
                next: effect.next,
                onSuccess: effect.onSuccess,
                // Send available cards for UI rendering
                cards: availableCards.map(c => ({
                    id: c.id,
                    instanceId: c.instanceId
                }))
            }
        };
        return { state, needsChoice: true };
    }

    public static handleSelectFromDiscard(state: GameState, player: PlayerState, effect: any, ctx: any = {}): EffectResult {
        const amount = effect.amount || 1;
        state.pendingDecision = {
            id: `select_discard_${Date.now()}`,
            playerId: player.id,
            type: PromptType.CHOOSE_CARDS,
            message: effect.message || `Choisissez ${amount} carte(s) de votre défausse`,
            constraints: {
                min: amount,
                max: amount,
                sourceZone: 'DISCARD' as any,
                filter: effect.filter
            },
            context: {
                ...ctx,
                type: 'SELECT_FROM_DISCARD',
                sourceCardInstanceId: ctx.sourceCardInstanceId,
                cards: player.discardPile.map(c => ({ id: c.id, instanceId: c.instanceId }))
            }
        };
        return { state, needsChoice: true };
    }

    public static handleSelectAndApply(state: GameState, player: PlayerState, effect: any, ctx: any = {}): EffectResult {
        const sourceZoneRaw = effect.sourceZone || effect.source || 'HAND';
        const sourceZone = sourceZoneRaw.toUpperCase();
        state.pendingDecision = {
            id: `select_and_apply_${Date.now()}`,
            playerId: player.id,
            type: PromptType.CHOOSE_CARDS,
            message: effect.message || 'Choisissez des cartes',
            constraints: {
                min: effect.min || 0,
                max: effect.max || 1,
                sourceZone: sourceZone as any,
                filter: effect.filter
            },
            context: {
                ...ctx,
                specialAction: 'SELECT_AND_APPLY',
                sourceCardInstanceId: ctx.sourceCardInstanceId,
                action: effect.action,
                destination: effect.destination,
                sourceCardDestination: effect.sourceCardDestination,
                effects: effect.effects,
                next: effect.next,
                onSuccess: effect.onSuccess,
                cards: ((sourceZone === 'HAND' ? player.hand :
                    sourceZone === 'DECK' ? player.deck :
                        (sourceZone === 'DISCARD' || sourceZone === 'DISCARDPILE') ? player.discardPile :
                            sourceZone === 'LIMBO' ? player.limbo :
                                (sourceZone === 'PLAYAREA' || sourceZone === 'PLAY_AREA') ? player.playArea :
                                    player.aside) || []).map(c => ({ id: c.id, instanceId: c.instanceId }))
            }
        };
        return { state, needsChoice: true };
    }
}
