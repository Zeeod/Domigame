/**
 * PhaseEngine - Dynamic Phase Management
 * 
 * Replaces hard-coded phase transitions with a configurable phase pipeline.
 * Extensions can register new phases (e.g., NIGHT, POSSESSION) without 
 * modifying the core engine.
 */

import { GameState, getCurrentPlayer } from './GameState.js';
import { Logger } from './Logger.js';
import { EventBus } from './EventBus.js';

// ============================================================================
// Phase Definition
// ============================================================================

export interface PhaseDefinition {
    /** Unique phase identifier (e.g., 'ACTION', 'BUY', 'NIGHT') */
    id: string;

    /** Display label (French) */
    label: string;

    /**
     * Guard: can we enter this phase?
     * Return false to skip this phase entirely.
     */
    canEnter: (state: GameState) => boolean;

    /**
     * Called when entering the phase.
     * Used for setup logic (e.g., trigger START_BUY_PHASE hooks).
     */
    onEnter?: (state: GameState) => void;

    /**
     * If true after entering, auto-advance to the next phase.
     * Used when, e.g., there are no Action cards to play.
     */
    autoSkip?: (state: GameState) => boolean;

    /**
     * Called when exiting the phase.
     * Used for teardown logic.
     */
    onExit?: (state: GameState) => void;
}

// ============================================================================
// Phase Engine
// ============================================================================

export class PhaseEngine {

    // Registry of all known phase definitions
    private static registry = new Map<string, PhaseDefinition>();

    // Default phase pipeline order
    private static defaultPipeline: string[] = ['ACTION', 'BUY', 'CLEANUP'];

    /**
     * Reset the PhaseEngine to its initial state.
     * Useful for tests to avoid shared state leakage.
     */
    static reset(): void {
        this.registry.clear();
        this.defaultPipeline = ['ACTION', 'BUY', 'CLEANUP'];
    }

    // ========================================================================
    // Registration API
    // ========================================================================

    /**
     * Register a phase definition. If a phase with the same ID already exists,
     * it will be overwritten (allows extensions to override behavior).
     */
    static register(phase: PhaseDefinition): void {
        this.registry.set(phase.id, phase);
    }

    /**
     * Get a registered phase definition by ID.
     */
    static get(phaseId: string): PhaseDefinition | undefined {
        return this.registry.get(phaseId);
    }

    /**
     * Check if a phase is registered.
     */
    static has(phaseId: string): boolean {
        return this.registry.has(phaseId);
    }

    // ========================================================================
    // Pipeline Management
    // ========================================================================

    /**
     * Set the default pipeline order.
     * Extensions call this to inject phases (e.g., NIGHT before CLEANUP).
     */
    static setDefaultPipeline(pipeline: string[]): void {
        this.defaultPipeline = [...pipeline];
    }

    /**
     * Get the default pipeline.
     */
    static getDefaultPipeline(): string[] {
        return [...this.defaultPipeline];
    }

    /**
     * Inject a phase into the default pipeline after a specific phase.
     * No-op if the phase is already in the pipeline.
     */
    static injectPhase(phaseId: string, afterPhaseId: string): void {
        if (this.defaultPipeline.includes(phaseId)) return;

        const idx = this.defaultPipeline.indexOf(afterPhaseId);
        if (idx === -1) {
            // If 'after' not found, append
            this.defaultPipeline.push(phaseId);
        } else {
            this.defaultPipeline.splice(idx + 1, 0, phaseId);
        }
    }

    /**
     * Initialize the phase pipeline for a new turn.
     * Copies the default pipeline into the game state.
     */
    static initTurnPipeline(state: GameState): void {
        state.phasePipeline = [...this.defaultPipeline];
        state.phaseIndex = 0;
    }

