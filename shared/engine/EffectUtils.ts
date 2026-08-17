import { GameState, PlayerState, CardInstance } from './GameState.js';
import { Logger } from './Logger.js';
import { CardRegistry } from '../cards/index.js';
import { EconomyEngine } from './EconomyEngine.js';

export class EffectUtils {
    public static log(state: GameState, message: string, playerId?: string, privateMessage?: string, privateData?: any) {
        Logger.log(state, message, playerId || null, privateMessage, privateData);
    }

    public static logEvent(state: GameState, event: any) {
        // Adapt legacy EffectUtils.logEvent calls to Logger.logEvent if needed
        // or just expose Logger's method
        Logger.logEvent(state, event);
    }

    /**
     * Filters an array of cards against a standard effect filter definition
     */
    static filterCards(cards: CardInstance[], filter: any): CardInstance[] {
        if (!filter) return cards;

        return cards.filter(c => {
            const def = CardRegistry.get(c.id);
            if (!def) return false;

            if (filter.cardIds && !filter.cardIds.includes(c.id)) return false;

            const filterTypes = filter.cardTypes || filter.types;
            if (filterTypes) {
                const types = Array.isArray(filterTypes) ? filterTypes : [filterTypes];
                if (!types.some((t: string) => {
                    const type = t.toUpperCase();
                    return def.types.includes(type as any) || c.additionalTypes?.includes(type);
                })) return false;
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
    }

    public static getAmount(state: GameState, player: PlayerState, amountInput: any): number {
        if (!player) return 0;
        if (amountInput === undefined || amountInput === null) return 0;
        if (typeof amountInput === 'number') return amountInput;
        if (typeof amountInput === 'function') return amountInput(state, player);

        // Handle all object-based dynamic amounts
        if (typeof amountInput === 'object' && amountInput.type) {
            switch (amountInput.type) {
                case 'DYNAMIC': {
                    let base = 0;
                    switch (amountInput.metric) {
                        case 'HAND_SIZE': base = player.hand.length; break;
                        case 'COINS': base = player.coins; break;
                        case 'ACTIONS': base = player.actions; break;
                        case 'BUYS': base = player.buys; break;
                        case 'PLAY_AREA_COUNT': base = player.playArea.length; break;
                        case 'DISCARD_PILE_COUNT': base = player.discardPile.length; break;
                        case 'DECK_COUNT': base = player.deck.length; break;
                        case 'TOTAL_CARDS': base = player.hand.length + player.deck.length + player.discardPile.length + player.playArea.length; break;
                        case 'DISTINCT_CARDS_IN_PLAY': {
                            const ids = new Set(player.playArea.map(c => c.id));
                            base = ids.size;
                            break;
                        }
                        case 'VICTORY_CARDS_IN_HAND': {
                            base = (player.hand || []).filter(c => {
                                const def = CardRegistry.get(c.id);
                                return def?.types?.includes('VICTORY') || false;
                            }).length;
                            break;
                        }
                        case 'ACTIONS_IN_PLAY': {
                            base = (player.playArea || []).filter(c => CardRegistry.get(c.id)?.types?.includes('ACTION')).length;
                            break;
                        }
                        case 'TREASURES_IN_PLAY': {
                            base = (player.playArea || []).filter(c => CardRegistry.get(c.id)?.types?.includes('TREASURE')).length;
                            break;
                        }
                        case 'EMPTY_PILES': {
                            if (!state.supply) base = 0;
                            else base = Object.values(state.supply).filter(p => (p as any).count === 0).length;
                            break;
                        }
                        default: base = 0;
                    }
                    return base * (amountInput.multiplier || 1);
                }

                case 'COUNT_CARDS_IN_PLAY': {
                    let cards = player.playArea || [];
                    if (amountInput.filter) {
                        const filterTypes = amountInput.filter.types || amountInput.filter.cardTypes;
                        if (filterTypes) {
                            cards = cards.filter(c => {
                                const def = CardRegistry.get(c.id);
                                return def && filterTypes.some((t: string) => def.types.includes(t as any));
                            });
                        }
                    }
                    return cards.length;
                }

                case 'COUNT_CARDS_IN_HAND': {
                    let cards = player.hand || [];
                    if (amountInput.filter) {
                        cards = this.filterCards(cards, amountInput.filter);
                    }
                    return cards.length;
                }

                case 'COUNT_DISCARDED': {
                    // Used by Vault: count cards discarded (tracked in state.lastDiscardedCount)
                    return (state as any).lastDiscardedCount || 0;
                }

                case 'COUNT_UNIQUE_TYPES_IN_PLAY': {
                    // Count unique card types across all cards in play
                    const allTypes = new Set<string>();
                    for (const c of player.playArea) {
                        const def = CardRegistry.get(c.id);
                        if (def) def.types.forEach(t => allTypes.add(t));
                    }
                    return allTypes.size;
                }

                case 'DIVIDE': {
                    const numerator = this.getAmount(state, player, amountInput.amount);
                    const divisor = amountInput.divisor || 1;
                    return Math.floor(numerator / divisor);
                }

                case 'LAST_TRASHED_COST':
                case 'TRASHED_CARD_COST': {
                    const card = state.lastTrashedCard;
                    if (!card) return 0;
                    return EconomyEngine.getCardCost(state, player.id, card.id);
                }

                default:
                    return 0;
            }
        }
        return 0;
    }

    public static shuffle<T>(array: T[], state: GameState): T[] {
        if (!array) {
            console.error('[EffectUtils.shuffle] Attempted to shuffle undefined array!');
            return [];
        }
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.random(state) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    public static random(state: GameState): number {
        // Simple seeded PRNG
        if (!state.rng) {
            state.rng = { seed: Date.now().toString(), callCount: 0 };
        }
        if (state.rng.state === undefined || state.rng.state === null) {
            state.rng.state = this.seedFromString(state.rng.seed || Date.now().toString());
        }
        state.rng.state = (state.rng.state * 16807) % 2147483647;
        state.rng.callCount++;
        return (state.rng.state - 1) / 2147483646;
    }

    private static seedFromString(s: string): number {
        if (!s) return 1;
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
        return Math.abs(h) || 1;
    }

    public static addCardToZone(player: PlayerState, card: CardInstance, zone: string, state: GameState, position?: 'TOP' | 'BOTTOM') {
        if (!player) return;
        if (zone === 'hand') (player.hand = player.hand || []).push(card);
        else if (zone === 'deck') {
            if (position === 'BOTTOM') (player.deck = player.deck || []).push(card);
            else (player.deck = player.deck || []).unshift(card);
        }
        else if (zone === 'discard' || zone === 'discardPile') (player.discardPile = player.discardPile || []).push(card);
        else if (zone === 'trash') (state.trash = state.trash || []).push(card);
        else if (zone === 'playArea') (player.playArea = player.playArea || []).push(card);
        else if (zone === 'aside') (player.aside = player.aside || []).push(card);
        else if (zone === 'limbo') (player.limbo = player.limbo || []).push(card);
        else if (zone === 'blackMarketDeck') (state.blackMarketDeck = state.blackMarketDeck || []).push(card);
        else if (zone === 'blackMarketRevealed') (state.blackMarketRevealed = state.blackMarketRevealed || []).push(card);
        else if (['island', 'islandMat', 'mats.island'].includes(zone)) {
            if (!player.mats) player.mats = {} as any;
            if (!player.mats.island) player.mats.island = [];
            player.mats.island.push(card);
            player.islandMat = player.mats.island;
        }
        else if (['nativeVillage', 'nativeVillageMat', 'mats.nativeVillage', 'mats.nativeVillageMat'].includes(zone)) {
            if (!player.mats) player.mats = {} as any;
            if (!player.mats.nativeVillage) player.mats.nativeVillage = [];
            player.mats.nativeVillage.push(card);
            player.nativeVillageMat = player.mats.nativeVillage;
        }
        else if (['tavern', 'tavernMat', 'mats.tavern'].includes(zone)) {
            if (!player.mats) player.mats = {} as any;
            if (!player.mats.tavern) player.mats.tavern = [];
            player.mats.tavern.push(card);
            player.tavernMat = player.mats.tavern;
        }
        else if (['exile', 'exileMat', 'mats.exile'].includes(zone)) {
            if (!player.mats) player.mats = {} as any;
            if (!player.mats.exile) player.mats.exile = [];
            player.mats.exile.push(card);
            player.exileMat = player.mats.exile;
        }
    }

    public static revealCards(state: GameState, cards: CardInstance[], visibleTo: string[] | 'ALL' = 'ALL', cause?: string, autoHide: boolean = true, highlight: boolean = false) {
        state.revealedCards = {
            cards,
            visibleTo,
            cause,
            autoHide,
            highlightedIds: highlight ? cards.map(c => c.instanceId) : undefined
        };
        state.lastRevealedCards = [...cards];
    }

    public static compare(val1: number, comparator: string, val2: number): boolean {
        switch (comparator) {
            case '<': return val1 < val2;
            case '<=': return val1 <= val2;
            case '>': return val1 > val2;
            case '>=': return val1 >= val2;
            case '=':
            case '==': return val1 === val2;
            default: return false;
        }
    }

    public static handleDrawCardsToLimbo(state: GameState, player: PlayerState, amount: number): { state: GameState, cards: CardInstance[] } {
        const drawn: CardInstance[] = [];
        for (let i = 0; i < amount; i++) {
            if (player.deck.length === 0 && player.discardPile.length > 0) {
                // Shuffle discard into deck
                player.deck = this.shuffle(player.discardPile, state);
                player.discardPile = [];
                this.log(state, `${player.name} mélange sa défausse.`, player.id);
            }
            if (player.deck.length > 0) {
                const card = player.deck.shift()!;
                drawn.push(card);
            }
        }
        return { state, cards: drawn };
    }

    public static drawCards(state: GameState, player: PlayerState, amount: number): CardInstance[] {
        const drawn: CardInstance[] = [];
        for (let i = 0; i < amount; i++) {
            if (player.deck.length === 0 && player.discardPile.length > 0) {
                player.deck = this.shuffle(player.discardPile, state);
                player.discardPile = [];
                this.log(state, `${player.name} mélange sa défausse.`, player.id);
            }
            if (player.deck.length > 0) {
                const card = player.deck.shift()!;
                player.hand.push(card);
                drawn.push(card);
            }
        }
        return drawn;
    }

    public static removeCardFromPlayer(state: GameState, player: PlayerState, cardInstanceId: string): CardInstance | undefined {
        const zones = ['hand', 'playArea', 'discardPile', 'aside', 'limbo', 'deck'] as const;
        for (const zone of zones) {
            const list = player[zone];
            if (!list) continue;
            const index = list.findIndex(c => c.instanceId === cardInstanceId);
            if (index !== -1) {
                return list.splice(index, 1)[0];
            }
        }

        const extraZones = ['blackMarketDeck', 'blackMarketRevealed'] as const;
        for (const zone of extraZones) {
            const list = state[zone];
            if (!list) continue;
            const index = list.findIndex(c => c.instanceId === cardInstanceId);
            if (index !== -1) {
                return list.splice(index, 1)[0];
            }
        }

        if (player.mats) {
            for (const matName in player.mats) {
                const mat = player.mats[matName];
                if (!mat) continue;
                const index = mat.findIndex((c: any) => c.instanceId === cardInstanceId);
                if (index !== -1) {
                    return mat.splice(index, 1)[0];
                }
            }
        }

        return undefined;
    }

    public static removeCardFromGame(state: GameState, cardInstanceId: string): CardInstance | undefined {
        for (const player of state.players) {
            const card = this.removeCardFromPlayer(state, player, cardInstanceId);
            if (card) return card;
        }
        // Check global zones
        const globalZones = ['trash', 'blackMarketDeck', 'blackMarketRevealed'] as const;
        for (const zone of globalZones) {
            const list = state[zone];
            if (!list) continue;
            const index = list.findIndex(c => c.instanceId === cardInstanceId);
            if (index !== -1) {
                return list.splice(index, 1)[0];
            }
        }
        return undefined;
    }

    public static findCardInGame(state: GameState, cardInstanceId: string): CardInstance | undefined {
        for (const player of state.players) {
            const zones = ['hand', 'playArea', 'discardPile', 'aside', 'limbo'] as const;
            for (const zone of zones) {
                const card = player[zone]?.find(c => c.instanceId === cardInstanceId);
                if (card) return card;
            }
        }
        const globalZones = ['trash', 'blackMarketDeck', 'blackMarketRevealed'] as const;
        for (const zone of globalZones) {
            const card = state[zone]?.find(c => c.instanceId === cardInstanceId);
            if (card) return card;
        }
        return undefined;
    }

    public static handleTrashTriggers(_state: GameState, _player: PlayerState, _card: CardInstance) {
        // This would delegate to TriggerEffectHandler or similar
        // For now, placeholder or minimal impl
        // TODO: Integrate with TriggerEffectHandler
    }
}
