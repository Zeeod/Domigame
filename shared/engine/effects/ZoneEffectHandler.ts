
import { GameState, EffectResult } from '../GameState.js';
import { PlayerState } from '../PlayerState.js';
import { CardInstance } from '../CardInstance.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';
import { Logger } from '../Logger.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';

export class ZoneEffectHandler {

    // Core Zone Operations (Trash, Discard, etc.)

    static handleTrash(state: GameState, player: PlayerState, _effect: any, _sourceCardInstanceId?: string): EffectResult {
        // Simple logic (trash from hand/play usually handled by specific source instructions, 
        // e.g. "Trash a card from your hand")
        // This handler handles the direct "TRASH" effect if target is known or general instruction

        // If effect has 'target' (e.g. from context of selection)
        if (state.lastDecisionResults?.cards) {
            const cardsToTrash = state.lastDecisionResults.cards; // CardInstances
            // Remove from source zones
            // Assuming cards are already found in player state

            const trashedNames: string[] = [];

            for (const c of cardsToTrash) {
                // Remove from wherever it is (Hand, Play, Discard)
                EffectUtils.removeCardFromPlayer(state, player, c.instanceId);
                state.trash.push(c);
                const def = CardRegistry.get(c.id);
                trashedNames.push(def ? def.name : c.id);

                // Triggers
                EffectUtils.handleTrashTriggers(state, player, c);
            }

            Logger.log(state, `${player.name} écarte : ${trashedNames.join(', ')}.`, player.id);
        }

        return { state, needsChoice: false };
    }

    static handleTrashSelf(state: GameState, player: PlayerState, sourceCardInstanceId?: string): EffectResult {
        let card = sourceCardInstanceId ? [...player.playArea, ...player.hand].find(c => c.instanceId === sourceCardInstanceId) : undefined;
        if (!card && player.playArea.length > 0) {
            card = player.playArea[player.playArea.length - 1];
        }
        if (card) {
            EffectUtils.removeCardFromPlayer(state, player, card.instanceId);
            state.trash.push(card);
            const def = CardRegistry.get(card.id);
            Logger.log(state, `${player.name} écarte ${def?.name}.`, player.id);
            EffectUtils.handleTrashTriggers(state, player, card);
        }
        return { state, needsChoice: false };
    }

