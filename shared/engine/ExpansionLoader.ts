/**
 * ExpansionLoader - Extension Registration System
 * 
 * Each expansion registers its unique mechanics at game start time:
 * - Custom phases (NIGHT, POSSESSION)
 * - New effect handlers
 * - Event hooks (global triggers)
 * - Cost modifiers
 * - Custom zones/mats
 * 
 * This allows adding any expansion by loading a module,
 * without modifying the core engine.
 */

import { PhaseEngine, PhaseDefinition } from './PhaseEngine.js';
import { EffectHandlerRegistry, EffectHandler } from './EffectHandlerRegistry.js';
import { EventBus, HookRegistration } from './EventBus.js';
import { EconomyEngine, CostModifier } from './EconomyEngine.js';
import { LandscapeRegistry } from '../cards/landscapes/index.js';

// ============================================================================
// Expansion Module Definition
// ============================================================================

export interface ExpansionModule {
    /** Unique expansion identifier (e.g., 'nocturne', 'seaside', 'rising_sun') */
    id: string;

    /** Display name */
    name?: string;

    /** Optional cards list */
    cards?: any[];

    /** Optional landscapes list */
    landscapes?: any[];

    /** Custom phases to register */
    phases?: PhaseDefinition[];

    /** Phase pipeline modifications (inject after existing phases) */
    phaseInjections?: { phaseId: string; afterPhaseId: string }[];

    /** Custom effect handlers */
    effectHandlers?: { type: string; handler: EffectHandler }[];

    /** Global event hooks */
    eventHooks?: HookRegistration[];

    /** Cost modifiers */
    costModifiers?: { id: string; modifier: CostModifier; priority?: number }[];

    /** Custom zone/mat names this expansion introduces */
    zones?: string[];

    /** Initialization function called after all registrations */
    onLoad?: () => void;
}

// ============================================================================
// Expansion Loader
// ============================================================================

export class ExpansionLoader {

    private static loadedModules = new Set<string>();

    // ========================================================================
    // Load API
    // ========================================================================

    /**
     * Load an expansion module, registering all its components.
     * No-op if already loaded.
     */
    static load(module: ExpansionModule): void {
        if (this.loadedModules.has(module.id)) return;

        // Register phases
        if (module.phases) {
            for (const phase of module.phases) {
                PhaseEngine.register(phase);
            }
        }

        // Inject phases into the default pipeline
        if (module.phaseInjections) {
            for (const injection of module.phaseInjections) {
                PhaseEngine.injectPhase(injection.phaseId, injection.afterPhaseId);
            }
        }

        // Register effect handlers
        if (module.effectHandlers) {
            EffectHandlerRegistry.registerAll(module.effectHandlers);
        }

        // Register event hooks
        if (module.eventHooks) {
            EventBus.subscribeAll(module.eventHooks);
        }

        // Register cost modifiers
        if (module.costModifiers) {
            for (const mod of module.costModifiers) {
                EconomyEngine.registerModifier(mod.id, mod.modifier, mod.priority);
            }
        }

        // Run custom initialization
        if (module.onLoad) {
            module.onLoad();
        }

        this.loadedModules.add(module.id);
    }

    /**
     * Unload an expansion module (removes registrations).
     * Note: This is a best-effort operation — hooks and handlers
     * registered by the expansion should use the expansion id as prefix.
     */
    static unload(moduleId: string): void {
        this.loadedModules.delete(moduleId);
        // Individual cleanup would need hook/handler IDs prefixed with module ID
        // This is handled by convention: use `${moduleId}:` prefix for all registration IDs
    }

    // ========================================================================
    // Query API
    // ========================================================================

    /**
     * Check if an expansion is loaded.
     */
    static isLoaded(moduleId: string): boolean {
        return this.loadedModules.has(moduleId);
    }

    /**
     * Get all loaded expansion IDs.
     */
    static getLoaded(): string[] {
        return Array.from(this.loadedModules);
    }

    // ========================================================================
    // Reset
    // ========================================================================

    /**
     * Clear all loaded modules. Used for new game or tests.
     */
    static reset(): void {
        this.loadedModules.clear();
        PhaseEngine.reset();
        LandscapeRegistry.reset();
        EffectHandlerRegistry.reset();
        EventBus.reset();
        EconomyEngine.reset();
    }
}
