import { produce } from 'immer';
import { PlayerState, createPlayerState } from './PlayerState.js';
import { CardInstance } from './CardInstance.js';
import { createCardInstance } from './CardInstance.js';
import { PromptType, PromptConstraints } from './prompts/Prompt.js';
import { EffectDefinition } from '../types/EffectDefinition.js';
import { LogEntry } from '../types/Log.js';

export type { PlayerState, CardInstance, PromptConstraints, EffectDefinition, LogEntry };
export { createCardInstance, PromptType, createPlayerState };

export interface EffectResult {
    state: GameState;
    needsChoice: boolean;
}

// ============================================================================
// Types
// ============================================================================

export type Phase = 'PREGAME' | 'START' | 'ACTION' | 'BUY' | 'NIGHT' | 'CLEANUP' | 'GAME_OVER' | (string & {});

export interface ExtraTurnInfo {
    playerId: string;
    type?: 'OUTPOST';
}

export interface StateSnapshot {
    logId: string; // The ID of the log event this snapshot belongs to
    state: string; // Serialized state
    timestamp: number;
}

/**
 * Utility to create a new game state
 */
export function createGameState(id: string): GameState {
    return {
        id,
        players: [],
        currentPlayerIndex: 0,
        extraTurns: [],
        phase: 'PREGAME',
        phasePipeline: [],
        phaseIndex: 0,
        boonDeck: [],
        boonDiscard: [],
        hexDeck: [],
        hexDiscard: [],
        turnNumber: 0,
        supply: {},
        nonSupply: {},
        landscapes: [],
        trash: [],
        history: [],
        effectStack: [],
        pendingDecision: null,
        revealedCards: null,
        isGameOver: false,
        winnerId: null,
        executionDepth: 0,
        gameResults: [],
        rng: {
            seed: id,
            state: undefined as number | undefined,
            callCount: 0
        },
        landscapeState: {},
        activeProphecyId: null,
        kingdomCards: [],
        triggers: [],
        durations: []
    };
}

export interface Effect {
    type: string;
    playerId: string;
    cardId?: string;
    amount?: number;
    destination?: string;
}

export interface EffectStep {
    type: string;
    playerId: string;
    effect?: EffectDefinition;
    context?: any;
}



export interface SupplyPile {
    cardId: string;
    count: number;
    tokens?: Record<string, number>;
    isMixed?: boolean;
    /** Traits applied to this pile (Plunder extension) */
    traits?: string[];
    cards: CardInstance[];
}

// ============================================================================
// Choice Options
// ============================================================================

export interface DecisionOption {
    label: string;
    value?: string | number;
    effects?: EffectDefinition[];
}

// ============================================================================
// Pending Decision (for interactive effects)
// ============================================================================

export interface PendingDecision {
    /** Unique ID for this decision */
    id: string;

    /** Player who must make the decision */
    playerId: string;

    /** Type of decision required */
    type: PromptType | string | 'ZONE_SEARCH';

    /** Human-readable prompt */
    message: string;

    /** Constraints for the decision */
    constraints?: PromptConstraints;

    /** Optional options for SELECT_OPTION prompts */
    options?: DecisionOption[];

    /** Optional context for effect resolution (e.g. isAuto, specialAction) */
    context?: any;

    /** Whether the decision is optional (can be passed) */
    optional?: boolean;
}

// ============================================================================
// Game State
// ============================================================================

export interface GameState {
    id: string;
    players: PlayerState[];
    currentPlayerIndex: number;
    /** Queue of extra turns with metadata (Outpost, etc) */
    extraTurns: ExtraTurnInfo[];
    phase: Phase;
    /** Dynamic phase pipeline for the current turn */
    phasePipeline: string[];
    /** Current index into the phase pipeline */
    phaseIndex: number;
    /** Nocturne - Boons deck and discard */
    boonDeck: string[];
    boonDiscard: string[];

