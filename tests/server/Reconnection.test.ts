/**
 * Disconnection and reconnection in the middle of a game: a player who is away for longer than the
 * grace period has their decisions answered and their turns passed; back in time, they keep control.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { totalCards } from '../helpers/autoPlay.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };
const socket = (id: string): any => ({ id, join: noop, leave: noop, emit: noop });
const GRACE = 1000;
const sock = (playerId: string) => 'sock_' + playerId;

/** A started game. `seats[0]` plays first, then `seats[1]`… (the room shuffles the seating). */
function newRoom(players = 2) {
    const room = new GameRoomV2(io, 'reco_' + Math.random(), {
        kingdomCards: ['militia', 'village', 'smithy', 'market', 'cellar', 'moat', 'workshop', 'festival', 'laboratory', 'chapel'],
        sheltersMode: 'never', landscapeInstructions: [], turnTimeoutMs: 0, disconnectGraceMs: GRACE
    } as any);
    for (let i = 1; i <= players; i++) room.addPlayer(socket(sock('p' + i)), 'P' + i, '#fff', 'p' + i);
    room.players.forEach(p => (p.isReady = true));
    room.startGame((room as any).config.kingdomCards);
    const s = room.gameState;
    for (const p of s.players) {
        p.hand = ['copper', 'copper', 'copper', 'estate', 'estate'].map(id => createCardInstance(id));
        p.deck = Array.from({ length: 10 }, () => createCardInstance('copper'));
    }
    const first = s.currentPlayerIndex;
    const seats = s.players.map((_, i) => s.players[(first + i) % s.players.length].id);
    return { room, seats };
}
const gs = (room: GameRoomV2) => room.gameState;
const pl = (room: GameRoomV2, id: string) => room.gameState.players.find(p => p.id === id)!;
const current = (room: GameRoomV2) => gs(room).players[gs(room).currentPlayerIndex].id;
const playMilitia = (room: GameRoomV2, by: string) => {
    const m = createCardInstance('militia');
    pl(room, by).hand.push(m);
    const r = room.handleAction(sock(by), { type: 'PLAY_CARD', cardInstanceId: m.instanceId } as any);
    expect(r.error ?? 'ok').toBe('ok');
};

describe('Déconnexion / reconnexion en pleine partie', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, 'log').mockImplementation(noop); });
    afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

    it('la décision d\'un joueur absent est prise pour lui après le délai de grâce', () => {
        const { room, seats: [a, b] } = newRoom();
        room.removePlayer(sock(b), 'disconnect');
        playMilitia(room, a);
        expect(gs(room).pendingDecision?.playerId).toBe(b);
        vi.advanceTimersByTime(GRACE / 2);
        expect(gs(room).pendingDecision?.playerId).toBe(b); // still waiting for them
        vi.advanceTimersByTime(GRACE + 2000);
        expect(gs(room).pendingDecision).toBeFalsy();
        expect(pl(room, b).hand.length).toBe(3);
    });

    it('revenu à temps, le joueur répond lui-même', () => {
        const { room, seats: [a, b] } = newRoom();
        room.removePlayer(sock(b), 'disconnect');
        playMilitia(room, a);
        vi.advanceTimersByTime(GRACE / 2);
        room.addPlayer(socket('sock_back'), 'Back', '#fff', b);
        vi.advanceTimersByTime(GRACE * 3);
        expect(gs(room).pendingDecision?.playerId).toBe(b);
        const ids = pl(room, b).hand.filter(c => c.id === 'estate').map(c => c.instanceId);
        expect(room.handleAction('sock_back', { type: 'CHOOSE', choiceId: gs(room).pendingDecision!.id, payload: { type: 'CARDS', cardInstanceIds: ids } } as any).success).toBe(true);
        expect(pl(room, b).hand.map(c => c.id)).toEqual(['copper', 'copper', 'copper']);
    });

    it('le tour d\'un joueur absent passe, et la partie continue', () => {
        const { room, seats: [a, b] } = newRoom();
        const before = totalCards(gs(room));
        room.removePlayer(sock(a), 'disconnect');
        vi.advanceTimersByTime(GRACE / 2);
        expect(current(room)).toBe(a);
        vi.advanceTimersByTime(GRACE + 10000);
        expect(current(room)).toBe(b);
        expect(totalCards(gs(room))).toBe(before);
        // b plays their turn; a's next turn is passed again
        for (let i = 0; i < 5 && current(room) === b; i++) room.handleAction(sock(b), { type: 'END_PHASE' } as any);
        vi.advanceTimersByTime(10000);
        expect(current(room)).toBe(b);
        expect(totalCards(gs(room))).toBe(before);
    });

    it('si plus aucun joueur humain n\'est là, la partie attend', () => {
        const { room, seats: [a, b] } = newRoom();
        room.removePlayer(sock(a), 'disconnect');
        room.removePlayer(sock(b), 'disconnect');
        const turn = gs(room).turnNumber;
        vi.advanceTimersByTime(GRACE * 20);
        expect(gs(room).turnNumber).toBe(turn);
        expect(current(room)).toBe(a);
    });

    it('un joueur qui abandonne est passé tout de suite', () => {
        const { room, seats: [a, b, c] } = newRoom(3);
        // The host leaving closes the room: the one who quits is not the host (p1)
        const quitter = b !== 'p1' ? b : c;
        room.removePlayer(sock(quitter), 'surrender');
        playMilitia(room, a);
        if (quitter === c) {
            const ids = pl(room, b).hand.filter(x => x.id === 'estate').map(x => x.instanceId);
            room.handleAction(sock(b), { type: 'CHOOSE', choiceId: gs(room).pendingDecision!.id, payload: { type: 'CARDS', cardInstanceIds: ids } } as any);
        }
        vi.advanceTimersByTime(3000);
        expect(pl(room, quitter).hand.length).toBe(3);
        if (quitter === b) expect(gs(room).pendingDecision?.playerId).toBe(c); // c still chooses for themself
    });

    it('le minuteur de tour répond à un choix de cartes', () => {
        const { room, seats: [a, b] } = newRoom();
        (room as any).config.turnTimeoutMs = 5000;
        playMilitia(room, a);
        expect(gs(room).pendingDecision?.playerId).toBe(b);
        vi.advanceTimersByTime(6000);
        expect(gs(room).pendingDecision).toBeFalsy();
        expect(pl(room, b).hand.length).toBe(3);
    });
});
