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
import { GainEffectHandler } from '../effects/GainEffectHandler.js';

export const SeasideModule: ExpansionModule = {
    id: 'seaside',
    name: 'Rivages',

    // Declare custom zones/mats this expansion introduces
    zones: ['nativeVillage', 'island'],

    effectHandlers: [
        {
            // Blockade: gain a card costing up to $4, setting it aside (back to hand next turn).
            // While it is set aside, when another player gains a copy of it on their turn, they gain a Curse.
            type: 'BLOCKADE',
            handler: (state, player, _effect, ctx) =>
                GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 4 }, {
                    destination: 'aside',
                    linkToSource: true,
                    sourceCardInstanceId: ctx?.sourceCardInstanceId,
                    next: [{ type: 'ATTACK', attackEffects: [{ type: 'BLOCKADE_WATCH' }] }]
                }, 'Blocus : recevez une carte coûtant jusqu\'à 4 💰 (mise de côté)')
        },
        {
            type: 'BLOCKADE_WATCH',
            handler: (state, victim, _effect, ctx) => {
                const gained = state.lastGainedCard?.id;
                if (!gained) return { state, needsChoice: false };
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: victim.id, once: false,
                    filter: { cardIds: [gained], onActorsTurn: true },
                    effects: [{ type: 'GAIN_CARD', cardId: 'curse' } as any],
                    expiresOnTurnOf: ctx?.attackerId,
                    description: 'Blocus : Malédiction'
                } as any);
                return { state, needsChoice: false };
            }
        },
        {
            // Monkey: until your next turn, when the player to your right gains a card, +1 Card.
            type: 'MONKEY',
            handler: (state, player) => {
                const i = state.players.findIndex(p => p.id === player.id);
                const right = state.players[(i - 1 + state.players.length) % state.players.length];
                if (right.id === player.id) return { state, needsChoice: false };
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: player.id, once: false, scope: 'OTHERS',
                    filter: { actorId: right.id },
                    effects: [{ type: 'DRAW', amount: 1 } as any],
                    expires: 'START_OF_NEXT_TURN',
                    description: 'Singe : +1 Carte'
                } as any);
                return { state, needsChoice: false };
            }
        },
        {
            // Smugglers: gain a copy of a card costing up to $6 that the player to your right gained on their last turn.
            type: 'SMUGGLERS',
            handler: (state, player) => {
                const i = state.players.findIndex(p => p.id === player.id);
                const right = state.players[(i - 1 + state.players.length) % state.players.length];
                const ids = [...new Set(right.gainedLastTurn || [])].filter(id => state.supply[id]);
                if (ids.length === 0) return { state, needsChoice: false };
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 6, cardIds: ids }, {}, 'Contrebandiers : recevez une copie d\'une carte reçue par votre voisin de droite');
            }
        },
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
