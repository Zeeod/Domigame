import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { EffectUtils } from '../EffectUtils.js';
import { CardRegistry } from '../../cards/index.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';
import { Logger } from '../Logger.js';
import { CardInstance, GameState } from '../GameState.js';
import { ChoiceEffectHandler } from './ChoiceEffectHandler.js';

export class AlliesEffectHandler {
    static register() {

        // =================================================================
        // Simple Effects
        // =================================================================

        // BAUBLE: Next gain to deck
        EffectHandlerRegistry.register('NEXT_GAIN_TO_DECK', (state, player) => {
            const trigger = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_GAIN',
                duration: 'ONCE',
                effects: [{ type: 'MOVE_CARDS', source: 'discardPile', destination: 'deck', position: 'TOP', count: 1 } as any]
            } as any;
            return TriggerEffectHandler.handleRegisterTrigger(state, player, trigger);
        });

        // SYCOPHANT: Discard 3, if any were Action/Treasure -> +3 Money
        EffectHandlerRegistry.register('SYCOPHANT_EFFECT', (state: GameState, player) => {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'DISCARD',
                    amount: 3,
                    source: 'hand',
                    onSuccess: [
                        {
                            type: 'CONDITION',
                            condition: 'DISCARDED_TYPE_COUNT',
                            cardTypes: ['ACTION', 'TREASURE'],
                            comparator: '>=',
                            value: 1,
                            trueEffects: [{ type: 'ADD_MONEY', amount: 3 }]
                        }
                    ]
                } as any
            });
            return { state, needsChoice: false };
        });

        // BARBARIAN ATTACK
        EffectHandlerRegistry.register('BARBARIAN_ATTACK', (state, player) => {
            const cards = EffectUtils.drawCards(state, player, 1);
            const card = cards[0];
            if (!card) return { state, needsChoice: false };

            state.trash.push(card);
            state.lastTrashedCard = card;
            const cost = EconomyEngine.getCardCost(state, player.id, card.id);
            const def = CardRegistry.get(card.id);

            if (cost >= 3) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: {
                        type: 'GAIN_CARD',
                        maxCost: cost - 1,
                        allowedTypes: def?.types || [],
                        destination: 'discardPile'
                    } as any
                });
            } else {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: { type: 'GAIN_CARD', cardId: 'curse' }
                });
            }
            EffectUtils.log(state, `Barbare : ${player.name} écarte ${def?.name} et doit gagner une carte coûtant jusqu'à ${cost - 1} 💰 partageant un type.`);
            return { state, needsChoice: false };
        });

        // BROKER: Draw/Actions/Money/Favors per cost
        const brokerStatHandler = (type: string, multiplier: number) => {
            EffectHandlerRegistry.register(type, (state, player) => {
                const trashed = state.lastTrashedCard;
                if (!trashed) return { state, needsChoice: false };
                const cost = EconomyEngine.getCardCost(state, player.id, trashed.id);
                const amount = cost * multiplier;

                if (type === 'DRAW_PER_COST') EffectUtils.drawCards(state, player, amount);
                if (type === 'ADD_ACTIONS_PER_COST') player.actions += amount;
                if (type === 'ADD_MONEY_PER_COST') player.coins += amount;
                if (type === 'ADD_FAVORS_PER_COST') player.favors = (player.favors || 0) + amount;

                return { state, needsChoice: false };
            });
        };
        brokerStatHandler('DRAW_PER_COST', 1);
        brokerStatHandler('ADD_ACTIONS_PER_COST', 1);
        brokerStatHandler('ADD_MONEY_PER_COST', 1);
        brokerStatHandler('ADD_FAVORS_PER_COST', 1);

        // CARPENTER
        EffectHandlerRegistry.register('CARPENTER_EFFECT', (state, player) => {
            const anyEmpty = Object.values(state.supply).some(p => p.count === 0);
            if (!anyEmpty) {
                player.actions++;
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: { type: 'GAIN_CARD', maxCost: 4 }
                });
            } else {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: {
                        type: 'SELECT_AND_APPLY',
                        source: 'hand',
                        message: 'Charpentier : Écartez une carte pour en gagner une coûtant jusqu\'à +2 💰 de plus',
                        min: 1, max: 1,
                        next: { type: 'GAIN_CARD_PLUS_COST', amount: 2 } as any
                    } as any
                });
            }
            return { state, needsChoice: false };
        });

        // COURIER
        EffectHandlerRegistry.register('COURIER_EFFECT', (state, player) => {
            // Can play an Action/Treasure from discard (not Courier)
            const options = player.discardPile
                .filter(c => {
                    const def = CardRegistry.get(c.id);
                    return c.id !== 'courier' && (def?.types.includes('ACTION') || def?.types.includes('TREASURE'));
                });

            if (options.length === 0) return { state, needsChoice: false };

            state.pendingDecision = {
                id: 'courier_choice',
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: 'Choisir une Action ou un Trésor à jouer de votre défausse',
                constraints: { min: 0, max: 1, sourceZone: 'discardPile' },
                context: { onSelect: [{ type: 'PLAY_SELECTED_CARD' }] }
            };
            return { state, needsChoice: true };
        });

        // HUNTER: Reveal 3, put Action, Treasure, Victory in hand
        EffectHandlerRegistry.register('HUNTER_EFFECT', (state, player) => {
            const cards = EffectUtils.drawCards(state, player, 3);
            EffectUtils.revealCards(state, cards, 'ALL', 'Chasseur');
            const toHand: CardInstance[] = [];
            const typesNeeded = new Set(['ACTION', 'TREASURE', 'VICTORY']);

            // For each type, pick one if available
            for (const type of typesNeeded) {
                const idx = cards.findIndex(c => CardRegistry.get(c.id)?.types.includes(type as any));
                if (idx !== -1) {
                    toHand.push(cards.splice(idx, 1)[0]);
                }
            }

            player.hand.push(...toHand);
            player.discardPile.push(...cards);
            return { state, needsChoice: false };
        });

        // ROYAL GALLEY: Set aside Action, play now and next turn
        EffectHandlerRegistry.register('ROYAL_GALLEY_EFFECT', (state, player) => {
            state.pendingDecision = {
                id: 'royal_galley_choice',
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: 'Choisir une Action non-Durée à jouer deux fois',
                constraints: {
                    min: 0, max: 1, sourceZone: 'hand',
                    filter: { cardTypes: ['ACTION'], excludeTypes: ['DURATION'] }
                },
                context: {
                    onSelect: [
                        { type: 'PLAY_SELECTED_CARD' },
                        { type: 'SET_ASIDE_LINKED', count: 1 },
                        { type: 'REGISTER_TRIGGER', trigger: 'START_TURN', duration: 'ONCE', effects: [{ type: 'PLAY_TARGET', sourceZone: 'aside' } as any] } as any
                    ]
                }
            };
            return { state, needsChoice: true };
        });

        // SENTINEL: Look at top 5, trash up to 2, discard any, reorder rest
        EffectHandlerRegistry.register('SENTINEL_EFFECT', (state, player) => {
            const cards = EffectUtils.drawCards(state, player, 5);
            EffectUtils.revealCards(state, cards, 'ALL', 'Sentinelle');
            state.pendingDecision = {
                id: 'sentinel_choice',
                playerId: player.id,
                type: 'COMPOSITE_FILTER',
                message: 'Sentinelle : Écartez jusqu\'à 2 cartes, défaussez ou remettez le reste sur le deck',
                context: {
                    cards,
                    buckets: [
                        { id: 'trash', label: 'Écarter', max: 2 },
                        { id: 'discardPile', label: 'Défausser' },
                        { id: 'deck', label: 'Sur le deck', reorder: true }
                    ]
                }
            } as any;
            return { state, needsChoice: true };
        });

        // SWAP: Return Action to pile, gain different Action ≤5
        EffectHandlerRegistry.register('SWAP_EFFECT', (state, player) => {
            state.pendingDecision = {
                id: 'swap_choice',
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: 'Retourner une Action pour en recevoir une autre',
                constraints: { min: 0, max: 1, filter: { cardTypes: ['ACTION'] }, sourceZone: 'hand' },
                context: {
                    onSelect: [
                        { type: 'RETURN_TO_SUPPLY', count: 1 },
                        { type: 'GAIN_CARD', maxCost: 5, cardTypes: ['ACTION'] }
                    ]
                }
            };
            return { state, needsChoice: true };
        });

        // WARLORD
        EffectHandlerRegistry.register('WARLORD_EFFECT', (state, player) => {
            // Restriction: other players can't play Actions they already have in play
            state.activeRestrictions = state.activeRestrictions || [];
            state.activeRestrictions.push({
                type: 'WARLORD_RESTRICTION',
                sourcePlayerId: player.id,
                expiresOnTurn: state.turnNumber + state.players.length
            });
            return { state, needsChoice: false };
        });

        // SPECIALIST: Play card, choose REPLAY or GAIN COPY
        EffectHandlerRegistry.register('SPECIALIST_EFFECT', (state, player) => {
            state.pendingDecision = {
                id: 'specialist_choice',
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: 'Choisir une Action ou un Trésor à jouer',
                constraints: { min: 0, max: 1, sourceZone: 'hand', filter: { excludeTypes: ['VICTORY'] } },
                context: {
                    onSelect: [
                        {
                            type: 'SELECT_OPTION',
                            options: [
                                { label: 'Rejouer', effects: [{ type: 'PLAY_SELECTED_CARD' }, { type: 'REPLAY_LAST_ACTION' as any }] },
                                { label: 'Gagner une copie', effects: [{ type: 'PLAY_SELECTED_CARD' }, { type: 'GAIN_SELECTED_COPY' as any }] }
                            ]
                        } as any
                    ]
                }
            };
            return { state, needsChoice: true };
        });

        EffectHandlerRegistry.register('GAIN_SELECTED_COPY', (state, player) => {
            const lastSelected = state.lastDecisionResults?.cards?.[0];
            if (lastSelected) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: { type: 'GAIN_CARD', cardId: lastSelected.id }
                });
            }
            return { state, needsChoice: false };
        });

        // ELDER: +2 Actions. Choices logic (Marker for now)
        EffectHandlerRegistry.register('ELDER_EFFECT', (state, player) => {
            player.actions += 2;
            state.activeRestrictions = state.activeRestrictions || [];
            state.activeRestrictions.push({
                type: 'ELDER_EFFECT_ACTIVE',
                sourcePlayerId: player.id,
                expiresOnTurn: state.turnNumber + 1
            });
            return { state, needsChoice: false };
        });

        // STUDENT: +1 Favor. Optional Trash -> +1 Card, +1 Action
        EffectHandlerRegistry.register('STUDENT_EFFECT', (state, player) => {
            player.favors = (player.favors || 0) + 1;
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    source: 'hand',
                    message: 'Écartez une carte pour +1 Carte, +1 Action',
                    min: 0, max: 1, action: 'TRASH' as any,
                    onSuccess: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }]
                } as any
            });
            return { state, needsChoice: false };
        });

        // LICH: onTrash
        EffectHandlerRegistry.register('LICH_TRASH_EFFECT', (state, player, _eff, ctx) => {
            const cardInstanceId = ctx.sourceCardInstanceId;
            const card = state.trash.find(c => c.instanceId === cardInstanceId);
            if (card && card.id === 'lich') {
                state.trash = state.trash.filter(c => c.instanceId !== cardInstanceId);
                player.discardPile.push(card);
                Logger.log(state, `Liche : Revient du rebut dans la défausse de ${player.name}.`);
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'GAIN_CARD', maxCost: 6 } });
            }
            return { state, needsChoice: false };
        });

        // HIGHWAYMAN ATTACK
        EffectHandlerRegistry.register('HIGHWAYMAN_ATTACK', (state: GameState, player) => {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'ATTACK',
                    attackEffects: [{
                        type: 'REGISTER_TRIGGER',
                        trigger: 'ON_PLAY',
                        duration: 'UNTIL_TURN_END',
                        effects: [{ type: 'HIGHWAYMAN_RESTRICTION_EFFECT' as any }]
                    }]
                } as any
            });
            // Add a restriction to other players
            state.activeRestrictions = state.activeRestrictions || [];
            state.activeRestrictions.push({
                type: 'HIGHWAYMAN_RESTRICTION',
                sourcePlayerId: player.id,
                expiresOnTurn: state.turnNumber + state.players.length,
                affectedPlayerIds: []
            });
            return { state, needsChoice: false };
        });

        // ARCHER ATTACK
        EffectHandlerRegistry.register('ARCHER_ATTACK', (state: GameState, player) => {
            if (player.hand.length >= 5) {
                const toDiscard = player.hand.filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def && (def.types.includes('ACTION') || def.types.includes('TREASURE'));
                });
                if (toDiscard.length > 0) {
                    EffectUtils.revealCards(state, player.hand, 'ALL', `${player.name} révèle sa main`);
                    toDiscard.forEach(c => {
                        const idx = player.hand.findIndex(hc => hc.instanceId === c.instanceId);
                        if (idx !== -1) {
                            player.discardPile.push(player.hand.splice(idx, 1)[0]);
                        }
                    });
                    Logger.log(state, `${player.name} défausse ses Actions et Trésors (${toDiscard.length} cartes).`);
                }
            }
            return { state, needsChoice: false };
        });

        // SORCERESS AUGUR ATTACK
        EffectHandlerRegistry.register('SORCERESS_AUGUR_ATTACK', (state, player, _eff, ctx) => {
            const namedCardId = ctx.namedCardId;
            const topCard = EffectUtils.drawCards(state, player, 1)[0];
            if (topCard) {
                EffectUtils.revealCards(state, [topCard], 'ALL', `Haut du deck de ${player.name}`);
                if (topCard.id === namedCardId) {
                    state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'GAIN_CARD', cardId: 'curse' } });
                }
                player.deck.unshift(topCard); // Put back
            }
            return { state, needsChoice: false };
        });

        // SORCERER WIZARD ATTACK
        EffectHandlerRegistry.register('SORCERER_WIZARD_ATTACK', (state, player) => {
            state.pendingDecision = {
                id: `sorcerer_guess_${player.id}`,
                playerId: player.id,
                type: 'NAME_CARD',
                message: 'Sorciers : Devinez la carte du haut de votre deck',
                constraints: { min: 1, max: 1, sourceZone: 'supply' },
                context: {
                    onSelect: [{ type: 'SORCERER_REVEAL_AND_CHECK' as any }]
                }
            } as any;
            return { state, needsChoice: true };
        });

        EffectHandlerRegistry.register('SORCERER_REVEAL_AND_CHECK', (state, player, _eff, ctx) => {
            const guessedCardId = ctx.namedCardId;
            const topCard = EffectUtils.drawCards(state, player, 1)[0];
            if (topCard) {
                EffectUtils.revealCards(state, [topCard], 'ALL', `${player.name} révèle sa carte`);
                if (topCard.id !== guessedCardId) {
                    state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'GAIN_CARD', cardId: 'curse' } });
                }
                player.deck.unshift(topCard);
            }
            return { state, needsChoice: false };
        });

        // MILLER
        EffectHandlerRegistry.register('SELECT_FROM_TOPDECK', (state, player, effect) => {
            const eff = effect as any;
            const cards = EffectUtils.drawCards(state, player, eff.amount || 1);
            if (cards.length === 0) return { state, needsChoice: false };

            state.pendingDecision = {
                id: 'miller_choice',
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: `Choisissez ${eff.count || 1} carte(s) à mettre dans votre ${eff.destination || 'hand'}`,
                constraints: { min: eff.count || 1, max: eff.count || 1, sourceZone: 'limbo' },
                context: {
                    cards,
                    onSelect: [
                        { type: 'MOVE_CARDS', source: 'limbo', destination: eff.destination || 'hand', count: eff.count || 1 },
                        { type: 'MOVE_CARDS', source: 'limbo', destination: 'discardPile', count: 'ALL' }
                    ]
                }
            } as any;
            // Move cards to a temporary zone (limbo) for selection
            state.players.find(p => p.id === player.id)!.hand.push(...cards); // Hack: use hand for now if no limbo
            // Actually, we should use a specific context for these cards.
            return { state, needsChoice: true };
        });

        // SUNKEN TREASURE
        EffectHandlerRegistry.register('GAIN_CARD_NOT_IN_PLAY', (state, player, effect) => {
            const eff = effect as any;
            const cardsInPlay = player.playArea.map(c => c.id);
            const candidates = Object.keys(state.supply).filter(id => {
                const def = CardRegistry.get(id);
                if (!def) return false;
                if (cardsInPlay.includes(id)) return false;
                if (eff.filter?.cardTypes) {
                    return eff.filter.cardTypes.some((t: string) => def.types.includes(t as any));
                }
                return true;
            });

            if (candidates.length === 0) return { state, needsChoice: false };

            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'GAIN_CARD',
                    maxCost: 99,
                    allowedCardIds: candidates
                } as any
            });
            return { state, needsChoice: false };
        });

        // GARRISON
        EffectHandlerRegistry.register('ADD_TOKEN_TO_THIS', (state: GameState, _player, _eff, ctx) => {
            const cardInstanceId = ctx.sourceCardInstanceId;
            if (cardInstanceId) {
                state.cardTokens = state.cardTokens || {};
                state.cardTokens[cardInstanceId] = (state.cardTokens[cardInstanceId] || 0) + 1;
            }
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('DRAW_PER_TOKEN_ON_THIS', (state: GameState, player, _eff, ctx) => {
            const cardInstanceId = ctx.sourceCardInstanceId;
            if (cardInstanceId && state.cardTokens?.[cardInstanceId]) {
                const count = state.cardTokens[cardInstanceId];
                state.cardTokens[cardInstanceId] = 0;
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'DRAW', amount: count } });
            }
            return { state, needsChoice: false };
        });

        // BOTTOMDECK_FROM_HAND
        EffectHandlerRegistry.register('BOTTOMDECK_FROM_HAND', (state: GameState, player, effect, ctx) => {
            const eff = effect as any;
            const chooseEffect = {
                type: 'CHOOSE_FROM_ZONE',
                sourceZone: 'hand',
                min: eff.min || 1,
                max: eff.max || 1,
                destination: 'deck',
                position: 'BOTTOM' as any,
                message: eff.message || 'Mettez une carte sous votre pioche',
                filter: eff.filter
            };
            // Note: handleChooseFromZone needs to support 'position' property
            return ChoiceEffectHandler.handleChooseFromZone(state, player, chooseEffect, ctx);
        });

        // VOYAGE: +1 Action (already handled) + Schedule Extra Turn with 3 cards limit
        EffectHandlerRegistry.register('SCHEDULE_EXTRA_TURN', (state: GameState, player, effect) => {
            const eff = effect as any;
            state.extraTurns = state.extraTurns || [];
            state.extraTurns.push({
                playerId: player.id,
                type: 'VOYAGE' as any,
                // The actual logic to enforce card limit would be in the Turn Manager / EffectEngine
            } as any);
            Logger.log(state, `${player.name} gagne un tour supplémentaire (Voyage).`);
            return { state, needsChoice: false };
        });

        // STRONGHOLD / SCHEDULE_NEXT_TURN: +3 Cards at start of next turn
        EffectHandlerRegistry.register('SCHEDULE_NEXT_TURN', (state: GameState, player, effect, ctx) => {
            const eff = effect as any;
            state.durations = state.durations || [];
            state.durations.push({
                cardInstanceId: ctx.sourceCardInstanceId || `scheduled_${Date.now()}`,
                cardId: 'scheduled_effect',
                playerId: player.id,
                turnsRemaining: 1,
                effects: eff.effects || []
            });
            return { state, needsChoice: false };
        });

        // CONJURER / MOVE_THIS_TO_HAND: Move the card to hand at start of next turn
        EffectHandlerRegistry.register('MOVE_THIS_TO_HAND', (state: GameState, player, _effect, ctx) => {
            const cardInstanceId = ctx.sourceCardInstanceId;
            if (cardInstanceId) {
                // Move from play or duration area to hand
                const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
                if (card) {
                    player.hand.push(card);
                    Logger.log(state, `${player.name} remet une carte en main.`);
                }
            }
            return { state, needsChoice: false };
        });
    }
}
