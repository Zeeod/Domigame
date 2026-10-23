/**
 * Plunder Expansion Module
 *
 * Registers Plunder-specific mechanics:
 * - Trait cost modifiers (e.g., 'Cheap' trait reduces cost by 1)
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';

export const PlunderModule: ExpansionModule = {
    id: 'plunder',
    name: 'Pillage',

    effectHandlers: [
        {
            // Reckless: follow the instructions of the played card twice; it returns to its pile when discarded from play
            type: 'PLAY_AGAIN',
            handler: (state, player, _effect, ctx: any) => {
                const id = ctx?.playedCardInstanceId;
                const card = id ? player.playArea.find(c => c.instanceId === id) : undefined;
                if (!card) return { state, needsChoice: false };
                (card as any).reckless = true;
                const def = CardRegistry.get(card.id);
                const effects = def?.effects || [];
                for (let i = effects.length - 1; i >= 0; i--) {
                    state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: effects[i] as any, context: { sourceCardInstanceId: id } });
                }
                return { state, needsChoice: false };
            }
        }
    ],

    costModifiers: [
        {
            id: 'plunder:trait_cheap',
            priority: 200, // Run late (after card-specific modifiers)
            modifier: (state, _playerId, cardId, currentCost) => {
                const pile = state.supply[cardId];
                if (pile?.traits?.includes('cheap')) {
                    return currentCost - 1;
                }
                return currentCost;
            }
        }
    ]
};
