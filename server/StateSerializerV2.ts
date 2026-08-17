/**
 * StateSerializer - Serializes game state for network transmission
 * 
 * Creates public/private views:
 * - Private: hand/deck visible only to owner
 * - Public: supply, scores, counts visible to all
 * 
 * Each client receives a different payload.
 */

import { GameState } from '../shared/engine/GameState.js';
import { PlayerState } from '../shared/engine/PlayerState.js';
import { CardInstance } from '../shared/engine/CardInstance.js';
import { CardRegistry } from '../shared/cards/index.js';
import { GameLogStore } from '../shared/engine/GameLogStore.js';
import { DeckEvaluator } from '../shared/bot/DeckEvaluator.js';
import { SerializedCard, PublicPlayerState, PublicGameState, PrivatePlayerState, SerializedState } from '../shared/types/index.js';

// Extend PublicGameState to include turnEndTime
declare module '../shared/types/index.js' {
    interface PublicGameState {
        turnEndTime?: number;
    }
}

// ============================================================================
// StateSerializer
// ============================================================================

export class StateSerializerV2 {
    /**
     * Serialize game state for a specific player
     * Each player gets their own view with their private data
     */
    static serialize(state: GameState, forPlayerId: string, turnEndTime?: number | null): SerializedState {
        const publicState = this.serializePublic(state, forPlayerId);

        // Inject turnEndTime into public state
        if (turnEndTime) {
            publicState.turnEndTime = turnEndTime;
        }

        const privateState = this.serializePrivate(state, forPlayerId);

        return {
            public: publicState,
            private: privateState
        };
    }

