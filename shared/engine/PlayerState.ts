/**
 * PlayerState - Canonical player state
 * 
 * Contains all player-specific data.
 * No UI logic. No network logic.
 */

import { CardInstance } from './CardInstance.js';

export interface PlayerState {
    /** Unique player identifier */
    id: string;

    /** Display name */
    name: string;

    /** Color for UI display */
    color: string;

    /** Is this player a bot? */
    isBot: boolean;

    /** Is this player the host? */
    isHost: boolean;

    /** Is this player ready? (pregame) */
    isReady: boolean;

    // ========================================
    // Card Zones
    // ========================================

    /** Cards in hand (visible only to this player) */
    hand: CardInstance[];

    /** Draw pile (face down) */
    deck: CardInstance[];

    /** Discard pile (face up) */
    discardPile: CardInstance[];

    /** Cards currently in play area */
    playArea: CardInstance[];

    /** Aside zone (for Duration cards, Library, etc) */
    aside: CardInstance[];

    /** Limbo zone (for revealed cards during effect resolution) */
    limbo: CardInstance[];

    /** Has played a Treasure this turn */
    hasPlayedTreasure: boolean;

    // ========================================
    // Turn Resources
    // ========================================

    /** Number of actions remaining this turn */
    actions: number;

    /** Number of buys remaining this turn */
    buys: number;

    /** Amount of coins available this turn */
    coins: number;

    /** Current score (calculated at game end or tracked) */
    score: number;

    /** Count of Merchants played this turn (for Silver bonus) */
    merchantsPlayed: number;

    /** Has the Silver bonus from Merchant been triggered this turn? */
    silverBonusTriggered: boolean;

    /** Global cost reduction for this turn (Bridge) */
    costReduction: number;
    /** Number of actions already played this turn (Conspirator) */
    actionsPlayed: number;

    /** Number of Silvers played this turn (Merchant) */
    silversPlayed: number;

    /** Track if a Victory card was bought this turn (Seaside - Treasury) */
    boughtVictoryCard: boolean;

    /** Number of cards gained this turn (Nocturne - Monastery) */
    cardsGainedThisTurn: number;

    /** Number of cards trashed this turn (Menagerie - Goatherd) */
    trashedThisTurn: number;

    /** If true, ignore extra actions (Menagerie - Snowy Village) */
    ignoreExtraActions?: boolean;

    /** Active triggers for this player (Rising Sun) */
    registeredTriggers?: {
        id: string;
        trigger: string;
        effects: any[];
        isPermanent: boolean;
        sourceCardInstanceId?: string;
    }[];

    /** Per-player turn counter */
    turnNumber: number;

    // ========================================
    // Seaside Mats
    // ========================================

    // ========================================



    // ========================================
    // Guilds Tokens
    // ========================================

    // ========================================
    // UNIVERSAL ARCHITECTURE (Generic)
    // ========================================

    /** 
     * Generic Mats for any expansion.
     * key: mat name (e.g., 'island', 'tavern', 'exile')
     */
    mats: Record<string, CardInstance[]>;

    /** 
     * Generic Tokens for any expansion.
     * key: token type (e.g., 'vp', 'debt', 'coffers', 'villagers', 'favors', 'project_cube', etc)
     */
    tokens: Record<string, number>;

    // ========================================
    // DEPRECATED / LEGACY (Mapped to tokens/mats getters)
    // ========================================
    // These will be removed in future phases but kept for compatibility during refactor.
    // They should be implemented as getters/setters in a class if possible, or just plain fields sync'd.
    // For now, we keep them as fields but will update TokenManager to sync them.

    coffers: number;
    villagers: number;
    debt: number;
    favors: number;
    vpTokens: number;
    coinTokens: number;
    potions: number;

    // Mats
    islandMat: CardInstance[];
    nativeVillageMat: CardInstance[];
    tavernMat: CardInstance[];
    exileMat: CardInstance[];

    // Valid for all expansions
    projects: string[];
    artifacts: string[];
    boons: string[];
    hexes: string[];
    /** Current card selection in UI (for sync) */
    currentSelection: string[];

    // Rising Sun / Adventures / Etc
    journeyTokenFaceUp: boolean;
    minusCoinToken: boolean;
    minusCardToken: boolean;
    permanentDurations: CardInstance[];
    cardsGainedLastTurn: number;
    sunToken: boolean;
    nextTurnDraw?: number;

