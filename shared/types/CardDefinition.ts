/**
 * CardDefinition - Static card data
 * 
 * Cards contain ONLY data.
 * No card-specific logic.
 * The engine interprets these definitions.
 */

import { EffectDefinition } from './EffectDefinition.js';

// ============================================================================
// Card Types
// ============================================================================

export type CardType = 'TREASURE' | 'VICTORY' | 'ACTION' | 'ATTACK' | 'REACTION' | 'CURSE' | 'DURATION' | 'LOOTER' | 'SHELTER' | 'RUINS' | 'KNIGHT' | 'RESERVE' | 'TRAVELLER' | 'EVENT' | 'LANDMARK' | 'CASTLE' | 'GATHERING' | 'NIGHT' | 'PROJECT' | 'WAY' | 'ALLY' | 'PROPHECY' | 'SPIRIT' | 'ZOMBIE' | 'BOON' | 'HEX' | 'STATE' | 'ARTIFACT' | 'AUGUR' | 'CLASH' | 'FORT' | 'ODYSSEY' | 'TOWNSFOLK' | 'WIZARD' | 'LIAISON' | 'FATE' | 'DOOM' | 'SHADOW' | 'HEIRLOOM' | 'PRIZE' | 'LOOT' | 'TRAIT' | 'OMEN' | 'COMMAND';

// ============================================================================
// Card Definition
// ============================================================================

export interface CardDefinition {
    /** Unique identifier */
    id: string;

    /** Display name */
    name: string;

    /** Base cost in coins */
    cost: number;

    /** Debt cost in tokens (Empires) */
    debtCost?: number;

    /** Potion cost (Alchemy) */
    potionCost?: number;

    /** Secondary types */
    types: CardType[];

    /** Effects when played (Action cards) */
    effects?: EffectDefinition[];

    /** Effects triggered at the start of the next turn (Duration cards) */
    durationEffects?: EffectDefinition[];

    /** Effects triggered at the start of every turn (Projects/Landmarks) */
    onTurnStart?: EffectDefinition[];

    /** How many turns this card stays in play (for durations). 1 = next turn, 2 = next 2 turns, etc. */
    durationTurns?: number;

    /** Effects triggered when this card is trashed */
    onTrash?: EffectDefinition[];

    /** Effects triggered when this card is gained */
    onGain?: EffectDefinition[];

    /** Effects triggered when this card is discarded (e.g. Tunnel) */
    onDiscard?: EffectDefinition[];

    /** Effects triggered when this card is bought (e.g. Noble Brigand, Ill-Gotten Gains) */
    onBuy?: EffectDefinition[];

    /** Effects triggered when this card is played (specifically for Traits like reckless, inspiring) */
    onPlay?: EffectDefinition[];



    /** Potions provided when played (Alchemy) */
    potionValue?: number;

    /** Effects triggered when this card is moved from play to discard during cleanup (Empires - Capital) */
    onCleanup?: EffectDefinition[];

    /** Effects when overpaying for a card (Guilds) */
    overpay?: {
        enabled: boolean;
        effects: EffectDefinition[];
    };

    /** Night phase effects (Nocturne) */
    nightEffects?: EffectDefinition[];

    /** Treasure value (Treasure cards) */
    treasureValue?: number;

    /** Money value provided when played (for cards like Harem/Minion) */
    moneyValue?: number;

    /** Victory points (Victory cards) - static value */
    victoryPoints?: number;

    /** If true, this card is calculated dynamically (e.g., Gardens) */
    dynamicVP?: boolean;

    /**
     * Dynamic VP calculator function.
     * When present, called at game end to compute the card's VP value.
     * Receives all cards the player owns and a getCardDef helper to look up definitions.
     * Replaces hard-coded `if (card.id === 'gardens')` chains.
     */
    vpCalculator?: (allCards: { id: string }[], getCardDef: (id: string) => CardDefinition | undefined) => number;

    /** Card description */
    description?: string;

    /** Is this a Reaction card? */
    isReaction?: boolean;