    /**
     * Inject a phase into the CURRENT turn's pipeline (one-shot).
     * Useful for effects like Possession that add phases mid-turn.
     */
    static injectPhaseForTurn(state: GameState, phaseId: string, afterPhaseId: string): void {
        if (!state.phasePipeline) return;
        if (state.phasePipeline.includes(phaseId)) return;

        const idx = state.phasePipeline.indexOf(afterPhaseId);
        if (idx === -1) {
            state.phasePipeline.push(phaseId);
        } else {
            state.phasePipeline.splice(idx + 1, 0, phaseId);
        }
    }

    // ========================================================================
    // Phase Transitions
    // ========================================================================

    /**
     * Advance to the next phase in the pipeline.
     * Skips phases whose canEnter() returns false.
     * Calls onExit() on the current phase and onEnter() on the new one.
     */
    static advancePhase(state: GameState): void {
        if (!state.phasePipeline || state.phasePipeline.length === 0) return;

        // Exit current phase
        const currentPhaseId = state.phasePipeline[state.phaseIndex];
        const currentPhaseDef = this.registry.get(currentPhaseId);

        EventBus.emit(state, {
            type: 'PHASE_EXIT',
            playerId: getCurrentPlayer(state)?.id || 'system',
            context: { phaseId: currentPhaseId }
        });

        if (currentPhaseDef?.onExit) {
            currentPhaseDef.onExit(state);
        }

        // Find next valid phase
        let nextIndex = state.phaseIndex + 1;
        while (nextIndex < state.phasePipeline.length) {
            const nextPhaseId = state.phasePipeline[nextIndex];
            const nextPhaseDef = this.registry.get(nextPhaseId);

            if (!nextPhaseDef || nextPhaseDef.canEnter(state)) {
                break; // Found a valid phase (or unregistered phase, which we allow through)
            }

            nextIndex++;
        }

        if (nextIndex >= state.phasePipeline.length) {
            // No more phases — pipeline exhausted, trigger cleanup/end-of-turn
            // This shouldn't normally happen because CLEANUP is the last phase
            // and always canEnter. But safety net:
            state.phase = 'CLEANUP';
            state.phaseIndex = state.phasePipeline.length - 1;
            return;
        }

        state.phaseIndex = nextIndex;
        const newPhaseId = state.phasePipeline[nextIndex];
        state.phase = newPhaseId as any;

        const newPhaseDef = this.registry.get(newPhaseId);

        // Log phase change
        const label = newPhaseDef?.label || `Phase ${newPhaseId}`;
        Logger.logEvent(state, {
            actionType: 'PHASE_CHANGE',
            payload: { choice: newPhaseId },
            message: `---- ${label} ----`
        });
        Logger.log(state, `---- ${label} ----`);

        // Enter new phase
        EventBus.emit(state, {
            type: 'PHASE_ENTER',
            playerId: getCurrentPlayer(state)?.id || 'system',
            context: { phaseId: newPhaseId }
        });

        if (newPhaseDef?.onEnter) {
            newPhaseDef.onEnter(state);
        }

        // Check auto-skip
        if (newPhaseDef?.autoSkip?.(state)) {
            this.advancePhase(state);
        }
    }

    /**
     * Get the current phase definition for the active turn.
     */
    static getCurrentPhase(state: GameState): PhaseDefinition | undefined {
        if (!state.phasePipeline) return undefined;
        const phaseId = state.phasePipeline[state.phaseIndex];
        return this.registry.get(phaseId);
    }

    /**
     * Check if the current phase should auto-advance (no playable cards).
     * Delegates to the phase's autoSkip function.
     */
    static checkAutoAdvance(state: GameState): void {
        if (state.pendingDecision) return;

        const phaseDef = this.getCurrentPhase(state);
        if (phaseDef?.autoSkip?.(state)) {
            this.advancePhase(state);
        }
    }
}

// ============================================================================
// Default Phase Definitions
// ============================================================================

// Default phases are registered in registerCorePhases.ts to avoid circular dependencies
