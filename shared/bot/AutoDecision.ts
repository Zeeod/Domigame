/**
 * Automatic answer to any pending decision: used by the smoke / stress tests, and by the server
 * to answer for a player who timed out or is disconnected. Strategy 'first' picks the minimum /
 * first option (the most neutral answer), 'last' the maximum / last option.
 */
import { GameState, CardInstance } from '../engine/GameState.js';
import { CardRegistry } from '../cards/index.js';
import { EconomyEngine } from '../engine/EconomyEngine.js';
import { EffectUtils } from '../engine/EffectUtils.js';
import { peekMat } from '../engine/Mats.js';

export type Strategy = 'first' | 'last';

function zoneCards(state: GameState, playerId: string, zone: string): CardInstance[] {
    const p = state.players.find(x => x.id === playerId)!;
    const z = (zone || 'hand').toLowerCase();
    if (z === 'hand') return p.hand;
    if (z === 'deck') return p.deck;
    if (z === 'discard' || z === 'discardpile') return p.discardPile;
    if (z === 'playarea' || z === 'play_area' || z === 'play') return p.playArea;
    if (z === 'limbo') return p.limbo;
    if (z === 'aside') return p.aside;
    if (z === 'trash') return state.trash;
    return peekMat(p, zone);
}

/** Payload answering the pending decision, or null if we cannot build one. */
export function autoPayload(state: GameState, strategy: Strategy = 'first'): any | null {
    const d: any = state.pendingDecision;
    if (!d) return null;
    const min = d.constraints?.min ?? d.minCards ?? 0;
    const max = d.constraints?.max ?? d.maxCards ?? 1;
    const options = (d.options && d.options.length) ? d.options : (d.context?.options || []);

    switch (d.type) {
        case 'CHOOSE_CARDS':
        case 'ZONE_SEARCH':
        case 'SELECT_CARD': {
            const zone = d.constraints?.sourceZone || 'hand';
            if (String(zone).toLowerCase() === 'supply') {
                const filter = d.constraints?.filter || {};
                const ids = (filter.cardIds as string[] | undefined) ?? Object.keys(state.supply);
                const ok = ids.filter(id => {
                    const pile = state.supply[id];
                    const def = CardRegistry.get(id);
                    if (!pile || pile.count <= 0 || !def) return false;
                    const cost = EconomyEngine.getCardCost(state, d.playerId, id);
                    if (filter.maxCost !== undefined && cost > filter.maxCost) return false;
                    if (filter.minCost !== undefined && cost < filter.minCost) return false;
                    if (filter.cardTypes && !filter.cardTypes.some((t: string) => def.types.includes(t as any))) return false;
                    return true;
                });
                if (ok.length === 0) return { type: 'PASS' };
                const pick = strategy === 'first' ? ok[0] : ok[ok.length - 1];
                return { type: 'SUPPLY', cardId: pick };
            }
            const pool: CardInstance[] = d.context?.cards?.length
                ? d.context.cards
                : EffectUtils.filterCards(zoneCards(state, d.playerId, zone), d.constraints?.filter);
            const count = Math.min(pool.length, strategy === 'first' ? min : Math.min(max, pool.length));
            const chosen = (strategy === 'first' ? pool.slice(0, count) : pool.slice(pool.length - count));
            return { type: 'CARDS', cardInstanceIds: chosen.map(c => c.instanceId) };
        }
        case 'SELECT_OPTION':
        case 'CHOOSE_OPTION': {
            if (options.length === 0) return { type: 'OPTION', optionIndex: 0 };
            if (min > 1) {
                const idx = Array.from({ length: Math.min(min, options.length) }, (_, i) => strategy === 'first' ? i : options.length - 1 - i);
                return { type: 'OPTIONS', optionIndices: idx };
            }
            return { type: 'OPTION', optionIndex: strategy === 'first' ? 0 : options.length - 1 };
        }
        case 'YES_NO':
            return { type: 'OPTION', choice: strategy === 'first' ? 'YES' : 'NO' };
        case 'CONFIRM':
            return { type: 'CONFIRM' };
        case 'REORDER':
            return { type: 'CARDS', cardInstanceIds: (d.context?.cards || []).map((c: any) => c.instanceId) };
        case 'DECK_INSERTION':
            return { type: 'CARDS', index: strategy === 'first' ? 0 : (d.context?.deckCount ?? 0) };
        case 'NAME_CARD':
            return { type: 'NAMED_CARD', cardId: strategy === 'first' ? 'copper' : 'gold' };
        case 'COMPOSITE_FILTER': {
            // 'first': everything to the default bucket; 'last': fill buckets in order up to their max
            if (strategy === 'first') return { type: 'COMPOSITE_RESPONSE', decisions: {} };
            const cards: any[] = [...(d.context?.cards || [])];
            const decisions: Record<string, string[]> = {};
            for (const b of d.context?.buckets || []) {
                const n = Math.min(b.max ?? cards.length, cards.length);
                decisions[b.id] = cards.splice(0, n).map((c: any) => c.instanceId);
            }
            return { type: 'COMPOSITE_RESPONSE', decisions };
        }
        case 'SENTRY_INTERACTION':
            return { type: 'SENTRY', trash: [], discard: [], reorder: (d.context?.cards || []).map((c: any) => c.instanceId) };
        default:
            return { type: 'PASS' };
    }
}

