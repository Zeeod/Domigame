/**
 * CardInstance - A specific card instance in the game
 * 
 * Separates card identity (id) from card instance (instanceId).
 */

export interface CardInstance {
    /** Card definition ID (e.g., 'copper', 'village') */
    id: string;

    /** Unique instance ID for tracking this specific card */
    instanceId: string;

    /** For duration cards: true if its effects for the current cycle are finished */
    isResolved?: boolean;

    /** For duration cards: number of turns remaining (0 = cleanup this turn) */
    durationTurns?: number;

    /** Cards linked to this instance (e.g., Haven set-aside card) */
    linkedCards?: CardInstance[];

    /** The turn number when this card was played (for Duration display logic) */
    turnPlayed?: number;

    /** Plunder - Shy trait: cannot be played this turn */
    shy?: boolean;

    /** Plunder - Inherited trait: counts as a starting card and has Heritage type */
    inherited?: boolean;

    /** Dynamic types added during the game (e.g. Heritage from Inherited trait) */
    additionalTypes?: any[];
}

let instanceCounter = 0;

/**
 * Create a new card instance
 */
export function createCardInstance(cardId: string): CardInstance {
    return {
        id: cardId,
        instanceId: `${cardId}_${Date.now()}_${++instanceCounter}`
    };
}

/**
 * Create multiple card instances
 */
export function createCardInstances(cardId: string, count: number): CardInstance[] {
    const instances: CardInstance[] = [];
    for (let i = 0; i < count; i++) {
        instances.push(createCardInstance(cardId));
    }
    return instances;
}
