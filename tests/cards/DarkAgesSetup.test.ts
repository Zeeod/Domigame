
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { Server } from 'socket.io';
import { CardRegistry } from '../../shared/cards/index.js';

describe('Dark Ages Setup', () => {
    let mockIo: Server;
    let room: GameRoomV2;

    beforeEach(() => {
        mockIo = {
            to: vi.fn().mockReturnValue({
                emit: vi.fn((event) => {
                    // console.log(`[MOCK IO] to(id).emit(${event})`);
                })
            }),
            emit: vi.fn((event) => {
                // console.log(`[MOCK IO] emit(${event})`);
            }),
            sockets: {
                sockets: new Map()
            }
        } as any;
    });

    it('should use Shelters when Dark Ages cards are in the kingdom', async () => {
        const config: any = {
            kingdomCards: ['cultist', 'village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'workshop'],
            enabledExpansions: ['base', 'dark_ages'],
            sheltersMode: 'random'
        };

        room = new GameRoomV2(mockIo, 'test_room', config);
        const mockSocket1 = { id: 's1', join: vi.fn(), emit: vi.fn() } as any;
        const mockSocket2 = { id: 's2', join: vi.fn(), emit: vi.fn() } as any;
        room.addPlayer(mockSocket1, 'Player 1', '#fff', 't1');
        room.addPlayer(mockSocket2, 'Player 2', '#000', 't2');

        // Manually set ready status to allow start
        room.players.forEach(p => p.isReady = true);

        room.startGame(config.kingdomCards);
        expect(room.isStarted).toBe(true);

        const state = room.gameState;
        const p1 = state.players[0];

        // Starting cards (hand + deck): 7 Coppers + 3 Shelters instead of Estates
        const handIds = [...p1.hand, ...p1.deck, ...p1.discardPile].map(c => c.id);
        expect(handIds).toContain('hovel');
        expect(handIds).toContain('necropolis');
        expect(handIds).toContain('overgrown_estate');
        expect(handIds.filter(id => id === 'copper').length).toBe(7);
        expect(handIds).not.toContain('estate');
    });

    it('should setup Ruins mixed pile when Looters are present', async () => {
        const config: any = {
            kingdomCards: ['marauder', 'village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'workshop'],
            enabledExpansions: ['base', 'dark_ages']
        };

        room = new GameRoomV2(mockIo, 'test_room', config);
        const mockSocket1 = { id: 's1', join: vi.fn(), emit: vi.fn() } as any;
        const mockSocket2 = { id: 's2', join: vi.fn(), emit: vi.fn() } as any;
        room.addPlayer(mockSocket1, 'Player 1', '#fff', 't1');
        room.addPlayer(mockSocket2, 'Player 2', '#000', 't2');

        room.players.forEach(p => p.isReady = true);
        room.startGame(config.kingdomCards);

        const state = room.gameState;

        // Ruins are a Supply pile: 10 per player after the first (2 players → 10)
        expect(state.supply['ruins']).toBeDefined();
        expect(state.supply['ruins'].isMixed).toBe(true);
        expect(state.supply['ruins'].cards?.length).toBe(10);
        expect(state.supply['ruins'].count).toBe(10);
    });

    it('should setup Knights mixed pile when Knights are in kingdom', async () => {
        const config: any = {
            kingdomCards: ['knights', 'village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'workshop'],
            enabledExpansions: ['base', 'dark_ages']
        };

        room = new GameRoomV2(mockIo, 'test_room', config);
        const mockSocket1 = { id: 's1', join: vi.fn(), emit: vi.fn() } as any;
        const mockSocket2 = { id: 's2', join: vi.fn(), emit: vi.fn() } as any;
        room.addPlayer(mockSocket1, 'Player 1', '#fff', 't1');
        room.addPlayer(mockSocket2, 'Player 2', '#000', 't2');

        room.players.forEach(p => p.isReady = true);
        room.startGame(config.kingdomCards);

        const state = room.gameState;

        // Knights are in supply
        expect(state.supply['knights']).toBeDefined();
        expect(state.supply['knights'].isMixed).toBe(true);
        expect(state.supply['knights'].cards?.length).toBe(10);

        // Check if top card of knights is one of the knights
        const topKnight = state.supply['knights'].cards?.[0];
        expect(topKnight).toBeDefined();
        expect(CardRegistry.get(topKnight!.id)?.types).toContain('KNIGHT');
    });

    it('should add Spoils extra pile when Marauder is present', async () => {
        const config: any = {
            kingdomCards: ['marauder', 'village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'workshop'],
            enabledExpansions: ['base', 'dark_ages']
        };

        room = new GameRoomV2(mockIo, 'test_room', config);
        const mockSocket1 = { id: 's1', join: vi.fn(), emit: vi.fn() } as any;
        const mockSocket2 = { id: 's2', join: vi.fn(), emit: vi.fn() } as any;
        room.addPlayer(mockSocket1, 'Player 1', '#fff', 't1');
        room.addPlayer(mockSocket2, 'Player 2', '#000', 't2');

        room.players.forEach(p => p.isReady = true);
        room.startGame(config.kingdomCards);

        // Spoils are in nonSupply
        expect(room.gameState.nonSupply['spoils']).toBeDefined();
        expect(room.gameState.nonSupply['spoils'].count).toBe(15);
    });
});
