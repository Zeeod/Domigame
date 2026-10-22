/**
 * Smoke test: every implemented Kingdom card is played in a real game (server setup),
 * then bought, then a full round is played — all decisions answered automatically.
 * Checks: no exception, every decision can be answered and validated, card count conserved.
 *
 * Report: logs/smoke_report.json. Cards that still fail are listed in KNOWN_BROKEN
 * (the test fails if a new card breaks, or if a listed card now works: update the list).
 */
import { actingPlayerFor } from '../../shared/engine/Possession.js';
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { GameState } from '../../shared/engine/GameState.js';
import { PhaseEngine } from '../../shared/engine/PhaseEngine.js';
import { act, resolveAll, totalCards, Strategy } from '../helpers/autoPlay.js';
import { KNOWN_BROKEN } from './knownBroken.js';

const FILLERS = ['village', 'smithy', 'market', 'militia', 'moat', 'cellar', 'workshop', 'remodel', 'laboratory', 'festival', 'chapel'];

function mockIo(): any {
    return { to: vi.fn().mockReturnValue({ emit: vi.fn() }), emit: vi.fn(), sockets: { sockets: new Map() } };
}

function newGame(pileId: string): GameState {
    const kingdom = [pileId, ...FILLERS.filter(f => f !== pileId)].slice(0, 10);
    const room = new GameRoomV2(mockIo(), 'smoke_' + pileId, { kingdomCards: kingdom, sheltersMode: 'never' } as any);
    for (let i = 1; i <= 3; i++) room.addPlayer({ id: 's' + i, join: vi.fn(), emit: vi.fn() } as any, 'P' + i, '#fff', 't' + i);
    room.players.forEach(p => (p.isReady = true));
    room.startGame(kingdom);
    const t = (room as any).turnTimer; if (t) clearTimeout(t);
    return room.gameState;
}

/** Which cards to exercise for a Kingdom pile (split/mixed piles: each card in it). */
function cardsOfPile(pileId: string): string[] {
    const def = CardRegistry.get(pileId) as any;
    if (def?.mixedPile?.cards) return [...new Set<string>(def.mixedPile.cards)];
    return [pileId];
}

