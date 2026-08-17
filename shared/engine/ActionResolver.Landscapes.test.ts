import { describe, it, expect } from 'vitest';
import { createGameState } from './GameState';
import { ActionResolver } from './ActionResolver';
import { createPlayerState } from './PlayerState';
import { LandscapeRegistry } from '../cards/landscapes/index';
import { alms } from '../cards/adventures/events';

describe('ActionResolver - Landscapes', () => {
    it('should resolve a buy landscape action (Event)', () => {
        // Register alms if not already there
        LandscapeRegistry.register(alms as any);

        const state = createGameState('test');
        const p1 = createPlayerState('p1', 'Player 1');
        p1.coins = 5;
        p1.buys = 1;
        state.players = [p1];
        state.phase = 'BUY';
        state.landscapes = ['alms'];

        const result = ActionResolver.resolve(state, 'p1', {
            type: 'BUY_LANDSCAPE',
            landscapeId: 'alms'
        } as any);

        expect(result.success).toBe(true);
        expect(result.state.players[0].buys).toBe(0);
        // Alms costs 0, so coins should still be 5
        expect(result.state.players[0].coins).toBe(5);
        // Verify effect was applied (Alms: if no treasure in play, gain card up to 4$)
        // In this test, no treasures in play, so it should have triggered a GAN_CARD or a pending decision
        expect(result.state.pendingDecision).toBeDefined();
        expect(result.state.pendingDecision?.message?.toLowerCase()).toContain('gagnez une carte');
    });

    it('should fail if not enough buys', () => {
        const state = createGameState('test');
        const p1 = createPlayerState('p1', 'Player 1');
        p1.coins = 5;
        p1.buys = 0;
        state.players = [p1];
        state.phase = 'BUY';
        state.landscapes = ['alms'];

        const result = ActionResolver.resolve(state, 'p1', {
            type: 'BUY_LANDSCAPE',
            landscapeId: 'alms'
        } as any);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
