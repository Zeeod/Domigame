/**
 * PlunderEffectHandler — Custom handlers for Plunder expansion cards
 * 
 * Handles effects that are unique to Plunder cards and can't be expressed
 * using core primitives alone.
 */

import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { Logger } from '../Logger.js';
import { EffectUtils } from '../EffectUtils.js';
import { CardRegistry } from '../../cards/index.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';
import { GameState, PlayerState } from '../GameState.js';

export class PlunderEffectHandler {
    static register() {

        // =================================================================
        // Simple Effects
        // =================================================================

        // ABUNDANCE: If all cards in hand have different names, +1 Buy
        EffectHandlerRegistry.register('ABUNDANCE_EFFECT', (state, player) => {
            const handIds = player.hand.map(c => c.id);
            const uniqueIds = new Set(handIds);
            if (uniqueIds.size === handIds.length && handIds.length > 0) {
                player.buys++;
                Logger.log(state, `${player.name} a des cartes aux noms différents en main : +1 Achat (Abondance).`);
            }
            return { state, needsChoice: false };
        });

        // PENDANT: +1 Coin per unique Action card in play
        EffectHandlerRegistry.register('PENDANT_EFFECT', (state, player) => {
            const uniqueActions = new Set(
                player.playArea
                    .filter(c => CardRegistry.get(c.id)?.types.includes('ACTION'))
                    .map(c => c.id)
            );
            const amount = uniqueActions.size;
            if (amount > 0) {
                player.coins += amount;
                Logger.log(state, `${player.name} reçoit +${amount} 💰 (Pendentif : ${amount} Action(s) unique(s) en jeu).`);
            }
            return { state, needsChoice: false };
        });

        // TASKMASTER: If a card costing exactly 5 was gained this turn, +1 Action +1 Coin
        EffectHandlerRegistry.register('TASKMASTER_EFFECT', (state, player) => {
            const gained5 = (state as any).lastGainedCost === 5;
            if (gained5) {
                player.actions++;
                player.coins++;
                Logger.log(state, `${player.name} a reçu une carte coûtant 5 : +1 Action, +1 💰 (Contremaître).`);
            }
            return { state, needsChoice: false };
        });

        // MAROON: Trash a card, +1 Coin and +1 Action per cost of trashed card
        EffectHandlerRegistry.register('MAROON_EFFECT', (state, player) => {
            if (player.hand.length === 0) return { state, needsChoice: false };

            state.pendingDecision = {
                id: `maroon_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: 'Écartez une carte (Abandonner)',
                constraints: { min: 1, max: 1, sourceZone: 'hand' },
                context: {
                    specialAction: 'CHOOSE_CARD_FOR_EFFECT', // Generic choice handler in EffectEngine
                    effectType: 'MAROON_EFFECT',
                    onSelect: [{ type: 'MAROON_RESOLVE' }]
                }
            };
            return { state, needsChoice: true };
        });

        EffectHandlerRegistry.register('MAROON_RESOLVE', (state, player, _effect, ctx) => {
            const cardInstanceId = (ctx as any).selectedCardInstanceId;
            if (!cardInstanceId) return { state, needsChoice: false };

            const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
            if (!card) return { state, needsChoice: false };

            const cardDef = CardRegistry.get(card.id);
            const cost = cardDef ? EconomyEngine.getCardCost(state, player.id, card.id) : 0;
            (state.trash = state.trash || []).push(card);
            (state as any).lastTrashedCard = card;

            if (cost > 0) {
                player.coins += cost;
                player.actions += cost;
                Logger.log(state, `${player.name} écarte ${cardDef?.name} (coût ${cost}) : +${cost} 💰, +${cost} Action(s) (Abandonner).`);
            } else {
                Logger.log(state, `${player.name} écarte ${cardDef?.name} (Abandonner).`);
            }
            return { state, needsChoice: false };
        });

        // =================================================================
        // Complex Effects
        // =================================================================

        // FORTUNE_HUNTER: Look at top 3, may trash 1, reorder rest on top
        EffectHandlerRegistry.register('FORTUNE_HUNTER_EFFECT', (state, player) => {
            const { cards } = EffectUtils.handleDrawCardsToLimbo(state, player, 3);
            player.aside.push(...cards);
            EffectUtils.revealCards(state, cards, [player.id], 'Chasseur de Fortune');

            if (cards.length === 0) return { state, needsChoice: false };

            // Push aside → trash 1 optional, then reorder rest back
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    sourceZone: 'aside',
                    min: 0,
                    max: 1,
                    message: 'Chasseur de Fortune : Écartez-en une (optionnel)',
                    action: 'TRASH'
                }
            });
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'MOVE_CARDS',
                    source: 'aside',
                    destination: 'deck'
                }
            });

            return { state, needsChoice: false };
        });

        // SEARCH: Look at top 4: put 1 on deck, 1 in hand, 1 in discard, trash 1
        EffectHandlerRegistry.register('SEARCH_EFFECT', (state, player) => {
            const { cards } = EffectUtils.handleDrawCardsToLimbo(state, player, 4);
            player.aside.push(...cards);
            EffectUtils.revealCards(state, cards, [player.id], 'Recherche');

            if (cards.length === 0) return { state, needsChoice: false };

            // Sequential prompts: trash 1, discard 1, hand 1, deck remainder
            const effects = [
                { type: 'SELECT_AND_APPLY', sourceZone: 'aside', min: 1, max: 1, message: 'Recherche : Écartez une carte', action: 'TRASH' },
                { type: 'SELECT_AND_APPLY', sourceZone: 'aside', min: 1, max: 1, message: 'Recherche : Défaussez une carte', action: 'DISCARD' },
                { type: 'SELECT_AND_APPLY', sourceZone: 'aside', min: 1, max: 1, message: 'Recherche : Mettez une carte en main', action: 'TO_HAND' },
                { type: 'MOVE_CARDS', source: 'aside', destination: 'deck' }
            ];

            for (const eff of effects.reverse()) {
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: eff as any });
            }

            return { state, needsChoice: false };
        });

        // MAPMAKER: Look at top 4, discard any, reorder rest. If discarded Action, +1 Buy
        EffectHandlerRegistry.register('MAPMAKER_EFFECT', (state, player) => {
            const { cards } = EffectUtils.handleDrawCardsToLimbo(state, player, 4);
            player.aside.push(...cards);
            EffectUtils.revealCards(state, cards, [player.id], 'Cartographe');

            if (cards.length === 0) return { state, needsChoice: false };

            // Discard any number, then put rest on top of deck
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_AND_APPLY',
                    sourceZone: 'aside',
                    min: 0,
                    max: cards.length,
                    message: 'Cartographe : Défaussez des cartes',
                    action: 'DISCARD'
                }
            });
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: { type: 'MOVE_CARDS', source: 'aside', destination: 'deck' }
            });

            return { state, needsChoice: false };
        });

        // FLAGSHIP: Register trigger — replay next Action played (one-shot)
        EffectHandlerRegistry.register('FLAGSHIP_EFFECT', (state, player) => {
            const trigger = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_PLAY',
                filter: { cardTypes: ['ACTION'] },
                duration: 'ONCE',
                effects: [{ type: 'REPLAY_LAST_ACTION' as const }]
            } as any;
            return TriggerEffectHandler.handleRegisterTrigger(state, player, trigger);
        });

        // REPLAY_LAST_ACTION: Re-execute the effects of the last played action
        EffectHandlerRegistry.register('REPLAY_LAST_ACTION', (state, player, _effect, ctx) => {
            const cardId = (ctx as any).cardId;
            if (!cardId) return { state, needsChoice: false };

            const cardDef = CardRegistry.get(cardId);
            if (!cardDef || !cardDef.effects) return { state, needsChoice: false };

            Logger.log(state, `${player.name} rejoue ${cardDef.name} (Vaisseau Amiral).`);
            const effectItems = cardDef.effects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e,
                context: { sourceCardInstanceId: ctx.sourceCardInstanceId }
            }));
            state.effectStack.push(...effectItems.reverse());
            return { state, needsChoice: false };
        });

        // FIRST_MATE: Play any number of Action cards from hand costing ≤3
        EffectHandlerRegistry.register('FIRST_MATE_EFFECT', (state, player) => {
            const candidates = player.hand.filter(c => {
                const def = CardRegistry.get(c.id);
                return def && def.types.includes('ACTION') && EconomyEngine.getCardCost(state, player.id, c.id) <= 3;
            });

            if (candidates.length === 0) return { state, needsChoice: false };

            // Play one, then re-trigger for more
            state.pendingDecision = {
                id: `first_mate_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: 'Maître d\'équipage : Jouez une Action coûtant ≤3 (optionnel)',
                constraints: {
                    min: 0,
                    max: 1,
                    sourceZone: 'hand',
                    allowedCardIds: candidates.map(c => c.id) // Or use filter
                },
                context: {
                    specialAction: 'PLAY_SELECTED_CARD_RECURSIVE', // We might need a custom handler for recursive play
                    onSelect: [{ type: 'PLAY_SELECTED_CARD' }, { type: 'FIRST_MATE_EFFECT' }]
                }
            };
            return { state, needsChoice: true };
        });

        // PILGRIM: Gain Action ≤4, if copy in play → to hand
        EffectHandlerRegistry.register('PILGRIM_EFFECT', (state, player) => {
            // Push a GAIN_CARD effect, then check and move
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'GAIN_CARD',
                    maxCost: 4,
                    filter: { cardTypes: ['ACTION'] },
                    destination: 'discardPile'
                } as any
            });
            // After gain, check if copy in play and move to hand
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: { type: 'PILGRIM_MOVE_CHECK' } as any
            });
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('PILGRIM_MOVE_CHECK', (state, player) => {
            const lastGained = state.lastGainedCard;
            if (!lastGained) return { state, needsChoice: false };

            const hasInPlay = player.playArea.some(c => c.id === lastGained.id && c.instanceId !== lastGained.instanceId);
            if (hasInPlay) {
                // Move from discard to hand
                const idx = player.discardPile.findIndex(c => c.instanceId === lastGained.instanceId);
                if (idx !== -1) {
                    const card = player.discardPile.splice(idx, 1)[0];
                    player.hand.push(card);
                    Logger.log(state, `${player.name} met ${CardRegistry.get(card.id)?.name} en main (Pèlerin : copie en jeu).`);
                }
            }
            return { state, needsChoice: false };
        });

        // TOOLS: Same as Pilgrim but with different context
        EffectHandlerRegistry.register('TOOLS_EFFECT', (state, player) => {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'GAIN_CARD',
                    maxCost: 4,
                    filter: { cardTypes: ['ACTION'] },
                    destination: 'discardPile'
                } as any
            });
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: { type: 'TOOLS_MOVE_CHECK' } as any
            });
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('TOOLS_MOVE_CHECK', (state, player) => {
            const lastGained = state.lastGainedCard;
            if (!lastGained) return { state, needsChoice: false };

            const hasInPlay = player.playArea.some(c => c.id === lastGained.id && c.instanceId !== lastGained.instanceId);
            if (hasInPlay) {
                const idx = player.discardPile.findIndex(c => c.instanceId === lastGained.instanceId);
                if (idx !== -1) {
                    const card = player.discardPile.splice(idx, 1)[0];
                    player.deck.unshift(card);
                    Logger.log(state, `${player.name} met ${CardRegistry.get(card.id)?.name} sur sa pioche (Outils : copie en jeu).`);
                }
            }
            return { state, needsChoice: false };
        });

        // LONGSHIP: Duration attack — block other players' Actions costing ≥4
        EffectHandlerRegistry.register('LONGSHIP_EFFECT', (state, player) => {
            // This is a persistent restriction effect
            // Store on state that this restriction is active
            if (!state.activeRestrictions) state.activeRestrictions = [];
            (state.activeRestrictions as any[]).push({
                type: 'BLOCK_ACTION_COST',
                minCost: 4,
                sourcePlayerId: player.id,
                expiresOnTurn: (state.turnNumber || 0) + state.players.length // Next turn of this player
            });
            Logger.log(state, `${player.name} joue le Drakkar : les autres joueurs ne pourront pas jouer d'Actions coûtant 4 ou plus.`);
            return { state, needsChoice: false };
        });

        // =================================================================
        // Attack Effects
        // =================================================================

        // CUTTHROAT_ATTACK: Duration — When others gain card ≥3, they gain Curse, you gain Loot
        EffectHandlerRegistry.register('CUTTHROAT_ATTACK', (state, player) => {
            player.coins += 5;
            Logger.log(state, `${player.name} +5 💰 (Coupe-jarret).`);

            const trigger = {
                type: 'REGISTER_TRIGGER',
                trigger: 'ON_GAIN',
                filter: { minCost: 3, otherPlayers: true } as any,
                duration: 'UNTIL_NEXT_TURN',
                effects: [
                    { type: 'GAIN_CARD', cardId: 'curse', targetPlayer: 'GAINING_PLAYER' },
                    { type: 'GAIN_LOOT', targetPlayer: 'SOURCE_PLAYER' }
                ]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, trigger);
        });

        // FRIGATE_ATTACK: Duration — After other players play Action, if hand ≥4, discard to 3
        EffectHandlerRegistry.register('FRIGATE_ATTACK', (state, player) => {
            player.coins += 2;
            Logger.log(state, `${player.name} +2 💰 (Frégate).`);

            const trigger = {
                type: 'REGISTER_TRIGGER',
                trigger: 'AFTER_OTHER_ACTION',
                duration: 'UNTIL_NEXT_TURN',
                effects: [
                    {
                        type: 'CONDITION', condition: 'HAND_SIZE', comparator: '>=', value: 4,
                        trueEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }]
                    }
                ]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, trigger);
        });

        // TRICKSTER_ATTACK: Each other player trashes top of deck. Cost ≥3 → gain copy, else → Curse
        EffectHandlerRegistry.register('TRICKSTER_ATTACK', (state, player) => {
            const attackEffects = [{
                type: 'REVEAL_CARDS',
                amount: 1,
                source: 'deck',
                destination: 'trash'
            }, {
                type: 'CONDITION',
                condition: 'LAST_REVEALED_COST_GTE',
                value: 3,
                trueEffects: [{ type: 'GAIN_COPY_OF_TARGET' }],
                falseEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }]
            }] as any[];

            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'ATTACK',
                    attackEffects
                }
            });

            return { state, needsChoice: false };
        });

        // CABIN BOY: When you gain this, set it aside. At the start of your next turn, play it.
        EffectHandlerRegistry.register('CABIN_BOY_EFFECT', (state, player, _effect, ctx) => {
            const cardInstanceId = ctx.sourceCardInstanceId;
            if (!cardInstanceId) return { state, needsChoice: false };

            const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
            if (card) {
                player.aside.push(card);
                Logger.log(state, `${player.name} met le Mousse de côté pour le jouer au prochain tour.`);

                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: {
                        type: 'REGISTER_TRIGGER',
                        trigger: 'TURN_START',
                        duration: 'ONCE',
                        effects: [{ type: 'PLAY_TARGET', filter: { cardInstanceIds: [card.instanceId] } } as any]
                    } as any,
                    context: { sourceCardInstanceId: card.instanceId }
                });
            }
            return { state, needsChoice: false };
        });

        // HARBOR VILLAGE: +1 Action the first time you play a card for +$ this turn.
        EffectHandlerRegistry.register('HARBOR_VILLAGE_EFFECT', (state, player) => {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'REGISTER_TRIGGER',
                    trigger: 'ON_PLAYER_METRIC_CHANGE',
                    filter: { metric: 'coins', change: 'positive' } as any,
                    duration: 'UNTIL_NEXT_TURN',
                    effects: [{
                        type: 'CONDITION',
                        condition: 'FIRST_TIME_THIS_TURN_GLOBAL', // Simple flag check
                        value: 'harbor_village_bonus',
                        trueEffects: [{ type: 'ADD_ACTIONS', amount: 1 }]
                    } as any]
                } as any
            });
            return { state, needsChoice: false };
        });

        // SHAMAN: Setup is handled in SystemHooks/SupplyGenerator. 
        // Turn start: May gain card from trash costing up to 1.
        EffectHandlerRegistry.register('SHAMAN_EFFECT', (state, player) => {
            const trigger = {
                type: 'REGISTER_TRIGGER',
                trigger: 'TURN_START',
                duration: 'PERMANENT',
                effects: [{
                    type: 'SELECT_AND_APPLY',
                    sourceZone: 'trash',
                    min: 0,
                    max: 1,
                    filter: { maxCost: 1 },
                    message: 'Chaman : Gagnez une carte du Rebut (optionnel)',
                    action: 'GAIN' as any
                } as any]
            };
            return TriggerEffectHandler.handleRegisterTrigger(state, player, trigger);
        });
    }
}
