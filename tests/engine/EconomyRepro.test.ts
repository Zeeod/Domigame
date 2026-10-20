
import { test, expect } from 'vitest';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

test('repro correct', () => {
    console.log('Creating state');
    const state = createGameState('test-seed');
    state.players.push(createPlayerState('P1', 'Player 1'));
    state.players.push(createPlayerState('P2', 'Player 2'));

    state.phase = 'BUY'; // Critical
    state.players[0].hand = [createCardInstance('copper')];
    state.players[0].actions = 1;
    state.players[0].coins = 0;
    state.players[0].playArea = [];

    console.log('Resolving...');
    const result = ActionResolver.resolve(state, state.players[0].id, {
        type: 'PLAY_CARD',
        cardInstanceId: state.players[0].hand[0].instanceId
    });
    console.log('Resolved!', result.success);
    expect(state.players[0].coins).toBe(1); // Coins logic might need ActionResolver internal update?
    // ActionResolver updates passed state clone? No, ActionResolver returns NEW STATE (lines 40, 155).
    // And mutate check?
    // Line 38: ActionResolver.resolve(state...)
    // Line 40: const newState = cloneGameState(state);
    // It returns newState!
    // So assertions on `state` will FAIL if ActionResolver doesn't mutate input.
    // Wait, `ActionResolver` DOES NOT mutate input state?
    // Line 40: `const newState = cloneGameState(state);`
    // Line 155: `return { success: true, state: state };` (Wait, line 155 uses `state` variable which is `newState`?)
    // Let's check `ActionResolver.ts` content again.
});
