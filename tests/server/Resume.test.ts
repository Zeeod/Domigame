/**
 * Resuming a saved game in a new room (after a server restart): the bots come back and play,
 * absent players keep their seat, and the log is restored.
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { GameLogStore } from '../../shared/engine/GameLogStore.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };
const KINGDOM = ['cellar', 'village', 'smithy', 'market', 'militia', 'workshop', 'festival', 'laboratory', 'chapel', 'remodel'];
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('Reprise d\'une partie sauvegardée', () => {
    it('recrée le bot et les places des joueurs absents', async () => {
        const room = new GameRoomV2(io, 'save_' + Math.random(), { kingdomCards: KINGDOM, sheltersMode: 'never', landscapeInstructions: [], turnTimeoutMs: 0 } as any);
        room.addPlayer({ id: 's1', join: noop, emit: noop } as any, 'Alice', '#fff', 'tok_alice');
        room.addPlayer({ id: 's2', join: noop, emit: noop } as any, 'Bruno', '#fff', 'tok_bruno');
        room.addBot('greedy' as any);
        room.players.forEach(p => (p.isReady = true));
        room.startGame(KINGDOM);
        const t = (room as any).turnTimer; if (t) clearTimeout(t);
        const saved = JSON.stringify(room.gameState);
        const logCount = GameLogStore.getLogs(room.gameState.id).length;

        // Server restart: Alice alone opens a new room and resumes the game
        GameLogStore.clear(room.gameState.id);
        const room2 = new GameRoomV2(io, 'resume_' + Math.random(), { landscapeInstructions: [], turnTimeoutMs: 0 } as any);
        room2.addPlayer({ id: 's9', join: noop, emit: noop } as any, 'Alice', '#fff', 'tok_alice');
        expect(room2.resumeGame(saved, KINGDOM)).toBe(true);

        const bot = room2.players.find(p => p.isBot)!;
        expect(bot).toBeTruthy();
        expect((room2 as any).bots.has(bot.id)).toBe(true);
        const bruno = room2.players.find(p => p.id === 'tok_bruno')!;
        expect(bruno.isConnected).toBe(false);
        expect(GameLogStore.getLogs(room2.gameState.id).length).toBe(JSON.parse(saved).history.length);
        expect(logCount).toBeGreaterThan(0);

        // Bruno comes back with his token: he gets his seat again
        room2.addPlayer({ id: 's8', join: noop, emit: noop } as any, 'Bruno', '#fff', 'tok_bruno');
        expect(room2.players.find(p => p.id === 'tok_bruno')!.isConnected).toBe(true);

        // When it is the bot's turn, it plays
        const s = room2.gameState;
        if (s.players[s.currentPlayerIndex].id === bot.id) {
            const turn = s.turnNumber;
            for (let i = 0; i < 40 && room2.gameState.players[room2.gameState.currentPlayerIndex].id === bot.id && room2.gameState.turnNumber === turn; i++) await wait(100);
            expect(room2.gameState.players[room2.gameState.currentPlayerIndex].id).not.toBe(bot.id);
        }
    }, 10000);
});
