/**
 * Automatic decision answering, used by the smoke tests to play any card without
 * knowing it in advance. Strategy 'first' picks the minimum / first option,
 * 'last' picks the maximum / last option (to cover other branches).
 */
import { GameState, CardInstance } from '../../shared/engine/GameState.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { EconomyEngine } from '../../shared/engine/EconomyEngine.js';
import { EffectUtils } from '../../shared/engine/EffectUtils.js';
import { RulesValidator } from '../../shared/engine/RulesValidator.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { peekMat } from '../../shared/engine/Mats.js';

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

export interface StepResult { ok: boolean; error?: string; state: GameState }

/** Validate + resolve an action like the server. */
export function act(state: GameState, playerId: string, action: any): StepResult {
    const v = RulesValidator.validate(state, playerId, action);
    if (!v.valid) return { ok: false, error: `${action.type} refusé : ${v.error}`, state };
    try {
        const res = ActionResolver.resolve(state, playerId, action);
        if (!res.success) return { ok: false, error: `${action.type} échoué : ${res.error}`, state };
        return { ok: true, state: res.state };
    } catch (e: any) {
        return { ok: false, error: `${action.type} exception : ${e.message}`, state };
    }
}

/** Answer pending decisions until none is left (or `maxSteps`). */
export function resolveAll(state: GameState, strategy: Strategy = 'first', maxSteps = 60): StepResult {
    for (let i = 0; i < maxSteps && state.pendingDecision; i++) {
        const d = state.pendingDecision;
        const payload = autoPayload(state, strategy);
        const r = act(state, d.playerId, { type: 'CHOOSE', choiceId: d.id, payload });
        if (!r.ok) return { ok: false, error: `décision ${d.type}/${(d as any).context?.specialAction ?? '-'} : ${r.error}`, state };
        state = r.state;
    }
    if (state.pendingDecision) return { ok: false, error: `boucle de décisions (${state.pendingDecision.type})`, state };
    return { ok: true, state };
}

/** Total number of cards in the game (players, trash, supply counts, extra decks). */
export function totalCards(state: GameState): number {
    let n = state.trash.length;
    for (const p of state.players) {
        n += p.hand.length + p.deck.length + p.discardPile.length + p.playArea.length
            + (p.aside?.length || 0) + (p.limbo?.length || 0)
            + Object.values(p.mats || {}).reduce((a, m) => a + m.length, 0);
    }
    for (const pile of Object.values(state.supply)) n += pile.count;
    for (const pile of Object.values(state.nonSupply || {})) n += (pile as any).count || 0;
    n += (state.blackMarketDeck?.length || 0) + (state.blackMarketRevealed?.length || 0);
    return n;
}
