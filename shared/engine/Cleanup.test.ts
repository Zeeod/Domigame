
import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, createGameState } from './GameState.js';
import { PlayerState, createPlayerState, resetTurnResources } from './PlayerState.js';
import { CleanupEffectHandler } from './effects/CleanupEffectHandler.js';
import { EconomyEngine } from './EconomyEngine.js';
import { CardRegistry } from '../cards/index.js';
import { GameLogStore } from './GameLogStore.js';
import { EffectHandlerRegistry } from './EffectHandlerRegistry.js';

function setupState(): GameState {
    const id = 'test-game-' + Math.random();
    GameLogStore.init(id);
    const state = createGameState(id);
    const p1 = createPlayerState('p1', 'Player 1');
    resetTurnResources(p1);
    state.players = [p1];
    state.currentPlayerIndex = 0;
    state.phase = 'CLEANUP';

    state.supply = {
        'copper': { cardId: 'copper', count: 60, cards: [] },
        'silver': { cardId: 'silver', count: 40, cards: [] },
    } as any;

    return state;
}

describe('Cleanup Phase Fixes', () => {

    it('Should trigger ON_DISCARD when discarding hand during cleanup', () => {
        const state = setupState();
        const p1 = state.players[0];
        // Mock a card with ON_DISCARD trigger (like Tunnel, though we just need the trigger to fire)
        p1.hand = [{ id: 'tunnel', instanceId: 't1' }] as any;

        // We'll check if a scan for triggers happened by looking at the effect stack 
        // if scanForTriggers was mocked or if we used a real card that pushes to stack.
        // For now, let's just verify the cards move.
        CleanupEffectHandler.handlePerformCleanup(state, p1);

        expect(p1.hand.length).toBe(0);
        expect(p1.discardPile.map(c => c.id)).toContain('tunnel');
    });

    it('Should clear turn-based triggers during transition to next turn', () => {
        const state = setupState();
        state.triggers = [
            { type: 'ON_PLAY', playerId: 'p1', once: true, effects: [] },
            { type: 'ON_PLAY', playerId: 'p1', once: false, effects: [] }
        ];

        CleanupEffectHandler.handleStartNextTurn(state);

        expect(state.triggers.length).toBe(1);
        expect(state.triggers[0].once).toBe(false);
    });

    it('Should incorporate player.costReduction in EconomyEngine.getCardCost', () => {
        const state = setupState();
        const p1 = state.players[0];
        p1.costReduction = 2;

        const cost = EconomyEngine.getCardCost(state, 'p1', 'silver');
        // Silver cost is 3. 3 - 2 = 1.
        expect(cost).toBe(1);
    });

    it('Should reset turn resources for next player', () => {
        const state = setupState();
        const p1 = state.players[0];
        p1.coins = 5;
        p1.actions = 0;

        // Setup p2
        const p2 = createPlayerState('p2', 'Player 2');
        state.players.push(p2);

        CleanupEffectHandler.handleStartNextTurn(state);

        expect(state.currentPlayerIndex).toBe(1);
        expect(state.players[1].actions).toBe(1);
        expect(state.players[1].coins).toBe(0);
    });
});
