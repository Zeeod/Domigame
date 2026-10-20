
import { describe, it, expect } from 'vitest';
import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { PlayerState, createPlayerState, resetTurnResources } from '../../shared/engine/PlayerState.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { GameLogStore } from '../../shared/engine/GameLogStore.js';

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

    it('Vassal: discards the top card and offers to play it if it is an Action', () => {
        let state = setupState();
        const p1 = state.players[0];

        p1.hand = [{ id: 'vassal', instanceId: 'v1' }] as any;
        p1.deck = [{ id: 'village', instanceId: 'v2' }, { id: 'copper', instanceId: 'c1' }] as any;

        state = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'v1' }).state;

        expect(state.players[0].coins).toBe(2);
        expect(state.pendingDecision?.playerId).toBe('p1');
        expect((state.pendingDecision as any)?.context?.specialAction).toBe('VASSAL_PLAY');

        // Play the Village
        state = ActionResolver.resolve(state, 'p1', {
            type: 'CHOOSE', choiceId: state.pendingDecision!.id,
            payload: { type: 'CARDS', cardInstanceIds: ['v2'] }
        } as any).state;

        const pl = state.players[0];
        expect(pl.playArea.map((c: any) => c.id)).toEqual(['vassal', 'village']);
        expect(pl.actions).toBe(2);              // 1 - 1 (Vassal) + 2 (Village)
        expect(pl.hand.map((c: any) => c.id)).toEqual(['copper']); // Village's +1 Card
    });

    it('Patrol: +3 Cards, Victory/Curse among the next 4 go to hand, the rest is reordered', () => {
        let state = setupState();
        const p1 = state.players[0];

        p1.hand = [{ id: 'patrol', instanceId: 'p1' }] as any;
        p1.deck = [
            { id: 'copper', instanceId: 'd1' }, { id: 'estate', instanceId: 'd2' }, { id: 'silver', instanceId: 'd3' }, // drawn
            { id: 'gold', instanceId: 'd4' }, { id: 'duchy', instanceId: 'd5' },                                     // revealed…
            { id: 'curse', instanceId: 'd6' }, { id: 'copper', instanceId: 'd7' },
            { id: 'village', instanceId: 'd8' }                                                                       // untouched
        ] as any;

        state = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'p1' }).state;

        const handIds = state.players[0].hand.map((c: any) => c.id).sort();
        expect(handIds).toEqual(['copper', 'curse', 'duchy', 'estate', 'silver']);

        // Gold and Copper go back on top in the chosen order
        expect(state.pendingDecision?.type).toBe('REORDER');
        state = ActionResolver.resolve(state, 'p1', {
            type: 'CHOOSE', choiceId: state.pendingDecision!.id,
            payload: { cardInstanceIds: ['d7', 'd4'] }
        } as any).state;
        expect(state.players[0].deck.map((c: any) => c.id)).toEqual(['copper', 'gold', 'village']);
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
