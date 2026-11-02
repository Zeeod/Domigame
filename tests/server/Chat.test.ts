/**
 * Room chat: messages are cleaned, kept for players who join later, and limited against flooding.
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';

describe('Chat de la salle', () => {
    it('diffuse, nettoie, garde l\'historique et limite le spam', () => {
        const sent: { event: string; data: any }[] = [];
        const io: any = { to: () => ({ emit: (event: string, data: any) => sent.push({ event, data }) }), emit: () => undefined, sockets: { sockets: new Map() } };
        const room = new GameRoomV2(io, 'chat_' + Math.random(), { landscapeInstructions: [], turnTimeoutMs: 0 } as any);
        const joined: any[] = [];
        room.addPlayer({ id: 's1', join: () => undefined, emit: () => undefined } as any, 'Alice', '#f00', 'p1');
        room.addPlayer({ id: 's2', join: () => undefined, emit: (e: string, d: any) => joined.push({ e, d }) } as any, 'Bruno', '#00f', 'p2');

        expect(room.postChat('s1', '   salut   tout\n le monde  ').success).toBe(true);
        const msg = sent.filter(s => s.event === 'chat_message').pop()!.data;
        expect(msg).toMatchObject({ playerId: 'p1', name: 'Alice', text: 'salut tout le monde' });

        expect(room.postChat('s1', '   ').success).toBe(false);
        expect(room.postChat('inconnu', 'coucou').success).toBe(false);
        room.postChat('s2', 'x'.repeat(1000));
        expect(sent.filter(s => s.event === 'chat_message').pop()!.data.text.length).toBe(300);

        // 5 messages in 5 seconds at most
        for (let i = 0; i < 4; i++) room.postChat('s1', 'msg ' + i);
        const flood = room.postChat('s1', 'encore');
        expect(flood.success).toBe(false);
        expect(flood.error).toMatch(/trop de messages/);

        // Someone joining gets the history
        const late: any[] = [];
        room.addPlayer({ id: 's3', join: () => undefined, emit: (e: string, d: any) => late.push({ e, d }) } as any, 'Chloé', '#0f0', 'p3');
        const history = late.find(x => x.e === 'chat_history')?.d;
        expect(history.map((m: any) => m.text)).toContain('salut tout le monde');
    });
});