    /** Nocturne - Hexes deck and discard */
    hexDeck: string[];
    hexDiscard: string[];
    turnNumber: number;
    supply: Record<string, SupplyPile>;
    /** Non-supply piles (Ruins, Spoils, Madman, Mercenary) */
    nonSupply: Record<string, SupplyPile>;
    /** Active Landscapes (Events, Landmarks, Projects, Ways, Traits) */
    landscapes: string[];
    /** List of cards in the trash */
    trash: CardInstance[];
    /** Tracking last card(s) trashed for effects like Forge or Upgrade */
    lastTrashedCard?: CardInstance | null;
    lastTrashedCards?: CardInstance[] | null;
    /** Tracking results of last decision (e.g. cards chosen) for contextual effects like Vault */
    lastDecisionResults?: { cards?: CardInstance[]; optionIndex?: number } | null;
    /** Tracking last card(s) revealed for effects like Courtier */
    effectStack: EffectStep[];
    history: LogEntry[];
    pendingDecision: PendingDecision | null;
    revealedCards: {
        cards: CardInstance[];
        visibleTo: string[] | 'ALL';
        cause?: string;
        autoHide?: boolean;
        highlightedIds?: string[];
    } | null;
    /** Tracking last card(s) revealed for effects like Courtier */
    lastRevealedCards?: CardInstance[] | null;
    /** Last card gained by ANY player this turn (used by Ironworks, Replace) */
    lastGainedCard?: CardInstance;

    /** Last card ID bought by current player this turn (used by Haggler, Merchant Guild) */
    lastBoughtCardId?: string;

    /** Cost of the last card bought (with reductions) */
    lastBoughtCost?: number;
    /** Cost of the last card gained (used by Taskmaster) */
    lastGainedCost?: number;
    isGameOver: boolean;
    winnerId: string | null;
    executionDepth: number;
    gameResults: {
        playerId: string;
        name: string;
        color: string;
        score: number;
        isWinner: boolean;
    }[];
    rng: {
        seed: string;
        state?: number;
        callCount: number;
    };
    /** Enchantress (Empires) tracking */
    activeEnchantresses?: string[]; // IDs of players who played Enchantress
    enchantressAffectedPlayers?: string[]; // Players who already had an Action modified this turn

    // ========================================
    // UNIVERSAL ARCHITECTURE (Generic)
    // ========================================

    /** 
     * Generic state for Landscapes (Events, Landmarks, Projects, etc.)
     * key: cardId or instanceId
     */
    landscapeState: Record<string, {
        tokens: Record<string, number>;
        state: any;
    }>;
    /** Rising Sun - Active Prophecy ID */
    activeProphecyId: string | null;

    /** Promo - Black Market side deck */
    blackMarketDeck?: CardInstance[];
    /** Promo - Current revealed cards from Black Market */
    blackMarketRevealed?: CardInstance[];
    /** Kingdom cards selected for this game */
    kingdomCards: string[];
    /** Triggered effects tracking */
    triggers: {
        type: string;
        playerId: string;
        filter?: any; // CardFilter
        effect?: any;
        effects?: EffectDefinition[];
        sourceCardInstanceId?: string;
        once?: boolean;
    }[];

    /** Active duration card entries (DurationTracker) */
    durations: {
        cardInstanceId: string;
        cardId: string;
        playerId: string;
        turnsRemaining: number | 'PERMANENT' | 'CONDITIONAL';
        conditionKey?: string;
        effects: EffectDefinition[];
        registeredOnTurn?: number;
    }[];

    /** Tokens on specific card instances (e.g. Garrison) */
    cardTokens?: Record<string, number>;

    /** Game-wide restrictions (e.g. Longship, Warlord, Swamp Hag) */
    activeRestrictions?: {
        type: string;
        minCost?: number;
        sourcePlayerId: string;
        expiresOnTurn?: number;
        [key: string]: any;
    }[];
}
/**
 * Utility to get current player state
 */
export function getCurrentPlayer(state: GameState): PlayerState {
    return state.players[state.currentPlayerIndex];
}

/**
 * Utility to clone the game state for immutability
 * Optimized for performance (avoiding JSON.parse/stringify)
 */
/**
 * Utility to clone the game state for immutability.
 * @deprecated Use Immer produce() instead for better performance and structural sharing.
 */
export function cloneGameState(state: GameState, lightweight: boolean = false): GameState {
    return produce(state, (draft: any) => {
        if (lightweight) {
            draft.revealedCards = null;
        }
    });
}