    /**
     * Serialize the public portion of game state (visible to all)
     */
    static serializePublic(state: GameState, forPlayerId?: string): PublicGameState {
        return {
            phase: state.phase,
            turnNumber: state.turnNumber,
            currentPlayerIndex: state.currentPlayerIndex,
            isGameOver: state.isGameOver,
            winnerId: state.winnerId,
            gameResults: state.gameResults,

            supply: Object.fromEntries(
                Object.entries(state.supply).map(([id, pile]) => [
                    id,
                    {
                        cardId: pile.cardId,
                        count: pile.count,
                        isMixed: pile.isMixed,
                        tokens: pile.tokens && Object.keys(pile.tokens).length > 0 ? { ...pile.tokens } : undefined,
                        topCardId: pile.isMixed && pile.cards && pile.cards.length > 0
                            ? pile.cards[pile.cards.length - 1].id
                            : undefined
                    }
                ])
            ),

            nonSupply: Object.fromEntries(
                Object.entries(state.nonSupply || {}).map(([id, pile]) => [
                    id,
                    {
                        cardId: pile.cardId,
                        count: pile.count,
                        isMixed: pile.isMixed,
                        tokens: pile.tokens && Object.keys(pile.tokens).length > 0 ? { ...pile.tokens } : undefined,
                        topCardId: pile.isMixed && pile.cards && pile.cards.length > 0
                            ? pile.cards[pile.cards.length - 1].id
                            : undefined
                    }
                ])
            ),

            trash: state.trash.map(c => this.serializeCard(c)),
            landscapes: state.landscapes || [],
            landscapeState: JSON.parse(JSON.stringify(state.landscapeState || {})), // Deep copy to be safe
            players: state.players.map(p => this.serializePublicPlayer(p)),

            pendingDecision: state.pendingDecision ? (() => {
                const decision = state.pendingDecision;

                try {
                    // PARANOID MODE: Explicitly cast everything to primitives/copies
                    // to absolutely ensure no circular references leaks.

                    const safeOptions = Array.isArray(decision.options)
                        ? decision.options.map((o: any) => {
                            if (typeof o === 'string') return o;
                            if (typeof o === 'object' && o !== null) {
                                // Extract safe properties for client
                                return {
                                    label: String(o.label || ''),
                                    // value: o.value ? String(o.value) : undefined // Optional
                                };
                            }
                            return String(o);
                        })
                        : undefined;

                    let safeConstraints: any = undefined;
                    if (decision.constraints) {
                        safeConstraints = {};
                        if (decision.constraints.min !== undefined) safeConstraints.min = Number(decision.constraints.min);
                        if (decision.constraints.max !== undefined) safeConstraints.max = Number(decision.constraints.max);
                        if (decision.constraints.sourceZone !== undefined) safeConstraints.sourceZone = String(decision.constraints.sourceZone);

                        if (decision.constraints.filter) {
                            safeConstraints.filter = {};
                            if (decision.constraints.filter.maxCost !== undefined) safeConstraints.filter.maxCost = Number(decision.constraints.filter.maxCost);
                            if (Array.isArray(decision.constraints.filter.cardIds)) {
                                safeConstraints.filter.cardIds = decision.constraints.filter.cardIds.map((id: any) => String(id));
                            }
                            if (Array.isArray(decision.constraints.filter.cardTypes)) {
                                safeConstraints.filter.cardTypes = decision.constraints.filter.cardTypes.map((t: any) => String(t));
                            }
                        }
                    }

                    let safeContext: any = undefined;
                    if (decision.context) {
                        safeContext = {};
                        if (decision.context.sourceZone !== undefined) safeContext.sourceZone = String(decision.context.sourceZone);
                        if (decision.context.specialAction !== undefined) safeContext.specialAction = String(decision.context.specialAction);
                        if (decision.context.isAuto !== undefined) safeContext.isAuto = Boolean(decision.context.isAuto);
                        // Ensure maxCost is passed if present in context
                        if (decision.context.maxCost !== undefined) safeContext.maxCost = Number(decision.context.maxCost);

                        // NEW: Allow options in context (for CHOOSE_OPTION type)
                        if (decision.context.options && Array.isArray(decision.context.options)) {
                            safeContext.options = decision.context.options.map((o: any) => {
                                if (typeof o === 'object' && o !== null) {
                                    return { label: String(o.label || '') };
                                }
                                return { label: String(o) };
                            });
                        }

                        // Serialize context.cards (for SENTRY_INTERACTION, COMPOSITE_FILTER, etc.)
                        if (decision.context.cards && Array.isArray(decision.context.cards)) {
                            safeContext.cards = decision.context.cards.map((c: any) => {
                                if (typeof c === 'object' && c !== null) {
                                    return { id: String(c.id || ''), instanceId: String(c.instanceId || '') };
                                }
                                return c;
                            });
                        }

                        // Serialize context.buckets (for COMPOSITE_FILTER overlay)
                        if (decision.context.buckets && Array.isArray(decision.context.buckets)) {
                            safeContext.buckets = decision.context.buckets.map((b: any) => ({
                                id: String(b.id || ''),
                                label: String(b.label || ''),
                                min: b.min !== undefined ? Number(b.min) : undefined,
                                max: b.max !== undefined ? Number(b.max) : undefined,
                                reorder: b.reorder !== undefined ? Boolean(b.reorder) : undefined
                            }));
                        }

                        // Serialize context.globalConstraints (for COMPOSITE_FILTER overlay)
                        if (decision.context.globalConstraints) {
                            safeContext.globalConstraints = {
                                minTotal: decision.context.globalConstraints.minTotal !== undefined ? Number(decision.context.globalConstraints.minTotal) : undefined,
                                maxTotal: decision.context.globalConstraints.maxTotal !== undefined ? Number(decision.context.globalConstraints.maxTotal) : undefined
                            };
                        }
                    }

                    const d: any = {
                        id: String(decision.id),
                        playerId: String(decision.playerId),
                        type: String(decision.type),
                        message: String(decision.message),
                        min: safeConstraints?.min,
                        max: safeConstraints?.max,
                        options: safeOptions,
                        constraints: safeConstraints,
                        filter: safeConstraints?.filter,
                        context: safeContext,
                        optional: Boolean(decision.optional)
                    };

                    // For ZONE_SEARCH, we must provide the cards of that zone
                    // We check string values to avoid Enum matching issues
                    const decType = String(decision.type);
                    if (decType === 'ZONE_SEARCH' || decType === 'CHOOSE_CARDS' || decType === 'REORDER' || decType === 'SENTRY_INTERACTION' || decType === 'COMPOSITE_FILTER') {
                        // Determine source zone from Context (Engine specific) or Constraints (Standard)
                        let zoneName = decision.context?.sourceZone || decision.constraints?.sourceZone;

                        if (zoneName) {
                            const player = state.players.find(p => p.id === decision.playerId);
                            if (player) {
                                // Map zone names to PlayerState fields
                                const map: Record<string, string> = {
                                    'discard': 'discardPile',
                                    'DISCARD': 'discardPile',
                                    'discardPile': 'discardPile',
                                    'hand': 'hand',
                                    'HAND': 'hand',
                                    'deck': 'deck',
                                    'DECK': 'deck',
                                    'aside': 'aside',
                                    'ASIDE': 'aside',
                                    'limbo': 'limbo',
                                    'LIMBO': 'limbo',
                                    'playArea': 'playArea',
                                    'IN_PLAY': 'playArea'
                                };

                                const mappedName = map[zoneName] || zoneName;

                                let cards: any[] = [];
                                if (mappedName === 'trash' || mappedName === 'TRASH') {
                                    cards = state.trash;
                                } else {
                                    cards = (player as any)[mappedName];
                                }

                                if (Array.isArray(cards)) {
                                    d.cards = cards.map(c => this.serializeCard(c));
                                }
                            }
                        }
                    }
                    return d;
                } catch (error) {
                    // If serialization fails, return minimal safe object
                    console.error('[StateSerializer] Error serializing pendingDecision:', error);
                    return {
                        id: String(decision.id),
                        playerId: String(decision.playerId),
                        type: String(decision.type),
                        message: "Error serializing decision",
                        optional: !!decision.optional
                    };
                }
            })() : undefined,

            logs: GameLogStore.getLogs(state.id).slice(-100).map(l => {
                let message = l.message;

                // Personalize draw logs
                if (l.privateData?.type === 'DRAW' && l.privateData.forPlayerId === forPlayerId && Array.isArray(l.privateData.cardIds)) {
                    message = this.formatPrivateDrawMessage(l.message, l.privateData.cardIds);
                }

                return {
                    id: l.id,
                    timestamp: l.timestamp,
                    type: l.type,
                    message,
                    playerId: l.playerId,
                    indent: l.indent,
                    payload: l.payload,
                    sequenceNumber: l.sequenceNumber,
                    isRewindable: GameLogStore.getSnapshots(state.id).some(s => s.logId === l.id)
                };
            }),

            // Removed 'history' field as it was redundant with 'logs'

            revealedCards: state.revealedCards ? (() => {
                const isVisible = state.revealedCards.visibleTo === 'ALL' || (forPlayerId && state.revealedCards.visibleTo.includes(forPlayerId));

                if (!isVisible) return undefined;

                return {
                    cards: state.revealedCards.cards.map(c => this.serializeCard(c)),
                    visibleTo: state.revealedCards.visibleTo,
                    cause: state.revealedCards.cause,
                    autoHide: state.revealedCards.autoHide,
                    highlightedIds: state.revealedCards.highlightedIds
                };
            })() : undefined
        };
    }