    static handleMoveToMat(state: GameState, player: PlayerState, effect: any, ctx: any = {}): EffectResult {
        const matName = effect.mat;
        if (!matName) return { state, needsChoice: false };

        if (!player.mats) player.mats = {};
        if (!player.mats[matName]) player.mats[matName] = [];

        // Alias legacy fields
        if (matName === 'island') player.islandMat = player.mats[matName];
        if (matName === 'tavern') player.tavernMat = player.mats[matName];
        if (matName === 'exile') player.exileMat = player.mats[matName];
        if (matName.startsWith('nativeVillage')) {
            player.nativeVillageMat = player.mats[matName];
            player.mats['nativeVillageMat'] = player.mats[matName];
            player.mats['nativeVillage'] = player.mats[matName];
        }

        // If targets is BOTH, move source card immediately before choice prompt
        if (effect.targets === 'BOTH' && ctx.sourceCardInstanceId) {
            const sourceCard = EffectUtils.removeCardFromPlayer(state, player, ctx.sourceCardInstanceId);
            if (sourceCard) {
                player.mats[matName].push(sourceCard);
                EffectUtils.log(state, `${player.name} place ${CardRegistry.get(sourceCard.id)?.name || sourceCard.id} sur son plateau ${matName}.`, player.id);
            }
        }

        // If this is a reserve card moving itself to tavern mat (e.g. Guide, Coin of the Realm)
        if (matName === 'tavern' && effect.targets !== 'BOTH' && (!effect.message && !effect.from) && ctx.sourceCardInstanceId) {
            const sourceCard = EffectUtils.removeCardFromPlayer(state, player, ctx.sourceCardInstanceId);
            if (sourceCard) {
                player.mats[matName].push(sourceCard);
                EffectUtils.log(state, `${player.name} place ${CardRegistry.get(sourceCard.id)?.name || sourceCard.id} sur son plateau ${matName}.`, player.id);
                return { state, needsChoice: false };
            }
        }

        let cards: CardInstance[] = [];
        if (state.lastDecisionResults?.cards) {
            cards = state.lastDecisionResults.cards;
        } else if (effect.targetCardInstanceId) {
            const card = EffectUtils.removeCardFromPlayer(state, player, effect.targetCardInstanceId);
            if (card) cards = [card];
        }

        if (cards.length === 0) {
            // Prompt player to choose a card to move to the mat
            state.pendingDecision = {
                id: `move_to_mat_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARDS' as any,
                message: effect.message || `Choisissez une carte à placer sur votre plateau ${matName}`,
                constraints: {
                    min: 1,
                    max: 1,
                    sourceZone: 'hand'
                },
                context: {
                    ...ctx,
                    specialAction: 'MOVE_TO_MAT',
                    matName: matName,
                    targets: effect.targets,
                    sourceCardInstanceId: ctx.sourceCardInstanceId
                }
            } as any;
            return { state, needsChoice: true };
        }

        for (const card of cards) {
            // Ensure card is removed from current zone
            player.mats[matName].push(card);
            EffectUtils.log(state, `${player.name} place ${CardRegistry.get(card.id)?.name || card.id} sur son plateau ${matName}.`, player.id);
        }

        return { state, needsChoice: false };
    }

    static handleTakeFromMat(state: GameState, player: PlayerState, effect: any): EffectResult {
        const matName = effect.mat;
        const destination = effect.destination || 'hand';
        if (!matName) return { state, needsChoice: false };

        let matCards: CardInstance[] | undefined = player.mats?.[matName] || (player as any)[matName];
        if (!matCards && matName.startsWith('nativeVillage')) {
            matCards = player.nativeVillageMat || player.mats?.['nativeVillageMat'] || player.mats?.['nativeVillage'];
        }
        if (!matCards) return { state, needsChoice: false };

        let cardsToMove: CardInstance[] = [];

        if (effect.targetCardIds) {
            // Move specific card types from mat
            const ids = Array.isArray(effect.targetCardIds) ? effect.targetCardIds : [effect.targetCardIds];
            cardsToMove = matCards.filter(c => ids.includes(c.id));
        } else {
            // Move all cards from mat
            cardsToMove = [...matCards];
        }

        if (cardsToMove.length === 0) return { state, needsChoice: false };

        for (const card of cardsToMove) {
            // Remove from mat safely
            if (player.mats?.[matName]) {
                player.mats[matName] = player.mats[matName].filter(c => c.instanceId !== card.instanceId);
            }
            if ((player as any)[matName]) {
                (player as any)[matName] = (player as any)[matName].filter((c: any) => c.instanceId !== card.instanceId);
            }
            if (player.nativeVillageMat) {
                player.nativeVillageMat = player.nativeVillageMat.filter(c => c.instanceId !== card.instanceId);
            }

            // Add to destination
            EffectUtils.addCardToZone(player, card, destination, state);
            EffectUtils.log(state, `${player.name} retire ${CardRegistry.get(card.id)?.name || card.id} de son plateau ${matName} vers ${destination}.`, player.id);
        }

        return { state, needsChoice: false };
    }

    static handleDiscardTopDeck(state: GameState, player: PlayerState): EffectResult {
        if (player.deck.length > 0) {
            const card = player.deck.shift()!;
            player.discardPile.push(card);
            const def = CardRegistry.get(card.id);
            Logger.log(state, `${player.name} défausse ${def?.name} du dessus de son deck.`, player.id);
        }
        return { state, needsChoice: false };
    }

    static handleTopdeckThis(state: GameState, player: PlayerState, sourceCardInstanceId?: string): EffectResult {
        if (!sourceCardInstanceId) return { state, needsChoice: false };
        const card = EffectUtils.removeCardFromPlayer(state, player, sourceCardInstanceId);
        if (card) {
            player.deck.unshift(card);
            const def = CardRegistry.get(card.id);
            Logger.log(state, `${player.name} remet ${def?.name} sur son deck.`, player.id);
        }
        return { state, needsChoice: false };
    }

    static handleDiscardHand(state: GameState, player: PlayerState): EffectResult {
        const count = player.hand.length;
        player.discardPile.push(...player.hand);
        player.hand = [];
        Logger.log(state, `${player.name} défausse sa main (${count} cartes).`, player.id);
        return { state, needsChoice: false };
    }

    static handleDiscardToDeck(state: GameState, player: PlayerState): EffectResult {
        const count = player.discardPile.length;
        player.deck.push(...player.discardPile);
        player.discardPile = [];
        Logger.log(state, `${player.name} remet sa défausse (${count} cartes) sur son deck.`, player.id);
        return { state, needsChoice: false };
    }

    static handleMoveCards(state: GameState, player: PlayerState, effect: any): EffectResult {
        const sourceZone = effect.source || 'limbo';
        const destZone = effect.destination || 'discardPile';
        const position = effect.position || 'BOTTOM';
        const filter = effect.filter || {};

        // Find cards in source
        let sourceCards: CardInstance[] = [];
        if (sourceZone === 'hand') sourceCards = player.hand;
        else if (sourceZone === 'deck') sourceCards = player.deck;
        else if (sourceZone === 'discardPile') sourceCards = player.discardPile;
        else if (sourceZone === 'limbo') sourceCards = player.limbo;
        else if (sourceZone === 'playArea') sourceCards = player.playArea;
        else if (sourceZone === 'aside') sourceCards = player.aside;
        else if (sourceZone === 'trash') sourceCards = state.trash;
        else if (sourceZone === 'last_selection' && state.lastDecisionResults?.cards) {
            sourceCards = state.lastDecisionResults.cards;
        }

        // Apply filter
        let eligible = sourceCards.filter(c => {
            const def = CardRegistry.get(c.id);
            if (!def) return false;

            if (filter.cardIds && !filter.cardIds.includes(c.id)) return false;
            if (filter.cardTypes) {
                const types = Array.isArray(filter.cardTypes) ? filter.cardTypes : [filter.cardTypes];
                if (!types.some((t: string) => def.types.includes(t.toUpperCase() as any))) return false;
            }
            if (filter.excludeIds && filter.excludeIds.includes(c.id)) return false;
            if (filter.excludeTypes) {
                const types = Array.isArray(filter.excludeTypes) ? filter.excludeTypes : [filter.excludeTypes];
                if (types.some((t: string) => def.types.includes(t.toUpperCase() as any))) return false;
            }
            if (filter.minCost !== undefined && (def.cost || 0) < filter.minCost) return false;
            if (filter.maxCost !== undefined && (def.cost || 0) > filter.maxCost) return false;
            if (filter.exactCost !== undefined) {
                const costs = Array.isArray(filter.exactCost) ? filter.exactCost : [filter.exactCost];
                if (!costs.includes(def.cost || 0)) return false;
            }
            if (filter.hasPotion !== undefined) {
                const needsPotion = !!def.potionCost;
                if (needsPotion !== filter.hasPotion) return false;
            }
            return true;
        });

        // Determine count
        let count: number;
        if (effect.count === 'ALL') {
            count = eligible.length;
        } else if (effect.count !== undefined) {
            count = EffectUtils.getAmount(state, player, effect.count);
        } else {
            // Default: if filter or source is specific, might want 1 or all. 
            // In Dominion, "Move cards" usually implies all matching if not specified.
            count = eligible.length;
        }

        // Limit count
        const toMove = eligible.slice(0, count);
        if (toMove.length === 0) return { state, needsChoice: false };

        const movedNames: string[] = [];

        toMove.forEach(c => {
            // Remove from source (from whichever player owns it or state trash)
            // Use EffectUtils helper for standard zones
            let actualCard = EffectUtils.removeCardFromPlayer(state, player, c.instanceId);
            if (!actualCard) {
                // Check if it's in state trash
                const trashIdx = state.trash.findIndex(x => x.instanceId === c.instanceId);
                if (trashIdx !== -1) {
                    actualCard = state.trash.splice(trashIdx, 1)[0];
                }
            }

            if (!actualCard) return; // Should not happen if data is consistent

            // Move to destination
            EffectUtils.addCardToZone(player, actualCard, destZone, state);
            if (destZone === 'deck' && position === 'TOP') {
                // If moving multiple to TOP, we should probably handle order.
                // handleMoveCards currently pushes one by one. 
                // To keep TOP order as specified, we should push to a temp list and unshift all.
            }

            const def = CardRegistry.get(actualCard.id);
            movedNames.push(def ? def.name : actualCard.id);

            // Per-card onSuccess
            if (effect.onSuccess) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: effect.onSuccess,
                    context: { sourceCardInstanceId: actualCard.instanceId }
                });
            }
        });

        if (movedNames.length > 0) {
            Logger.log(state, `${player.name} déplace ${movedNames.length} carte(s) vers ${destZone}.`, player.id);
        }

        return { state, needsChoice: false };
    }

    static handleRotatePile(_state: GameState, _effect: any): EffectResult {
        // Rotate logic
        return { state: _state, needsChoice: false };
    }

    static handlePlayFromMat(state: GameState, player: PlayerState, effect: any): EffectResult {
        const matName = effect.mat;
        let cards: any[] = [];
        let isRootZone = false;

        if (matName === 'aside' && player.aside && player.aside.length > 0) {
            cards = [...player.aside];
            isRootZone = true;
        } else if (player.mats?.[matName] && player.mats[matName].length > 0) {
            cards = [...player.mats[matName]];
        }

        if (cards.length === 0) return { state, needsChoice: false };

        // Usually, we play ALL cards from the mat (like for Patient or Cabin Boy)
        // or a specific one if effect.cardInstanceId is provided.
        const toPlay = effect.cardInstanceId ? cards.filter(c => c.instanceId === effect.cardInstanceId) : cards;

        for (const card of toPlay) {
            // Remove from mat
            if (isRootZone && matName === 'aside') {
                player.aside = player.aside.filter(c => c.instanceId !== card.instanceId);
            } else {
                player.mats[matName] = player.mats[matName].filter(c => c.instanceId !== card.instanceId);
            }

            // Add to play area
            card.turnPlayed = state.turnNumber;
            player.playArea.push(card);

            const def = CardRegistry.get(card.id);
            Logger.log(state, `${player.name} joue ${def?.name || card.id} depuis son plateau ${matName}.`);

            // Push effects to stack
            if (def?.effects) {
                const nested = def.effects.map((e: any) => ({
                    type: 'EFFECT' as const,
                    playerId: player.id,
                    effect: e,
                    context: { sourceCardInstanceId: card.instanceId }
                }));
                state.effectStack.push(...nested.reverse());
            }

            // Trigger ON_PLAY
            TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
        }

        return { state, needsChoice: false };
    }

    public static handleMoveToZone(state: GameState, player: PlayerState, effect: any, ctx: any): EffectResult {
        const cardInstanceId = effect.sourceCardInstanceId || ctx.sourceCardInstanceId;
        const destination = effect.destination || 'discardPile';

        if (!cardInstanceId) return { state, needsChoice: false };

        const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
        if (card) {
            EffectUtils.addCardToZone(player, card, destination, state);
            const def = CardRegistry.get(card.id);
            Logger.log(state, `${player.name} déplace ${def?.name || card.id} vers ${destination}.`, player.id);
        }

        return { state, needsChoice: false };
    }
}
