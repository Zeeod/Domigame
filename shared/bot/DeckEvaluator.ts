
import { GameState, PlayerState } from '../engine/GameState.js';
import { CardRegistry } from '../cards/index.js';
import { CardDefinition } from '../types/CardDefinition.js';

export type GameStage = 'EARLY' | 'MID' | 'LATE';

export class DeckEvaluator {

    /**
     * Evaluate the strength of a deck in the current game state.
     * Higher score = better position.
     */
    static evaluateDeck(state: GameState, player: PlayerState): number {
        const stage = this.getGameStage(state);
        const allCards = this.getAllCards(player);

        // Calculate Action Efficiency (Penalty for ensuring terminal collision)
        const efficiency = this.calculateActionEfficiency(allCards);

        // Base Scores
        const wealthScore = this.calculateWealth(allCards, efficiency);
        const vpScore = this.calculateVP(allCards, state);
        const cyclingScore = this.calculateCycling(allCards, efficiency);

        // Stage Weights
        let weights = { wealth: 1, vp: 1, cycling: 1 };

        switch (stage) {
            case 'EARLY':
                // Focus on economy and cycling
                weights = { wealth: 3.0, vp: 0.1, cycling: 2.0 };
                break;
            case 'MID':
                // Balanced, start caring about VP density but mostly building engine
                weights = { wealth: 2.0, vp: 1.5, cycling: 2.5 };
                break;
            case 'LATE':
                // VP is king, but need enough economy/cycling to buy Provinces
                weights = { wealth: 1.0, vp: 5.0, cycling: 2.0 };
                break;
        }

        const totalScore =
            (wealthScore * weights.wealth) +
            (vpScore * weights.vp) +
            (cyclingScore * weights.cycling);

        return totalScore;
    }

    static getGameStage(state: GameState): GameStage {
        // Simple heuristic based on empty piles and Province count
        const provincePile = state.supply['province'];
        const emptyPiles = Object.values(state.supply).filter(p => p.count === 0).length;

        if (!provincePile) return 'MID'; // Fallback

        // Late Game: < 4 Provinces or >= 2 empty piles
        if (provincePile.count < 4 || emptyPiles >= 2) {
            return 'LATE';
        }

        // Early Game: Turn number < 8 (approx 2 shuffles)
        if (state.turnNumber < 8) {
            return 'EARLY';
        }

        return 'MID';
    }

    // --- Metrics ---

    public static calculateActionEfficiency(cards: CardDefinition[]): number {
        let villagers = 0;
        let actionCards = 0;

        for (const card of cards) {
            if (card.types.includes('ACTION')) {
                actionCards++;
                if (card.effects) {
                    for (const eff of card.effects) {
                        if (eff.type === 'ADD_ACTIONS') {
                            if (typeof eff.amount === 'number') villagers += eff.amount;
                        }
                    }
                }
            }
        }

        if (actionCards === 0) return 1.0;

        // Base 1 Action + Villagers provided
        const capacity = 1 + villagers;

        // Efficiency = Capacity / Needs
        // Cap at 1.0
        return Math.min(1.0, capacity / actionCards);
    }

    public static calculateWealth(cards: CardDefinition[], efficiency: number): number {
        let wealth = 0;
        for (const card of cards) {
            if (card.types.includes('TREASURE')) {
                wealth += (card.treasureValue || 0);
                // Special case for Bank, Philosopher's Stone (approximate)
                if (card.id === 'bank') wealth += 3;
                if (card.id === 'philosophers_stone') wealth += 2;
            }
            // Action cards that produce money (Market +1, Festival +2)
            if (card.types.includes('ACTION')) {
                let actionWealth = 0;
                if (card.effects) {
                    for (const eff of card.effects) {
                        if (eff.type === 'ADD_MONEY') {
                            // Simplified: Only count static amounts for now
                            if (typeof eff.amount === 'number') actionWealth += eff.amount;
                        }
                    }
                }
                wealth += actionWealth * efficiency;
            }
        }
        return wealth / Math.max(1, cards.length) * 10; // Normalized wealth density score
    }

    public static calculateVP(cards: CardDefinition[], state: GameState): number {
        let vp = 0;
        for (const card of cards) {
            if (card.types.includes('VICTORY') || card.types.includes('CURSE')) {
                if (card.victoryPoints !== undefined) vp += card.victoryPoints;
                else if (card.id === 'gardens') vp += Math.floor(cards.length / 10);
                else if (card.id === 'duke') vp += cards.filter(c => c.id === 'duchy').length;
                else if (card.id === 'fairgrounds') vp += Math.floor(new Set(cards.map(c => c.id)).size / 5) * 2;
                // Add other dynamic VP logic if needed or reuse VP calculator from card def
            }
        }
        return vp;
    }

    public static calculateCycling(cards: CardDefinition[], efficiency: number): number {
        let drawPower = 0;
        for (const card of cards) {
            if (card.effects) {
                for (const eff of card.effects) {
                    if (eff.type === 'DRAW') {
                        if (typeof eff.amount === 'number') {
                            // Apply efficiency if source is an Action
                            const factor = card.types.includes('ACTION') ? efficiency : 1.0;
                            drawPower += eff.amount * factor;
                        }
                    }
                }
            }
        }
        return drawPower / Math.max(1, cards.length) * 10;
    }

    // --- Helpers ---

    public static getAllCards(player: PlayerState): CardDefinition[] {
        const all = [
            ...player.hand,
            ...player.deck,
            ...player.discardPile,
            ...player.playArea
        ];
        // Map to definitions
        return all.map(c => CardRegistry.get(c.id)).filter(d => d !== undefined) as CardDefinition[];
    }
}