    /**
     * Format a private draw message like "Tom pioche 4 Cuivres et un Domaine."
     */
    private static formatPrivateDrawMessage(genericMessage: string, cardIds: string[]): string {
        if (!Array.isArray(cardIds) || cardIds.length === 0) return genericMessage;

        // Group cards by Name
        const counts = new Map<string, number>();
        cardIds.forEach(id => {
            const name = CardRegistry.get(id)?.name || id;
            counts.set(name, (counts.get(name) || 0) + 1);
        });

        const items: string[] = [];
        counts.forEach((count, name) => {
            if (count === 1) {
                // Determine if it should be "un" or "une" (simple check for "Malédiction" which is feminine)
                const prefix = (name === 'Malédiction' || name === 'Cave' || name === 'Chapelle' || name === 'Rénovation' || name === 'Salle du Trône' || name === 'Sorcière' || name === 'Bibliothèque') ? 'une' : 'un';
                items.push(`${prefix} ${name}`);
            } else {
                // Pluralize (very simple add 's' if not ending in 's' or 'z')
                const pluralName = (name.endsWith('s') || name.endsWith('z')) ? name : `${name}s`;
                items.push(`${count} ${pluralName}`);
            }
        });

        let detail = '';
        if (items.length === 1) {
            detail = items[0];
        } else {
            const last = items.pop();
            detail = `${items.join(', ')} et ${last}`;
        }

        // Replace "N cartes" or "1 carte" with detail
        // Example: "Tom pioche 5 cartes." -> "Tom pioche 4 Cuivres et un Domaine."
        const match = genericMessage.match(/^(.* pioche )(\d+ cartes?)(.*)$/);
        if (match) {
            return `${match[1]}${detail}${match[3]}`;
        }

        return genericMessage;
    }

