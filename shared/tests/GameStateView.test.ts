
import { describe, it, expect } from 'vitest';
import { createGameState, PlayerState } from '../engine/GameState.js';
import { GameStateView } from '../engine/GameStateView.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { createPlayerState } from '../engine/PlayerState.js';

describe('GameStateView', () => {
    it('should mask opponent hand but keep count and instanceIds', () => {
        const state = createGameState('test-game');

        const p1 = createPlayerState('p1', 'Player 1', '#ff0000');
        p1.hand = [createCardInstance('copper'), createCardInstance('silver')];

        const p2 = createPlayerState('p2', 'Player 2', '#00ff00');
        p2.hand = [createCardInstance('gold')];

        state.players = [p1, p2];

        // View from P1 perspective
        const viewP1 = GameStateView.createPlayerView(state, 'p1');

        // P1 should see their own cards
        expect(viewP1.players[0].hand[0].id).toBe('copper');
        expect(viewP1.players[0].hand[1].id).toBe('silver');

        // P1 should NOT see P2's cards
        expect(viewP1.players[1].hand[0].id).toBe('back');
        expect(viewP1.players[1].hand.length).toBe(1);
        // But instanceId should be preserved for stability
        expect(viewP1.players[1].hand[0].instanceId).toBe(p2.hand[0].instanceId);
    });

    it('should mask deck order even for the owner', () => {
        const state = createGameState('test-game');
        const p1 = createPlayerState('p1', 'Player 1', '#ff0000');
        p1.deck = [createCardInstance('copper'), createCardInstance('estate')];
        state.players = [p1];

        const view = GameStateView.createPlayerView(state, 'p1');

        // Deck cards should be masked to 'back'
        expect(view.players[0].deck[0].id).toBe('back');
        expect(view.players[0].deck[1].id).toBe('back');
    });

    it('should remove sensitive global data like rng', () => {
        const state = createGameState('test-game');
        // @ts-ignore
        state.rng = { seed: 'secret', state: 123, callCount: 5 };

        const view = GameStateView.createPlayerView(state, 'p1');

        // @ts-ignore
        expect(view.rng).toBeUndefined();
    });

    it('should mask Native Village mat for non-owners', () => {
        const state = createGameState('test-game');
        const p1 = createPlayerState('p1', 'Player 1', '#ff0000');
        p1.nativeVillageMat = [createCardInstance('gold')];

        const p2 = createPlayerState('p2', 'Player 2', '#00ff00');

        state.players = [p1, p2];

        // View from P2 perspective
        const viewP2 = GameStateView.createPlayerView(state, 'p2');

        expect(viewP2.players[0].nativeVillageMat?.[0].id).toBe('back');

        // View from P1 perspective
        const viewP1 = GameStateView.createPlayerView(state, 'p1');
        expect(viewP1.players[0].nativeVillageMat?.[0].id).toBe('gold');
    });
});
