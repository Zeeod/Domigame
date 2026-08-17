/**
 * Plunder Expansion Module
 *
 * Registers Plunder-specific mechanics:
 * - Trait cost modifiers (e.g., 'Cheap' trait reduces cost by 1)
 */

import { ExpansionModule } from '../ExpansionLoader.js';

export const PlunderModule: ExpansionModule = {
    id: 'plunder',
    name: 'Pillage',

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
