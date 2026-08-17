/**
 * Nocturne Expansion Module
 *
 * Registers Nocturne-specific mechanics:
 * - Night phase injection into the phase pipeline
 * - Boon/Hex handlers (declared, resolved by existing effect handlers)
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { GameState } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { Logger } from '../Logger.js';

/**
 * Check if any player has Night cards in hand.
 */
function hasNightCards(state: GameState): boolean {
    const player = state.players[state.currentPlayerIndex];
    if (!player) return false;
    return player.hand.some(c => {
        const def = CardRegistry.get(c.id);
        return def?.types.includes('NIGHT');
    });
}

export const NocturneModule: ExpansionModule = {
    id: 'nocturne',
    name: 'Nocturne',

    phases: [
        {
            id: 'NIGHT',
            label: 'Phase de Nuit',
            canEnter: hasNightCards,
            autoSkip: (state) => !hasNightCards(state),
            onEnter: (state) => {
                Logger.log(state, '---- Phase Nuit ----');
            }
        }
    ],

    // Inject NIGHT phase after BUY in the default pipeline
    phaseInjections: [
        { phaseId: 'NIGHT', afterPhaseId: 'BUY' }
    ]
};
