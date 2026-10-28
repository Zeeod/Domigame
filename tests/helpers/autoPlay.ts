/**
 * Helpers for the smoke / stress tests: validated actions, automatic answers to decisions
 * (shared/bot/AutoDecision.ts), card count.
 */
import { actingPlayerFor } from '../../shared/engine/Possession.js';
import { GameState } from '../../shared/engine/GameState.js';
import { RulesValidator } from '../../shared/engine/RulesValidator.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';

export { autoPayload } from '../../shared/bot/AutoDecision.js';
export type { Strategy } from '../../shared/bot/AutoDecision.js';
import { autoPayload, type Strategy } from '../../shared/bot/AutoDecision.js';

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
        const r = act(state, actingPlayerFor(state, d.playerId), { type: 'CHOOSE', choiceId: d.id, payload });
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
