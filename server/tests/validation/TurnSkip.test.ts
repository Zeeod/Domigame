
import { describe, expect, it, vi } from 'vitest';
import { TestEngine } from './TestUtils.js';
import { ActionResolver } from '../../../shared/engine/ActionResolver.js';
import { TurnMachine } from '../../../shared/engine/TurnMachine.js';
import { PhaseEngine } from '../../../shared/engine/PhaseEngine.js';

describe('Turn Skip Regression', () => {
    it('should NOT skip the turn even if player has no action cards initially', () => {
        const engine = new TestEngine();

        // Setup P1 with only Coppers and Estates (no Actions)
        engine.setHand('Player1', ['copper', 'copper', 'copper', 'estate', 'estate']);

        const state = engine.state;

        // Start the game
        ActionResolver.startGame(state);

        // Initially in ACTION phase because startGame doesn't call checkAutoEndActionPhase
        expect(state.phase).toBe('ACTION');
        expect(state.currentPlayerIndex).toBe(0);

        // Now trigger auto-advance
        TurnMachine.checkAutoEndActionPhase(state);

        // It should move to BUY phase
        expect(state.phase).toBe('BUY');
        expect(state.currentPlayerIndex).toBe(0); // Important: P1 should still be current player
    });

    it('should NOT skip past BUY phase during turn start auto-advance', () => {
        const engine = new TestEngine();

        // Setup P1 with no Actions, P2 with no Actions
        engine.setHand('Player1', ['copper', 'copper', 'copper', 'estate', 'estate']);
        engine.setHand('Player2', ['copper', 'copper', 'copper', 'estate', 'estate']);

        const state = engine.state;

        // Manually start turn 1
        PhaseEngine.initTurnPipeline(state);
        state.phase = 'ACTION';
        state.currentPlayerIndex = 0;

        // Trigger auto-advance (simulating TurnMachine.startNextTurn behavior)
        TurnMachine.checkAutoEndActionPhase(state);

        expect(state.phase).toBe('BUY');
        expect(state.currentPlayerIndex).toBe(0);
    });
});
