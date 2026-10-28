/**
 * Game-wide rule changes that depend on the kingdom.
 * Computed once at setup and stored in state.cardOverrides (see CardRegistry.withGameOverrides).
 */
import type { GameState } from './GameState.js';
import { CardRegistry, type CardOverrides } from '../cards/index.js';
import { EffectUtils } from './EffectUtils.js';

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

/** Rewards (Joust): not in the Supply, 1 copy each with 2 players, 2 with 3 or more. */
export const REWARDS = ['coronet', 'courser', 'demesne', 'housecarl', 'huge_turnip', 'renown'];

/**
 * Setup that depends on the kingdom (after the Supply is built):
 * Ferryman's set-aside pile, Joust's Rewards, Baker's starting Coffers.
 */
/** Setup steps registered by expansions (Empires: Landmark VP, Tax…). */
export const setupHooks: ((state: GameState) => void)[] = [];

/** Setup choices made once the starting hands are dealt (Plunder — Inherited). */
export const startGameHooks: ((state: GameState) => void)[] = [];

export function applyKingdomSetup(state: GameState): void {
    for (const hook of setupHooks) hook(state);
    const kingdom = state.kingdomCards || [];
    state.nonSupply = state.nonSupply || {};

    // Ferryman: an unused Kingdom pile costing $3 or $4, set aside (gained only via Ferryman)
    if (kingdom.includes('ferryman') && !state.ferrymanPile) {
        const used = new Set([...kingdom, ...Object.keys(state.supply)]);
        const pool = CardRegistry.getKingdomCandidates().filter(id => {
            const d = CardRegistry.get(id);
            return d && !used.has(id) && (d.cost === 3 || d.cost === 4) && !d.potionCost && !d.debtCost && !d.mixedPile;
        }).sort();
        if (pool.length) {
            const pick = pool[Math.floor(EffectUtils.random(state) * pool.length)];
            state.ferrymanPile = pick;
            state.nonSupply[pick] = { cardId: pick, count: 10, cards: [] } as any;
        }
    }

    // Joust: the Rewards
    if (kingdom.includes('joust')) {
        const n = state.players.length >= 3 ? 2 : 1;
        for (const id of REWARDS) state.nonSupply[id] = { cardId: id, count: n, cards: [] } as any;
    }

    // Baker: each player starts with +1 Coffers
    if (kingdom.includes('baker')) {
        for (const p of state.players) p.coffers = (p.coffers || 0) + 1;
    }
}

const mergedCache = new WeakMap<object, Map<string, CardOverrides>>();

/**
 * Card overrides in force right now: the game's (Charlatan…) plus those of the player whose
 * turn it is (Inheritance: "during your turns, Estates are also Commands…").
 */
export function activeOverrides(state: GameState): CardOverrides | undefined {
    const game = state.cardOverrides;
    const pid = state.players?.[state.currentPlayerIndex]?.id;
    const mine = pid ? state.playerCardOverrides?.[pid] : undefined;
    if (!mine) return game;
    if (!game) return mine;
    let byPlayer = mergedCache.get(game);
    if (!byPlayer) { byPlayer = new Map(); mergedCache.set(game, byPlayer); }
    const key = pid + ':' + JSON.stringify(Object.keys(mine));
    let merged = byPlayer.get(key);
    if (!merged) { merged = { ...game, ...mine }; byPlayer.set(key, merged); }
    return merged;
}
