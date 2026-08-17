export type LogEventType =
    | 'PHASE_CHANGE' // "--- Phase Achat ---"
    | 'PLAY_CARD'    // "Joue [Village]"
    | 'BUY_CARD'     // "Achète [Or]"
    | 'GAIN_CARD'    // "Gagne [Malédiction]"
    | 'TRASH_CARD'   // "Écarte [Cuivre]"
    | 'DISCARD_CARDS' // "Défausse [X, Y]"
    | 'DRAW_CARDS'    // "Pioche 5 cartes"
    | 'ATTACK'       // "Attaque avec [Sorcière]"
    | 'REACTION'     // "Révèle [Douves]"
    | 'TEXT'         // Fallback for generic messages
    | 'GAME_OVER'
    | 'TURN_START'
    | 'EFFECT_CHOICE'
    | 'REVEAL';

export interface LogPayload {
    amount?: number;
    targets?: string[]; // IDs of other players affected
    text?: string;      // Custom text if needed
    cardIds?: string[]; // List of cards (e.g., for "Trashed X, Y, Z")
    source?: string;    // e.g. "from trash", "from supply"
    cardId?: string;
    wayId?: string;
    choice?: any;
    destZone?: string;
    index?: number;
}

export interface LogEntry {
    id: string;
    timestamp: number;
    type: LogEventType;
    playerId?: string; // The actor
    cardId?: string;   // The primary card involved
    message: string;   // Human readable message
    payload?: LogPayload;
    indent?: number;   // Serialization only? No, engine too for "Gagné via X"
    privateData?: {
        type: string;
        forPlayerId: string;
        cardIds?: string[];
    };
    sequenceNumber?: number;
}

