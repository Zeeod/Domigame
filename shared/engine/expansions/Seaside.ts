/**
 * Seaside Expansion Module
 *
 * Registers Seaside-specific mechanics:
 * - Duration card initialization support
 * - Native Village / Island mat zone declarations
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { GameState, getCurrentPlayer } from '../GameState.js';
import { Logger } from '../Logger.js';

export const SeasideModule: ExpansionModule = {
    id: 'seaside',
    name: 'Rivages',

    // Declare custom zones/mats this expansion introduces
    zones: ['nativeVillageMat', 'islandMat'],

    eventHooks: [
        {
            id: 'seaside:duration_resolve',
            event: 'TURN_START',
            priority: 'EARLY',
            handler: (_state, _event) => {
                // Duration resolution is handled by DurationTracker.resolveAll()
                // called from TurnMachine.startNextTurn.
                // This hook exists as a documentation placeholder for the expansion system.
            }
        },
        {
            id: 'seaside:treasury_cleanup',
            event: 'PHASE_ENTER', // Runs when entering CLEANUP phase
            priority: 'EARLY', // Run BEFORE system cleanup (which moves hand/play to discard)
            handler: (state: GameState, event: any) => {
                if (event.context.phaseId === 'CLEANUP') {
                    const player = getCurrentPlayer(state);
                    if (!player) return;

                    // Treasury: If in play and no VP bought, put on deck
                    const treasuries = player.playArea.filter(c => c.id === 'treasury');
                    if (treasuries.length > 0 && !player.boughtVictoryCard) {
                        for (const treasury of treasuries) {
                            // Move from playArea to deck
                            player.playArea = player.playArea.filter(c => c.instanceId !== treasury.instanceId);
                            player.deck.unshift(treasury);
                        }
                        Logger.log(state, `${player.name} replace ${treasuries.length} Trésorerie(s) sur son deck.`);
                    }
                }
            }
        }
    ]
};
