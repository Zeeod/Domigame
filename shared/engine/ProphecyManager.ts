import { GameState } from './GameState.js';
import { CardRegistry } from '../cards/index.js';

/**
 * Rising Sun — the Prophecy of the game and its Sun tokens (state.landscapeState[id].tokens.sun).
 * The rules of each Prophecy live in expansions/RisingSunCards.ts.
 */
export class ProphecyManager {
    /** Sun tokens by player count (rulebook): 5 / 8 / 10 / 12 / 13 for 2–6 players. */
    static sunTokensFor(playerCount: number): number {
        return ({ 1: 5, 2: 5, 3: 8, 4: 10, 5: 12, 6: 13 } as Record<number, number>)[playerCount] ?? 13;
    }

    /** The Prophecy used this game, if any. */
    static prophecy(state: GameState): string | undefined {
        return (state.landscapes || []).find(id => CardRegistry.get(id)?.types.includes('PROPHECY' as any));
    }

    static sun(state: GameState): number {
        const id = this.prophecy(state);
        return id ? (state.landscapeState?.[id]?.tokens?.sun ?? 0) : 0;
    }

    /** True once the last Sun token has been removed from this Prophecy. */
    static isActive(state: GameState, prophecyId: string): boolean {
        return this.prophecy(state) === prophecyId && !!state.landscapeState?.[prophecyId]?.tokens && state.landscapeState[prophecyId].tokens.sun === 0;
    }

    /** Setup: put the Sun tokens on the Prophecy. */
    static setup(state: GameState): void {
        const id = this.prophecy(state);
        if (!id) return;
        state.landscapeState = state.landscapeState || {};
        const ls = state.landscapeState[id] = state.landscapeState[id] || { tokens: {}, state: null };
        ls.tokens = ls.tokens || {};
        if (ls.tokens.sun === undefined) ls.tokens.sun = this.sunTokensFor(state.players.length);
        state.activeProphecyId = id;
    }
}
