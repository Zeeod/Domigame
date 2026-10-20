
import { GameState, EffectResult } from '../GameState.js';
import { PlayerState } from '../PlayerState.js';
import { CardInstance } from '../CardInstance.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';
import { Logger } from '../Logger.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';
import { TrashEffectHandler } from './TrashEffectHandler.js';
import { matName, matName as canonicalMat, getMat, addToMat } from '../Mats.js';
import { markPlayed } from '../Play.js';

export class ZoneEffectHandler {

    // Core Zone Operations

    static handleTrashSelf(state: GameState, player: PlayerState, sourceCardInstanceId?: string): EffectResult {
        let owner: PlayerState = player;
        let card: CardInstance | undefined;

        if (sourceCardInstanceId) {
            // The source card may belong to another player (e.g. a Knight's attack resolved
            // by the victim: "if a Knight is trashed, trash this" targets the attacker's Knight).
            const owners = [player, ...state.players.filter(p => p.id !== player.id)];
            for (const p of owners) {
                const found = [...p.playArea, ...p.hand].find(c => c.instanceId === sourceCardInstanceId);
                if (found) { owner = p; card = found; break; }
            }
        } else if (player.playArea.length > 0) {
            // Legacy fallback: no source id known, assume the last card played
            card = player.playArea[player.playArea.length - 1];
        }

        if (card) {
            EffectUtils.removeCardFromPlayer(state, owner, card.instanceId);
            TrashEffectHandler.trashCard(state, owner, card);
        }
        return { state, needsChoice: false };
    }

    /**
     * MOVE_TO_MAT — put card(s) on a player mat.
     *   targets: 'TOP_OF_DECK'  → the top card of the deck (Native Village)
     *            'SELF'         → the source card
     *            'BOTH'         → the source card, then a card chosen from hand (Island)
     *   targetCardInstanceId    → that specific card
     *   otherwise               → the player chooses a card from hand
     * Reserve cards moving themselves to the Tavern (no message/from) behave like 'SELF'.
     */
    static handleMoveToMat(state: GameState, player: PlayerState, effect: any, ctx: any = {}): EffectResult {
        if (!effect.mat) return { state, needsChoice: false };
        const mat = matName(effect.mat);
        const put = (card: CardInstance) => {
            addToMat(player, mat, card);
            EffectUtils.log(state, `${player.name} place ${CardRegistry.get(card.id)?.name || card.id} sur son plateau ${mat}.`, player.id);
        };

        if (effect.targets === 'TOP_OF_DECK') {
            if (player.deck.length === 0 && player.discardPile.length > 0) {
                player.deck = EffectUtils.shuffle(player.discardPile, state);
                player.discardPile = [];
            }
            const top = player.deck.shift();
            if (top) put(top);
            return { state, needsChoice: false };
        }

        const reserveSelfMove = mat === 'tavern' && !effect.targets && !effect.message && !effect.from;
        if ((effect.targets === 'SELF' || effect.targets === 'BOTH' || reserveSelfMove) && ctx.sourceCardInstanceId) {
            const sourceCard = EffectUtils.removeCardFromPlayer(state, player, ctx.sourceCardInstanceId);
            if (sourceCard) put(sourceCard);
            if (effect.targets !== 'BOTH') return { state, needsChoice: false };
        }

        if (effect.targetCardInstanceId) {
            const card = EffectUtils.removeCardFromPlayer(state, player, effect.targetCardInstanceId);
            if (card) put(card);
            return { state, needsChoice: false };
        }

        // Choose a card from hand
        if (player.hand.length === 0) return { state, needsChoice: false };
        state.pendingDecision = {
            id: `move_to_mat_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: effect.message || `Choisissez une carte à placer sur votre plateau ${mat}`,
            constraints: { min: effect.min ?? 1, max: effect.max ?? 1, sourceZone: 'hand', filter: effect.filter },
            context: {
                ...ctx,
                specialAction: 'MOVE_TO_MAT',
                matName: mat,
                targets: effect.targets,
                sourceCardInstanceId: ctx.sourceCardInstanceId
            }
        } as any;
        return { state, needsChoice: true };
    }

    /** TAKE_FROM_MAT — move all cards (or those listed in targetCardIds) from a mat to `destination` (hand by default). */
    static handleTakeFromMat(state: GameState, player: PlayerState, effect: any): EffectResult {
        if (!effect.mat) return { state, needsChoice: false };
        const mat = getMat(player, effect.mat);
        const destination = effect.destination || 'hand';
        const ids: string[] | undefined = effect.targetCardIds
            ? (Array.isArray(effect.targetCardIds) ? effect.targetCardIds : [effect.targetCardIds])
            : undefined;

        const toMove = mat.filter(c => !ids || ids.includes(c.id));
        for (const card of toMove) {
            mat.splice(mat.indexOf(card), 1);
            EffectUtils.addCardToZone(player, card, destination, state);
        }
        if (toMove.length > 0) {
            EffectUtils.log(state, `${player.name} prend ${toMove.length} carte(s) de son plateau ${matName(effect.mat)}.`, player.id);
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

    /**
     * Rotate a split pile (Allies): every card with the same name as the top card goes
     * to the bottom. Convention: the TOP of a mixed pile is the END of `pile.cards`.
     */
    static handleRotatePile(state: GameState, effect: any): EffectResult {
        const pile = state.supply[effect.pileId];
        if (!pile?.cards || pile.cards.length < 2) return { state, needsChoice: false };

        const topId = pile.cards[pile.cards.length - 1].id;
        const moved: CardInstance[] = [];
        while (pile.cards.length > 0 && pile.cards[pile.cards.length - 1].id === topId) {
            moved.unshift(pile.cards.pop()!);
        }
        if (pile.cards.length === 0) {
            pile.cards = moved; // only one card name in the pile: nothing changes
        } else {
            pile.cards.unshift(...moved);
        }
        pile.cardId = pile.cards[pile.cards.length - 1].id;
        Logger.log(state, `La pile tourne : ${CardRegistry.get(pile.cardId)?.name || pile.cardId} est maintenant au-dessus.`);
        return { state, needsChoice: false };
    }

    static handlePlayFromMat(state: GameState, player: PlayerState, effect: any): EffectResult {
        const matKey: string = effect.mat === 'aside' ? 'aside' : canonicalMat(effect.mat);
        return this.playFromMat(state, player, effect, matKey);
    }

    private static playFromMat(state: GameState, player: PlayerState, effect: any, matName: string): EffectResult {
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
            markPlayed(state, player, card);
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
