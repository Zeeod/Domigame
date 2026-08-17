
import { GameState } from './GameState.js';
import { CardRegistry } from '../cards/index.js';

export type CostModifier = (
    state: GameState,
    playerId: string,
    cardId: string,
    currentCost: number
) => number;

export class EconomyEngine {
    private static modifiers: { id: string; modifier: CostModifier; priority: number }[] = [];

    /**
     * Register a cost modifier.
     * Priority: Higher runs LATER (acting on the result of previous modifiers).
     */
    static registerModifier(id: string, modifier: CostModifier, priority: number = 50): void {
        this.modifiers.push({ id, modifier, priority });
        this.modifiers.sort((a, b) => a.priority - b.priority);
    }

    static unregisterModifier(id: string): void {
        this.modifiers = this.modifiers.filter(m => m.id !== id);
    }

    /**
     * Reset the EconomyEngine to its initial state.
     */
    static reset(): void {
        this.modifiers = [];
    }

    static getCardCost(state: GameState, playerId: string, cardId: string): number {
        const def = CardRegistry.get(cardId);
        if (!def) return 0;

        let cost = def.cost;

        // Custom static modifiers from card definition
        if (def.costModifier === 'DESTRIER') {
            const player = state.players.find(p => p.id === playerId);
            if (player) {
                cost = Math.max(0, cost - (player.cardsGainedThisTurn || 0));
            }
        } else if (def.costModifier === 'FISHERMAN') {
            const player = state.players.find(p => p.id === playerId);
            if (player && player.discardPile.length === 0) {
                cost = 2; // Fixed cost of 2
            }
        } else if (def.costModifier === 'WAYFARER') {
            if (state.lastGainedCost !== undefined && state.lastGainedCost !== null) {
                cost = state.lastGainedCost;
            }
        }

        // --- PLUNDER TRAITS ---
        const pile = state.supply[cardId];
        if (pile && pile.traits?.includes('cheap')) {
            cost = Math.max(0, cost - 1);
        }

        // Apply registered modifiers (Bridge, Highway, Quarry, etc.)
        for (const mod of this.modifiers) {
            cost = mod.modifier(state, playerId, cardId, cost);
        }

        // Apply player-specific cost reduction (Bridge, Highway)
        const player = state.players.find(p => p.id === playerId);
        if (player && player.costReduction) {
            cost -= player.costReduction;
        }

        // System fallback: ensure no negative cost
        return Math.max(0, cost);
    }
}
