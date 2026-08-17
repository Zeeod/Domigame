import { GameState, PlayerState, createCardInstance, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';

export class GainEffectHandler {
    public static handleGainCard(state: GameState, player: PlayerState, effect: any, sourceCardInstanceId?: string): EffectResult {
        const cardId = effect.cardId;

        // If no specific cardId but maxCost is given, prompt the player to choose from supply
        if (!cardId && effect.maxCost !== undefined) {
            let computedMaxCost = effect.maxCost;
            if (computedMaxCost === 'LAST_BOUGHT_COST' || computedMaxCost === 'LAST_BOUGHT_COST_LESS') {
                computedMaxCost = Math.max(0, (state.lastBoughtCost !== undefined ? state.lastBoughtCost : 0) - 1);
            } else if (computedMaxCost === 'LAST_BOUGHT_COST_EQUAL') {
                computedMaxCost = state.lastBoughtCost !== undefined ? state.lastBoughtCost : 0;
            } else if (computedMaxCost === 'TRASHED_COST_MINUS_1') {
                const trashedCost = state.lastTrashedCard ? EconomyEngine.getCardCost(state, player.id, state.lastTrashedCard.id) : 0;
                computedMaxCost = Math.max(0, trashedCost - 1);
            } else if (computedMaxCost === 'TRASHED_COST_PLUS_2') {
                const trashedCost = state.lastTrashedCard ? EconomyEngine.getCardCost(state, player.id, state.lastTrashedCard.id) : 0;
                computedMaxCost = trashedCost + 2;
            }

            state.pendingDecision = {
                id: `gain_card_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS' as any,
                message: `Gagnez une carte coûtant jusqu'à ${computedMaxCost} 💰`,
                constraints: {
                    min: 1,
                    max: 1,
                    sourceZone: 'supply',
                    filter: {
                        maxCost: computedMaxCost,
                        cardTypes: effect.cardTypes,
                        allowedTypes: effect.allowedTypes
                    }
                },
                context: {
                    specialAction: 'GAINER',
                    filter: {
                        maxCost: computedMaxCost,
                        cardTypes: effect.cardTypes,
                        allowedTypes: effect.allowedTypes
                    },
                    destination: effect.destination || 'discardPile',
                    linkToSource: effect.linkToSource || false,
                    sourceCardInstanceId: sourceCardInstanceId,
                    onSuccess: effect.onSuccess,
                    next: effect.next
                }
            };
            return { state, needsChoice: true };
        }

        if (!cardId) {
            return { state, needsChoice: false };
        }

        const pile = state.supply[cardId];
        if (!pile || pile.count <= 0) {
            EffectUtils.log(state, `Plus de ${CardRegistry.get(cardId)?.name || cardId} en réserve.`);
            return { state, needsChoice: false };
        }

        pile.count--;
        const newCard = createCardInstance(cardId);
        state.lastGainedCard = newCard;
        state.lastGainedCost = EconomyEngine.getCardCost(state, player.id, cardId);
        const dest = effect.destination || 'discardPile';

        if (dest === 'exile_prompt') {
            state.pendingDecision = {
                id: `exile_prompt_${Date.now()}`,
                playerId: player.id,
                type: 'SELECT_OPTION',
                message: `Voulez-vous exiler ${CardRegistry.get(cardId)?.name || cardId} ?`,
                options: [
                    { label: 'Exiler', effects: [{ type: 'MOVE_TO_MAT', mat: 'exile', targetCardInstanceId: newCard.instanceId }] },
                    { label: 'Défausser', effects: [{ type: 'MOVE_CARDS', source: 'limbo', destination: 'discardPile' }] }
                ],
                context: { cardInstanceId: newCard.instanceId }
            };
            EffectUtils.addCardToZone(player, newCard, 'limbo', state);
        } else {
            EffectUtils.addCardToZone(player, newCard, dest, state);
        }

        if (effect.linkToSource && sourceCardInstanceId) {
            const sourceCard = player.playArea.find(c => c.instanceId === sourceCardInstanceId);
            if (sourceCard) {
                if (!sourceCard.linkedCards) sourceCard.linkedCards = [];
                sourceCard.linkedCards.push(newCard);
            }
        }

        const cardName = CardRegistry.get(cardId)?.name || cardId;
        EffectUtils.log(state, `${player.name} reçoit ${cardName}.`, player.id);

        // Trigger centralized On-Gain effects (card's own onGain + global triggers)
        TriggerEffectHandler.triggerOnGainEffects(state, player, newCard);

        return { state, needsChoice: dest === 'exile_prompt' };
    }

    public static handleGainCardPlusCost(state: GameState, player: PlayerState, effect: any): EffectResult {
        const lastTrashed = state.lastTrashedCard;
        if (!lastTrashed) return { state, needsChoice: false };

        const baseCost = EconomyEngine.getCardCost(state, player.id, lastTrashed.id);
        const maxCost = baseCost + (effect.amount !== undefined ? effect.amount : (effect.costBonus !== undefined ? effect.costBonus : 0));

        state.pendingDecision = {
            id: `gain_plus_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: `Gagnez une carte coûtant jusqu'à ${maxCost} 💰`,
            constraints: { 
                min: 1, 
                max: 1, 
                sourceZone: 'supply',
                filter: { maxCost }
            },
            context: {
                specialAction: 'GAINER',
                destination: effect.destination || 'discardPile',
                onGainEffects: effect.onGainEffects || effect.onSuccess || effect.next
            }
        };
        return { state, needsChoice: true };
    }

    public static handleGainCardExactCost(state: GameState, player: PlayerState, effect: any): EffectResult {
        const cost = effect.amount;
        state.pendingDecision = {
            id: `gain_exact_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: `Gagnez une carte coûtant exactement ${cost} 💰`,
            constraints: { 
                min: 1, 
                max: 1, 
                sourceZone: 'supply',
                filter: { exactCost: cost }
            },
            context: {
                specialAction: 'GAINER',
                destination: effect.destination || 'discardPile'
            }
        };
        return { state, needsChoice: true };
    }

    public static handleGainCopyOfTarget(state: GameState, player: PlayerState, effect: any): EffectResult {
        const lastSelected = state.lastDecisionResults?.cards?.[0];
        if (!lastSelected) return { state, needsChoice: false };

        return this.handleGainCard(state, player, { ...effect, cardId: lastSelected.id });
    }

    public static handleGainThisCard(state: GameState, player: PlayerState, effect: any, sourceCardInstanceId?: string): EffectResult {
        if (!sourceCardInstanceId) return { state, needsChoice: false };
        const card = player.playArea.find(c => c.instanceId === sourceCardInstanceId) ||
            player.aside.find(c => c.instanceId === sourceCardInstanceId);

        if (card) {
            player.playArea = player.playArea.filter(c => c.instanceId !== card.instanceId);
            player.aside = player.aside.filter(c => c.instanceId !== card.instanceId);
            EffectUtils.addCardToZone(player, card, effect.destination || 'discardPile', state);
            EffectUtils.log(state, `${player.name} reçoit sa propre carte (${CardRegistry.get(card.id)?.name}).`, player.id);
        }
        return { state, needsChoice: false };
    }

    public static handleGainFromTrash(state: GameState, player: PlayerState, effect: any): EffectResult {
        // Filter trash
        let trashCards = state.trash;
        if (effect.minCost !== undefined || effect.maxCost !== undefined) {
            trashCards = trashCards.filter(c => {
                const cost = EconomyEngine.getCardCost(state, player.id, c.id);
                return cost >= (effect.minCost || 0) && cost <= (effect.maxCost || 999);
            });
        }

        if (trashCards.length === 0) {
            EffectUtils.log(state, 'Aucune carte valide dans le Rebut à gagner.', player.id);
            return { state, needsChoice: false };
        }

        // We can't filter the PROMPT by strict list of IDs easily in PromptConstraints yet (allows 'allowedCardIds'?)
        // PromptConstraints has `allowedCardIds`.
        const allowedIds = trashCards.map(c => c.id); // Deduplicate? Prompt usually handles instances or definitions.
        // Prompt constraints for 'trash' usually allow selecting ANY card in trash.
        // We should restrict it.

        state.pendingDecision = {
            id: `gain_trash_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: 'Choisissez une carte du Rebut à gagner',
            constraints: {
                min: 1,
                max: 1,
                sourceZone: 'trash',
                allowedCardIds: allowedIds // Restrict to valid cost targets
            },
            context: {
                specialAction: 'GAIN_FROM_TRASH',
                next: [{ type: 'GAIN_SELECTED_FROM_TRASH', destination: effect.destination }],
                cards: trashCards.map(c => ({ id: c.id, instanceId: c.instanceId }))
            }
        };
        return { state, needsChoice: true };
    }

    public static handleGainSelectedFromTrash(state: GameState, player: PlayerState, effect: any): EffectResult {
        const selected = state.lastDecisionResults?.cards?.[0];
        if (!selected) return { state, needsChoice: false };

        const cardInTrash = state.trash.find(c => c.instanceId === selected.instanceId);
        if (cardInTrash) {
            // Remove from Trash
            state.trash = state.trash.filter(c => c.instanceId !== cardInTrash.instanceId);

            // Add to Destination
            const dest = effect.destination || 'discardPile';
            EffectUtils.addCardToZone(player, cardInTrash, dest, state);

            EffectUtils.log(state, `${player.name} gagne ${CardRegistry.get(cardInTrash.id)?.name} du Rebut.`, player.id);

            // Trigger centralized On-Gain effects (card's own onGain + global triggers)
            TriggerEffectHandler.triggerOnGainEffects(state, player, cardInTrash);
        }
        return { state, needsChoice: false };
    }

    public static handleMoveGainedToHand(state: GameState, player: PlayerState, effect: any): EffectResult {
        const gainedCard = state.lastGainedCard;
        console.log('[DEBUG-MOVE] handleMoveGainedToHand called. gainedCard ID:', gainedCard?.id, 'instanceId:', gainedCard?.instanceId);
        if (!gainedCard) return { state, needsChoice: false };

        const targetZone = effect.destination || 'hand';
        console.log('[DEBUG-MOVE] targetZone:', targetZone);

        // Find where the gained card is now. usually discardPile
        const zones: (keyof PlayerState)[] = ['discardPile', 'hand', 'deck', 'aside', 'playArea'];
        let foundZone: keyof PlayerState | null = null;
        let foundCard = null;

        for (const zone of zones) {
            const arr = player[zone] as any[];
            if (Array.isArray(arr)) {
                const idx = arr.findIndex(c => c.instanceId === gainedCard.instanceId);
                if (idx !== -1) {
                    foundCard = arr[idx];
                    foundZone = zone;
                    console.log('[DEBUG-MOVE] found card in zone:', zone);
                    break;
                }
            }
        }

        console.log('[DEBUG-MOVE] foundZone:', foundZone, 'foundCard:', foundCard ? 'exists' : 'null');

        if (foundCard && foundZone && foundZone !== targetZone) {
            // Remove from current zone
            (player[foundZone] as any[]) = (player[foundZone] as any[]).filter(c => c.instanceId !== gainedCard.instanceId);
            // Add to target zone
            if (targetZone === 'deck') {
                player.deck.push(foundCard); // Top of deck
            } else {
                EffectUtils.addCardToZone(player, foundCard, targetZone as any, state);
            }
            EffectUtils.log(state, `${player.name} met la carte obtenue dans ${targetZone === 'deck' ? 'sa pioche' : 'sa main'}.`, player.id);
            console.log('[DEBUG-MOVE] Moved card successfully to', targetZone);
        }

        return { state, needsChoice: false };
    }
}
