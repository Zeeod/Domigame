/**
 * Possession (Alchemy): "The player to your left takes an extra turn after this one, in which you
 * can see all cards they can and make all decisions for them. Any cards or debt they would gain on
 * that turn, you gain instead; any cards of theirs that are trashed are set aside and put in their
 * discard pile at end of turn."
 */
import type { GameState, PlayerState, CardInstance } from './GameState.js';
import { getMat } from './Mats.js';

export interface PossessionInfo { possessedId: string; controllerId: string }

/** The Possession turn being played right now, if any. */
export function possessionOf(state: GameState): PossessionInfo | null {
    const t: any = state.currentExtraTurn;
    if (!t || t.type !== 'POSSESSION' || !t.controllerId) return null;
    return { possessedId: t.playerId, controllerId: t.controllerId };
}

/**
 * Who an incoming action really acts for. During a Possession turn, the controller acts for the
 * possessed player (their turn and their decisions); the possessed player cannot act for themself.
 * Returns null when the action must be refused.
 */
export function mapActor(state: GameState, playerId: string, action: { type: string }): string | null {
    const p = possessionOf(state);
    if (!p) return playerId;
    const target = action.type === 'CHOOSE'
        ? state.pendingDecision?.playerId
        : state.players[state.currentPlayerIndex]?.id;
    if (target !== p.possessedId) return playerId;
    if (playerId === p.controllerId) return p.possessedId;
    if (playerId === p.possessedId) return null;
    return playerId;
}

/** The player who actually gains a card that `player` would gain. */
export function gainRecipient(state: GameState, player: PlayerState): PlayerState {
    const p = possessionOf(state);
    if (!p || player.id !== p.possessedId) return player;
    return state.players.find(x => x.id === p.controllerId) || player;
}

/** During a Possession turn, the possessed player's trashed cards are set aside instead. */
export function interceptTrash(state: GameState, owner: PlayerState, card: CardInstance): boolean {
    const p = possessionOf(state);
    if (!p || owner.id !== p.possessedId) return false;
    getMat(owner, 'possessionTrash').push(card);
    return true;
}

/** End of the Possession turn: set-aside cards go to the possessed player's discard pile. */
export function endPossessionTurn(state: GameState, ending: PlayerState | undefined): void {
    if (!ending) return;
    const kept = getMat(ending, 'possessionTrash');
    if (kept.length) {
        ending.discardPile.push(...kept.splice(0));
    }
}

/** The player who must act for `seatId` right now (the controller during a Possession turn). */
export function actingPlayerFor(state: GameState, seatId: string): string {
    const p = possessionOf(state);
    return p && seatId === p.possessedId ? p.controllerId : seatId;
}
