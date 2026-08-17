/**
 * EffectHandlerRegistry - Dynamic Effect Handler Registration
 * 
 * Replaces the monolithic switch/case in EffectEngine.applyEffect with
 * a registry pattern. Extensions register their own effect handlers at
 * load time without modifying core engine code.
 */

import { GameState, PlayerState, EffectResult } from './GameState.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Context passed to every effect handler.
 */
export interface EffectContext {
    sourceCardInstanceId?: string;
    suppressLog?: boolean;
    attackerId?: string;
    boughtCardId?: string;
    boughtCost?: number;
    isAttack?: boolean;
    [key: string]: any;
}

/**
 * Signature for an effect handler function.
 * Receives the game state, the acting player, the effect data, and context.
 * Returns the (possibly mutated) state and whether user input is needed.
 */
export type EffectHandler = (
    state: GameState,
    player: PlayerState,
    effect: any,
    context: EffectContext
) => EffectResult;

// ============================================================================
// Registry
// ============================================================================

export class EffectHandlerRegistry {

    private static handlers = new Map<string, EffectHandler>();

    // ========================================================================
    // Registration API
    // ========================================================================

    /**
     * Register a handler for an effect type.
     * Overwrites any existing handler for that type (allows extension overrides).
     */
    static register(effectType: string, handler: EffectHandler): void {
        this.handlers.set(effectType, handler);
    }

    /**
     * Register multiple handlers at once.
     */
    static registerAll(entries: { type: string; handler: EffectHandler }[]): void {
        for (const entry of entries) {
            this.handlers.set(entry.type, entry.handler);
        }
    }

    // ========================================================================
    // Resolution API
    // ========================================================================

    /**
     * Resolve an effect by looking up its handler in the registry and executing it.
     * Returns undefined if no handler is found (caller should handle gracefully).
     */
    static resolve(
        state: GameState,
        player: PlayerState,
        effect: any,
        context: EffectContext
    ): EffectResult | undefined {
        const handler = this.handlers.get(effect.type);
        if (!handler) {
            console.log(`[EffectHandlerRegistry] NO HANDLER for ${effect.type}. Registered: ${Array.from(this.handlers.keys()).join(', ')}`);
            return undefined;
        }
        console.log(`[EffectHandlerRegistry] Resolving ${effect.type}`);
        return handler(state, player, effect, context);
    }

    /**
     * Check if a handler is registered for the given effect type.
     */
    static has(effectType: string): boolean {
        return this.handlers.has(effectType);
    }

    /**
     * Get the handler for a specific effect type.
     */
    static get(effectType: string): EffectHandler | undefined {
        return this.handlers.get(effectType);
    }

    /**
     * Get all registered effect type names (useful for debugging).
     */
    static getRegisteredTypes(): string[] {
        return Array.from(this.handlers.keys());
    }

    // ========================================================================
    // Reset (for tests)
    // ========================================================================

    /**
     * Clear all registrations. Used in tests.
     */
    static reset(): void {
        this.handlers.clear();
    }
}
