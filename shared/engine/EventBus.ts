/**
 * EventBus - Global Hook System
 * 
 * A publish/subscribe event system allowing cards, landscapes, and prophecies
 * to intercept any game event. Supports:
 * - PRE_ hooks that can cancel events
 * - Priority ordering (EARLY → NORMAL → LATE)
 * - Once-only hooks that auto-unsubscribe
 * - Source-card-aware hooks
 */

import { GameState } from './GameState.js';

// ============================================================================
// Event Types
// ============================================================================

export type GameEventType =
    | 'PRE_PLAY' | 'POST_PLAY'
    | 'PRE_BUY' | 'POST_BUY'
    | 'PRE_GAIN' | 'POST_GAIN'
    | 'PRE_TRASH' | 'POST_TRASH'
    | 'PRE_DISCARD' | 'POST_DISCARD'
    | 'TURN_START' | 'TURN_END'
    | 'PHASE_ENTER' | 'PHASE_EXIT'
    | 'CLEANUP_START' | 'CLEANUP_END'
    | 'ATTACK_DECLARED'
    | 'PROPHECY_CHECK'
    | (string & {}); // Extensible for custom event types

export interface GameEvent {
    /** Event type */
    type: GameEventType;

    /** Player who triggered the event */
    playerId: string;

    /** Card definition ID involved */
    cardId?: string;

    /** Card instance ID involved */
    cardInstanceId?: string;

    /** If true, the action was cancelled by a PRE_ hook */
    cancelled?: boolean;

    /** Arbitrary context data for the event */
    context?: Record<string, any>;
}

// ============================================================================
// Hook Registration
// ============================================================================

export type HookPriority = 'EARLY' | 'NORMAL' | 'LATE';

const PRIORITY_ORDER: Record<HookPriority, number> = {
    'EARLY': 0,
    'NORMAL': 1,
    'LATE': 2
};

export interface HookRegistration {
    /** Unique identifier for this hook */
    id: string;

    /** Which event to listen to */
    event: GameEventType;

    /** Execution priority */
    priority: HookPriority;

    /** The card that registered this hook (for auto-cleanup) */
    sourceCardId?: string;

    /** The card instance that registered this hook */
    sourceCardInstanceId?: string;

    /** The player who owns this hook */
    sourcePlayerId?: string;

    /** The handler function */
    handler: (state: GameState, event: GameEvent) => void;

    /** If true, remove after first trigger */
    once?: boolean;
}

// ============================================================================
// Event Bus
// ============================================================================

export class EventBus {
    private static hooks: HookRegistration[] = [];

    // ========================================================================
    // Registration API
    // ========================================================================

    /**
     * Subscribe a hook to an event type.
     */
    static subscribe(hook: HookRegistration): void {
        this.hooks.push(hook);
    }

    /**
     * Subscribe multiple hooks at once.
     */
    static subscribeAll(hooks: HookRegistration[]): void {
        this.hooks.push(...hooks);
    }

    /**
     * Unsubscribe a hook by its ID.
     */
    static unsubscribe(hookId: string): void {
        this.hooks = this.hooks.filter(h => h.id !== hookId);
    }

    /**
     * Unsubscribe all hooks from a specific source card instance.
     * Used during cleanup when a card leaves play.
     */
    static unsubscribeBySource(sourceCardInstanceId: string): void {
        this.hooks = this.hooks.filter(h => h.sourceCardInstanceId !== sourceCardInstanceId);
    }

    /**
     * Unsubscribe all hooks owned by a specific player.
     */
    static unsubscribeByPlayer(playerId: string): void {
        this.hooks = this.hooks.filter(h => h.sourcePlayerId !== playerId);
    }

    // ========================================================================
    // Emission API
    // ========================================================================

    /**
     * Emit an event. All matching hooks are called in priority order.
     * For PRE_ events, hooks can set event.cancelled = true to prevent the action.
     * Returns the event (potentially with cancelled=true).
     */
    static emit(state: GameState, event: GameEvent): GameEvent {
        const matching = this.hooks
            .filter(h => h.event === event.type)
            .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

        const toRemove: string[] = [];

        for (const hook of matching) {
            // Don't run further hooks if the event was cancelled
            if (event.cancelled) break;

            hook.handler(state, event);

            if (hook.once) {
                toRemove.push(hook.id);
            }
        }

        // Remove once-only hooks after emission
        if (toRemove.length > 0) {
            this.hooks = this.hooks.filter(h => !toRemove.includes(h.id));
        }

        return event;
    }

    // ========================================================================
    // Query API
    // ========================================================================

    /**
     * Get all hooks for a specific event type (for debugging).
     */
    static getHooksForEvent(eventType: GameEventType): HookRegistration[] {
        return this.hooks.filter(h => h.event === eventType);
    }

    /**
     * Get the total number of registered hooks (for debugging).
     */
    static getHookCount(): number {
        return this.hooks.length;
    }

    // ========================================================================
    // Reset
    // ========================================================================

    /**
     * Clear all hooks. Used for new game or tests.
     */
    static reset(): void {
        this.hooks = [];
    }
}
