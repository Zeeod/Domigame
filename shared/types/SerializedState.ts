import { LogEntry } from './Log.js';

export interface SerializedCard {
    id: string;
    instanceId: string;
    name: string;
    isResolved?: boolean;
    durationTurns?: number;
    linkedCards?: SerializedCard[];
    turnPlayed?: number;
}

export interface PublicPlayerState {
    id: string;
    name: string;
    color: string;
    isBot: boolean;
    isHost: boolean;
    isReady: boolean;

    // Card zones
    handCount: number;
    deckCount: number;
    discardCount: number;
    discardPile: SerializedCard[]; // Public information in Dominion

    // Visible zones
    playArea: SerializedCard[];
    aside: SerializedCard[];
    limbo: SerializedCard[];
    /** Rising Sun: Shadow cards in the deck (their backs are unique, so this is public) */
    deckShadows?: SerializedCard[];
    /** Adventures: the pile each of this player's tokens is on (+1 Carte, −2 💰 de coût…) */
    advTokens?: Record<string, string>;
    /** Nocturne: States the player has (Lost in the Woods, Deluded…) */
    states?: string[];
    topDiscard?: SerializedCard;

    // Generic Storage (New)
    mats: Record<string, SerializedCard[]>;
    tokens: Record<string, number>;

    // Resources
    actions: number;
    buys: number;
    coins: number;
    /** Cards and Events bought this turn */
    boughtThisTurn?: number;
    vpTokens: number;
    costReduction: number;
    score: number;
    turnNumber: number;
    currentSelection: string[];

    // Guilds
    coffers: number;

    // Adventures - Plateau Taverne
    tavernMat: SerializedCard[];
    journeyTokenFaceUp: boolean;
    minusCoinToken: boolean;
    minusCardToken: boolean;
    permanentDurations: SerializedCard[];

    // Empires
    debt: number;

    // Alchemy
    potions: number;

    // Renaissance
    villagers: number;
    projects: string[];
    artifacts: string[];

    // Nocturne
    boons: string[];
    hexes: string[];

    // Menagerie
    exileMat: SerializedCard[];

    // Allies
    favors: number;

    // Rising Sun
    sunToken: boolean;
}


export interface PublicGameState {
    phase: string;
    turnNumber: number;
    currentPlayerIndex: number;
    isGameOver: boolean;
    winnerId: string | null;

    supply: Record<string, { cardId: string; count: number; isMixed?: boolean; topCardId?: string; tokens?: Record<string, number>; cost?: number }>;
    nonSupply: Record<string, { cardId: string; count: number; isMixed?: boolean; topCardId?: string; tokens?: Record<string, number> }>;
    landscapes: string[];
    /** Cards set aside at setup that players should see (Rising Sun — Riverboat), with what they belong to */
    setAsideForGame?: { cardId: string; label: string; sourceId?: string }[];
    /** Supply piles added on top of the 10 Kingdom piles (Approaching Army, Bane) */
    extraPiles?: { cardId: string; label: string; sourceId?: string }[];
    landscapeState: Record<string, {
        tokens: Record<string, number>;
        state: any;
    }>;
    trash: SerializedCard[];
    /** Per-game card changes (e.g. Charlatan: Curse is also a Treasure) */
    cardOverrides?: Record<string, any>;
    /** Per-player card changes (Inheritance), applied during that player's turns */
    playerCardOverrides?: Record<string, Record<string, any>>;
    /** Possession turn in progress (hand: only sent to the controller) */
    possession?: { possessedId: string; controllerId: string; hand?: SerializedCard[] };
    durations?: any[]; // Active multi-turn effects
    players: PublicPlayerState[];

    pendingDecision?: {
        id: string;
        playerId: string;
        type: string;
        message: string;
        min?: number;
        max?: number;
        options?: string[];
        constraints?: any;
        filter?: any;
        context?: any;
        optional?: boolean;
    };

    logs: LogEntry[];
    history?: any[]; // Simplified for now, or import LogEvent
    // Note: LogEvent is in engine/GameState.ts, avoiding circular dep if possible.
    // Ideally types shouldn't depend on engine.
    // For now using any or defining a simplified interface.

    gameResults?: {
        playerId: string;
        name: string;
        color: string;
        score: number;
        isWinner: boolean;
        turns?: number;
        /** Where the VP come from: a card id, a Landmark id, 'vpTokens' or 'other' */
        breakdown?: { source: string; count?: number; vp: number }[];
        /** Every card owned at the end */
        deck?: { cardId: string; count: number }[];
    }[];

    revealedCards?: {
        cards: SerializedCard[];
        visibleTo: string[] | 'ALL';
        cause?: string;
        autoHide?: boolean;
        highlightedIds?: string[];
    };
}

export interface PrivatePlayerState {
    hand: SerializedCard[];
    limbo: SerializedCard[];
    deckStats?: {
        score: number;
        wealthDensity: number;
        vpDensity: number;
        cyclingCapacity: number;
    };
}

export interface SerializedState {
    public: PublicGameState;
    private: PrivatePlayerState | null;
    spectatorData?: {
        playerId: string;
        hand: SerializedCard[];
        limbo: SerializedCard[];
    }[];
}
