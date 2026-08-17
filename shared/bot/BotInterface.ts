/**
 * BotInterface - Abstract contract for AI players
 * 
 * Bots receive game state and must return a valid GameAction.
 * All bots are server-side only (no client code).
 */

import { GameState } from '../engine/GameState.js';
import { GameAction } from '../types/GameAction.js';

// ============================================================================
// Bot Interface
// ============================================================================

export interface BotInterface {
    /** Unique identifier for the bot type */
    readonly name: string;

    /** 
     * Choose an action based on current game state
     * MUST return a valid action (validated by RulesValidator)
     */
    chooseAction(state: GameState, playerId: string): GameAction;

    /**
     * Optional: Respond to a pending choice (e.g., discard cards)
     */
    resolveChoice?(state: GameState, playerId: string): GameAction;
}

// ============================================================================
// Bot Factory
// ============================================================================

export type BotType = 'random' | 'greedy' | 'bigmoney' | 'smart';

const botRegistry: Map<BotType, () => BotInterface> = new Map();

export function registerBot(type: BotType, factory: () => BotInterface): void {
    botRegistry.set(type, factory);
}

export function createBot(type: BotType): BotInterface {
    const factory = botRegistry.get(type);
    if (!factory) {
        throw new Error(`Unknown bot type: ${type}`);
    }
    return factory();
}

export function getAvailableBots(): BotType[] {
    return Array.from(botRegistry.keys());
}
