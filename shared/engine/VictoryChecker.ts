/**
 * VictoryChecker - Checks game end conditions and calculates scores
 */

import { GameState } from './GameState.js';
import { PlayerState } from './PlayerState.js';
import { CardRegistry } from '../cards/index.js';
import { ZoneManager } from './ZoneManager.js';

export interface VictoryResult {
    isGameOver: boolean;
    winnerId?: string;
    scores?: { playerId: string; playerName: string; score: number }[];
    reason?: string;
}

export class VictoryChecker {
    /**
     * Check if the game should end
     */
    static checkGameEnd(state: GameState): VictoryResult {
        // Province pile empty
        const provincePile = state.supply['province'];
        if (provincePile && provincePile.count === 0) {
            return this.calculateVictory(state, 'Les Provinces sont épuisées!');
        }

        // Colony pile empty (Prosperity)
        const colonyPile = state.supply['colony'];
        if (colonyPile && colonyPile.count === 0) {
            return this.calculateVictory(state, 'Les Colonies sont épuisées!');
        }

        // 3 piles empty
        const emptyPiles = Object.values(state.supply).filter(p => p.count === 0).length;
        if (emptyPiles >= 3) {
            return this.calculateVictory(state, '3 piles sont épuisées!');
        }

        return { isGameOver: false };
    }

    /**
     * Calculate final scores and determine winner
     */
    static calculateVictory(state: GameState, reason: string): VictoryResult {
        const scores = state.players.map(player => {
            let score = player.vpTokens || 0;
            const allCards = ZoneManager.getAllCards(player);

            for (const card of allCards) {
                const def = CardRegistry.get(card.id);
                if (!def) continue;

                if (def.vpCalculator) {
                    // Data-driven dynamic VP
                    score += def.vpCalculator(allCards, (id) => CardRegistry.get(id));
                } else if (def.dynamicVP) {
                    // Legacy fallback for cards without vpCalculator yet
                    if (card.id === 'gardens') score += Math.floor(allCards.length / 10);
                    else if (card.id === 'duke') score += allCards.filter((c: any) => c.id === 'duchy').length;
                    else if (card.id === 'pasture') score += allCards.filter((c: any) => c.id === 'estate').length;
                    else if (card.id === 'vineyard') {
                        const actionCount = allCards.filter((c: any) => {
                            const d = CardRegistry.get(c.id);
                            return d?.types.includes('ACTION');
                        }).length;
                        score += Math.floor(actionCount / 3);
                    }
                } else if (def.victoryPoints) {
                    score += def.victoryPoints;
                }
            }

            // Landscapes (Landmarks)
            if (state.landscapes) {
                for (const landscapeId of state.landscapes) {
                    const def = CardRegistry.get(landscapeId);
                    if (def && def.types.includes('LANDMARK')) {
                        score += this.calculateLandmarkScore(state, player, landscapeId, allCards);
                    }
                }
            }

            return {
                playerId: player.id,
                playerName: player.name,
                score
            };
        }).sort((a, b) => b.score - a.score);

        return {
            isGameOver: true,
            winnerId: scores[0].playerId,
            scores,
            reason
        };
    }

    /**
     * Get current scores (for display during game)
     */
    static getCurrentScores(state: GameState): { playerId: string; score: number }[] {
        return state.players.map(player => {
            let score = player.vpTokens || 0;
            const allCards = ZoneManager.getAllCards(player);

            for (const card of allCards) {
                const def = CardRegistry.get(card.id);
                if (!def) continue;

                if (def.vpCalculator) {
                    score += def.vpCalculator(allCards, (id) => CardRegistry.get(id));
                } else if (def.dynamicVP) {
                    if (card.id === 'gardens') score += Math.floor(allCards.length / 10);
                    else if (card.id === 'duke') score += allCards.filter((c: any) => c.id === 'duchy').length;
                    else if (card.id === 'pasture') score += allCards.filter((c: any) => c.id === 'estate').length;
                } else if (def.victoryPoints) {
                    score += def.victoryPoints;
                }
            }

            // Landscapes (Landmarks)
            if (state.landscapes) {
                for (const landscapeId of state.landscapes) {
                    const def = CardRegistry.get(landscapeId);
                    if (def && def.types.includes('LANDMARK')) {
                        score += this.calculateLandmarkScore(state, player, landscapeId, allCards);
                    }
                }
            }

            return { playerId: player.id, score };
        });
    }

    /**
     * Calculate score from a Landmark
     */
    static calculateLandmarkScore(_state: GameState, _player: PlayerState, landmarkId: string, allCards: any[]): number {
        switch (landmarkId) {
            case 'fountain':
                // 15 VP if you have at least 10 Coppers
                const coppers = allCards.filter(c => c.id === 'copper').length;
                return coppers >= 10 ? 15 : 0;
            case 'wolf_den':
                // -3 VP for each card you have exactly one copy of
                const counts = new Map<string, number>();
                allCards.forEach(c => counts.set(c.id, (counts.get(c.id) || 0) + 1));
                let penalty = 0;
                counts.forEach((count) => {
                    if (count === 1) penalty += 3;
                });
                return -penalty;
            default:
                return 0;
        }
    }
}
