/**
 * EffectManager - Manages simultaneous effect resolution (The "Ordering Rule")
 * 
 * In Dominion, when multiple things happen at the same time (e.g. Start of Turn),
 * the player can choose the order in which they resolve.
 * 
 * This manager collects triggers from various sources and orchestrates their execution,
 * prompting the player for order if necessary.
 */

import { GameState, EffectDefinition, PlayerState } from './GameState.js';
import { Logger } from './Logger.js';

export interface TriggerDefinition {
    id: string;         // Unique ID for the trigger instance
    sourceId: string;   // Card ID or source ID (e.g. 'wharf', 'project_citadel')
    sourceType: 'CARD' | 'PROJECT' | 'TRAIT' | 'LANDSCAPE' | 'RULE';
    description: string;
    effects: EffectDefinition[];
    priority?: number;  // Optional priority for auto-ordering (lower = earlier)
    context?: any;      // Context to pass to effects
}

export class EffectManager {

    /**
     * Resolve a list of triggers.
     * If multiple triggers exist, prompts the player to order them.
     * If only one, executes immediately.
     */
    static resolveTriggers(
        state: GameState,
        player: PlayerState,
        triggers: TriggerDefinition[],
        message: string = "Choisissez l'ordre de résolution"
    ): void {
        if (triggers.length === 0) return;

        // 1. If only one trigger, execute immediately
        if (triggers.length === 1) {
            this.executeTrigger(state, player, triggers[0]);
            return;
        }

        // 2. If multiple triggers, check if we need player intervention
        // Some triggers might have strict priority (rare in Dominion, usually player choice)
        // For now, we assume ALL simultaneous triggers are player-ordered.

        // Create a special decision to order effects
        // We push a "RESOLVE_TRIGGERS_CHOICE" effect which will handle the UI
        // But EffectEngine doesn't support generic ordering yet.
        // We can simulate this by asking "Which do you want to resolve FIRST?"
        // then recursing with the rest.

        // However, building a custom UI for "Reorder these N items" is cleaner.
        // Let's use a new PromptType 'ORDER_CARDS' or similar if available, 
        // or just 'SELECT_OPTION' to pick the next one.

        // Strategy: Push a wrapper effect that manages the choice loop.
        state.effectStack.push({
            type: 'EFFECT',
            playerId: player.id,
            effect: {
                type: 'SYSTEM_ORDER_TRIGGERS', // New internal effect type
                triggers: triggers,
                message: message
            } as any
        });
    }

    /**
     * Internal handler for the ordering decision.
     * Called by EffectHandlerRegistry when 'SYSTEM_ORDER_TRIGGERS' is processed.
     */
    static handleOrderTriggers(
        state: GameState,
        player: PlayerState,
        triggers: TriggerDefinition[],
        message: string
    ): any { // Returns EffectResult compatible object
        // If we down to 1, just do it
        if (triggers.length === 1) {
            this.executeTrigger(state, player, triggers[0]);
            return { state, needsChoice: false };
        }

        // Prompt user to pick the NEXT trigger to resolve
        return {
            state,
            needsChoice: true,
            decision: {
                id: `order_${Date.now()}_${Math.random()}`,
                playerId: player.id,
                type: 'SELECT_OPTION',
                message: message,
                options: triggers.map((t, index) => ({
                    label: t.description,
                    value: index.toString(), // We'll use index to identify
                    command: 'select_trigger'
                })),
                context: {
                    specialAction: 'ORDER_TRIGGERS',
                    remainingTriggers: triggers // Pass full objects? Or store in state?
                    // Triggers might contain functions or complex data, careful with serialization.
                    // For now, in-memory reference is fine for server-side state.
                }
            }
        };
    }

    /**
     * Callback when player picks a trigger to resolve first.
     */
    static onOrderTriggerDecision(
        state: GameState,
        player: PlayerState,
        selectedIndex: number,
        remainingTriggers: TriggerDefinition[]
    ): any { // EffectResult
        const selected = remainingTriggers[selectedIndex];
        const others = remainingTriggers.filter((_, i) => i !== selectedIndex);

        // 1. Execute the selected trigger immediately
        // We push it to the stack.
        // BUT we also need to continue ordering the 'others'.
        // So we push 'SYSTEM_ORDER_TRIGGERS' for the 'others' FIRST (so it executes LAST),
        // then push the selected effects (so they execute FIRST).

        // Stack: [ ... ]
        // Push: Order(Others)
        // Push: Execute(Selected)
        // -> Execute(Selected) happens, then Order(Others) happens.

        if (others.length > 0) {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SYSTEM_ORDER_TRIGGERS',
                    triggers: others,
                    message: "Choisissez le prochain effet à résoudre"
                } as any
            });
        }

        this.executeTrigger(state, player, selected);

        return { state, needsChoice: false };
    }

    private static executeTrigger(state: GameState, player: PlayerState, trigger: TriggerDefinition): void {
        Logger.log(state, `Résolution de : ${trigger.description}`, player.id);

        // Push effects to stack (reverse for correct execution order)
        const items = trigger.effects.map(e => ({
            type: 'EFFECT' as const,
            playerId: player.id,
            effect: e,
            context: { sourceCardInstanceId: trigger.context?.sourceCardInstanceId }
        }));

        state.effectStack.push(...items.reverse());
    }
}
