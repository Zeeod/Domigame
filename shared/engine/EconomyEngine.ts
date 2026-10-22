
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

    /**
     * Does a Supply card satisfy a selection filter? (maxCost, minCost, exactCost,
     * cardTypes / allowedTypes, excludeTypes, cardIds, excludeIds, nonVictory).
     * Used both to build supply choices and to validate the answer.
     */
    static supplyCardMatches(state: GameState, playerId: string, cardId: string, filter: any = {}): boolean {
        const def = CardRegistry.get(cardId);
        if (!def) return false;
        const cost = this.getCardCost(state, playerId, cardId);
        if (filter.maxCost !== undefined && cost > filter.maxCost) return false;
        if (filter.minCost !== undefined && cost < filter.minCost) return false;
        if (filter.exactCost !== undefined) {
            const exact = Array.isArray(filter.exactCost) ? filter.exactCost : [filter.exactCost];
            if (!exact.includes(cost)) return false;
        }
        // Potion / Debt costs: "up to $X" never includes a cost with a Potion or Debt in it
        if ((filter.maxCost !== undefined || filter.exactCost !== undefined) && !filter.allowPotionOrDebt
            && (((def as any).potionCost || 0) > 0 || ((def as any).debtCost || 0) > 0)) return false;
        const types = filter.cardTypes || filter.allowedTypes;
        if (types && !types.some((t: string) => def.types.includes(t as any))) return false;
        if (filter.excludeTypes && filter.excludeTypes.some((t: string) => def.types.includes(t as any))) return false;
        if (filter.nonVictory && def.types.includes('VICTORY')) return false;
        if (filter.cardIds && !filter.cardIds.includes(cardId)) return false;
        if (filter.excludeIds && filter.excludeIds.includes(cardId)) return false;
        return true;
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

        // Note: Plunder's "Cheap" trait is a registered modifier (expansions/Plunder.ts).

        // Apply registered modifiers (Bridge, Highway, Quarry, etc.)
        for (const mod of this.modifiers) {
            cost = mod.modifier(state, playerId, cardId, cost);
        }

        // "This turn, cards cost $1 less" (Bridge, Highway): applies to everyone during that turn
        const current = state.players[state.currentPlayerIndex];
        if (current && current.costReduction) {
            cost -= current.costReduction;
        }

        // System fallback: ensure no negative cost
        return Math.max(0, cost);
    }
}
