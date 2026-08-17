/**
 * MenagerieEffectHandler — Custom handlers for Menagerie expansion cards
 * 
 * Handles effects unique to Menagerie cards that can't be expressed
 * using core primitives alone.
 */

import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { EffectUtils } from '../EffectUtils.js';
import { CardRegistry } from '../../cards/index.js';
import { Logger } from '../Logger.js';
import { createCardInstance } from '../CardInstance.js';
import { EconomyEngine } from '../EconomyEngine.js';

export class MenagerieEffectHandler {
    static register() {
        // ====================================================================
        // ADD_BUYS_PER_EMPTY_PILES — Animal Fair
        // ====================================================================
        EffectHandlerRegistry.register('ADD_BUYS_PER_EMPTY_PILES', (state, player, _effect, _ctx) => {
            let emptyCount = 0;
            for (const key of Object.keys(state.supply)) {
                if (state.supply[key].count <= 0) emptyCount++;
            }
            if (emptyCount > 0) {
                player.buys += emptyCount;
                Logger.log(state, `${player.name} gagne +${emptyCount} Achat(s) (piles vides).`, player.id);
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // ADD_ACTIONS_PER_EMPTY_PILES — Paddock
        // ====================================================================
        EffectHandlerRegistry.register('ADD_ACTIONS_PER_EMPTY_PILES', (state, player, _effect, _ctx) => {
            let emptyCount = 0;
            for (const key of Object.keys(state.supply)) {
                if (state.supply[key].count <= 0) emptyCount++;
            }
            if (emptyCount > 0) {
                player.actions += emptyCount;
                Logger.log(state, `${player.name} gagne +${emptyCount} Action(s) (piles vides).`, player.id);
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // EXILE_SELF — Stockpile (exile the card that was just played)
        // ====================================================================
        EffectHandlerRegistry.register('EXILE_SELF', (state, player, _effect, ctx) => {
            const sourceId = ctx?.sourceCardInstanceId;
            if (!sourceId) return { state, needsChoice: false };

            const idx = player.playArea.findIndex(c => c.instanceId === sourceId);
            if (idx !== -1) {
                const card = player.playArea.splice(idx, 1)[0];
                if (!player.exileMat) player.exileMat = [];
                player.exileMat.push(card);
                Logger.log(state, `${player.name} exile ${CardRegistry.get(card.id)?.name || card.id}.`, player.id);
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // EXILE_CURSE — Coven (exile a curse from supply, or discard exiled curses)
        // ====================================================================
        EffectHandlerRegistry.register('EXILE_CURSE', (state, player, _effect, _ctx) => {
            const cursePile = state.supply['curse'];
            if (cursePile && cursePile.count > 0) {
                // Exile a curse
                cursePile.count--;
                const curseCard = createCardInstance('curse');
                if (!player.exileMat) player.exileMat = [];
                player.exileMat.push(curseCard);
                Logger.log(state, `${player.name} exile une Malédiction.`, player.id);
            } else {
                // No curses left in supply: discard all exiled curses
                if (player.exileMat && player.exileMat.length > 0) {
                    const exiledCurses = player.exileMat.filter(c => c.id === 'curse');
                    player.exileMat = player.exileMat.filter(c => c.id !== 'curse');
                    for (const curse of exiledCurses) {
                        player.discardPile.push(curse);
                    }
                    if (exiledCurses.length > 0) {
                        Logger.log(state, `${player.name} défausse ${exiledCurses.length} Malédiction(s) exilée(s).`, player.id);
                    }
                }
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // SCRAP_EFFECT — Scrap (trash a card, choose N bonuses where N = cost)
        // ====================================================================
        EffectHandlerRegistry.register('SCRAP_EFFECT', (state, player, _effect, _ctx) => {
            state.pendingDecision = {
                id: `scrap_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: 'Écartez une carte de votre main (Ferraille)',
                constraints: {
                    min: 1,
                    max: 1,
                    sourceZone: 'hand'
                },
                context: {
                    specialAction: 'SCRAP_TRASH',
                    next: [
                        { type: 'TRASH' },
                        { type: 'SCRAP_BONUSES' }
                    ]
                }
            };
            return { state, needsChoice: true };
        });

        // ====================================================================
        // SCRAP_BONUSES — Scrap (choose N bonuses where N = cost)
        // ====================================================================
        EffectHandlerRegistry.register('SCRAP_BONUSES', (state, player, _effect, _ctx) => {
            const card = state.lastTrashedCard;
            if (!card) return { state, needsChoice: false };

            const cost = EconomyEngine.getCardCost(state, player.id, card.id);
            if (cost <= 0) {
                Logger.log(state, `${player.name} ne gagne aucun bonus (coût 0).`, player.id);
                return { state, needsChoice: false };
            }

            state.pendingDecision = {
                id: `scrap_choice_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_OPTION',
                message: `Choisissez ${cost} bonus différents (Ferraille)`,
                options: [
                    { label: '+1 Carte', effects: [{ type: 'DRAW', amount: 1 }] },
                    { label: '+1 Action', effects: [{ type: 'MODIFY_RESOURCE', resource: 'actions', amount: 1 }] },
                    { label: '+1 Achat', effects: [{ type: 'MODIFY_RESOURCE', resource: 'buys', amount: 1 }] },
                    { label: 'Gagner un Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }] },
                    { label: 'Gagner un Cheval', effects: [{ type: 'GAIN_CARD', cardId: 'horse' }] }
                ],
                constraints: {
                    min: Math.min(cost, 5),
                    max: Math.min(cost, 5),
                    exclusive: true,
                    sourceZone: 'aside'
                },
                context: { specialAction: 'CHOOSE_OPTION' }
            };
            return { state, needsChoice: true };
        });

        // ====================================================================
        // GROOM_BONUS — Groom (bonus based on gained card type)
        // ====================================================================
        EffectHandlerRegistry.register('GROOM_BONUS', (state, player, _effect, _ctx) => {
            const lastGained = state.lastGainedCard;
            if (!lastGained) return { state, needsChoice: false };

            const def = CardRegistry.get(lastGained.id);
            if (!def) return { state, needsChoice: false };

            if (def.types.includes('ACTION')) {
                // Gain a Horse
                const horsePile = state.nonSupply['horse'];
                if (horsePile && horsePile.count > 0) {
                    horsePile.count--;
                    const horse = createCardInstance('horse');
                    player.discardPile.push(horse);
                    Logger.log(state, `${player.name} gagne un Cheval (Palefrenier).`, player.id);
                }
            }
            if (def.types.includes('TREASURE')) {
                // Gain a Silver
                const silverPile = state.supply['silver'];
                if (silverPile && silverPile.count > 0) {
                    silverPile.count--;
                    const silver = createCardInstance('silver');
                    player.discardPile.push(silver);
                    Logger.log(state, `${player.name} gagne un Argent (Palefrenier).`, player.id);
                }
            }
            if (def.types.includes('VICTORY')) {
                EffectUtils.drawCards(state, player, 1);
                player.actions += 1;
                Logger.log(state, `${player.name} gagne +1 Carte, +1 Action (Palefrenier).`, player.id);
            }

            return { state, needsChoice: false };
        });

        // ====================================================================
        // IGNORE_EXTRA_ACTIONS — Snowy Village
        // ====================================================================
        EffectHandlerRegistry.register('IGNORE_EXTRA_ACTIONS', (state, player, _effect, _ctx) => {
            // Set a flag that prevents further +Action effects this turn
            (player as any).ignoreExtraActions = true;
            Logger.log(state, `${player.name} ignore les Actions supplémentaires ce tour-ci (Village Enneigé).`, player.id);
            return { state, needsChoice: false };
        });

        // ====================================================================
        // DRAW_PER_OPPONENT_TRASH — Goatherd
        // ====================================================================
        EffectHandlerRegistry.register('DRAW_PER_OPPONENT_TRASH', (state, player, _effect, _ctx) => {
            // Count cards trashed by the player to your right this turn
            // Simplified: count cards trashed by any other player this turn
            const rightPlayerIndex = (state.players.indexOf(player) - 1 + state.players.length) % state.players.length;
            const rightPlayer = state.players[rightPlayerIndex];
            const trashedThisTurn = (rightPlayer as any).trashedThisTurn || 0;

            if (trashedThisTurn > 0) {
                EffectUtils.drawCards(state, player, trashedThisTurn);
                Logger.log(state, `${player.name} pioche ${trashedThisTurn} carte(s) (Chevrier).`, player.id);
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // GAIN_HORSE_PER_DISCARDED — Hostelry on-gain
        // ====================================================================
        EffectHandlerRegistry.register('GAIN_HORSE_PER_DISCARDED', (state, player, _effect, _ctx) => {
            const discardedCount = state.lastDecisionResults?.cards?.length || 0;
            if (discardedCount > 0) {
                for (let i = 0; i < discardedCount; i++) {
                    const horsePile = state.nonSupply['horse'];
                    if (horsePile && horsePile.count > 0) {
                        horsePile.count--;
                        const horse = createCardInstance('horse');
                        player.discardPile.push(horse);
                    }
                }
                Logger.log(state, `${player.name} gagne ${discardedCount} Cheval/Chevaux (Hôtellerie).`, player.id);
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // PLAY_ACTION_FROM_HAND — Mastermind duration
        // ====================================================================
        EffectHandlerRegistry.register('PLAY_ACTION_FROM_HAND', (state, player, effect, _ctx) => {
            const times = effect.times || 3;
            // Prompt to choose an Action from hand
            const actionsInHand = player.hand.filter(c => {
                const def = CardRegistry.get(c.id);
                return def && def.types.includes('ACTION');
            });

            if (actionsInHand.length === 0) {
                Logger.log(state, `${player.name} n'a pas d'Action en main (Cerveau).`, player.id);
                return { state, needsChoice: false };
            }

            state.pendingDecision = {
                id: `mastermind_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: `Choisissez une Action à jouer ${times} fois (Cerveau)`,
                constraints: {
                    min: 0,
                    max: 1,
                    sourceZone: 'hand',
                    filter: { cardTypes: ['ACTION'] }
                },
                optional: true,
                context: {
                    specialAction: 'PLAY_ACTION_TIMES',
                    times
                }
            };
            return { state, needsChoice: true };
        });

        // ====================================================================
        // KILN_COPY — Kiln trigger (gain a copy of the next card played)
        // ====================================================================
        EffectHandlerRegistry.register('KILN_COPY', (state, player, _effect, ctx) => {
            // ctx should have the card that was just played
            const cardId = ctx?.triggerCardId;
            if (!cardId) return { state, needsChoice: false };

            // Ask if they want to gain a copy
            state.pendingDecision = {
                id: `kiln_${Date.now()}`,
                playerId: player.id,
                type: 'YES_NO' as any,
                message: `Gagner une copie de ${CardRegistry.get(cardId)?.name || cardId} ? (Four)`,
                options: [
                    { label: 'Oui', effects: [{ type: 'GAIN_CARD', cardId }] },
                    { label: 'Non', effects: [] }
                ],
                optional: true,
                context: { specialAction: 'CHOOSE_OPTION' }
            };
            return { state, needsChoice: true };
        });

        // ====================================================================
        // RECRUITER_BONUS — Recruiter (gain +Action per cost of trashed card)
        // ====================================================================
        EffectHandlerRegistry.register('RECRUITER_BONUS', (state, player, _effect, _ctx) => {
            const card = state.lastTrashedCard;
            if (!card) return { state, needsChoice: false };

            const cost = EconomyEngine.getCardCost(state, player.id, card.id);
            if (cost > 0) {
                player.actions += cost;
                Logger.log(state, `${player.name} gagne +${cost} Action(s) (Recruteur).`, player.id);
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // BOUNTY_HUNTER_BONUS — Bounty Hunter (+$3 and exile if card is "new")
        // ====================================================================
        EffectHandlerRegistry.register('BOUNTY_HUNTER_BONUS', (state, player, _effect, _ctx) => {
            const card = state.lastTrashedCard;
            if (!card) return { state, needsChoice: false };

            const exiledNames = (player.exileMat || []).map(c => CardRegistry.get(c.id)?.name);
            const trashedName = CardRegistry.get(card.id)?.name;

            if (trashedName && !exiledNames.includes(trashedName)) {
                player.coins += 3;
                Logger.log(state, `${player.name} gagne +3$ car ${trashedName} n'était pas en Exil (Chasseur de Primes).`, player.id);

                // Exile a card from supply with same name
                const pile = state.supply[card.id];
                if (pile && pile.count > 0) {
                    pile.count--;
                    const copy = createCardInstance(card.id);
                    if (!player.exileMat) player.exileMat = [];
                    player.exileMat.push(copy);
                    Logger.log(state, `${player.name} exile ${trashedName} depuis la Réserve.`, player.id);
                }
            }
            return { state, needsChoice: false };
        });

        // ====================================================================
        // WAY_BUTTERFLY_EFFECT — Way of the Butterfly
        // ====================================================================
        EffectHandlerRegistry.register('WAY_BUTTERFLY_EFFECT', (state, player, _effect, ctx) => {
            const sourceId = ctx?.sourceCardInstanceId;
            if (!sourceId) return { state, needsChoice: false };

            const idx = player.playArea.findIndex(c => c.instanceId === sourceId);
            if (idx === -1) return { state, needsChoice: false };

            const card = player.playArea.splice(idx, 1)[0];
            const cost = EconomyEngine.getCardCost(state, player.id, card.id);
            
            // Return to pile
            const pile = state.supply[card.id];
            if (pile) {
                pile.count++;
                Logger.log(state, `${player.name} retourne ${CardRegistry.get(card.id)?.name} à sa pile (Voie du Papillon).`, player.id);
            }

            // Gain card costing exactly cost + 1
            state.pendingDecision = {
                id: `butterfly_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS',
                message: `Gagnez une carte coûtant exactement ${cost + 1} Pièces (Voie du Papillon)`,
                constraints: {
                    min: 1,
                    max: 1,
                    filter: { exactCost: cost + 1 }
                },
                context: { specialAction: 'GAINER' }
            };

            return { state, needsChoice: true };
        });

        // ====================================================================
        // TOPDECK_WHEN_DISCARDED — Way of the Frog
        // ====================================================================
        EffectHandlerRegistry.register('TOPDECK_WHEN_DISCARDED', (state, player, _effect, ctx) => {
            const sourceId = ctx?.sourceCardInstanceId;
            if (!sourceId) return { state, needsChoice: false };

            // Register a cleanup trigger for this specific instance
            if (!state.triggers) state.triggers = [];
            state.triggers.push({
                type: 'ON_CLEANUP',
                playerId: player.id,
                effects: [{
                    type: 'CHOOSE_OPTION',
                    message: `Mettre ${CardRegistry.get(ctx.sourceCardId)?.name || 'la carte'} sur votre deck ?`,
                    options: [
                        { label: 'Oui', effects: [{ type: 'MOVE_TO_ZONE', sourceCardInstanceId: sourceId, destination: 'deck' }] },
                        { label: 'Non', effects: [] }
                    ]
                }],
                once: true,
                sourceCardInstanceId: sourceId
            } as any);

            Logger.log(state, `${player.name} pourra mettre cette carte sur son deck à la fin du tour (Voie de la Grenouille).`, player.id);
            return { state, needsChoice: false };
        });

        // ====================================================================
        // SET_ASIDE_FOR_NEXT_TURN — Way of the Turtle
        // ====================================================================
        EffectHandlerRegistry.register('SET_ASIDE_FOR_NEXT_TURN', (state, player, _effect, ctx) => {
            const sourceId = ctx?.sourceCardInstanceId;
            if (!sourceId) return { state, needsChoice: false };

            const idx = player.playArea.findIndex(c => c.instanceId === sourceId);
            if (idx === -1) return { state, needsChoice: false };

            const card = player.playArea.splice(idx, 1)[0];
            if (!player.aside) player.aside = [];
            player.aside.push(card);

            // Register a start-of-turn trigger to play it
            if (!state.triggers) state.triggers = [];
            state.triggers.push({
                type: 'START_TURN',
                playerId: player.id,
                effects: [{ type: 'PLAY_FROM_MAT', mat: 'aside', cardInstanceId: sourceId }],
                once: true,
                sourceCardInstanceId: sourceId
            } as any);

            Logger.log(state, `${player.name} met ${CardRegistry.get(card.id)?.name} de côté pour le prochain tour (Voie de la Tortue).`, player.id);
            return { state, needsChoice: false };
        });

        // ====================================================================
        // DRAW_AT_END_OF_TURN — Way of the Squirrel
        // ====================================================================
        EffectHandlerRegistry.register('DRAW_AT_END_OF_TURN', (state, player, _effect, _ctx) => {
            // Register a cleanup trigger
            if (!state.triggers) state.triggers = [];
            state.triggers.push({
                type: 'ON_CLEANUP',
                playerId: player.id,
                effects: [{ type: 'DRAW', amount: 2 }],
                once: true
            } as any);

            Logger.log(state, `${player.name} piochera 2 cartes à la fin du tour (Voie de l'Écureuil).`, player.id);
            return { state, needsChoice: false };
        });
    }
}
