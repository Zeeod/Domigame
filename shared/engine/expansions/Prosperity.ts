/**
 * Prosperity Expansion Module
 * 
 * Registers Prosperity-specific mechanics:
 * - Quarry: Actions cost 2 less while in play
 * - Peddler: Costs 2 less for each Action in play
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';

export const ProsperityModule: ExpansionModule = {
    id: 'prosperity',
    name: 'Prospérité',

    costModifiers: [
        {
            id: 'prosperity:quarry',
            priority: 50,
            modifier: (state, playerId, cardId, currentCost) => {
                const player = state.players.find(p => p.id === playerId);
                if (!player) return currentCost;

                const cardDef = CardRegistry.get(cardId);
                if (!cardDef?.types.includes('ACTION')) return currentCost;

                const quarriesInPlay = player.playArea.filter(c => c.id === 'quarry').length;
                return currentCost - (quarriesInPlay * 2);
            }
        },
        {
            id: 'prosperity:peddler',
            priority: 60,
            modifier: (state, playerId, cardId, currentCost) => {
                if (cardId !== 'peddler') return currentCost;

                const player = state.players.find(p => p.id === playerId);
                if (!player) return currentCost;

                const actionsInPlay = player.playArea.filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def?.types.includes('ACTION');
                }).length;

                return currentCost - (actionsInPlay * 2);
            }
        }
    ]
};
