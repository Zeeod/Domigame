/**
 * Game-wide rule changes that depend on the kingdom.
 * Computed once at setup and stored in state.cardOverrides (see CardRegistry.withGameOverrides).
 */
import type { GameState } from './GameState.js';
import type { CardOverrides } from '../cards/index.js';

export function computeCardOverrides(kingdom: string[]): CardOverrides | undefined {
    const o: CardOverrides = {};
    // Charlatan: "In games using this, Curse is also a Treasure worth $1."
    if (kingdom.includes('charlatan')) {
        o.curse = { types: ['CURSE', 'TREASURE'] as any, treasureValue: 1, effects: [{ type: 'ADD_MONEY', amount: 1 } as any] };
    }
    return Object.keys(o).length ? o : undefined;
}

/** Call after state.kingdomCards is set. */
export function applyKingdomRules(state: GameState): void {
    state.cardOverrides = computeCardOverrides(state.kingdomCards || []);
}
