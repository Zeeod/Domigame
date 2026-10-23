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
        // 3 empty Supply piles (4 with 5 or more players)
        const emptyPiles = Object.values(state.supply).filter(p => p.count === 0).length;
        const limit = state.players.length >= 5 ? 4 : 3;
        if (emptyPiles >= limit) {
            return this.calculateVictory(state, `${limit} piles sont épuisées!`);
        }

        return { isGameOver: false };
    }

    /**
     * A player's score: VP tokens + card VP (fixed or computed) + Landmarks.
     * Single source of truth, used during the game and at the end.
     */
    static scorePlayer(state: GameState, player: PlayerState): number {
        let score = player.vpTokens || 0;
        const allCards = ZoneManager.getAllCards(player);
        for (const card of allCards) {
            const def = CardRegistry.get(card.id);
            if (!def) continue;
            if ((def as any).vpOnMat) {
                const { mat, vp } = (def as any).vpOnMat;
                if (player.mats?.[mat]?.some((c: any) => c.instanceId === card.instanceId)) score += vp;
            } else if (def.vpCalculator) {
                score += def.vpCalculator(allCards, (id) => CardRegistry.get(id));
            } else if (def.dynamicVP) {
                if (card.id === 'gardens') score += Math.floor(allCards.length / 10);
                else if (card.id === 'duke') score += allCards.filter((c: any) => c.id === 'duchy').length;
                else if (card.id === 'pasture') score += allCards.filter((c: any) => c.id === 'estate').length;
            } else if (def.victoryPoints) {
                score += def.victoryPoints;
            }
        }
        for (const landscapeId of state.landscapes || []) {
            const def = CardRegistry.get(landscapeId);
            if (def && def.types.includes('LANDMARK')) {
                score += this.calculateLandmarkScore(state, player, landscapeId, allCards);
            }
        }
        for (const f of this.playerScorers) score += f(state, player);
        return score;
    }

    /**
     * Final ranking. Ties on score go to the tied player who had the fewest turns;
     * if still tied, they share the victory (all of them are in `winnerIds`).
     */
    static ranking(state: GameState): { scores: { playerId: string; playerName: string; score: number; turns: number }[]; winnerIds: string[] } {
        const scores = state.players.map(p => ({ playerId: p.id, playerName: p.name, score: this.scorePlayer(state, p), turns: p.turnsTaken || 0 }))
            .sort((a, b) => b.score - a.score || a.turns - b.turns);
        const best = scores[0];
        const winnerIds = best ? scores.filter(s => s.score === best.score && s.turns === best.turns).map(s => s.playerId) : [];
        return { scores, winnerIds };
    }

    /**
     * Calculate final scores and determine winner
     */
    static calculateVictory(state: GameState, reason: string): VictoryResult {
        const { scores, winnerIds } = this.ranking(state);
        return {
            isGameOver: true,
            winnerId: winnerIds[0],
            scores: scores.map(({ playerId, playerName, score }) => ({ playerId, playerName, score })),
            reason
        };
    }

    /**
     * Get current scores (for display during game)
     */
    static getCurrentScores(state: GameState): { playerId: string; score: number }[] {
        return state.players.map(player => ({ playerId: player.id, score: this.scorePlayer(state, player) }));
    }

    /**
     * Calculate score from a Landmark
     */
    /** Extra VP for a player, registered by expansions (Nocturne: Miserable). */
    static playerScorers: ((state: GameState, player: PlayerState) => number)[] = [];

    /** "When scoring" Landmark rules, registered by expansions (Empires). */
    static landmarkScorers: ((state: GameState, player: PlayerState, landmarkId: string, allCards: any[]) => number)[] = [];

    static calculateLandmarkScore(state: GameState, player: PlayerState, landmarkId: string, allCards: any[]): number {
        return this.landmarkScorers.reduce((sum, f) => sum + f(state, player, landmarkId, allCards), 0);
    }
}
