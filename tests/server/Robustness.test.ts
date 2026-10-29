/**
 * A malformed action from a client is refused; it never throws (which would stop the whole server).
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };

describe('Serveur : actions mal formées', () => {
    it('refuse sans planter une réponse de cartes sans liste, et d\'autres payloads absurdes', () => {
        const kingdom = ['cellar', 'village', 'smithy', 'market', 'moat', 'workshop', 'festival', 'laboratory', 'chapel', 'remodel'];
        const room = new GameRoomV2(io, 'robust_' + Math.random(), { kingdomCards: kingdom, landscapeInstructions: [], turnTimeoutMs: 0 } as any);
        room.addPlayer({ id: 's1', join: noop, emit: noop } as any, 'A', '#fff', 'p1');
        room.addPlayer({ id: 's2', join: noop, emit: noop } as any, 'B', '#fff', 'p2');
        room.players.forEach(p => (p.isReady = true));
        room.startGame(kingdom);
        const s = room.gameState;
        const cur = s.players[s.currentPlayerIndex];
        const sock = cur.id === 'p1' ? 's1' : 's2';
        const cellar = createCardInstance('cellar');
        cur.hand.push(cellar);
        expect(room.handleAction(sock, { type: 'PLAY_CARD', cardInstanceId: cellar.instanceId } as any).success).toBe(true);
        const id = room.gameState.pendingDecision!.id;
        for (const payload of [{ type: 'CARDS' }, { type: 'CARDS', cardInstanceIds: 'x' }, { type: 'CARDS', cardInstanceIds: [null] }, null, { type: 'SUPPLY' }, { type: 'OPTION', optionIndex: 99 }]) {
            expect(() => room.handleAction(sock, { type: 'CHOOSE', choiceId: id, payload } as any)).not.toThrow();
        }
        expect(() => room.handleAction(sock, { type: 'PLAY_CARD' } as any)).not.toThrow();
        expect(() => room.handleAction(sock, { type: 'BUY_CARD', cardId: undefined } as any)).not.toThrow();
        expect(() => room.handleAction(sock, { type: 'PAY_DEBT', amount: 'beaucoup' } as any)).not.toThrow();
        expect(room.gameState.pendingDecision?.id).toBe(id); // still waiting for a real answer
    });
});
