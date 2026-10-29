/**
 * A decision with only one possible answer is answered by the server for a human player;
 * a real choice still waits for them.
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

function setup() {
    const kingdom = ['cellar', 'village', 'smithy', 'market', 'militia', 'workshop', 'festival', 'laboratory', 'chapel', 'remodel'];
    const room = new GameRoomV2(io, 'forced_' + Math.random(), { kingdomCards: kingdom, landscapeInstructions: [], turnTimeoutMs: 0 } as any);
    room.forcedDecisionDelayMs = 0;
    room.addPlayer({ id: 's1', join: noop, emit: noop } as any, 'A', '#fff', 'p1');
    room.addPlayer({ id: 's2', join: noop, emit: noop } as any, 'B', '#fff', 'p2');
    room.players.forEach(p => (p.isReady = true));
    room.startGame(kingdom);
    const s = room.gameState;
    const cur = s.players[s.currentPlayerIndex];
    const other = s.players.find(p => p.id !== cur.id)!;
    return { room, cur, other, sock: cur.id === 'p1' ? 's1' : 's2' };
}

function playMilitia(room: GameRoomV2, sock: string, otherHand: string[]) {
    const s = room.gameState;
    const cur = s.players[s.currentPlayerIndex];
    const other = s.players.find(p => p.id !== cur.id)!;
    other.hand = otherHand.map(createCardInstance);
    const militia = createCardInstance('militia');
    cur.hand.push(militia);
    expect(room.handleAction(sock, { type: 'PLAY_CARD', cardInstanceId: militia.instanceId } as any).success).toBe(true);
}

describe('Choix sans alternative', () => {
    it('défausse automatiquement quand toutes les cartes en main sont identiques (Milice)', async () => {
        const { room, sock } = setup();
        playMilitia(room, sock, ['copper', 'copper', 'copper', 'copper', 'copper']);
        expect(room.gameState.pendingDecision).toBeTruthy();
        await wait(20);
        const other = room.gameState.players.find(p => p.id !== room.gameState.players[room.gameState.currentPlayerIndex].id)!;
        expect(room.gameState.pendingDecision).toBeNull();
        expect(other.hand.length).toBe(3);
    });

    it('attend le joueur quand il a un vrai choix', async () => {
        const { room, sock } = setup();
        playMilitia(room, sock, ['copper', 'copper', 'estate', 'silver', 'gold']);
        const id = room.gameState.pendingDecision?.id;
        expect(id).toBeTruthy();
        await wait(20);
        expect(room.gameState.pendingDecision?.id).toBe(id);
    });
});
