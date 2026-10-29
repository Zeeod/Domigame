/**
 * End-of-game details: the VP breakdown always adds up to the score, and the deck list holds every card.
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { VictoryChecker } from '../../shared/engine/VictoryChecker.js';
import { ZoneManager } from '../../shared/engine/ZoneManager.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };

describe('Fin de partie : détail des points et decks', () => {
    it('le détail des points fait le score, Jardins et jetons compris', () => {
        const kingdom = ['gardens', 'village', 'smithy', 'market', 'militia', 'workshop', 'festival', 'laboratory', 'chapel', 'remodel'];
        const room = new GameRoomV2(io, 'score_' + Math.random(), { kingdomCards: kingdom, landscapeInstructions: [], turnTimeoutMs: 0 } as any);
        room.addPlayer({ id: 's1', join: noop, emit: noop } as any, 'A', '#fff', 'p1');
        room.addPlayer({ id: 's2', join: noop, emit: noop } as any, 'B', '#fff', 'p2');
        room.players.forEach(p => (p.isReady = true));
        room.startGame(kingdom);
        const p = room.gameState.players[0];
        p.discardPile.push(...['province', 'province', 'duchy', 'curse', 'gardens', 'gardens'].map(createCardInstance));
        p.vpTokens = 4;

        const lines = VictoryChecker.scoreBreakdown(room.gameState, p);
        const total = lines.reduce((s, l) => s + l.vp, 0);
        expect(total).toBe(VictoryChecker.scorePlayer(room.gameState, p));
        // 16 cards: each Gardens is worth 1
        expect(lines.find(l => l.source === 'gardens')).toEqual({ source: 'gardens', count: 2, vp: 2 });
        expect(lines.find(l => l.source === 'province')).toEqual({ source: 'province', count: 2, vp: 12 });
        expect(lines.find(l => l.source === 'curse')).toEqual({ source: 'curse', count: 1, vp: -1 });
        expect(lines.find(l => l.source === 'vpTokens')?.vp).toBe(4);

        const deck = VictoryChecker.deckList(p);
        expect(deck.reduce((s, d) => s + d.count, 0)).toBe(ZoneManager.getAllCards(p).length);
        expect(deck[0]).toEqual({ cardId: 'copper', count: 7 });
    });
});
