
import { EventBus, GameEvent } from './EventBus.js';
import { GameState, getCurrentPlayer } from './GameState.js';
import { TriggerEffectHandler } from './effects/TriggerEffectHandler.js';

/**
 * PhaseTriggerAdapter
 * 
 * Bridges the gap between the new EventBus-driven PhaseEngine and the 
 * legacy TriggerEffectHandler.
 * 
 * Listens for PHASE_ENTER events and dispatches legacy 'START_X_PHASE' triggers
 * to the EffectEngine.
 */
export class PhaseTriggerAdapter {
    static register(): void {
        EventBus.subscribe({
            id: 'legacy-phase-triggers',
            event: 'PHASE_ENTER',
            priority: 'NORMAL',
            handler: (state: GameState, event: GameEvent) => {
                const phaseId = event.context?.phaseId;
                if (!phaseId) return;

                const player = getCurrentPlayer(state);
                if (!player) return;

                // Map PHASE_ENTER(ID) -> START_ID_PHASE
                // e.g. BUY -> START_BUY_PHASE
                // e.g. TURN -> START_TURN_PHASE (if we need it)
                const triggerName = `START_${phaseId}_PHASE`;

                // Call legacy handler
                TriggerEffectHandler.handlePhaseTriggers(state, player, triggerName);
            }
        });
    }
}
