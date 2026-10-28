/**
 * The game log sent to a player never names the cards another player drew, and is not doubled.
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { StateSerializerV2 } from '../../server/StateSerializerV2.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };

describe('Journal envoyé aux joueurs', () => {
    it('ne contient ni les cartes piochées par l\'adversaire ni de doublons', () => {
        const kingdom = ['village', 'smithy', 'market', 'cellar', 'moat', 'workshop', 'festival', 'laboratory', 'chapel', 'remodel'];
        const room = new GameRoomV2(io, 'privacy_' + Math.random(), { kingdomCards: kingdom, landscapeInstructions: [], turnTimeoutMs: 0 } as any);
        room.addPlayer({ id: 's1', join: noop, emit: noop } as any, 'A', '#fff', 'p1');
        room.addPlayer({ id: 's2', join: noop, emit: noop } as any, 'B', '#fff', 'p2');
        room.players.forEach(p => (p.isReady = true));
        room.startGame(kingdom);
        let s = room.gameState;
        // Play a whole turn so that the active player draws a new hand
        const active = s.players[s.currentPlayerIndex].id;
        for (let i = 0; i < 4 && s.players[s.currentPlayerIndex].id === active; i++) s = ActionResolver.resolve(s, active, { type: 'END_PHASE' } as any).state;
        const other = s.players.find(p => p.id !== active)!.id;
        const logs: any[] = (StateSerializerV2.serialize(s, other) as any).public.logs;
        const leaks = logs.filter(l => l.playerId === active && l.payload?.targetIds);
        expect(leaks).toEqual([]);
        for (let i = 1; i < logs.length; i++) {
            const dup = logs[i].playerId === logs[i - 1].playerId && logs[i].message === logs[i - 1].message && logs[i].type === 'TEXT';
            expect(dup ? logs[i].message : null).toBeNull();
        }
    });
});
