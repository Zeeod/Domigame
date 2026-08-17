import { CardRegistry } from '../cards/index.js';
import { ZoneManager } from './ZoneManager.js';
import { GameState } from './GameState.js';

export interface DeckStats {
    score: number;
    wealthDensity: number;
    vpDensity: number;
    cyclingCapacity: number;
}

/**
 * StatsCalculator - Computes advanced statistics for a player's deck
 */
export class StatsCalculator {
    /**
     * Calculate deck statistics for a specific player
     */
    static calculate(state: GameState, playerId: string): DeckStats {
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return { score: 0, wealthDensity: 0, vpDensity: 0, cyclingCapacity: 0 };
        }

        const allCards = ZoneManager.getAllCards(player);
        const cardCount = allCards.length || 1; // Avoid division by zero

        let totalVP = player.vpTokens || 0;
        let totalWealth = 0;
        let cyclingPower = 0;

        for (const card of allCards) {
            const def = CardRegistry.get(card.id);
            if (!def) continue;

            // 1. VP Calculation
            if (def.vpCalculator) {
                totalVP += def.vpCalculator(allCards, (id) => CardRegistry.get(id));
            } else if (def.dynamicVP) {
                // Fallback for common dynamic VP cards
                if (card.id === 'gardens') totalVP += Math.floor(allCards.length / 10);
                else if (card.id === 'duke') totalVP += allCards.filter(c => c.id === 'duchy').length;
                else if (card.id === 'pasture') totalVP += allCards.filter(c => c.id === 'estate').length;
            } else if (def.victoryPoints) {
                totalVP += def.victoryPoints;
            }

            // 2. Wealth Calculation
            totalWealth += (def.treasureValue || 0) + (def.moneyValue || 0);

            // 3. Cycling Capacity (Heuristic)
            // We look at cards that provide +Cards or +Actions+Draw
            if (def.effects) {
                for (const effect of def.effects) {
                    if (effect.type === 'DRAW') {
                        const amount = typeof effect.amount === 'number' ? effect.amount : 1;
                        cyclingPower += amount;
                    } else if (effect.type === 'ADD_ACTIONS') {
                        const amount = typeof effect.amount === 'number' ? effect.amount : 1;
                        cyclingPower += (amount * 0.5); // Weighting actions slightly less for cycling
                    }
                }
            }
        }

        // Add Landmark scores if applicable
        if (state.landscapes) {
            for (const landscapeId of state.landscapes) {
                const def = CardRegistry.get(landscapeId);
                if (def && def.types.includes('LANDMARK')) {
                    // This is a bit complex as Landmarks usually check all players at the end.
                    // For current stats, we use the same logic as VictoryChecker if possible.
                    // For now, let's keep it simple and skip Landmarks in live stats to avoid heavy computation
                    // or just implement the most common ones.
                }
            }
        }

        return {
            score: totalVP,
            wealthDensity: Number((totalWealth / cardCount).toFixed(2)),
            vpDensity: Number((totalVP / cardCount).toFixed(2)),
            cyclingCapacity: cyclingPower
        };
    }
}
