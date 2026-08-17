import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartBot } from './SmartBot.js';
import { GameState } from '../engine/GameState.js';
import { CardRegistry } from '../cards/index.js';
import { EconomyEngine } from '../engine/EconomyEngine.js';

describe('SmartBot (MCTS)', () => {
    let bot: SmartBot;
    let mockState: GameState;

    beforeEach(() => {
        bot = new SmartBot();
        mockState = {
            players: [{
                id: 'p1',
                hand: [],
                discardPile: [],
                deck: [],
                playArea: [],
                actions: 1,
                buys: 1,
                coins: 0,
                mats: {},
                aside: []
            }],
            supply: {
                'province': { count: 8, cost: 8 },
                'gold': { count: 10, cost: 6 },
                'silver': { count: 10, cost: 3 },
                'copper': { count: 10, cost: 0, treasureValue: 1 },
            },
            phase: 'ACTION',
            currentPlayerIndex: 0,
            trash: [],
            effectStack: [],
            landmarks: [],
            landscapes: [],
            landscapeState: {},
            activeProphecyId: null
        } as any;
    });

    it('should be named "smart"', () => {
        expect(bot.name).toBe('smart');
    });

    it('should return a valid action in Action Phase', () => {
        const player = mockState.players[0];
        player.hand = [{ id: 'village', instanceId: 'v1' }] as any;

        vi.spyOn(CardRegistry, 'get').mockReturnValue({
            id: 'village',
            types: ['ACTION'],
            effects: [{ type: 'ADD_ACTIONS', amount: 2 }]
        } as any);

        const action = bot.chooseAction(mockState, 'p1');

        // MCTS is probabilistic, but with 1 non-terminal choice (Village) and deep enough simulation,
        // it should pick Village if it leads to better score (which it might not if evaluation function is simple VP/Coins)
        // Actually, playing Village usually leads to nothing extra if deck is empty.
        // But the test is just checking it returns *something* valid.
        expect(action).toBeDefined();
        // It should be either END_PHASE or PLAY_CARD
        expect(['END_PHASE', 'PLAY_CARD']).toContain(action.type);
    });

    it('should prefer buying Province over Copper when rich', () => {
        mockState.phase = 'BUY';
        const player = mockState.players[0];
        player.coins = 8;
        player.buys = 1;

        // Mock CardRegistry for prices/types
        vi.spyOn(CardRegistry, 'get').mockImplementation((id: string) => {
            const costs: any = { province: 8, gold: 6, silver: 3, copper: 0, duchy: 5 };
            const values: any = { gold: 3, silver: 2, copper: 1 };
            return {
                id,
                cost: costs[id] ?? 0,
                treasureValue: values[id] ?? 0,
                victoryPoints: id === 'province' ? 6 : (id === 'duchy' ? 3 : 0),
                types: id === 'province' ? ['VICTORY'] : ['TREASURE']
            } as any;
        });

        // Mock EconomyEngine using spyOn instead of vi.mock to not break bootstrap
        vi.spyOn(EconomyEngine, 'getCardCost').mockImplementation((_s: any, _p: any, id: string) => {
            const costs: any = { province: 8, gold: 6, silver: 3, copper: 0, duchy: 5 };
            return costs[id] ?? 0;
        });

        const action = bot.chooseAction(mockState, 'p1');

        // With 8 coins, optimal move is Province (6 VP) vs Gold (0 VP but 3 coins).
        // Evaluation function weights VP heavily (1.0 vs coins 0.02).
        // So MCTS should converge on Province.
        expect(action).toEqual({ type: 'BUY_CARD', cardId: 'province' });
    });
});