    /**
     * Serialize private data for a specific player
     * This method is no longer used directly by the main serialize method,
     * but its logic is incorporated. Keeping it for potential future use or
     * if other parts of the system still call it.
     */
    static serializePrivate(state: GameState, forPlayerId: string): PrivatePlayerState | null {
        const player = state.players.find(p => p.id === forPlayerId);
        if (!player) return null;

        return {
            hand: player.hand.map(c => this.serializeCard(c)),
            limbo: player.limbo.map(c => this.serializeCard(c)),
            deckStats: {
                score: DeckEvaluator.evaluateDeck(state, player),
                wealthDensity: DeckEvaluator.calculateWealth(DeckEvaluator.getAllCards(player), DeckEvaluator.calculateActionEfficiency(DeckEvaluator.getAllCards(player))),
                vpDensity: DeckEvaluator.calculateVP(DeckEvaluator.getAllCards(player), state),
                cyclingCapacity: DeckEvaluator.calculateCycling(DeckEvaluator.getAllCards(player), DeckEvaluator.calculateActionEfficiency(DeckEvaluator.getAllCards(player)))
            }
        };
    }

    /**
     * Serialize a single player's public data
     */
    private static serializePublicPlayer(player: PlayerState): PublicPlayerState {
        const topDiscard = player.discardPile.length > 0
            ? this.serializeCard(player.discardPile[player.discardPile.length - 1])
            : undefined;

        return {
            id: player.id,
            name: player.name,
            color: player.color,
            isBot: player.isBot,
            isHost: player.isHost,
            isReady: player.isReady,

            handCount: player.hand.length,
            deckCount: player.deck.length,
            discardCount: player.discardPile.length,
            // Dominion rules: Discard pile is public but only the top card should be visible
            // We only send the full discard pile for debugging or if specific UI needs it, 
            // but for production payload we should stick to topDiscard.
            // Keeping it empty to save payload.
            discardPile: [],

            playArea: player.playArea.map(c => this.serializeCard(c)),
            aside: player.aside.map(c => this.serializeCard(c)),
            limbo: player.limbo.map(c => this.serializeCard(c)),
            topDiscard,

            actions: player.actions,
            buys: player.buys,
            coins: player.coins,
            vpTokens: player.vpTokens || 0,
            costReduction: player.costReduction || 0,
            score: player.score,
            turnNumber: player.turnNumber,
            currentSelection: player.currentSelection || [],
            // Guilds
            coffers: player.coffers || 0,
            // Adventures
            tavernMat: (player.tavernMat || []).map(c => this.serializeCard(c)),
            journeyTokenFaceUp: player.journeyTokenFaceUp || false,
            minusCoinToken: player.minusCoinToken || false,
            minusCardToken: player.minusCardToken || false,
            permanentDurations: (player.permanentDurations || []).map(c => this.serializeCard(c)),
            // Empires
            debt: player.debt || 0,
            // Alchemy
            potions: player.potions || 0,
            // Renaissance
            villagers: player.villagers || 0,
            projects: player.projects || [],
            artifacts: player.artifacts || [],
            // Nocturne
            boons: player.boons || [],
            hexes: player.hexes || [],
            // Menagerie
            exileMat: (player.exileMat || []).map(c => this.serializeCard(c)),
            // Allies
            favors: player.favors || 0,
            // Rising Sun
            sunToken: player.sunToken || false,

            // Generic Storage
            mats: Object.fromEntries(
                Object.entries(player.mats || {}).map(([key, cards]) => [
                    key,
                    cards.map(c => this.serializeCard(c))
                ])
            ),
            tokens: { ...(player.tokens || {}) }
        };
    }

    /**
     * Serialize a single card
     */
    private static serializeCard(card: CardInstance): SerializedCard {
        // const def = CardRegistry.get(card.id);
        return {
            id: card.id,
            instanceId: card.instanceId,
            name: card.id, // Fallback to ID to avoid dependency loop
            isResolved: card.isResolved,
            durationTurns: card.durationTurns,
            linkedCards: card.linkedCards?.map(c => this.serializeCard(c)),
            turnPlayed: card.turnPlayed
        };
    }
}
