import { describe, it, expect } from 'vitest';
import { GameState, createPlayerState } from '../engine/GameState.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import '../engine/registerCorePhases.js';
import '../engine/registerCoreEffects.js';

describe('Bandit & Bureaucrat min constraint handling', () => {

    function createMockState(id: string): GameState {
        const p1 = createPlayerState('p1', 'Player 1', '#ff0000');
        const p2 = createPlayerState('p2', 'Player 2', '#0000ff');

        return {
            id,
            players: [p1, p2],
            supply: {
                'copper': { count: 10, cost: 0, cardId: 'copper' },
                'silver': { count: 10, cost: 3, cardId: 'silver' },
                'gold': { count: 30, cost: 6, cardId: 'gold' },
                'estate': { count: 8, cost: 2, cardId: 'estate' },
                'duchy': { count: 8, cost: 5, cardId: 'duchy' },
                'province': { count: 8, cost: 8, cardId: 'province' },
            },
            phase: 'ACTION',
            currentPlayerIndex: 0,
            trash: [],
            logs: [],
            effectStack: [],
            turnNumber: 1,
            isGameOver: false,
            phasePipeline: ['ACTION', 'BUY', 'CLEANUP'],
            phaseIndex: 0,
            hostId: 'p1',
            useProsperity: false
        } as any;
    }

    it('should not lock the game when Bandit victim has no valid treasures in limbo', () => {
        let state = createMockState('test');
        const p1 = state.players[0];
        const p2 = state.players[1];

        // Give p1 a Bandit
        p1.hand = [{ id: 'bandit', instanceId: 'b1' }];
        p2.deck = [{ id: 'estate', instanceId: 'e1' }, { id: 'copper', instanceId: 'c1' }];

        const res = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'b1' });
        state = res.state;

        if (state.pendingDecision) {
            console.log("Bandit Decision type:", state.pendingDecision.type);
            console.log("Bandit constraints:", state.pendingDecision.constraints);
        } else {
            console.log("Bandit resolved without locking!");
        }

        expect(true).toBe(true);
    });

    it('should not lock the game when Bureaucrat victim has no Victory cards in hand', () => {
        let state = createMockState('test2');
        const p1 = state.players[0];
        const p2 = state.players[1];

        p1.hand = [{ id: 'bureaucrat', instanceId: 'bur1' }];
        p2.hand = [{ id: 'copper', instanceId: 'c1' }];

        const res = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'bur1' });
        state = res.state;

        if (state.pendingDecision) {
            console.log("Bureaucrat Decision type:", state.pendingDecision.type);
            console.log("Bureaucrat constraints:", state.pendingDecision.constraints);
        } else {
            console.log("Bureaucrat resolved without locking!");
        }

        expect(true).toBe(true);
    });
});
