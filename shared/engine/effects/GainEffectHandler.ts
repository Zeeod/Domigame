import { GameState, PlayerState, createCardInstance, EffectResult, CardInstance } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';
import { debugLog } from '../debug.js';

export class GainEffectHandler {
    /**
     * Take the top card of a Supply (or non-Supply) pile. Mixed piles (Ruins, Knights,
     * split piles) give their real top card (end of `cards`); others create a new instance.
     */
    public static takeFromPile(state: GameState, pileId: string): CardInstance | undefined {
        const pile = state.supply[pileId] || state.nonSupply?.[pileId];
        if (!pile || pile.count <= 0) return undefined;
        pile.count--;
        if (pile.cards && pile.cards.length > 0) {
            const card = pile.cards.pop()!;
            if (pile.cards.length > 0) pile.cardId = pile.cards[pile.cards.length - 1].id;
            return card;
        }
        return createCardInstance(pileId);
    }

    /** Supply piles a player may choose with this filter (non-empty, matching). */
    public static supplyChoices(state: GameState, playerId: string, filter: any): string[] {
        return Object.keys(state.supply).filter(id =>
            state.supply[id].count > 0 && EconomyEngine.supplyCardMatches(state, playerId, state.supply[id].cards?.length ? state.supply[id].cards![state.supply[id].cards!.length - 1].id : id, filter));
    }

    /** Ask the player to choose a card to gain from the Supply (skipped if nothing matches). */
    public static promptGainFromSupply(state: GameState, player: PlayerState, filter: any, context: any, message: string, optional = false): EffectResult {
        const choices = this.supplyChoices(state, player.id, filter);
        if (choices.length === 0) {
            EffectUtils.log(state, `${player.name} ne peut recevoir aucune carte.`, player.id);
            return { state, needsChoice: false };
        }
        state.pendingDecision = {
            id: `gain_card_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message,
            constraints: { min: optional ? 0 : 1, max: 1, sourceZone: 'supply', filter: { ...filter, cardIds: filter.cardIds ?? choices } },
            context: { specialAction: 'GAINER', filter, ...context }
        } as any;
        return { state, needsChoice: true };
    }

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

            const filter = {
                maxCost: computedMaxCost,
                minCost: effect.minCost,
                cardTypes: effect.cardTypes,
                allowedTypes: effect.allowedTypes,
                excludeTypes: effect.excludeTypes,
                nonVictory: effect.nonVictory,
                excludeIds: effect.excludeIds,
            };
            return this.promptGainFromSupply(state, player, filter, {
                destination: effect.destination || 'discardPile',
                linkToSource: effect.linkToSource || false,
                sourceCardInstanceId,
                onSuccess: effect.onSuccess,
                next: effect.next
            }, effect.message || `Recevez une carte coûtant jusqu'à ${computedMaxCost} 💰`, !!effect.optional);
        }

        if (!cardId) {
            return { state, needsChoice: false };
        }

        const newCard = this.takeFromPile(state, cardId);
        if (!newCard) {
            EffectUtils.log(state, `Plus de ${CardRegistry.get(cardId)?.name || cardId} en réserve.`);
            return { state, needsChoice: false };
        }
        state.lastGainedCard = newCard;
        state.lastGainedCost = EconomyEngine.getCardCost(state, player.id, newCard.id);
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

        const cardName = CardRegistry.get(newCard.id)?.name || newCard.id;
        EffectUtils.log(state, `${player.name} reçoit ${cardName}.`, player.id);

        // Trigger centralized On-Gain effects (card's own onGain + global triggers)
        TriggerEffectHandler.triggerOnGainEffects(state, player, newCard);

        return { state, needsChoice: dest === 'exile_prompt' };
    }

    public static handleGainCardPlusCost(state: GameState, player: PlayerState, effect: any): EffectResult {
        const lastTrashed = state.lastTrashedCard;
        if (!lastTrashed) return { state, needsChoice: false };

        const baseCost = EconomyEngine.getCardCost(state, player.id, lastTrashed.id);
        const target = baseCost + (effect.amount !== undefined ? effect.amount : (effect.costBonus !== undefined ? effect.costBonus : 0));
        // exact: "costing exactly $X more" (Upgrade); otherwise "up to"
        const filter: any = effect.exact ? { exactCost: target } : { maxCost: target };
        if (effect.cardTypes) filter.cardTypes = effect.cardTypes;
        if (effect.nonVictory) filter.nonVictory = true;

        return this.promptGainFromSupply(state, player, filter, {
            destination: effect.destination || 'discardPile',
            onGainEffects: effect.onGainEffects || effect.onSuccess || effect.next
        }, effect.exact ? `Recevez une carte coûtant exactement ${target} 💰` : `Recevez une carte coûtant jusqu'à ${target} 💰`);
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
        if (effect.cardTypes) {
            trashCards = trashCards.filter(c => effect.cardTypes.some((t: string) => CardRegistry.get(c.id)?.types.includes(t as any)));
        }
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
        debugLog('[DEBUG-MOVE] handleMoveGainedToHand called. gainedCard ID:', gainedCard?.id, 'instanceId:', gainedCard?.instanceId);
        if (!gainedCard) return { state, needsChoice: false };

        const targetZone = effect.destination || 'hand';
        debugLog('[DEBUG-MOVE] targetZone:', targetZone);

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
                    debugLog('[DEBUG-MOVE] found card in zone:', zone);
                    break;
                }
            }
        }

        debugLog('[DEBUG-MOVE] foundZone:', foundZone, 'foundCard:', foundCard ? 'exists' : 'null');

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
            debugLog('[DEBUG-MOVE] Moved card successfully to', targetZone);
        }

        return { state, needsChoice: false };
    }
}
