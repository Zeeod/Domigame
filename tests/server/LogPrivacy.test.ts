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

describe('Possession : ce que voit chaque joueur', () => {
    it('le contrôleur voit la main du joueur possédé, les autres non', async () => {
        const { GameStateView } = await import('../../shared/engine/GameStateView.js');
        const kingdom = ['village', 'smithy', 'market', 'cellar', 'moat', 'workshop', 'festival', 'laboratory', 'chapel', 'possession'];
        const room = new GameRoomV2(io, 'poss_' + Math.random(), { kingdomCards: kingdom, landscapeInstructions: [], turnTimeoutMs: 0 } as any);
        for (const id of ['p1', 'p2', 'p3']) room.addPlayer({ id: 's' + id, join: noop, emit: noop } as any, id, '#fff', id);
        room.players.forEach(p => (p.isReady = true));
        room.startGame(kingdom);
        const s: any = room.gameState;
        const possessed = s.players[s.currentPlayerIndex].id;
        const controller = s.players.find((p: any) => p.id !== possessed).id;
        const other = s.players.find((p: any) => p.id !== possessed && p.id !== controller).id;
        s.currentExtraTurn = { type: 'POSSESSION', playerId: possessed, controllerId: controller };
        const view = (id: string) => (StateSerializerV2.serialize(GameStateView.createPlayerView(s, id), id) as any).public.possession;
        const hand = s.players.find((p: any) => p.id === possessed).hand.map((c: any) => c.id);
        expect(view(controller).hand.map((c: any) => c.id)).toEqual(hand);
        expect(view(other).hand).toBeUndefined();
    });
});
