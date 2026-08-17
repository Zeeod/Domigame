import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { Logger } from '../Logger.js';
import { SupplyGenerator } from '../SupplyGenerator.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';
import { GameState } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { CardRegistry } from '../../cards/index.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { EffectDefinition } from '../../types/EffectDefinition.js';

export class RisingSunEffectHandler {
    static register() {
        EffectHandlerRegistry.register('DIVINE_WIND_EFFECT', (state) => {
            Logger.log(state, "PROPHÉTIE : VENT DIVIN ! Les piles du Royaume sont remplacées !");

            const oldKingdomCards = [...state.kingdomCards];
            const newKingdomCards = SupplyGenerator.generate({
                count: 10,
                excludeCards: oldKingdomCards,
                enabledExpansions: state.kingdomCards.length > 0 ?
                    [...new Set(oldKingdomCards.map(id => CardRegistry.get(id)?.expansion || 'base'))] : undefined
            });

            // 1. Remove old piles
            oldKingdomCards.forEach((id: string) => {
                delete state.supply[id];
            });

            // 2. Add new piles
            state.kingdomCards = newKingdomCards;
            newKingdomCards.forEach((id: string) => {
                const def = CardRegistry.get(id);
                if (def) {
                    state.supply[id] = {
                        cardId: id,
                        count: 10,
                        cards: Array.from({ length: 10 }, () => ({
                            id,
                            instanceId: `divine_${id}_${Math.random().toString(36).substr(2, 9)}`
                        }))
                    };
                }
            });

            Logger.log(state, `Le Vent Divin a apporté : ${newKingdomCards.map((id: string) => CardRegistry.get(id)?.name).join(', ')}.`);
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('ENLIGHTENMENT_EFFECT', (state) => {
            Logger.log(state, "EFFET ILLUMINATION : Les Trésors sont maintenant des Actions.");
            // Passive effect: Engine checks state.activeProphecyId === 'enlightenment'
            // and Sun tokens === 0 to apply Treasure-as-Action logic.
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('FLOURISHING_TRADE_EFFECT', (state) => {
            Logger.log(state, "EFFET COMMERCE FLORISSANT : Réduction de coût active !");
            return { state, needsChoice: false };
        });

        // Register Flourishing Trade cost reduction modifier
        EconomyEngine.registerModifier('flourishing_trade', (state: GameState, _playerId: string, _cardId: string, currentCost: number) => {
            if (state.activeProphecyId === 'flourishing_trade') {
                const prophecyState = state.landscapeState['flourishing_trade'];
                if (prophecyState && prophecyState.tokens && prophecyState.tokens['sun'] === 0) {
                    return currentCost - 1;
                }
            }
            return currentCost;
        }, 30);

        EffectHandlerRegistry.register('HARSH_WINTER_EFFECT', (state, player) => {
            // Register a trigger that applies Debt logic on every gain
            const effect = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_GAIN',
                effects: [{
                    type: 'CONDITION',
                    condition: 'PHASE',
                    value: 'ACTION',
                    trueEffects: [{ type: 'HARSH_WINTER_LOGIC' as any }]
                }]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, effect);
        });

        EffectHandlerRegistry.register('HARSH_WINTER_LOGIC', (state, player, _effect, ctx) => {
            const cardId = ctx.cardId;
            const pile = state.supply[cardId];
            if (!pile) return { state, needsChoice: false };

            if (pile.tokens && pile.tokens['debt'] > 0) {
                // Take the debt
                const debt = pile.tokens['debt'];
                player.debt += debt;
                player.tokens.debt = (player.tokens.debt || 0) + debt;
                pile.tokens['debt'] = 0;
                Logger.log(state, `${player.name} prend ${debt} Dette de la pile ${CardRegistry.get(cardId)?.name} (Hiver Rigoureux).`);
            } else {
                // Others put 2 debt on pile
                Logger.log(state, `Hiver Rigoureux : 2 Dettes sont placées sur la pile ${CardRegistry.get(cardId)?.name}.`);
                if (!pile.tokens) pile.tokens = {};
                pile.tokens['debt'] = (pile.tokens['debt'] || 0) + 2;
            }
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('KIND_EMPEROR_EFFECT', (state, player) => {
            // Immediate effect: Gain one now
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: { type: 'GAIN_CARD', maxCost: 4, filter: { cardTypes: ['ACTION'] }, destination: 'hand' } as any
            });
            // Persistent effect: Gain one at start of turn
            const p = {
                type: 'REGISTER_TRIGGER',
                trigger: 'TURN_START',
                effects: [{ type: 'GAIN_CARD', maxCost: 4, filter: { cardTypes: ['ACTION'] }, destination: 'hand' } as any]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, p);
        });

        EffectHandlerRegistry.register('PANIC_EFFECT', (state, player) => {
            // 1. Trigger for +2 Buys on playing Treasure
            const p1 = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_PLAY',
                filter: { cardTypes: ['TREASURE'] },
                effects: [{ type: 'ADD_BUYS', amount: 2 }]
            };
            // 2. Trigger for returning discarded Treasures to pile
            const p2 = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_DISCARD_FROM_PLAY', // Needs to be supported in Cleanup
                filter: { cardTypes: ['TREASURE'] },
                effects: [{ type: 'RETURN_TO_PILE' as any }]
            };
            TriggerEffectHandler.handleRegisterTrigger(state, player, p1);
            return TriggerEffectHandler.handleRegisterTrigger(state, player, p2);
        });

        EffectHandlerRegistry.register('RAPID_EXPANSION_EFFECT', (state, player) => {
            const p = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_GAIN',
                filter: { cardTypes: ['ACTION', 'TREASURE'] } as any,
                effects: [{ type: 'SET_ASIDE_AND_PLAY_NEXT_TURN' as any }]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, p);
        });

        EffectHandlerRegistry.register('SET_ASIDE_AND_PLAY_NEXT_TURN', (state, player, _effect, ctx) => {
            const cardInstanceId = ctx.cardInstanceId;
            const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
            if (card) {
                player.aside.push(card);
                Logger.log(state, `${player.name} met ${CardRegistry.get(card.id)?.name} de côté pour le jouer au prochain tour.`);

                // Register start of turn trigger for THIS card only
                const startTurnTrigger = {
                    type: 'REGISTER_TRIGGER',
                    trigger: 'TURN_START',
                    effects: [
                        { type: 'MOVE_CARDS', sourceZone: 'aside', destinationZone: 'hand', filter: { cardInstanceIds: [card.instanceId] } } as any,
                        { type: 'PLAY_TARGET', filter: { cardInstanceIds: [card.instanceId] } } as any
                    ],
                    duration: 'ONCE'
                };
                return TriggerEffectHandler.handleRegisterTrigger(state, player, startTurnTrigger);
            }
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('RETURN_TO_PILE', (state, player, _effect, ctx) => {
            const cardInstanceId = ctx.instanceId || ctx.cardInstanceId;
            // Search in discardPile or hand if triggered by something else
            const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
            if (card) {
                const pile = state.supply[card.id];
                if (pile) {
                    pile.count++;
                    Logger.log(state, `${player.name} remet ${CardRegistry.get(card.id)?.name} dans sa pile.`);
                }
            }
            return { state, needsChoice: false };
        });
        EffectHandlerRegistry.register('APPROACHING_ARMY_EFFECT', (state, player) => {
            const p = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_PLAY',
                filter: { cardTypes: ['ATTACK'] },
                effects: [{ type: 'ADD_MONEY', amount: 1 }]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, p);
        });

        EffectHandlerRegistry.register('GOOD_HARVEST_EFFECT', (state, player) => {
            const p = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_PLAY',
                filter: { cardTypes: ['TREASURE'] },
                effects: [{ type: 'GOOD_HARVEST_LOGIC' as any }]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, p);
        });

        EffectHandlerRegistry.register('GOOD_HARVEST_LOGIC', (state, player, _effect, ctx) => {
            const cardId = ctx.cardId;
            // Check if this is the first time THIS CARD ID was played this turn
            const alreadyPlayed = player.playArea.filter(c => c.id === cardId && c.instanceId !== ctx.sourceCardInstanceId).length > 0;
            if (!alreadyPlayed) {
                Logger.log(state, `${player.name} gagne +1 Achat via Bonne Récolte (Premier ${CardRegistry.get(cardId)?.name} ce tour).`);
                player.buys++;
            }
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('BUREAUCRACY_EFFECT', (state, player) => {
            const p = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_GAIN',
                filter: { minCost: 1 },
                effects: [{ type: 'GAIN_CARD', cardId: 'copper' }]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, p);
        });

        EffectHandlerRegistry.register('GREAT_LEADER_EFFECT', (state, player) => {
            const p = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_PLAY',
                filter: { cardTypes: ['ACTION'] },
                effects: [{ type: 'GREAT_LEADER_LOGIC' as any }]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, p);
        });

        EffectHandlerRegistry.register('GREAT_LEADER_LOGIC', (state, player) => {
            const uniqueActions = new Set(player.playArea.filter(c => CardRegistry.get(c.id)?.types.includes('ACTION')).map(c => c.id));
            const vp = uniqueActions.size * 2;
            if (vp > 0) {
                Logger.log(state, `${player.name} gagne ${vp} Jetons Victoire via Grand Leader (${uniqueActions.size} Actions uniques en jeu).`);
                player.vpTokens += vp;
                player.tokens.vp = (player.tokens.vp || 0) + vp;
            }
            return { state, needsChoice: false };
        });

        // =================================================================
        // Kingdom Card Effects
        // =================================================================

        // ARISTOCRAT
        EffectHandlerRegistry.register('ARISTOCRAT_EFFECT', (state, player) => {
            const count = player.playArea.filter(c => c.id === 'aristocrat').length;
            const effectMap: Record<number, EffectDefinition[]> = {
                1: [{ type: 'ADD_ACTIONS', amount: 3 }],
                5: [{ type: 'ADD_ACTIONS', amount: 3 }],
                2: [{ type: 'DRAW', amount: 3 }],
                6: [{ type: 'DRAW', amount: 3 }],
                3: [{ type: 'ADD_BUYS', amount: 3 }],
                7: [{ type: 'ADD_BUYS', amount: 3 }],
                4: [{ type: 'ADD_ACTIONS', amount: 3 }],
                8: [{ type: 'ADD_ACTIONS', amount: 3 }]
            };
            const effects = effectMap[count] || [];
            effects.forEach(eff => state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: eff }));
            return { state, needsChoice: false };
        });

        // ARTIST: +1 Action (base), +1 Card per card with exactly 1 copy in play
        EffectHandlerRegistry.register('ARTIST_EFFECT', (state, player) => {
            const counts: Record<string, number> = {};
            player.playArea.forEach(c => counts[c.id] = (counts[c.id] || 0) + 1);
            const amount = Object.values(counts).filter(c => c === 1).length;
            if (amount > 0) {
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'DRAW', amount } });
            }
            return { state, needsChoice: false };
        });

        // CHANGE
        EffectHandlerRegistry.register('CHANGE_EFFECT', (state, player) => {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    source: 'hand',
                    message: 'Écartez une carte pour en recevoir une plus chère',
                    min: 1, max: 1, action: 'TRASH' as any,
                    next: { type: 'GAIN_CARD_PLUS_COST', amount: player.coins } as any
                } as any
            });
            return { state, needsChoice: false };
        });

        // DAIMYO: Next Action played this turn is played twice (Trigger)
        EffectHandlerRegistry.register('DAIMYO_EFFECT', (state, player, _eff, ctx) => {
            const sourceId = ctx.sourceCardInstanceId;
            const playedId = ctx.cardInstanceId;
            const playedDef = CardRegistry.get(state.players.find(p => p.id === ctx.playerId)?.playArea.find(c => c.instanceId === playedId)?.id || '');

            if (playedDef && playedDef.types.includes('ACTION') && !playedDef.types.includes('COMMAND') && playedId !== sourceId) {
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'REPLAY_LAST_ACTION' as any } });
            }
            return { state, needsChoice: false };
        });

        // IMPERIAL ENVOY
        EffectHandlerRegistry.register('IMPERIAL_ENVOY_EFFECT', (state, player) => {
            const cards = EffectUtils.drawCards(state, player, 4);
            EffectUtils.revealCards(state, cards, 'ALL', 'Émissaire Impérial');
            state.pendingDecision = {
                id: 'imperial_envoy_choice',
                playerId: player.id,
                type: 'COMPOSITE_FILTER',
                message: 'Émissaire Impérial : Écartez 1, défaussez 1, hand 1, deck 1',
                context: {
                    cards,
                    buckets: [
                        { id: 'trash', label: 'Écarter', min: 1, max: 1 },
                        { id: 'discard', label: 'Défausser', min: 1, max: 1 },
                        { id: 'hand', label: 'En main', min: 1, max: 1 },
                        { id: 'deck', label: 'Sur le deck', min: 1, max: 1 }
                    ]
                }
            } as any;
            return { state, needsChoice: true };
        });

        // MOUNTAIN SHRINE: If Actions in trash, +2 Cards. +2 Money.
        EffectHandlerRegistry.register('MOUNTAIN_SHRINE_EFFECT', (state, player) => {
            const hasActionInTrash = state.trash.some(c => CardRegistry.get(c.id)?.types.includes('ACTION'));
            if (hasActionInTrash) {
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'DRAW', amount: 2 } });
            }
            player.coins += 2;
            return { state, needsChoice: false };
        });

        // RICE_BROKER: Trash, if Treasure +2 Actions, if Action +2 Cards
        EffectHandlerRegistry.register('RICE_BROKER_EFFECT', (state, player) => {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    source: 'hand',
                    message: 'Écartez une carte pour des bonus',
                    min: 1, max: 1, action: 'TRASH' as any,
                    onSuccess: [{ type: 'RICE_BROKER_RESOLVE' as any }]
                } as any
            });
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('RICE_BROKER_RESOLVE', (state, player) => {
            const trashed = state.lastTrashedCard;
            if (!trashed) return { state, needsChoice: false };
            const def = CardRegistry.get(trashed.id);
            if (def?.types.includes('TREASURE')) player.actions += 2;
            if (def?.types.includes('ACTION')) state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'DRAW', amount: 2 } });
            return { state, needsChoice: false };
        });

        // RIVER SHRINE: +1 💰. You may discard a card to gain a card costing up to 4.
        EffectHandlerRegistry.register('RIVER_SHRINE_EFFECT', (state, player) => {
            player.coins += 1;
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    sourceZone: 'hand',
                    min: 0,
                    max: 1,
                    message: 'Sanctuaire de la Rivière : Défaussez une carte pour gagner une carte coûtant jusqu\'à 4',
                    action: 'DISCARD' as any,
                    onSuccess: [{ type: 'GAIN_CARD', maxCost: 4 }]
                } as any
            });
            return { state, needsChoice: false };
        });

        // SNAKE WITCH ATTACK: If no duplicates in hand, Attack (registered via CardDef usually, but logic here)
        EffectHandlerRegistry.register('SNAKE_WITCH_ATTACK', (state, player) => {
            const handIds = player.hand.map(c => c.id);
            const uniqueIds = new Set(handIds);
            if (uniqueIds.size === handIds.length) {
                EffectUtils.revealCards(state, player.hand, 'ALL', 'Sorcière aux Serpents');
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] }
                });
            }
            return { state, needsChoice: false };
        });

        // POET: +1 Card, +1 Action. Reveal top 3, discard any, +$1 per unique name among revealed.
        EffectHandlerRegistry.register('POET_EFFECT', (state, player) => {
            const { cards } = EffectUtils.handleDrawCardsToLimbo(state, player, 3);
            if (cards.length === 0) return { state, needsChoice: false };

            EffectUtils.revealCards(state, cards, 'ALL', 'Poète');

            const uniqueNames = new Set(cards.map(c => c.id));
            const bonus = uniqueNames.size;
            player.coins += bonus;
            Logger.log(state, `${player.name} gagne +${bonus} 💰 (Poète : ${bonus} nom(s) unique(s) parmi les cartes révélées).`);

            player.aside.push(...cards);
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    sourceZone: 'aside',
                    min: 0,
                    max: cards.length,
                    message: 'Poète : Choisissez les cartes à défausser',
                    action: 'DISCARD' as any
                } as any
            });
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: { type: 'MOVE_CARDS', source: 'aside', destination: 'deck' }
            });

            return { state, needsChoice: false };
        });

        // MOUNTAIN SHRINE: Trash a card. +$1 per unique name in play.
        EffectHandlerRegistry.register('MOUNTAIN_SHRINE_EFFECT', (state, player) => {
            const uniqueInPlay = new Set(player.playArea.map(c => c.id));
            const bonus = uniqueInPlay.size;
            player.coins += bonus;
            Logger.log(state, `${player.name} gagne +${bonus} 💰 (Sanctuaire de la Montagne : ${bonus} nom(s) unique(s) en jeu).`);

            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    sourceZone: 'hand',
                    min: 1,
                    max: 1,
                    message: 'Sanctuaire de la Montagne : Écartez une carte',
                    action: 'TRASH' as any
                } as any
            });

            return { state, needsChoice: false };
        });
    }
}