/**
 * Payload for a decision that has only one possible answer (e.g. "discard 2 cards" with 2 cards in hand,
 * a single option, a single affordable pile), or null when the player has a real choice.
 * Optional decisions are never forced: passing is always a second answer.
 */
export function forcedPayload(state: GameState): any | null {
    const d: any = state.pendingDecision;
    if (!d || d.optional) return null;
    const min = d.constraints?.min ?? d.minCards ?? 0;
    const max = d.constraints?.max ?? d.maxCards ?? 1;
    const options = (d.options && d.options.length) ? d.options : (d.context?.options || []);
    const sameCard = (cards: any[]) => cards.length > 0 && cards.every(c => c.id === cards[0].id);

    switch (d.type) {
        case 'CHOOSE_CARDS':
        case 'SELECT_CARD': {
            // Decisions with their own rules (Sentry-like special actions) are left to the player
            if (d.context?.specialAction && d.context.specialAction !== 'TRASH' && d.context.specialAction !== 'DISCARD') return null;
            const zone = d.constraints?.sourceZone || 'hand';
            if (String(zone).toLowerCase() === 'supply') {
                if (min < 1) return null;
                const pick = autoPayload(state, 'first');
                const last = autoPayload(state, 'last');
                // Only one pile qualifies when both ends of the list are the same card
                if (pick?.type === 'SUPPLY' && last?.type === 'SUPPLY' && pick.cardId === last.cardId) return pick;
                return null;
            }
            if (d.context?.candidates) return null; // the handler checks its own list
            const pool: CardInstance[] = d.context?.cards?.length
                ? d.context.cards
                : EffectUtils.filterCards(zoneCards(state, d.playerId, zone), d.constraints?.filter);
            if (min > 0 && pool.length <= min) {
                return { type: 'CARDS', cardInstanceIds: pool.map(c => c.instanceId) };
            }
            // Same number to pick and all candidates identical: any pick is the same
            if (min > 0 && min === max && sameCard(pool)) {
                return { type: 'CARDS', cardInstanceIds: pool.slice(0, min).map(c => c.instanceId) };
            }
            return null;
        }
        case 'SELECT_OPTION':
        case 'CHOOSE_OPTION': {
            if (options.length === 1 && min <= 1) return { type: 'OPTION', optionIndex: 0 };
            return null;
        }
        case 'REORDER': {
            const cards = d.context?.cards || [];
            if (cards.length > 0 && sameCard(cards)) return autoPayload(state, 'first');
            return null;
        }
        default:
            return null;
    }
}
