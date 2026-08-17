export enum PromptType {
    CHOOSE_CARDS = "CHOOSE_CARDS",
    CONFIRM = "CONFIRM", // For simple yes/no or acknowledgments
    PLAY_ACTION = "PLAY_ACTION", // If needed for complex turn phases, though usually covered by intents.
    SELECT_OPTION = "SELECT_OPTION",
    YES_NO = "YES_NO",
    ZONE_SEARCH = "ZONE_SEARCH",
    NAME_CARD = "NAME_CARD",
    REORDER = "REORDER",
    DECK_INSERTION = "DECK_INSERTION",
    SENTRY_INTERACTION = "SENTRY_INTERACTION",
    COMPOSITE_FILTER = "COMPOSITE_FILTER"
}

export interface PromptConstraints {
    min: number;
    max: number;
    sourceZone?: "hand" | "discardPile" | "supply" | "trash" | "playArea" | "aside" | "limbo" | "deck" | string;
    allowedCardIds?: string[]; // Specific allowed card definition IDs (e.g. "copper")
    filter?: {
        maxCost?: number;
        minCost?: number;
        exactCost?: number;
        cardIds?: string[];
        cardTypes?: string[];
        allowedTypes?: string[];
        excludeTypes?: string[];
        uniqueNames?: boolean;
    };
    actionType?: 'TRASH' | 'DISCARD' | 'GAIN' | 'TOPDECK' | 'GENERIC'; // Determines Theme
    exclusive?: boolean; // For SELECT_OPTION: cannot pick same option twice
}

/**
 * Universal Decision Object (DTO for client)
 * Standardized for all card selection scenarios.
 */
export interface Prompt {
    id: string;
    playerId: string;
    type: PromptType;
    message: string;
    constraints: PromptConstraints;
    context?: any; // For Effect resolution context
}

// Alias to match user request for 'DecisionRequest' terminology in some parts of the system
export type DecisionRequest = Prompt;

export interface CompositeBucketDefinition {
    id: string;
    label: string;
    min?: number;
    max?: number;
    reorder?: boolean;
}
