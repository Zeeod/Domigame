import { GameState, EffectResult } from '../GameState.js';
import { PlayerState } from '../PlayerState.js';

export class DurationEffectHandler {
    static handleSetAsideLinked(state: GameState, player: PlayerState, effect: any, sourceCardInstanceId?: string): EffectResult {
        const count = effect.count || 1;
        if (player.hand.length === 0) return { state, needsChoice: false };

        const min = effect.min !== undefined ? effect.min : Math.min(count, player.hand.length);
        const max = effect.max !== undefined ? effect.max : Math.min(count, player.hand.length);

        state.pendingDecision = {
            id: `set_aside_linked_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS',
            message: effect.message || `Choisissez ${count} carte(s) à mettre de côté`,
            constraints: {
                min,
                max,
                sourceZone: 'hand'
            },
            context: {
                specialAction: 'SET_ASIDE_LINKED',
                sourceCardInstanceId,
                faceDown: effect.faceDown !== undefined ? effect.faceDown : true
            }
        } as any;

        return { state, needsChoice: true };
    }

    static handleReturnLinkedCards(state: GameState, player: PlayerState, sourceCardInstanceId?: string): EffectResult {
        if (!sourceCardInstanceId) return { state, needsChoice: false };

        // Card should be in playArea as it is a Duration card active at start of turn
        const sourceCard = player.playArea.find(c => c.instanceId === sourceCardInstanceId);

        if (!sourceCard || !sourceCard.linkedCards || sourceCard.linkedCards.length === 0) {
            return { state, needsChoice: false };
        }

        // Clone list to iterate safely while modifying arrays
        const linkedCards = [...sourceCard.linkedCards];

        for (const linkedCard of linkedCards) {
            // Find the card in aside zone
            const asideIndex = player.aside.findIndex(c => c.instanceId === linkedCard.instanceId);
            if (asideIndex !== -1) {
                const cardToMove = player.aside[asideIndex];

                // Move from aside to hand
                player.aside.splice(asideIndex, 1);
                player.hand.push(cardToMove);

                // Log (optional, but helpful for debugging Blockade)
                // EffectUtils.log(state, `${player.name} met ${CardRegistry.get(cardToMove.id)?.name} dans sa main (depuis la mise de côté).`, player.id);
            }
        }

        // Clear the links as they are no longer set aside
        sourceCard.linkedCards = [];

        return { state, needsChoice: false };
    }

    static handleSeaChartCheck(state: GameState, player: PlayerState): EffectResult {
        // Sea Chart specific logic
        return { state, needsChoice: false };
    }
}
