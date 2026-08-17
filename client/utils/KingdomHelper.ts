import { PublicGameState } from '../../shared/types/SerializedState';
import { CardRegistry } from '../../shared/cards';
import { CardDefinition } from '../../shared/types/CardDefinition';

export interface KingdomCardGroup {
    title: string;
    cards: CardDefinition[];
}

/**
 * KingdomHelper - Utility to aggregate and sort all cards in the current game.
 */
export class KingdomHelper {
    /**
     * Get all cards in the game categorized and sorted.
     */
    static getAllGameCards(state: PublicGameState): KingdomCardGroup[] {
        const categories: KingdomCardGroup[] = [];

        // 1. Landscapes (Events, Landmarks, Ways, etc.)
        if (state.landscapes && state.landscapes.length > 0) {
            const landscapes = state.landscapes
                .map(id => CardRegistry.get(id))
                .filter((c): c is CardDefinition => !!c);

            categories.push({
                title: 'Paysages',
                cards: this.sortCards(landscapes)
            });
        }

        // 2. Kingdom Supply (Main cards)
        const supplyCardIds = Object.keys(state.supply);
        const supplyCards = supplyCardIds
            .filter(id => id !== 'curse')
            .map(id => CardRegistry.get(id))
            .filter((c): c is CardDefinition => !!c && !c.types.includes('TREASURE') && !c.types.includes('VICTORY'));

        if (supplyCards.length > 0) {
            categories.push({
                title: 'Réserve',
                cards: this.sortCards(supplyCards)
            });
        }

        // 3. Special Cards (Non-Supply, Heirlooms, Prizes, etc.)
        const nonSupplyIds = Object.keys(state.nonSupply);
        // Also check for linked cards in supply or player mats if needed, but nonSupply should cover most
        const nonSupplyCards = nonSupplyIds
            .map(id => CardRegistry.get(id))
            .filter((c): c is CardDefinition => !!c);

        if (nonSupplyCards.length > 0) {
            categories.push({
                title: 'Cartes Spéciales',
                cards: this.sortCards(nonSupplyCards)
            });
        }

        // 4. Basic Treasures & Victories (Optional, maybe keep it separate or skip for focus)
        // Usually, we want to see the kingdom cards. Basic cards are always the same.
        // But for completeness, we could add them. Let's stick to requested sections.

        return categories;
    }

    /**
     * Sort cards by cost, then by name.
     */
    private static sortCards(cards: CardDefinition[]): CardDefinition[] {
        return [...cards].sort((a, b) => {
            // Sort by cost (including debt and potion if needed, but primary cost first)
            const costA = a.cost ?? 0;
            const costB = b.cost ?? 0;
            if (costA !== costB) return costA - costB;

            // Sort by debt cost
            const debtA = a.debtCost ?? 0;
            const debtB = b.debtCost ?? 0;
            if (debtA !== debtB) return debtA - debtB;

            // Sort by name
            return a.name.localeCompare(b.name, 'fr');
        });
    }
}
