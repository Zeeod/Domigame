import { PlayerState } from './PlayerState.js';
import { CardInstance } from './CardInstance.js';

/**
 * Player mats (Native Village, Island, Tavern, Exile, and any card-specific mat).
 *
 * SINGLE SOURCE OF TRUTH: `player.mats[<canonical name>]`.
 * Never store a mat in another field: the game state is copied by Immer on every
 * action, so aliases (two fields pointing to the same array) silently diverge.
 * Always go through these helpers.
 */

export type MatName = 'nativeVillage' | 'island' | 'tavern' | 'exile' | string;

const ALIASES: Record<string, MatName> = {
    nativevillage: 'nativeVillage', nativevillagemat: 'nativeVillage', native_village: 'nativeVillage',
    island: 'island', islandmat: 'island',
    tavern: 'tavern', tavernmat: 'tavern',
    exile: 'exile', exilemat: 'exile',
};

/** Canonical mat name for any spelling ("nativeVillageMat", "mats.island", "Exile"…). */
export function matName(raw: string): MatName {
    const key = raw.replace(/^mats\./, '');
    return ALIASES[key.toLowerCase()] ?? key;
}

/** True if `zone` designates a mat (rather than hand, deck, …). */
export function isMatZone(zone: string): boolean {
    const key = zone.replace(/^mats\./, '').toLowerCase();
    return key in ALIASES || zone.startsWith('mats.');
}

/** The mat array (created if missing). Mutating it mutates the player. */
export function getMat(player: PlayerState, name: string): CardInstance[] {
    const n = matName(name);
    if (!player.mats) (player as any).mats = {};
    if (!player.mats[n]) player.mats[n] = [];
    return player.mats[n];
}

/** Read-only view of a mat (does not create it). */
export function peekMat(player: PlayerState, name: string): CardInstance[] {
    return player.mats?.[matName(name)] ?? [];
}

export function addToMat(player: PlayerState, name: string, card: CardInstance): void {
    getMat(player, name).push(card);
}

/** Remove a card from any mat; returns it if found. */
export function removeFromMats(player: PlayerState, instanceId: string): CardInstance | undefined {
    for (const key of Object.keys(player.mats || {})) {
        const mat = player.mats[key];
        const idx = mat.findIndex(c => c.instanceId === instanceId);
        if (idx !== -1) return mat.splice(idx, 1)[0];
    }
    return undefined;
}

/** All cards on all mats. */
export function allMatCards(player: PlayerState): CardInstance[] {
    return Object.values(player.mats || {}).flat();
}
