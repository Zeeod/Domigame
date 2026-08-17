import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../shared/engine/GameState.js';
import { RulesValidator } from '../shared/engine/RulesValidator.js';
import { ActionResolver } from '../shared/engine/ActionResolver.js';
import { CardRegistry } from '../shared/cards/index.js';

describe('Bug Reproduction: Buy Mechanics', () => {
    let state: GameState;

    beforeEach(() => {
        state = {
            players: [{
                id: 'p1',
                hand: [
                    { id: 'copper', instanceId: 'c1' },
                    { id: 'silver', instanceId: 's1' },
                    { id: 'village', instanceId: 'v1' }
                ],
                discardPile: [],
                deck: [],
                playArea: [],
                actions: 1,
                buys: 1,
                coins: 0,
                mats: {},
                aside: [],
                isReady: true,
                name: 'Player 1'
            }],
            supply: {
                'province': { count: 8, cost: 8 },
                'copper': { count: 10, cost: 0, treasureValue: 1 },
            },
            phase: 'ACTION',
            currentPlayerIndex: 0,
            trash: [],
            turnNumber: 1,
            effectStack: [],
            landscapes: [],
            turnPhasePipeline: ['ACTION', 'BUY', 'NIGHT', 'CLEANUP']
        } as any;
    });

    it('should allow PLAY_ALL_TREASURES in ACTION phase (Auto-Transition)', () => {
        // User attempts to play all treasures to start buying
        const action = { type: 'PLAY_ALL_TREASURES' };

        // 1. Validation
        const valid = RulesValidator.validate(state, 'p1', action as any);
        if (!valid.valid) {
            console.log('REPRO VALIDATION ERROR:', valid.error);
        }
        expect(valid.valid).toBe(true); // <--- This likely FAILS now

        // 2. Resolution
        if (valid.valid) {
            console.log('Before Resolve Phase:', state.phase);
            const result = ActionResolver.resolve(state, 'p1', action as any);
            console.log('After Resolve Phase:', result.state.phase);
            console.log('Result Success:', result.success);
            if (!result.success) console.log('Result Error:', result.error);

            expect(result.success).toBe(true);
            expect(result.state.phase).toBe('BUY');
            expect(result.state.players[0].playArea.length).toBe(2); // Copper + Silver
        }
    });

    it('should allow buying card in BUY phase', () => {
        state.phase = 'BUY';
        state.players[0].coins = 8;

        const action = { type: 'BUY_CARD', cardId: 'province' };

        const valid = RulesValidator.validate(state, 'p1', action as any);
        expect(valid.valid).toBe(true);

        const result = ActionResolver.resolve(state, 'p1', action as any);
        expect(result.success).toBe(true);
        expect(result.state.players[0].discardPile.some(c => c.id === 'province')).toBe(true);
    });
});
