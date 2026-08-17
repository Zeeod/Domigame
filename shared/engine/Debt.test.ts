import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, createGameState } from './GameState.js';
import { ActionResolver } from './ActionResolver.js';
import { createPlayerState } from './PlayerState.js';

describe('Debt Mechanics', () => {
    let state: GameState;
    const p1 = 'p1';

    beforeEach(() => {
        state = createGameState('test-game');
        state.players = [
            createPlayerState('p1', 'Player 1', 'blue'),
            createPlayerState('p2', 'Player 2', 'red')
        ];
        state.phase = 'BUY';
        state.players[0].actions = 1;
        state.players[0].buys = 1;
        state.players[0].coins = 10;
        state.players[0].tokens.debt = 0;
        state.players[0].debt = 0; // Legacy sync

        // Ensure Engineer and Fortune are in supply
        state.supply['engineer'] = { cardId: 'engineer', count: 10, cards: [] };
        state.supply['fortune'] = { cardId: 'fortune', count: 10, cards: [] };
        state.supply['silver'] = { cardId: 'silver', count: 40, cards: [] };
    });

    it('should allow buying a card with debt cost', () => {
        const result = ActionResolver.resolve(state, p1, { type: 'BUY_CARD', cardId: 'engineer' });
        expect(result.success).toBe(true);
        expect(result.state.players[0].tokens.debt).toBe(4);
        expect(result.state.players[0].debt).toBe(4);
        expect(result.state.players[0].coins).toBe(10); // 0 coin cost, only debt
    });

    it('should prevent buying another card while in debt', () => {
        // First buy Engineer
        let result = ActionResolver.resolve(state, p1, { type: 'BUY_CARD', cardId: 'engineer' });
        expect(result.success).toBe(true);

        // Try to buy Silver (cost 3)
        state.players[0].buys = 1; // Give another buy
        result = ActionResolver.resolve(result.state, p1, { type: 'BUY_CARD', cardId: 'silver' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('dette');
    });

    it('should allow paying off debt', () => {
        // Setup state with debt
        state.players[0].tokens.debt = 4;
        state.players[0].debt = 4;
        state.players[0].coins = 5;

        // Pay 3 debt
        const result = ActionResolver.resolve(state, p1, { type: 'PAY_DEBT', amount: 3 });
        expect(result.success).toBe(true);
        expect(result.state.players[0].tokens.debt).toBe(1);
        expect(result.state.players[0].debt).toBe(1);
        expect(result.state.players[0].coins).toBe(2);
    });

    it('should allow buying once debt is paid off', () => {
        // Setup state with debt
        state.players[0].tokens.debt = 4;
        state.players[0].debt = 4;
        state.players[0].coins = 10;
        state.players[0].buys = 1;

        // Pay all debt
        let result = ActionResolver.resolve(state, p1, { type: 'PAY_DEBT', amount: 4 });
        expect(result.success).toBe(true);

        // Buy Silver
        result = ActionResolver.resolve(result.state, p1, { type: 'BUY_CARD', cardId: 'silver' });
        expect(result.success).toBe(true);
        expect(result.state.players[0].coins).toBe(3); // 10 - 4 (debt) - 3 (silver)
    });

    it('should handle cards with both coin and debt cost (Fortune)', () => {
        state.players[0].coins = 10;
        const result = ActionResolver.resolve(state, p1, { type: 'BUY_CARD', cardId: 'fortune' });
        expect(result.success).toBe(true);
        expect(result.state.players[0].coins).toBe(2); // 10 - 8
        expect(result.state.players[0].tokens.debt).toBe(8);
    });
});