    /** Flag tracking for "first time this turn" effects */
    turnFlags: Record<string, any>;
};

/**
 * Create a new player state with default values
 */
export function createPlayerState(id: string, name: string, color: string = '#ffffff'): PlayerState {
    return {
        id,
        name,
        color,
        isBot: false,
        isHost: false,
        isReady: false,
        hand: [],
        deck: [],
        discardPile: [],
        playArea: [],
        aside: [],
        limbo: [],
        actions: 0,
        buys: 0,
        coins: 0,
        score: 0,
        hasPlayedTreasure: false,
        merchantsPlayed: 0,
        silverBonusTriggered: false,
        costReduction: 0,
        actionsPlayed: 0,
        silversPlayed: 0,
        boughtVictoryCard: false,
        turnNumber: 0,

        // Universal Storage
        mats: (() => {
            const m = {
                island: [],
                nativeVillage: [],
                tavern: [],
                exile: [],
                prophecy: [], // Rising Sun
                sun: [],      // Rising Sun
                horse: []     // Menagerie? (Horse pile is separate usually)
            };
            return m;
        })(),
        tokens: {
            vp: 0,
            debt: 0,
            coffers: 0,
            villagers: 0,
            favors: 0,
            coin: 0,
            sun: 0,        // Rising Sun
            journey: 0,    // Adventures (0=face down, 1=face up)
            minusCoin: 0,  // Adventures
            minusCard: 0   // Adventures
        },

        // Legacy / Sync Fields
        coffers: 0,
        villagers: 0,
        debt: 0,
        favors: 0,
        vpTokens: 0,
        coinTokens: 0,
        potions: 0,
        get islandMat() { return this.mats.island; },
        set islandMat(v) { if (this.mats) this.mats.island = v; },
        get nativeVillageMat() { return this.mats.nativeVillage; },
        set nativeVillageMat(v) { if (this.mats) this.mats.nativeVillage = v; },
        get tavernMat() { return this.mats.tavern; },
        set tavernMat(v) { if (this.mats) this.mats.tavern = v; },
        get exileMat() { return this.mats.exile; },
        set exileMat(v) { if (this.mats) this.mats.exile = v; },

        projects: [],
        artifacts: [],
        boons: [],
        hexes: [],

        // Rising Sun specific (to be migrated to tokens/mats/flags)
        // journeyTokenFaceUp -> tokens.journey
        // minusCoinToken -> tokens.minusCoin
        journeyTokenFaceUp: false,
        minusCoinToken: false,
        minusCardToken: false,
        permanentDurations: [],
        cardsGainedLastTurn: 0,
        cardsGainedThisTurn: 0,
        trashedThisTurn: 0,
        ignoreExtraActions: false,
        sunToken: false, // -> tokens.sun > 0
        nextTurnDraw: 0,

        currentSelection: [],
        turnFlags: {},
    };
}

/**
 * Reset player resources for a new turn
 */
export function resetTurnResources(player: PlayerState): void {
    player.actions = 1;
    player.buys = 1;
    player.coins = 0;
    // Potions are now tokens or resources? 
    // Alchemy potions are "virtual" currency like coins, they don't persist.
    // So keep as turn resource or sync with temporary token.
    player.potions = 0;

    player.merchantsPlayed = 0;
    player.silverBonusTriggered = false;
    player.hasPlayedTreasure = false;
    player.costReduction = 0;
    player.actionsPlayed = 0;
    player.silversPlayed = 0;
    player.boughtVictoryCard = false;
    player.cardsGainedThisTurn = 0;
    player.trashedThisTurn = 0;
    player.ignoreExtraActions = false;
    player.turnFlags = {};
}

/**
 * Count total cards a player owns
 */
export function countTotalCards(player: PlayerState): number {
    let count = player.hand.length +
        player.deck.length +
        player.discardPile.length +
        player.playArea.length;

    // Add Generic Mats
    Object.values(player.mats).forEach(pile => count += pile.length);

    // Add Legacy Mats (if not using generic yet to avoid double counting if sync'd?
    // For now, implementation plan says "use generic". 
    // If migration is imperfect, we risk double counting.
    // Safest check: if mats['island'] exists, use it.

    return count;
}
