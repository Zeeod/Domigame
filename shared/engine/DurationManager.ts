
import { GameState, EffectDefinition, PlayerState } from './GameState.js';
import { CardRegistry } from '../cards/index.js';
import { Logger } from './Logger.js';
import { TriggerDefinition } from './EffectManager.js';

/**
 * DurationEntry describes an active multi-turn effect.
 */
export interface DurationEntry {
    cardInstanceId: string;
    cardId: string;
    playerId: string;
    turnsRemaining: number | 'PERMANENT' | 'CONDITIONAL';
    conditionKey?: string;
    effects: EffectDefinition[];
    registeredOnTurn: number;
}

/**
 * DurationManager - Unified management of multi-turn effects.
 * 
 * Centralizes:
 * - Registration of new duration effects
 * - Triggering effects at start of turn
 * - Determining which cards stay in play during cleanup
 */
export class DurationManager {
    /**
     * Register a new duration effect
     */
    static register(state: GameState, entry: Omit<DurationEntry, 'registeredOnTurn'>): void {
        state.durations = state.durations || [];
        
        // Prevent duplicate registration for the same card instance
        const existingIdx = state.durations.findIndex(d => d.cardInstanceId === entry.cardInstanceId);
        if (existingIdx !== -1) {
            state.durations[existingIdx] = {
                ...entry,
                registeredOnTurn: state.turnNumber
            };
            return;
        }

        const fullEntry: DurationEntry = {
            ...entry,
            registeredOnTurn: state.turnNumber
        };

        state.durations.push(fullEntry);

        const cardName = CardRegistry.get(entry.cardId)?.name || entry.cardId;
        Logger.log(state, `Effet de durée enregistré pour ${cardName}.`);
    }

    /**
     * Get start-of-turn duration triggers for a player.
     * Decrements turn counters as side-effect.
     */
    static getStartOfTurnTriggers(state: GameState, player: PlayerState): TriggerDefinition[] {
        if (!state.durations) return [];

        // Identify durations for this player that weren't registered THIS turn
        // (Dominion durations usually start "next turn")
        const activeDurations = (state.durations || []).filter(d => {
            return d.playerId === player.id && (d.registeredOnTurn ?? 0) < state.turnNumber;
        });

        const triggers: TriggerDefinition[] = [];

        for (const duration of activeDurations) {
            const def = CardRegistry.get(duration.cardId);
            const cardName = def?.name || duration.cardId;

            if (duration.effects && duration.effects.length > 0) {
                triggers.push({
                    id: `duration_${duration.cardInstanceId}_${state.turnNumber}`,
                    sourceId: duration.cardId,
                    sourceType: 'CARD',
                    description: `Durée : ${cardName}`,
                    effects: duration.effects,
                    context: { sourceCardInstanceId: duration.cardInstanceId }
                });
            }

            // Decrement counters
            if (typeof duration.turnsRemaining === 'number' && duration.turnsRemaining > 0) {
                duration.turnsRemaining--;
            }
        }

        return triggers;
    }

    /**
     * Determine which cards to keep in play area at cleanup.
     * Removes completed durations from state.durations.
     * @returns Array of CardInstanceIds to keep in play.
     */
    static processCleanup(state: GameState, player: PlayerState): string[] {
        if (!state.durations) return [];

        const keepInstanceIds: string[] = [];
        const stillActive: DurationEntry[] = [];

        for (const d of state.durations) {
            // Keep other players' durations
            if (d.playerId !== player.id) {
                stillActive.push({
                    ...d,
                    registeredOnTurn: d.registeredOnTurn ?? state.turnNumber
                });
                continue;
            }

            let shouldKeep = false;

            if (d.turnsRemaining === 'PERMANENT') {
                shouldKeep = true;
            } else if (d.turnsRemaining === 'CONDITIONAL') {
                // TODO: Expansion-specific conditional logic
                shouldKeep = true;
            } else if (typeof d.turnsRemaining === 'number') {
                // Rule: If it was registered THIS turn, keep it (it hasn't fired its next turn effect yet)
                // If turnsRemaining > 0, it has more turns to fire.
                if (d.registeredOnTurn === state.turnNumber || d.turnsRemaining > 0) {
                    shouldKeep = true;
                }
            }

            if (shouldKeep) {
                keepInstanceIds.push(d.cardInstanceId);
                stillActive.push({
                    ...d,
                    registeredOnTurn: d.registeredOnTurn ?? state.turnNumber
                });
            }
        }

        state.durations = stillActive;
        return keepInstanceIds;
    }

    /**
     * Check if a specific card has an active duration effect
     */
    static isActive(state: GameState, cardInstanceId: string): boolean {
        return state.durations?.some(d => d.cardInstanceId === cardInstanceId) || false;
    }
}
