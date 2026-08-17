import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../shared/engine/GameState.js';
import { createGameState } from '../../shared/engine/GameState.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';

describe('Economy Smoke Test', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test-seed-economy');
        state.players.push(createPlayerState('Player1', 'Player1'));
        state.players.push(createPlayerState('Player2', 'Player2'));

        state.players[0].hand = [];
        state.players[0].playArea = [];
        state.players[0].discardPile = [];
        state.players[0].deck = [];
        state.players[0].coins = 0;
        state.players[0].actions = 1;
        state.players[0].buys = 1;
        // Playing a treasure usually switches phase to buy, so we can start in ACTION or BUY.
        state.phase = 'BUY';
    });

    it('should add exactly 1 coin when playing Copper', () => {
        const copper = createCardInstance('copper');
        state.players[0].hand.push(copper);

        const result = ActionResolver.resolve(state, state.players[0].id, {
            type: 'PLAY_CARD',
            cardInstanceId: copper.instanceId
        });

        // Update state reference (ActionResolver returns new state)
        if (result.success) state = result.state;

        expect(state.players[0].coins).toBe(1);
    });

    it('should add exactly 2 coins when playing Silver', () => {
        const silver = createCardInstance('silver');
        state.players[0].hand.push(silver);

        const result = ActionResolver.resolve(state, state.players[0].id, {
            type: 'PLAY_CARD',
            cardInstanceId: silver.instanceId
        });
        if (result.success) state = result.state;

        expect(state.players[0].coins).toBe(2);
    });

    it('should add exactly 3 coins when playing Gold', () => {
        const gold = createCardInstance('gold');
        state.players[0].hand.push(gold);

        const result = ActionResolver.resolve(state, state.players[0].id, {
            type: 'PLAY_CARD',
            cardInstanceId: gold.instanceId
        });
        if (result.success) state = result.state;

        expect(state.players[0].coins).toBe(3);
    });

    it('should handle sequential plays correctly', () => {
        const copper = createCardInstance('copper');
        const silver = createCardInstance('silver');
        state.players[0].hand.push(copper, silver);

        const result = ActionResolver.resolve(state, state.players[0].id, {
            type: 'PLAY_CARD',
            cardInstanceId: copper.instanceId
        });

        // Update state reference (ActionResolver returns new state)
        if (result.success) state = result.state;
        const result2 = ActionResolver.resolve(state, state.players[0].id, {
            type: 'PLAY_CARD',
            cardInstanceId: silver.instanceId
        });
        if (result2.success) state = result2.state;

        expect(state.players[0].coins).toBe(3); // 1 + 2 = 3
    });
});
