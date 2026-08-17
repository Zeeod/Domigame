import { PublicState, PrivateState, SerializedState } from '../shared/types';

/**
 * GameView - Single source of truth for UI rendering
 * 
 * Cette classe contient l'état reçu du serveur et ne fait AUCUNE logique de jeu.
 * L'UI lit uniquement depuis cette classe.
 */
export class GameView {
    public publicState: PublicState | null = null;
    public privateState: PrivateState | null = null;
    public isHost: boolean = false;
    public mySocketId: string = '';

    /**
     * Met à jour l'état depuis le payload serveur
     */
    updateFromServer(payload: SerializedState & { isHost?: boolean }): void {
        this.publicState = payload.public;
        this.privateState = payload.private;
        this.isHost = payload.isHost || false;
    }

    /**
     * Définit l'ID socket du joueur local
     */
    setMySocketId(id: string): void {
        this.mySocketId = id;
    }

    // === Getters pour les données privées (mon joueur) ===

    get myHand(): any[] {
        return this.privateState?.hand || [];
    }

    get myDeck(): any[] {
        return this.privateState?.deck || [];
    }

    get myActions(): number {
        return this.privateState?.actions || 0;
    }

    get myBuys(): number {
        return this.privateState?.buys || 0;
    }

    get myCoins(): number {
        return this.privateState?.coins || 0;
    }

    get myPlayArea(): any[] {
        return this.privateState?.playArea || [];
    }

    get myDeckCount(): number {
        return this.myPublicInfo?.deckCount || 0;
    }

    get myDiscardCount(): number {
        return this.myPublicInfo?.discardCount || 0;
    }

    get myScore(): number {
        return this.myPublicInfo?.score || 0;
    }

    // === Getters pour les données publiques ===

    get supply(): { [key: string]: any } {
        return this.publicState?.supply || {};
    }

    get players(): any[] {
        return this.publicState?.players || [];
    }

    get activePlayerIndex(): number {
        return this.publicState?.activePlayerIndex || 0;
    }

    get turnCount(): number {
        return this.publicState?.turnCount || 0;
    }

    get phase(): string {
        return this.publicState?.phase || 'lobby';
    }

    get trash(): any[] {
        return this.publicState?.trash || [];
    }

    get prompt(): string | undefined {
        return this.publicState?.prompt;
    }

    get logs(): { text: string, playerId: string | null }[] {
        return this.publicState?.logs || [];
    }

    // === Getters utilitaires ===

    get isLobby(): boolean {
        return this.phase === 'lobby';
    }

    get isGameActive(): boolean {
        return this.phase !== 'lobby' && this.phase !== 'GAME_OVER';
    }

    /**
     * Trouve le joueur actuel (celui dont c'est le tour)
     */
    get currentPlayer(): any | null {
        return this.players[this.activePlayerIndex] || null;
    }

    /**
     * Trouve mes informations publiques
     */
    get myPublicInfo(): any | null {
        return this.players.find(p => p.id === this.mySocketId) || null;
    }

    /**
     * Est-ce mon tour?
     */
    get isMyTurn(): boolean {
        const current = this.currentPlayer;
        return current ? current.id === this.mySocketId : false;
    }

    /**
     * Trouve les autres joueurs (adversaires)
     */
    get opponents(): any[] {
        return this.players.filter(p => p.id !== this.mySocketId);
    }

    /**
     * Trouve mon nom
     */
    get myName(): string {
        return this.myPublicInfo?.name || 'Joueur';
    }

    /**
     * Trouve ma couleur
     */
    get myColor(): string {
        return this.myPublicInfo?.color || '#fff';
    }
}

