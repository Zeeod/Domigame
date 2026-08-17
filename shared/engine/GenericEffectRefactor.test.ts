
import { describe, it, expect } from 'vitest';
import { GameState, createGameState } from './GameState.js';
import { PlayerState, createPlayerState, resetTurnResources } from './PlayerState.js';
import { ActionResolver } from './ActionResolver.js';
import { GameLogStore } from './GameLogStore.js';

function setupState(): GameState {
    const id = 'test-game-' + Math.random();
    GameLogStore.init(id);
    const state = createGameState(id);
    const p1 = createPlayerState('p1', 'Player 1');
    resetTurnResources(p1);
    state.players = [p1];
    state.currentPlayerIndex = 0;
    state.phase = 'ACTION';

    state.supply = {
        'copper': { cardId: 'copper', count: 60, cards: [] },
        'village': { cardId: 'village', count: 10, cards: [] },
    } as any;

    return state;
}

describe('Generic Effect Refactor Verification', () => {

    it('Vassal: Should reveal top card and offer to play if Action', () => {
        let state = setupState();
        const p1 = state.players[0];

        p1.hand = [{ id: 'vassal', instanceId: 'v1' }] as any;
        p1.deck = [{ id: 'village', instanceId: 'v2' }] as any;

        const res = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'v1' });
        state = res.state;

        expect(state.players[0].coins).toBe(2);
        expect(state.players[0].limbo.length).toBe(1);
        expect(state.pendingDecision).toBeDefined();
        expect(state.pendingDecision?.type).toBe('CHOOSE_FROM_ZONE');
    });

    it('Patrol: Should put Victory/Curse in hand and reorder others', () => {
        let state = setupState();
        const p1 = state.players[0];

        p1.hand = [{ id: 'patrol', instanceId: 'p1' }] as any;
        p1.deck = [
            { id: 'copper', instanceId: 'd1' },
            { id: 'estate', instanceId: 'd2' },
            { id: 'silver', instanceId: 'd3' },
            { id: 'gold', instanceId: 'd4' }
        ] as any;

        const res = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'p1' });
        state = res.state;

        // Estate should be in hand (plus one card drawn from effects?)
        // Patrol: +3 Cards. Reveal 4...
        // Wait, Patrol is +3 cards first.
        const handIds = state.players[0].hand.map((c: any) => c.id);
        expect(handIds).toContain('gold');
        expect(handIds).toContain('silver');
        expect(handIds).toContain('copper');
        expect(handIds).toContain('estate');

        expect(state.pendingDecision?.type).toBe('REORDER');
    });

    it('Golem: Should reveal until 2 non-Golem actions and play them', () => {
        let state = setupState();
        const p1 = state.players[0];

        p1.hand = [{ id: 'golem', instanceId: 'g1' }] as any;
        p1.deck = [
            { id: 'copper', instanceId: 'd1' },
            { id: 'village', instanceId: 'v1' },
            { id: 'smithy', instanceId: 's1' },
            { id: 'silver', instanceId: 'd2' }
        ] as any;

        const res = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'g1' });
        state = res.state;

        // Smithy and Village should have been played (or Smithy played, Village next)
        // If Smithy played first (drawn cards), or Golem plays both.
        // Golem: Reveal until 2 actions. Village (1), Copper (skip), Smithy (2).
        // It plays both.
        expect(state.players[0].playArea.map((c: any) => c.id)).toContain('village');
        expect(state.players[0].playArea.map((c: any) => c.id)).toContain('smithy');
    });
});
