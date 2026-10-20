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
import { EffectUtils } from '../EffectUtils.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';

export const SeasideModule: ExpansionModule = {
    id: 'seaside',
    name: 'Rivages',

    // Declare custom zones/mats this expansion introduces
    zones: ['nativeVillage', 'island'],

    effectHandlers: [
        {
            // Treasure Map: trash this and a Treasure Map from your hand.
            // If you trashed two Treasure Maps, gain 4 Golds onto your deck.
            type: 'TREASURE_MAP',
            handler: (state, player, _effect, ctx) => {
                let trashed = 0;
                const selfId = ctx?.sourceCardInstanceId;
                const self = selfId && player.playArea.some(c => c.instanceId === selfId)
                    ? EffectUtils.removeCardFromPlayer(state, player, selfId) : undefined;
                if (self) { TrashEffectHandler.trashCard(state, player, self); trashed++; }

                // All Treasure Maps are identical: no need to ask which one
                const other = player.hand.find(c => c.id === 'treasure_map');
                if (other) {
                    EffectUtils.removeCardFromPlayer(state, player, other.instanceId);
                    TrashEffectHandler.trashCard(state, player, other);
                    trashed++;
                }

                if (trashed === 2) {
                    for (let i = 0; i < 4; i++) {
                        state.effectStack.push({
                            type: 'EFFECT', playerId: player.id,
                            effect: { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' } as any,
                            context: {}
                        });
                    }
                }
                return { state, needsChoice: false };
            }
        }
    ],

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