    /** What triggers the reaction? */
    reactionTrigger?: 'ATTACK' | 'GAIN' | 'TRASH' | 'BUY' | 'REVEAL' | 'DISCARD' | 'ANY';

    /** Does this reaction block the attack (e.g. Moat)? */
    blocksAttack?: boolean;

    /** Effects when reacting */
    reactionEffects?: EffectDefinition[];

    /** Alternative name for reactionEffects for compatibility/clarity */
    onReaction?: EffectDefinition[];

    /** Condition to be able to react */
    reactionCondition?: { type: 'HAND_SIZE' | 'GAIN_TYPE', comparator?: '<=' | '>=' | '==', value: any };

    /** Is this a legacy card (e.g. 1st Edition)? */
    isLegacy?: boolean;

    /** Path to card image */
    image?: string;

    /** Expansion name */
    expansion?: string;

    /** Set name (e.g. 'seaside', 'base') */
    set?: string;

    /** Global buy restrictions (e.g. Grand Market) */
    buyRestriction?: {
        type: 'NO_COPPER_IN_PLAY';
    };

    /** Mixed Pile Definition (e.g. Knights, Ruins, Castles, Split Piles) */
    mixedPile?: {
        type: 'SHUFFLED' | 'ORDERED' | 'ROTATING';
        cards: string[]; // List of card IDs in the pile
    };

    /** If true, this card is part of a mixed pile and should not be in the supply generator candidates (e.g. Dame Anna) */
    isSubCard?: boolean;

    /** Passive triggers while in play (e.g. Hoard, Tiara) */
    triggers?: CardTrigger[];

    /** If true, this card is not in the supply (e.g. Traveller upgrades, Spirits, Zombies) */
    isNonSupply?: boolean;

    /** For Traveller cards: what card this upgrades to */
    upgradesTo?: string;

    /** If true, this Duration stays in play for the rest of the game (e.g. Hireling, Champion) */
    isPermanentDuration?: boolean;

    /** Heirloom card ID that replaces a starting Copper (Nocturne) */
    heirloom?: string;

    /** Linked non-supply card ID (e.g. Necromancer->Zombie, Exorcist->Spirit) */
    linkedCard?: string;

    /** If true, this is a virtual pile representative for the gallery */
    isPile?: boolean;

    /** Effects when a Prophecy is fulfilled */
    fulfillmentEffects?: EffectDefinition[];

    /** Condition to remove a Sun token from this Prophecy (Rising Sun) */
    prophecyTrigger?: {
        event: 'GAIN_CARD' | 'BUY_CARD' | 'TRASH_CARD' | 'PLAY_CARD' | 'TURN_START';
        filter?: any;
        condition?: (state: any, context: any) => boolean;
        minCost?: number;
    };

    /** Errata or official clarification text for the card inspector */
    errata?: string;

    /** Explicitly linked cards for preview (e.g. Spirits, Zombies, etc.) */
    relatedCardIds?: string[];

    /** Custom cost modifier key (Menagerie) */
    costModifier?: 'DESTRIER' | 'FISHERMAN' | 'WAYFARER' | string;
}

export interface CardTrigger {
    trigger: 'ON_BUY' | 'ON_GAIN' | 'ON_OPPONENT_GAIN' | 'START_BUY_PHASE' | 'ON_CLEANUP' | 'START_TURN' | 'ON_PLAY';
    /** Filter for the card being bought/gained to trigger this */
    filter?: {
        cardTypes?: CardType[];
        cardIds?: string[];
        matchLinkedId?: boolean;
    };
    effects: EffectDefinition[];
}

/**
 * Checks if a card has a specific type
 */
export function hasType(card: CardDefinition, type: CardType): boolean {
    return card.types.includes(type);
}

/**
 * Checks if a card is playable (Action or Treasure)
 */
export function isPlayable(card: CardDefinition): boolean {
    return hasType(card, 'ACTION') || hasType(card, 'TREASURE');
}
