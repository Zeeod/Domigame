import { GameState, PlayerState, CardInstance, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';


export class TrashEffectHandler {
    // ... (existing methods)

    public static handleTrashActionGainUpTo3More(state: GameState, player: PlayerState, _effect: any): EffectResult {
        state.pendingDecision = {
            id: `trash_action_gain_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: 'Ecartez une carte Action de votre main',
            constraints: {
                min: 1,
                max: 1,
                sourceZone: 'hand',
                filter: {
                    cardTypes: ['ACTION']
                }
            },
            context: {
                specialAction: 'TRASH_ACTION_GAIN',
                next: [
                    { type: 'TRASH' },
                    { type: 'GAIN_CARD_PLUS_COST', amount: 3, destination: 'discardPile' }
                ]
            }
        };
        return { state, needsChoice: true };
    }

    public static handleTrash(state: GameState, player: PlayerState, effect: any, context: any = {}): EffectResult {
        const suppressLog = context?.suppressLog || false;
        const sourceCardInstanceId = context?.sourceCardInstanceId;

        let cards: CardInstance[] = [];
        if (effect.forceAll) {
            const zoneName = (effect.sourceZone || effect.source || effect.from || 'hand').toLowerCase();
            let sourceCards = (zoneName === 'playarea' || zoneName === 'play_area')
                ? player.playArea
                : (zoneName === 'discard' || zoneName === 'discardpile') ? player.discardPile
                : player.hand;

            cards = EffectUtils.filterCards(sourceCards, effect.filter);
        } else if (effect.target) {
            // Find specific target if provided (e.g. last revealed)
            // ...
        } else {
            // Usually comes from a choice prompt, so we check lastDecisionResults
            cards = state.lastDecisionResults?.cards || [];
        }

        if (cards.length === 0 && !effect.optional) {
            // Only default to sourceCardInstanceId if no choice constraints (min/max) are defined
            // and no explicit source zone is specified (which would imply a choice from that zone)
            const isChoiceEffect = effect.min !== undefined || effect.max !== undefined || effect.source !== undefined;

            if (sourceCardInstanceId && !isChoiceEffect) {
                const card = player.playArea.find(c => c.instanceId === sourceCardInstanceId) ||
                    player.hand.find(c => c.instanceId === sourceCardInstanceId);
                if (card) cards = [card];
            }

            // If still no cards, we need to prompt the user
            if (cards.length === 0) {
                state.pendingDecision = {
                    id: `trash_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: effect.message || 'Écartez une carte de votre main.',
                    constraints: {
                        min: effect.min !== undefined ? effect.min : 1,
                        max: effect.max !== undefined ? effect.max : 1,
                        sourceZone: effect.source || 'hand',
                        filter: effect.filter
                    },
                    context: {
                        ...context,
                        specialAction: 'TRASH',
                        action: 'TRASH',
                        next: [
                            { type: 'TRASH', ...effect, next: undefined },
                            ...(effect.next ? (Array.isArray(effect.next) ? effect.next : [effect.next]) : [])
                        ]
                    }
                };
                return { state, needsChoice: true };
            }
        }

        cards.forEach(card => {
            // Remove from source
            player.hand = player.hand.filter(c => c.instanceId !== card.instanceId);
            player.playArea = player.playArea.filter(c => c.instanceId !== card.instanceId);
            player.discardPile = player.discardPile.filter(c => c.instanceId !== card.instanceId);

            state.trash.push(card);
            state.lastTrashedCard = card;
            state.lastTrashedCards = [...(state.lastTrashedCards || []), card];
            player.trashedThisTurn = (player.trashedThisTurn || 0) + 1;

            if (!suppressLog) {
                EffectUtils.log(state, `${player.name} écarte ${CardRegistry.get(card.id)?.name || card.id}.`, player.id);
            }

            const def = CardRegistry.get(card.id);
            if (def?.onTrash) {
                const effects = Array.isArray(def.onTrash) ? def.onTrash : [def.onTrash];
                for (let i = effects.length - 1; i >= 0; i--) {
                    state.effectStack.push({
                        type: 'EFFECT',
                        playerId: player.id,
                        effect: effects[i],
                        context: { suppressLog: false, sourceCardInstanceId: card.instanceId }
                    });
                }
            }

            if (effect.onSuccess) {
                const onSuccessEffects = Array.isArray(effect.onSuccess) ? effect.onSuccess : [effect.onSuccess];
                for (let i = onSuccessEffects.length - 1; i >= 0; i--) {
                    state.effectStack.push({
                        type: 'EFFECT',
                        playerId: player.id,
                        effect: onSuccessEffects[i],
                        context: { suppressLog: false, sourceCardInstanceId: card.instanceId }
                    });
                }
            }
        });


        // Handle next effects (Standard chaining)
        if (effect.next) {
            const nextEffects = Array.isArray(effect.next) ? effect.next : [effect.next];
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: { type: 'SEQUENCE', effects: nextEffects },
                context: { ...context }
            });
        }

        return { state, needsChoice: false };
    }

    public static handleTrashSelf(state: GameState, player: PlayerState, sourceCardInstanceId?: string): EffectResult {
        if (!sourceCardInstanceId) return { state, needsChoice: false };

        // Find the owner before removing the card
        const owner = state.players.find(p =>
            p.playArea.some(c => c.instanceId === sourceCardInstanceId) ||
            p.hand.some(c => c.instanceId === sourceCardInstanceId) ||
            p.discardPile.some(c => c.instanceId === sourceCardInstanceId) ||
            p.aside.some(c => c.instanceId === sourceCardInstanceId)
        ) || player;

        // Search for the card instance in the entire game (attacker might be a different player)
        const card = EffectUtils.removeCardFromGame(state, sourceCardInstanceId);

        if (card) {
            state.trash.push(card);
            state.lastTrashedCard = card;
            state.lastTrashedCards = [...(state.lastTrashedCards || []), card];
            owner.trashedThisTurn = (owner.trashedThisTurn || 0) + 1;

            EffectUtils.log(state, `${owner.name} écarte sa propre carte (${CardRegistry.get(card.id)?.name}).`, owner.id);

            const def = CardRegistry.get(card.id);
            if (def?.onTrash) {
                const effects = Array.isArray(def.onTrash) ? def.onTrash : [def.onTrash];
                for (let i = effects.length - 1; i >= 0; i--) {
                    state.effectStack.push({
                        type: 'EFFECT',
                        playerId: owner.id,
                        effect: effects[i],
                        context: { suppressLog: false, sourceCardInstanceId: card.instanceId }
                    });
                }
            }
        }
        return { state, needsChoice: false };
    }

    public static handleDiscard(state: GameState, player: PlayerState, effect: any, _context: any = {}): EffectResult {
        const amount = EffectUtils.getAmount(state, player, effect.amount);
        if (effect.forceAll) {
            const cards = [...player.hand];
            const discardedCount = cards.length;
            player.discardPile.push(...cards);
            player.hand = [];
            EffectUtils.log(state, `${player.name} défausse sa main.`, player.id);
            
            if (discardedCount > 0 && effect.onSuccess) {
                const effects = Array.isArray(effect.onSuccess) ? effect.onSuccess : [effect.onSuccess];
                state.effectStack.push(...effects.map((e: any) => ({
                    type: 'EFFECT' as const,
                    playerId: player.id,
                    effect: e,
                    context: { sourceCardInstanceId: effect.sourceCardInstanceId }
                })).reverse());
            }
            return { state, needsChoice: false };
        }

        if (effect.targetSize !== undefined) {
            return this.handleDiscardToHandSize(state, player, effect);
        }

        // DISCARD logic often requires a prompt first.
        const minAmount = effect.min !== undefined ? effect.min : (effect.optional ? 0 : amount);
        const maxAmount = effect.max !== undefined ? effect.max : amount;



        state.pendingDecision = {
            id: `discard_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: effect.message || `Défaussez ${maxAmount} carte(s).`,
            constraints: { 
                min: minAmount, 
                max: maxAmount, 
                sourceZone: 'hand',
                filter: effect.filter 
            },
            context: {
                specialAction: 'DISCARD',
                action: 'DISCARD',
                requiredCount: effect.requiredCount,
                onSuccess: effect.onSuccess,
                onFailure: effect.onFailure
            }
        };

        return { state, needsChoice: true };
    }

    public static handleDiscardToHandSize(state: GameState, player: PlayerState, effect: any): EffectResult {
        const targetSize = effect.targetSize || 3;
        if (player.hand.length <= targetSize) return { state, needsChoice: false };

        const amount = player.hand.length - targetSize;
        state.pendingDecision = {
            id: `discard_to_size_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: `Défaussez jusqu'à avoir ${targetSize} cartes en main (Défaussez ${amount}).`,
            constraints: { min: amount, max: amount, sourceZone: 'hand' },
            context: { 
                specialAction: 'DISCARD',
                action: 'DISCARD'
            }
        };
        return { state, needsChoice: true };
    }

    public static handleDiscardThenDraw(state: GameState, player: PlayerState, effect: any): EffectResult {
        state.pendingDecision = {
            id: `discard_then_draw_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: effect.message || 'Défaussez n\'importe quel nombre de cartes pour en piocher autant.',
            constraints: { min: 0, max: player.hand.length, sourceZone: 'hand' },
            context: {
                specialAction: 'DISCARD_THEN_DRAW',
                cards: player.hand.map(c => ({ id: c.id, instanceId: c.instanceId }))
            }
        };
        return { state, needsChoice: true };
    }
}