function runCard(pileId: string, cardId: string, strategy: Strategy): string | null {
    let state = newGame(pileId);
    const def = CardRegistry.get(cardId)!;
    const p1 = state.players[state.currentPlayerIndex];
    const pid = p1.id;

    // Known hand / deck for everyone
    p1.hand = [cardId, 'copper', 'silver', 'estate', 'village'].map(id => createCardInstance(id));
    p1.deck = ['copper', 'gold', 'estate', 'silver', 'village', 'copper', 'smithy', 'duchy', 'copper', 'curse', 'silver', 'copper']
        .map(id => createCardInstance(id));
    for (const other of state.players.filter(p => p.id !== pid)) {
        other.hand = ['copper', 'copper', 'estate', 'silver', 'moat'].map(id => createCardInstance(id));
        other.deck = ['copper', 'silver', 'estate', 'gold', 'copper', 'village', 'copper'].map(id => createCardInstance(id));
    }

    const expected = totalCards(state);
    const check = (where: string): string | null => {
        const n = totalCards(state);
        return n !== expected ? `${where} : nombre de cartes ${expected} → ${n}` : null;
    };

    // 1. Play it
    const isAction = def.types.includes('ACTION');
    const isTreasure = def.types.includes('TREASURE');
    const isNight = def.types.includes('NIGHT');
    if (isAction || isTreasure || isNight) {
        if (isNight && !isAction) {
            if (!state.phasePipeline?.includes('NIGHT')) PhaseEngine.injectPhaseForTurn(state, 'NIGHT', 'BUY');
            state.phase = 'NIGHT';
            state.phaseIndex = state.phasePipeline!.indexOf('NIGHT');
        } else if (isTreasure && !isAction) {
            state.phase = 'BUY';
            state.phaseIndex = state.phasePipeline!.indexOf('BUY');
        }
        const card = p1.hand.find(c => c.id === cardId)!;
        let r = act(state, pid, { type: 'PLAY_CARD', cardInstanceId: card.instanceId });
        if (!r.ok) return `jouer : ${r.error}`;
        state = r.state;
        r = resolveAll(state, strategy);
        if (!r.ok) return `jouer → ${r.error}`;
        state = r.state;
        const c = check('après avoir joué'); if (c) return c;
    }

    // 2. Buy one (on-buy / on-gain effects)
    if (state.supply[pileId] && state.supply[pileId].count > 0 && state.currentPlayerIndex === state.players.findIndex(p => p.id === pid)) {
        if (state.phase === 'ACTION') {
            const r = act(state, pid, { type: 'END_PHASE' });
            if (!r.ok) return `fin phase Action : ${r.error}`;
            state = r.state;
            const rr = resolveAll(state, strategy); if (!rr.ok) return `fin phase Action → ${rr.error}`; state = rr.state;
        }
        if (state.phase === 'BUY') {
            const me = state.players.find(p => p.id === pid)!;
            me.coins = 20; me.buys = 2; me.potions = 3; me.debt = 0;
            let r = act(state, pid, { type: 'BUY_CARD', cardId: pileId });
            if (!r.ok && !/coût|dette|potion|Mission|restriction|interdit/i.test(r.error || '')) return `acheter : ${r.error}`;
            if (r.ok) {
                state = r.state;
                r = resolveAll(state, strategy);
                if (!r.ok) return `acheter → ${r.error}`;
                state = r.state;
                const c = check('après achat'); if (c) return c;
            }
        }
    }

    // 3. A full round: everybody ends their phases (Durations, attacks, reactions, start-of-turn)
    for (let step = 0; step < 40; step++) {
        if (state.isGameOver) break;
        if (state.pendingDecision) {
            const r = resolveAll(state, strategy); if (!r.ok) return `tour → ${r.error}`; state = r.state;
            continue;
        }
        const current = state.players[state.currentPlayerIndex];
        const r = act(state, actingPlayerFor(state, current.id), { type: 'END_PHASE' });
        if (!r.ok) return `fin de phase (${state.phase}) : ${r.error}`;
        state = r.state;
        const c = check(`tour ${state.turnNumber}`); if (c) return c;
        if (state.turnNumber >= 5 && state.currentPlayerIndex === 0) break;
    }
    return null;
}

describe('Smoke test : chaque carte du Royaume', () => {
    it('joue, achète et fait un tour complet avec chaque carte', () => {
        const piles = CardRegistry.getKingdomCandidates();
        const failures: Record<string, string> = {};
        const silence = vi.spyOn(console, 'log').mockImplementation(() => {});
        const silenceWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const silenceInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
        try {
            for (const pileId of piles) {
                for (const cardId of cardsOfPile(pileId)) {
                    for (const strategy of ['first', 'last'] as Strategy[]) {
                        let error: string | null;
                        const missing: string[] = [];
                        silenceWarn.mockImplementation((msg: any) => {
                            const m = /No handler for effect type "([^"]+)"/.exec(String(msg));
                            if (m) missing.push(m[1]);
                        });
                        try { error = runCard(pileId, cardId, strategy); }
                        catch (e: any) { error = `exception : ${e.message}`; }
                        if (!error && missing.length) error = `effet(s) sans gestionnaire : ${[...new Set(missing)].join(', ')}`;
                        if (error && !failures[cardId]) failures[cardId] = `[${strategy}] ${error}`;
                    }
                }
            }
        } finally {
            silence.mockRestore(); silenceWarn.mockRestore(); silenceInfo.mockRestore();
        }

        fs.mkdirSync('logs', { recursive: true });
        fs.writeFileSync('logs/smoke_report.json', JSON.stringify(failures, null, 2));

        const unexpected = Object.keys(failures).filter(id => !KNOWN_BROKEN.has(id));
        const nowFixed = [...KNOWN_BROKEN].filter(id => !failures[id]);
        expect(unexpected.map(id => `${id}: ${failures[id]}`)).toEqual([]);
        expect(nowFixed).toEqual([]);
    }, 600_000);
});
