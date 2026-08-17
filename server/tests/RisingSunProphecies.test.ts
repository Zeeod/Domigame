import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { kind_emperor, biding_time } from '../../shared/cards/rising_sun/prophecies.js';
import { kitsune, mountain_shrine } from '../../shared/cards/rising_sun/kingdom.js';

describe('Rising Sun Expansion - Prophecies & Omen', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test-seed');
        state.players = [
            { id: 'player1', name: 'Player 1', hand: [], deck: [], discard: [], pazaak: [], playArea: [], aside: [], durationCards: [], victoryTokens: 0, coffers: 0, villagers: 0, favors: 0, debt: 0, totalCards: 0 } as any,
            { id: 'player2', name: 'Player 2', hand: [], deck: [], discard: [], pazaak: [], playArea: [], aside: [], durationCards: [], victoryTokens: 0, coffers: 0, villagers: 0, favors: 0, debt: 0, totalCards: 0 } as any
        ];
    });

    it('should remove a Sun token when an Omen card is played', () => {
        // Setup a prophecy
        state.activeProphecyId = 'kind_emperor';
        state.landscapeState['kind_emperor'] = { tokens: { sun: 5 }, state: null };

        const player1 = state.players[0];
        const kitsuneInstanceId = 'kitsune-1';
        player1.hand.push({ id: 'kitsune', instanceId: kitsuneInstanceId } as any);

        // Apply effects of kitsune (Omen)
        EffectEngine.applyEffects(state, player1.id, kitsune.effects as any, false, kitsuneInstanceId);

        // Check if a sun token was removed
        expect(state.landscapeState['kind_emperor'].tokens['sun']).toBe(4);
    });

    it('should fulfill prophecy when tokens reach zero', () => {
        // Setup a prophecy near fulfillment
        state.activeProphecyId = 'biding_time';
        state.landscapeState['biding_time'] = { tokens: { sun: 1 }, state: null };

        const player1 = state.players[0];
        const kitsuneInstanceId = 'kitsune-2';
        player1.hand.push({ id: 'kitsune', instanceId: kitsuneInstanceId } as any);

        // Apply effects
        EffectEngine.applyEffects(state, player1.id, kitsune.effects as any, false, kitsuneInstanceId);

        // Process effects to trigger fulfillment
        EffectEngine.processStack(state);

        // Check if prophecy is fulfilled
        expect(state.landscapeState['biding_time'].tokens['sun']).toBe(0);
    });
});
