/**
 * Base Expansion Module
 *
 * Registers the global Bridge cost modifier (Bridge reduces all card costs by 1).
 * Also registers bridge-based cost reduction from player.costReduction.
 */

import { ExpansionModule } from '../ExpansionLoader.js';

export const BaseModule: ExpansionModule = {
    id: 'base',
    name: 'Base',

    costModifiers: [
        {
            // Global cost reduction from Bridge and similar effects
            // Bridge sets player.costReduction during its play
            id: 'base:cost_reduction',
            priority: 10, // Run first (lowest priority number = earliest)
            modifier: (state, playerId, _cardId, currentCost) => {
                const player = state.players.find(p => p.id === playerId);
                if (!player) return currentCost;
                return currentCost - (player.costReduction || 0);
            }
        }
    ]
};
