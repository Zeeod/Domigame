import { test, expect } from 'vitest';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

test('playing a Copper in the Buy phase gives +1 coin', () => {
    const state = createGameState('test-seed');
    state.players.push(createPlayerState('P1', 'Player 1'));
    state.players.push(createPlayerState('P2', 'Player 2'));

    state.phase = 'BUY';
    state.players[0].hand = [createCardInstance('copper')];
    state.players[0].actions = 1;
    state.players[0].coins = 0;
    state.players[0].playArea = [];

    const result = ActionResolver.resolve(state, state.players[0].id, {
        type: 'PLAY_CARD',
        cardInstanceId: state.players[0].hand[0].instanceId
    });

    // ActionResolver returns a new state (Immer): read the result, not the input
    expect(result.success).toBe(true);
    expect(result.state.players[0].coins).toBe(1);
    expect(result.state.players[0].playArea.map(c => c.id)).toEqual(['copper']);
});
