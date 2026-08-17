import { describe, it, expect } from 'vitest';
import { GameState, createPlayerState } from '../engine/GameState.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import { CardRegistry } from '../cards/index.js';
import '../engine/registerCorePhases.js';
import '../engine/registerCoreEffects.js';
import { PhaseEngine } from '../engine/PhaseEngine.js';
import { TurnMachine } from '../engine/TurnMachine.js';

describe('Turn Skipping Reproduction', () => {
    it('should NOT skip a human player who has 0 actions but 1 buy', () => {
        const p1 = createPlayerState('human', 'Human', '#ff0000');
        p1.isBot = false;

        // Initial hand: 5 coppers (0 actions)
        p1.hand = [
            { id: 'copper', instanceId: 'c1' },
            { id: 'copper', instanceId: 'c2' },
            { id: 'copper', instanceId: 'c3' },
            { id: 'copper', instanceId: 'c4' },
            { id: 'copper', instanceId: 'c5' },
        ];

        let state: GameState = {
            id: 'test',
            players: [p1],
            supply: {
                'copper': { cardId: 'copper', count: 40, cards: [] },
                'estate': { cardId: 'estate', count: 8, cards: [] },
            },
            phase: 'PREGAME',
            currentPlayerIndex: 0,
            trash: [],
            logs: [],
            effectStack: [],
            turnNumber: 0,
            isGameOver: false,
            phasePipeline: ['ACTION', 'BUY', 'CLEANUP'],
            phaseIndex: 0,
            landscapeState: {},
            revealedCards: null,
            pendingDecision: null,
        } as any;

        // Initialize turn
        PhaseEngine.initTurnPipeline(state);
        state.phase = 'ACTION';
        state.turnNumber = 1;

        const nextPlayer = state.players[0];
        nextPlayer.actions = 1;
        nextPlayer.buys = 1;
        nextPlayer.coins = 0;

        console.log(`[Test] Starting turn for ${nextPlayer.name}. Phase: ${state.phase}`);

        // This is what TurnMachine.startNextTurn does:
        TurnMachine.checkAutoEndActionPhase(state);

        console.log(`[Test] After checkAutoEndActionPhase. Phase: ${state.phase}`);

        // EXPECTATION: Should be in BUY phase, NOT CLEANUP
        expect(state.phase).toBe('BUY');
    });

    it('should skip correctly if NO phases are valid (unlikely)', () => {
        // ...
    });
});
