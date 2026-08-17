
import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, createGameState } from '../engine/GameState.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { createPlayerState } from '../engine/PlayerState.js';
import { CardRegistry } from '../cards/index.js';

describe('Double Economy Bug Reproduction (V2)', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test-seed-repro-v2');
        state.players.push(createPlayerState('Player1', 'Player1'));
        state.players.push(createPlayerState('Player2', 'Player2'));

        state.players[0].hand = [];
        state.players[0].playArea = [];
        state.players[0].discardPile = [];
        state.players[0].coins = 0;
        state.players[0].actions = 1;
        state.players[0].buys = 1;

        state.phase = 'BUY';
    });

    it('PLAY_ALL_TREASURES should add exactly 3 coins for 3 Coppers', () => {
        const c1 = createCardInstance('copper');
        const c2 = createCardInstance('copper');
        const c3 = createCardInstance('copper');
        state.players[0].hand.push(c1, c2, c3);
        const player = state.players[0];

        const result = ActionResolver.resolve(state, player.id, {
            type: 'PLAY_ALL_TREASURES'
        });

        expect(result.success).toBe(true);
        expect(result.state.players[0].coins).toBe(3);
    });

    it('PLAY_ALL_TREASURES with Lucky Coin and Silver', () => {
        // Lucky Coin provides 1 and gains a silver.
        const lucky = createCardInstance('lucky_coin');
        const silver = createCardInstance('silver');
        state.players[0].hand.push(lucky, silver);
        const player = state.players[0];

        player.coins = 0;
        const result = ActionResolver.resolve(state, player.id, {
            type: 'PLAY_ALL_TREASURES'
        });

        expect(result.success).toBe(true);
        // Lucky Coin (1) + Silver (2) = 3
        expect(result.state.players[0].coins).toBe(3);
    });

    it('Bank should add coins equal to treasures in play', () => {
        const c1 = createCardInstance('copper');
        const c2 = createCardInstance('silver');
        const b = createCardInstance('bank');
        state.players[0].hand.push(c1, c2, b);
        const player = state.players[0];

        player.coins = 0;

        // Play Copper (1)
        let result = ActionResolver.resolve(state, player.id, { type: 'PLAY_CARD', cardInstanceId: c1.instanceId });
        state = result.state;
        // Play Silver (2)
        result = ActionResolver.resolve(state, player.id, { type: 'PLAY_CARD', cardInstanceId: c2.instanceId });
        state = result.state;

        expect(state.players[0].coins).toBe(3);

        // Play Bank (should be 3: Copper, Silver, Bank)
        result = ActionResolver.resolve(state, player.id, { type: 'PLAY_CARD', cardInstanceId: b.instanceId });
        state = result.state;

        expect(result.success).toBe(true);
        expect(state.players[0].coins).toBe(3 + 3); // 3 (previous) + 3 (Bank)
    });
});
