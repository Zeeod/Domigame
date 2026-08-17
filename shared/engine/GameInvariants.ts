/**
 * GameInvariants - Runtime validation utilities
 * 
 * Used in dev mode to catch impossible states early.
 * In production, these become no-ops for performance.
 */

import { GameState } from './GameState.js';
import { CardRegistry } from '../cards/index.js';

const IS_DEV = process.env.NODE_ENV !== 'production';

export class GameInvariants {
    /**
     * Validate entire game state for impossible conditions
     */
    static validate(state: GameState): { valid: boolean; errors: string[] } {
        if (!IS_DEV) return { valid: true, errors: [] };

        const errors: string[] = [];

        // Check supply piles
        for (const [cardId, pile] of Object.entries(state.supply)) {
            if (pile.count < 0) {
                errors.push(`Supply pile ${cardId} has negative count: ${pile.count}`);
            }
        }

        // Check player states
        const allCardInstanceIds = new Set<string>();

        for (const player of state.players) {
            // No negative resources
            if (player.actions < 0) errors.push(`Player ${player.id} has negative actions`);
            if (player.buys < 0) errors.push(`Player ${player.id} has negative buys`);
            if (player.coins < 0) errors.push(`Player ${player.id} has negative coins`);

            // Check all zones for duplicates
            const playerCards = [
                ...player.hand,
                ...player.deck,
                ...player.discardPile,
                ...player.playArea
            ];

            for (const card of playerCards) {
                if (allCardInstanceIds.has(card.instanceId)) {
                    errors.push(`Duplicate card instance: ${card.instanceId} (${card.id})`);
                }
                allCardInstanceIds.add(card.instanceId);

                // Validate card exists in registry
                if (!CardRegistry.get(card.id)) {
                    errors.push(`Unknown card ID: ${card.id}`);
                }
            }
        }

        // Check trash for duplicates
        for (const card of state.trash) {
            if (allCardInstanceIds.has(card.instanceId)) {
                errors.push(`Duplicate card in trash: ${card.instanceId}`);
            }
            allCardInstanceIds.add(card.instanceId);
        }

        // Validate current player index
        if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) {
            errors.push(`Invalid currentPlayerIndex: ${state.currentPlayerIndex}`);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Assert state is valid, throw in dev mode if not
     */
    static assert(state: GameState, context?: string): void {
        if (!IS_DEV) return;

        const result = this.validate(state);
        if (!result.valid) {
            const message = `[GameInvariants] ${context || 'Validation failed'}:\n${result.errors.join('\n')}`;
            console.error(message);
            throw new Error(message);
        }
    }

    /**
     * Log invariant check (non-throwing)
     */
    static check(state: GameState, context?: string): boolean {
        const result = this.validate(state);
        if (!result.valid) {
            console.warn(`[GameInvariants] ${context || 'Check failed'}:`, result.errors);
        }
        return result.valid;
    }
}

// ============================================================================
// Safety Constants
// ============================================================================

export const SAFETY_LIMITS = {
    /** Maximum effect stack depth to prevent infinite recursion */
    MAX_EFFECT_DEPTH: 50,

    /** Maximum reveals per single action */
    MAX_REVEALS_PER_ACTION: 100,

    /** Maximum draws per single action */
    MAX_DRAWS_PER_ACTION: 50,

    /** Maximum total actions per turn (prevents soft-lock) */
    MAX_ACTIONS_PER_TURN: 200,

    /** Maximum turns per game (prevents infinite games) */
    MAX_TURNS_PER_GAME: 500
};
