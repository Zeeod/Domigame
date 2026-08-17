import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, createGameState } from './GameState.js';
import { ActionResolver } from './ActionResolver.js';
import { createPlayerState } from './PlayerState.js';

describe('Potion Mechanics', () => {
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
        state.players[0].potions = 0;

        // Ensure Alchemist and Potion are in supply
        state.supply['alchemist'] = { cardId: 'alchemist', count: 10, cards: [] };
        state.supply['potion'] = { cardId: 'potion', count: 10, cards: [] };
    });

    it('should add a potion when playing a Potion card', () => {
        // Add Potion to hand
        state.players[0].hand = [{ id: 'potion', instanceId: 'pot1' }];
        state.phase = 'BUY'; // Treasures can be played in BUY phase

        const result = ActionResolver.resolve(state, p1, { type: 'PLAY_CARD', cardInstanceId: 'pot1' });
        expect(result.success).toBe(true);
        expect(result.state.players[0].potions).toBe(1);
    });

    it('should allow buying a card with potion cost (Alchemist)', () => {
        state.players[0].coins = 3;
        state.players[0].potions = 1;

        const result = ActionResolver.resolve(state, p1, { type: 'BUY_CARD', cardId: 'alchemist' });
        expect(result.success).toBe(true);
        expect(result.state.players[0].coins).toBe(0); // 3 (cost) - 3 (coins)
        expect(result.state.players[0].potions).toBe(0);
        expect(result.state.players[0].discardPile.some(c => c.id === 'alchemist')).toBe(true);
    });

    it('should prevent buying a card if not enough potions', () => {
        state.players[0].coins = 10;
        state.players[0].potions = 0;

        const result = ActionResolver.resolve(state, p1, { type: 'BUY_CARD', cardId: 'alchemist' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('potion');
    });

    it('should handle complex costs (coins + potion)', () => {
        // Alchemist costs 3 + 1P
        state.players[0].coins = 5;
        state.players[0].potions = 1;

        const result = ActionResolver.resolve(state, p1, { type: 'BUY_CARD', cardId: 'alchemist' });
        expect(result.success).toBe(true);
        expect(result.state.players[0].coins).toBe(2); // 5 - 3
        expect(result.state.players[0].potions).toBe(0);
    });

    it('should accumulate potions', () => {
        state.players[0].hand = [
            { id: 'potion', instanceId: 'pot1' },
            { id: 'potion', instanceId: 'pot2' }
        ];

        let currentState = state;
        let res = ActionResolver.resolve(currentState, p1, { type: 'PLAY_CARD', cardInstanceId: 'pot1' });
        currentState = res.state;
        res = ActionResolver.resolve(currentState, p1, { type: 'PLAY_CARD', cardInstanceId: 'pot2' });

        expect(res.state.players[0].potions).toBe(2);
    });
});
