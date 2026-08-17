import { GameState } from './GameState.js';
import { PhaseEngine } from './PhaseEngine.js';

export class TurnMachine {
    /**
     * Advance logic based on current state
     * Returns true if state changed
     */
    static autoAdvance(_state: GameState): boolean {
        // Only host/server logic should call this
        return false;
    }

    static advancePhase(state: GameState): void {
        PhaseEngine.advancePhase(state);
    }

    static endActionPhase(state: GameState): void {
        PhaseEngine.advancePhase(state);
    }

    /**
     * Automatically transition to next phase if no Action cards in hand
     */
    static checkAutoEndActionPhase(state: GameState): void {
        PhaseEngine.checkAutoAdvance(state);
    }

    static endBuyPhase(state: GameState): void {
        PhaseEngine.advancePhase(state);
    }

    static maybeTransitionToNight(state: GameState): void {
        PhaseEngine.advancePhase(state);
    }

    static endBuyPhaseToNight(state: GameState): void {
        PhaseEngine.advancePhase(state);
    }

    static checkAutoEndNightPhase(state: GameState): void {
        PhaseEngine.checkAutoAdvance(state);
    }

    static endNightPhase(state: GameState): void {
        PhaseEngine.advancePhase(state);
    }

    static finalizeCleanup(state: GameState): void {
        PhaseEngine.advancePhase(state);
    }
}



