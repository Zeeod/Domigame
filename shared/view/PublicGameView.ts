import { Prompt } from '../engine/prompts/Prompt';
import { Phase } from '../engine/GameState';
import { LogEntry } from '../types/Log';

/**
 * A unique, deterministic view of the game state for a specific player.
 * Security: This object must NEVER contain hidden information (enemy hand, deck, etc.)
 */
export interface PublicGameView {
    id: string; // Game ID or View ID
    /** The player receiving this view (contains private info like Hand) */
    you: PublicPlayerView;

    /** Other players (contains ONLY public info) */
    opponents: OpponentPlayerView[];

    /** Shared public state */
    isHost: boolean; // Is the viewer the host?
    supply: PublicSupplyPile[];
    trashCount: number;
    trashTop?: CardView; // Top card of trash is usually visible
    phase: Phase;
    turnPlayerId: string;

    /** 
     * Pending Prompt.
     * Only present if the viewer allows to see it (i.e. it is THEIR prompt).
     */
    pendingPrompt?: Prompt;

    /** Global logs */
    logs: LogEntry[];
}

/**
 * Common Card View
 * If card is hidden, only show ID/Name if strictly necessary, or generic "Back".
 * But commonly we just send instanceId if known, or ID.
 */
export interface CardView {
    id: string; // 'copper'
    instanceId: string; // 'copper_123'
    name?: string; // Optional display name
    // Cost/Types can be derived by Client from static data using 'id'
}

/**
 * Full view of the self (includes Hand)
 */
export interface PublicPlayerView {
    id: string;
    name: string;
    isBot: boolean;
    isReady: boolean;
    color: string;

    hand: CardView[]; // VISIBLE
    deckCount: number;
    discardCount: number;
    discardTop?: CardView;
    inPlay: CardView[];

    actions: number;
    buys: number;
    coins: number;
    score: number; // For self, we track score live
    vpTokens: number;
}

/**
 * Restricted view of opponents (NO Hand)
 */
export interface OpponentPlayerView {
    id: string;
    name: string;
    isBot: boolean;
    isReady: boolean;
    color: string;

    handCount: number; // COUNT ONLY
    deckCount: number;
    discardCount: number;
    discardTop?: CardView;
    inPlay: CardView[]; // Usually visible

    // Opponent resources are public knowledge in Dominion?
    // Yes, Actions/Buys/Coins are public info during their turn.
    actions: number;
    buys: number;
    coins: number;

    score?: number; // Usually hidden until end, but maybe tracked? 
    vpTokens: number;
}

export interface PublicSupplyPile {
    cardId: string;
    count: number;
    topCard?: CardView;
    // canBuy?: boolean; // Derived on client
}

export interface LogView {
    text: string;
    playerId?: string | null;
}
