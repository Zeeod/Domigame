/**
 * Going back in the game from a log line: the state comes back exactly as it was before the move
 * that wrote the line, once every connected player agrees.
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { GameLogStore } from '../../shared/engine/GameLogStore.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };
const KINGDOM = ['cellar', 'village', 'smithy', 'market', 'militia', 'workshop', 'festival', 'laboratory', 'chapel', 'remodel'];

function setup(withBot = false) {
    const room = new GameRoomV2(io, 'rewind_' + Math.random(), { kingdomCards: KINGDOM, sheltersMode: 'never', landscapeInstructions: [], turnTimeoutMs: 0 } as any);
    room.forcedDecisionDelayMs = 0;
    room.addPlayer({ id: 's1', join: noop, emit: noop } as any, 'A', '#fff', 'p1');
    if (withBot) room.addBot('greedy' as any);
    else room.addPlayer({ id: 's2', join: noop, emit: noop } as any, 'B', '#fff', 'p2');
    room.players.forEach(p => (p.isReady = true));
    room.startGame(KINGDOM);
    const t = (room as any).turnTimer; if (t) clearTimeout(t);
    return room;
}

const sockOf = (room: GameRoomV2) => room.gameState.players[room.gameState.currentPlayerIndex].id === 'p1' ? 's1' : 's2';
const snapshot = (room: GameRoomV2) => JSON.stringify(room.gameState);

/** Plays the treasures and buys a Silver; returns the state before the buy and the id of its log line */
function buySilver(room: GameRoomV2) {
    const sock = sockOf(room);
    expect(room.handleAction(sock, { type: 'END_PHASE' } as any).success).toBe(true); // to the Buy phase
    expect(room.handleAction(sock, { type: 'PLAY_ALL_TREASURES' } as any).success).toBe(true);
    const before = snapshot(room);
    const logsBefore = GameLogStore.getLogs(room.gameState.id).length;
    expect(room.handleAction(sock, { type: 'BUY_CARD', cardId: 'silver' } as any).success).toBe(true);
    const buyLine = GameLogStore.getLogs(room.gameState.id)[logsBefore];
    return { before, buyLogId: buyLine.id, sock };
}

describe('Retour en arrière depuis le journal', () => {
    it('revient exactement avant le coup choisi quand l\'autre joueur accepte', () => {
        const room = setup();
        if (room.gameState.players[room.gameState.currentPlayerIndex].id !== 'p1') {
            room.handleAction('s2', { type: 'END_PHASE' } as any); room.handleAction('s2', { type: 'END_PHASE' } as any);
        }
        const { before, buyLogId, sock } = buySilver(room);
        room.handleAction(sock, { type: 'END_PHASE' } as any); // end of turn: other moves after the buy
        expect(room.gameState.supply.silver.count).toBe(39);

        expect(room.handleRewindRequest('s1', buyLogId).success).toBe(true);
        expect(room.activeRewindRequest).toBeTruthy(); // waiting for B
        room.handleRewindVote('s2', true);

        expect(room.activeRewindRequest).toBeNull();
        expect(room.gameState.supply.silver.count).toBe(40);
        // Same state as before the buy, apart from the line saying we went back
        const restored = JSON.parse(snapshot(room));
        const expected = JSON.parse(before);
        expect(restored.history.slice(0, -1)).toEqual(expected.history);
        delete restored.history; delete expected.history;
        expect(restored).toEqual(expected);
        // The log ends with the rewind line, the undone lines are gone
        const logs = GameLogStore.getLogs(room.gameState.id);
        expect(logs.some(l => l.id === buyLogId)).toBe(false);
        expect(logs[logs.length - 1].message).toMatch(/Retour en arrière/);
        // The game goes on normally
        expect(room.handleAction('s1', { type: 'BUY_CARD', cardId: 'silver' } as any).success).toBe(true);
    });

    it('un refus annule la demande sans rien changer', () => {
        const room = setup();
        const { buyLogId } = buySilver(room);
        const after = snapshot(room);
        const asker = sockOf(room), other = asker === 's1' ? 's2' : 's1';
        expect(room.handleRewindRequest(asker, buyLogId).success).toBe(true);
        room.handleRewindVote(other, false);
        expect(room.activeRewindRequest).toBeNull();
        expect(snapshot(room)).toBe(after);
    });

    it('contre des bots, le retour est immédiat', () => {
        const room = setup(true);
        // Let the human be the current player
        if (room.gameState.players[room.gameState.currentPlayerIndex].id !== 'p1') return;
        const { before, buyLogId } = buySilver(room);
        expect(room.handleRewindRequest('s1', buyLogId).success).toBe(true);
        expect(room.activeRewindRequest).toBeNull();
        expect(room.gameState.supply.silver.count).toBe(JSON.parse(before).supply.silver.count);
    });

    it('refuse une ligne inconnue ou une deuxième demande en même temps', () => {
        const room = setup();
        const { buyLogId } = buySilver(room);
        expect(room.handleRewindRequest('s1', 'nope').success).toBe(false);
        expect(room.handleRewindRequest('s1', buyLogId).success).toBe(true);
        expect(room.handleRewindRequest('s2', buyLogId).success).toBe(false);
    });
});
