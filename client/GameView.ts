/**
 * GameView - Client-side game state container
 * 
 * Stores public + private state received from server.
 * Replaces any local Game instance.
 * 
 * UI must:
 * - Render GameView
 * - Send intents
 * - NEVER infer rules
 */

import { PublicGameState, PrivatePlayerState, SerializedState } from "../shared/types/index.js";

export class GameView {
    /** Public state visible to all players */
    public publicState: PublicGameState | null = null;

    /** Private state for this player only */
    public privateState: PrivatePlayerState | null = null;

    /** This player's ID */
    public playerId: string | null = null;

    /**
     * Update the view with new state from server
     */
    update(state: SerializedState): void {
        this.publicState = state.public;
        this.privateState = state.private;
    }

    /**
     * Set this player's ID
     */
    setPlayerId(id: string): void {
        this.playerId = id;
    }

    // ========================================================================
    // Convenience Getters (for UI rendering)
    // ========================================================================

    get phase(): string {
        return this.publicState?.phase ?? 'PREGAME';
    }

    get turnNumber(): number {
        return this.publicState?.turnNumber ?? 0;
    }

    get isMyTurn(): boolean {
        if (!this.publicState || !this.playerId) return false;
        const currentPlayer = this.publicState.players[this.publicState.currentPlayerIndex];
        return currentPlayer?.id === this.playerId;
    }

    get currentPlayer() {
        if (!this.publicState) return null;
        return this.publicState.players[this.publicState.currentPlayerIndex];
    }

    get myHand() {
        return this.privateState?.hand ?? [];
    }

    get supply() {
        return this.publicState?.supply ?? {};
    }

    get players() {
        return this.publicState?.players ?? [];
    }

    get logs() {
        return this.publicState?.logs ?? [];
    }

    get pendingDecision() {
        return this.publicState?.pendingDecision ?? null;
    }

    get isMyChoice(): boolean {
        return this.pendingDecision?.playerId === this.playerId;
    }

    get isGameOver(): boolean {
        return this.publicState?.isGameOver ?? false;
    }

    get winnerId(): string | null {
        return this.publicState?.winnerId ?? null;
    }

    // ========================================================================
    // Resource Getters
    // ========================================================================

    get myActions(): number {
        const me = this.publicState?.players.find(p => p.id === this.playerId);
        return me?.actions ?? 0;
    }

    get myBuys(): number {
        const me = this.publicState?.players.find(p => p.id === this.playerId);
        return me?.buys ?? 0;
    }

    get myCoins(): number {
        const me = this.publicState?.players.find(p => p.id === this.playerId);
        return me?.coins ?? 0;
    }
}
