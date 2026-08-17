/**
 * EffectDefinition - Declarative effect types
 * 
 * Effects are pure data. No logic here.
 * The EffectEngine interprets these definitions.
 */

// ============================================================================
// Effect Union Type
// ============================================================================

export type EffectDefinition =
    | DrawEffect
    | AddActionEffect
    | AddBuyEffect
    | AddMoneyEffect
    | AddPotionEffect
    | ModifyResourceEffect
    | GainCardEffect
    | GainCardPlusCostEffect
    | TrashEffect
    | ChoiceEffect
    | DiscardEffect
    | AttackEffect
    | ConditionEffect
    | RevealAndPutInHandEffect
    | MultiplyMoneyEffect
    | PassToLeftEffect
    | SwindlerAttackEffect
    | ReplaceAttackEffect
    | NameCardEffect
    | MoveToPositionEffect
    | AllOthersDrawEffect
    | RevealVictoryToDeckEffect
    | RevealUntilTreasuresEffect
    | DrawUntilHandSizeEffect
    | PlayActionTwiceEffect
    | PlayActionThriceEffect
    | SelectFromDiscardEffect
    | TopdeckFromHandEffect
    | RevealAndPlayActionEffect
    | DiscardPerEmptySupplyEffect
    | MerchantBonusEffect
    | TopdeckFromDiscardEffect
    | BanditAttackEffect
    | SentryLookAtEffect
    | RevealAndTrashTreasureEffect
    | DiscardToHandSizeEffect
    | DiscardDownToEffect
    | DiscardThenDrawEffect
    | ChooseOptionEffect
    | ChooseFromZoneEffect
    | ReduceCostsEffect
    | AddCostReductionEffect
    | ProcessMasqueradeFinishEffect
    | TrashSelfEffect
    | RevealCardsEffect
    | MoveCardsEffect
    | SelectAndApplyEffect
    | ReorderEffect
    | PlayTargetEffect
    | SetAsideLinkedEffect
    | ReturnLinkedCardsEffect
    | MoveToMatEffect
    | TakeFromMatEffect
    | CheckPreviousTurnEffect
    | RevealUntilEffect
    | AddTokenEffect
    | ScheduleExtraTurnEffect
    | PeekBottomEffect
    | RevealHandEffect
    | ReturnToSupplyEffect
    | IfEmptyPilesEffect
    | SequenceEffect
    | GainCardExactCostEffect
    | GainCopyOfTargetEffect
    | RevealAndApplyEffect
    | OtherPlayersEffect
    | AddVictoryTokensEffect
    | KnightAttackEffect
    | KnightAttackStepEffect
    | SeaChartCheckEffect
    | EachPlayerEffect
    | PeekTopDeckEffect
    | DiscardTopDeckEffect
    // Guilds mechanics
    | AddCoffersEffect
    | SpendCoffersEffect
    | OverpayEffect
    // Adventures mechanics
    | MoveToTavernEffect
    | CallFromTavernEffect
    | FlipJourneyTokenEffect
    | TakeMinusCoinTokenEffect
    | TakeMinusCardTokenEffect
    | ExchangeTravellerEffect
    | PermanentDurationEffect
    // Empires mechanics
    | TakeDebtEffect
    | PayDebtEffect
    | GatherVpEffect
    | TakeVpFromPileEffect
    | RevealTopDeckEffect
    | CompareTopDeckWithNeighborEffect
    | SwitchOnLastTrashedEffect
    | DrawTreasuresEffect
    | ReplaceActionInstructionsEffect
    | PlayAsSupplyActionEffect
    | RecursiveApplyEffect
    | ChangePhaseEffect
    | AddVpTokensEffect
    | AddVpTokensPerMovedEffect
    | AddCardsPerActionInPlayEffect
    | GladiatorRevealResponseEffect
    // Additional Adventures
    | SetAsideEffect
    | PutCopperOnTavernEffect
    | ReturnSetAsideToHandEffect
    | AddMoneyPerCopperOnTavernEffect
    | DeckToDiscardEffect
    | RevealTopOfDeckEffect
    | AddVillagersEffect
    | AddCoinsPerCardsEffect
    | TakeArtifactEffect
    | RecruiterEffect
    | DiscardHandEffect
    | MoveGainedToHandEffect
    | ReorderRemainingRevealedEffect
    | ChooseFromRevealedEffect
    | MonasteryEffect
    | ExorcistEffect
    | ReceiveHexEffect
    | ReceiveBoonEffect
    | DruidChooseBoonEffect
    | ModifyTokenEffect
    | DiscardDeckEffect
    | AddMoneyPerUnusedActionEffect
    | CostReductionEffect
    | DiscardToDeckEffect
    | PlayThisCardEffect
    | GainThisCardEffect
    | DiscardWithConditionEffect
    | AddMoneyPerCardInHandEffect
    | GainCopyOfSelfEffect
    | TopdeckWhenDiscardedEffect
    | GainCopyOfSelfEffect
    | TopdeckWhenDiscardedEffect
    | GainCardRelativeToDiscardEffect
    | GainStatsByCostEffect
    // Alchemy Effects
    | AddMoneyPotionEffect
    | SetupAlchemistReactionEffect
    | ApothecaryEffect
    | ScryingPoolAttackEffect
    | ScryingPoolDrawEffect
    | GainCurseToOthersEffect
    // Allies mechanics
    | AddFavorsEffect
    | SpendFavorsEffect
    | RotatePileEffect
    | SetupHerbalistReactionEffect
    | PhilosophersStoneEffect
    | PossessionEffect
    | TransmuteEffect
    | GainCardFromSupplyEffect
    | ReturnToPileEffect
    | GainLootEffect
    | ShadowEffect
    | RemoveSunTokenEffect
    | FulfillProphecyEffect
    | RegisterTriggerEffect
    | GainTeaEffect
    | SpendTeaEffect
    | IncreaseEnlightenmentEffect
    // Promo mechanics
    | TopdeckThisEffect
    | SentryInteractionEffect
    | BuyCardFromZoneEffect
    | PlayLastSelectedEffect
    | BuyLastSelectedEffect
    | FinalizeCleanupEffect
    | StartNextTurnEffect
    | CompositeFilterEffect
    | AbundanceEffect
    | PendantEffect
    | TaskmasterEffect
    | MaroonEffect
    | FortuneHunterEffect
    | SearchEffect
    | MapmakerEffect
    | FirstMateEffect
    | LongshipEffect
    | CutthroatAttackEffect
    | FrigateAttackEffect
    | TricksterAttackEffect
    | MaroonResolveEffect
    | PilgrimMoveCheckEffect
    | ToolsMoveCheckEffect
    | ReplayLastActionEffect
    | BarbarianAttackEffect
    | NextGainToDeckEffect
    | DrawPerCostEffect
    | AddActionsPerCostEffect
    | AddMoneyPerCostEffect
    | AddFavorsPerCostEffect
    | CarpenterEffect
    | CourierEffect
    | HighwaymanAttackEffect
    | HunterEffect
    | RoyalGalleyEffect
    | SentinelEffect
    | SpecialistEffect
    | SwapEffect
    | SycophantEffect
    | SorceressAugurAttackEffect
    | ArcherAttackEffect
    | WarlordEffect
    | GainGoldPerEmptyPilesEffect
    | AddTokenToThisEffect
    | DrawPerTokenOnThisEffect
    | ScheduleNextTurnEffect
    | GainCardNotInPlayEffect
    | SelectFromTopdeckEffect
    | ElderEffect
    | StudentEffect
    | MoveThisToHandEffect
    | SorcererWizardAttackEffect
    | LichTrashEffect
    | AristocratEffect
    | ArtistEffect
    | ChangeEffect
    | DaimyoEffect
    | ImperialEnvoyEffect
    | MountainShrineEffect
    | RiceBrokerEffect
    | RiverShrineEffect
    | SnakeWitchAttackEffect
    | DurationEffect
    | PlayAgainEffect
    | ReturnToPileEffect
    | MoveGainedCardEffect
    | WayButterflyEffect
    | DrawAtEndOfTurnEffect
    | SetAsideForNextTurnEffect
    | ExileSelfEffect;

export interface WayButterflyEffect {
    type: 'WAY_BUTTERFLY_EFFECT';
}

export interface DrawAtEndOfTurnEffect {
    type: 'DRAW_AT_END_OF_TURN';
}

export interface SetAsideForNextTurnEffect {
    type: 'SET_ASIDE_FOR_NEXT_TURN';
}

export interface ExileSelfEffect {
    type: 'EXILE_SELF';
}

export interface SentryInteractionEffect {
    type: 'SENTRY_INTERACTION';
    amount: number;
    message?: string;
}


export interface ModifyTokenEffect {
    type: 'MODIFY_TOKEN';
    /** 'vp', 'debt', 'coffers', 'villagers', 'favors', etc. */
    token: string;
    amount: EffectAmount;
}

export interface DiscardDeckEffect {
    type: 'DISCARD_DECK';
}

export interface AddMoneyPerUnusedActionEffect {
    type: 'ADD_MONEY_PER_UNUSED_ACTION';
    amount: number;
}

export interface CostReductionEffect {
    type: 'ADD_COST_REDUCTION';
    amount: number;
}

export interface DiscardToDeckEffect {
    type: 'DISCARD_TO_DECK';
}

export interface TakeArtifactEffect {
    type: 'TAKE_ARTIFACT';
    artifact: 'flag' | 'treasure_chest' | 'key' | 'horn' | 'lantern';
}

export interface PlayThisCardEffect {
    type: 'PLAY_THIS_CARD';
    optional?: boolean;
}

export interface GainThisCardEffect {
    type: 'GAIN_THIS_CARD';
    destination?: 'hand' | 'discardPile' | 'deck';
}

export interface DiscardWithConditionEffect {
    type: 'DISCARD_WITH_CONDITION';
    min: number;
    max: number;
    condition: ConditionEffect['condition'] | { type: string, [key: string]: any };
    cardType?: string;
    trueEffects: EffectDefinition[];
    falseEffects?: EffectDefinition[];
}

export interface GladiatorRevealResponseEffect {
    type: 'GLADIATOR_REVEAL_RESPONSE';
}

export interface RevealCardsEffect {
    type: 'REVEAL_CARDS';
    amount: EffectAmount;
    source?: 'deck' | 'hand' | 'limbo';
    destination?: 'hand' | 'discardPile' | 'deck' | 'limbo' | 'aside';
    private?: boolean;
    /** Apply to cards that match the filter */
    onMatches?: EffectDefinition[];
    /** Apply to the rest */
    onRest?: EffectDefinition[];
    filter?: CardFilter;
    next?: EffectDefinition[];
}

export interface RevealUntilEffect {
    type: 'REVEAL_UNTIL';
    condition: CardFilter;
    /** Number of matches to find */
    amount?: number | EffectAmount;
    limit?: number;
    destination?: 'hand' | 'discardPile' | 'deck' | 'limbo' | 'aside';
    failDestination?: 'hand' | 'discardPile' | 'deck' | 'limbo' | 'aside';
    /** Apply to matching cards */
    onMatch?: EffectDefinition[];
    /** Apply to non-matching cards */
    onFail?: EffectDefinition[];
}

export interface GainLootEffect {
    type: 'GAIN_LOOT';
    count?: number;
    destination?: 'discardPile' | 'hand' | 'deck';
}

export interface ShadowEffect {
    type: 'SHADOW_EFFECT';
    /** Sub-type of shadow effect */
    trigger: 'START_DRAW' | 'DURING_DRAW';
    effects: EffectDefinition[];
}

export interface RemoveSunTokenEffect {
    type: 'REMOVE_SUN_TOKEN';
    amount?: number;
}

export interface FulfillProphecyEffect {
    type: 'FULFILL_PROPHECY';
    prophecyId: string;
}

export interface GainTeaEffect {
    type: 'GAIN_TEA';
    amount: number;
}

export interface SpendTeaEffect {
    type: 'SPEND_TEA';
    amount: number;
}

export interface IncreaseEnlightenmentEffect {
    type: 'INCREASE_ENLIGHTENMENT';
    amount: number;
}

export type EffectAmount =
    | number
    | { type: 'COUNT_UNIQUE_CARDS_IN_TRASH' }
    | { type: 'COUNT_DISCARDED' }
    | { type: 'COUNT_CARDS_IN_HAND', filter: { types?: string[] } }
    | { type: 'COUNT_CARDS_IN_PLAY', filter: { types?: string[] } }
    | { type: 'DYNAMIC', metric: 'HAND_SIZE' | 'COINS' | 'ACTIONS' | 'BUYS' | 'PLAY_AREA_COUNT' | 'DISCARD_PILE_COUNT' | 'DECK_COUNT' | 'TOTAL_CARDS' | 'DISTINCT_CARDS_IN_PLAY' | 'VICTORY_CARDS_IN_HAND' | 'ACTIONS_IN_PLAY' | 'TREASURES_IN_PLAY' | 'EMPTY_PILES', multiplier?: number }
    | { type: 'LAST_TRASHED_COST' }
    | 'LAST_TRASHED_COST'
    | 'HALF_LAST_TRASHED_COST'
    | 'COUNT_GAINED_THIS_TURN';

export interface GainCardRelativeToDiscardEffect {
    type: 'GAIN_CARD_RELATIVE_TO_DISCARD';
    costBonus: number;
    destination?: 'discardPile' | 'hand' | 'deck';
}

export interface GainCardExactCostEffect {
    type: 'GAIN_CARD_EXACT_COST';
    useTotalTrashedCost?: boolean;
    exactCost?: number;
    destination: 'discardPile' | 'hand' | 'deck';
}

export interface GainCopyOfTargetEffect {
    type: 'GAIN_COPY_OF_TARGET';
}

export interface RevealAndApplyEffect {
    type: 'REVEAL_AND_APPLY';
    amount: number;
    from: 'deck';
    onActionsTreasures: { action: 'DISCARD' | 'TRASH' };
    onOthers: { action: 'TOPDECK_ORDER' | 'DISCARD' };
}

export interface BuyCardFromZoneEffect {
    type: 'BUY_CARD_FROM_ZONE';
    sourceZone: string;
}

export interface PlayLastSelectedEffect {
    type: 'PLAY_LAST_SELECTED';
}

export interface BuyLastSelectedEffect {
    type: 'BUY_LAST_SELECTED';
}

export interface OtherPlayersEffect {
    type: 'OTHER_PLAYERS_EFFECT';
    effect: EffectDefinition;
}

export interface IfEmptyPilesEffect {
    type: 'IF_EMPTY_PILES';
    minPiles: number;
    effect: EffectDefinition;
}

export interface SequenceEffect {
    type: 'SEQUENCE';
    effects: EffectDefinition[];
}

// ============================================================================
// Effect Types
// ============================================================================

export interface AddVictoryTokensEffect {
    type: 'ADD_VICTORY_TOKENS';
    amount: EffectAmount;
}

// ============================================================================
// Effect Types
// ============================================================================

export interface ChooseOptionEffect {
    type: 'CHOOSE_OPTION' | 'SELECT_OPTION';
    options: { label: string; value?: any; effects?: EffectDefinition[]; command?: string }[];
    count?: number;
    message?: string;
    /** For cards like Pawn: choices must be different */
    different?: boolean;
    /** For cards like Courtier: count is based on revealed card types */
    variableCount?: 'REVEAL_TYPES';
    /** Min options to choose (defaults to count) */
    min?: number;
    /** Max options to choose (defaults to count) */
    max?: number;
    /** For Kitsune and others */
    minChoices?: number;
    maxChoices?: number;
}

export interface DurationEffect {
    type: 'DURATION';
    effects: EffectDefinition[];
    turns?: number;
    cardId?: string;
}

export interface PlayAgainEffect {
    type: 'PLAY_AGAIN';
}

export interface ReturnToPileEffect {
    type: 'RETURN_TO_PILE';
}

export interface MoveGainedCardEffect {
    type: 'MOVE_GAINED_CARD';
    destination: 'deck' | 'hand' | 'aside' | 'discardPile';
}

export interface DiscardDownToEffect {
    type: 'DISCARD_DOWN_TO';
    amount?: number;
    targetSize?: number;
}

export interface ConditionEffect {
    type: 'CONDITION';
    condition: 'HAND_SIZE' | 'ACTIONS_PLAYED' | 'NO_ACTIONS_IN_HAND' | 'IS_VICTORY' | 'IS_ACTION' | 'IS_TREASURE' | 'FIRST_TIME_PLAYED_THIS_TURN' | 'FIRST_SILVER_OF_TURN' | 'LAST_SELECTED_HAS_TYPE' | 'PHASE' | 'PILE_HAS_VP' | 'CARDS_IN_PLAY_COUNT' | 'DISCARD_COUNT' | 'COFFERS' | 'COUNT_GAINED_THIS_TURN' | 'HAS_CARD_TYPE_IN_PLAY' | 'DISCARDED_TYPE_COUNT' | 'LAST_SELECTED_COST_AT_LEAST' | 'LAST_TRASHED_MIN_COST' | 'LAST_TRASHED_HAS_TYPE';
    comparator?: '<=' | '>=' | '==';
    value?: number | string;
    cardType?: string;
    pileId?: string;
    filter?: CardFilter;
    trueEffects: EffectDefinition[];
    falseEffects?: EffectDefinition[];
}

// Alchemy custom effects
export interface AddCoinsPerCardsEffect {
    type: 'ADD_COINS_PER_CARDS';
    sources: ('deck' | 'discard')[];
    divisor: number;
}

export interface GainStatsByCostEffect {
    type: 'GAIN_STATS_BY_COST';
    resource: 'cards' | 'actions' | 'coins' | 'buys';
    stats: {
        moneyMultiplier?: number;
        potionMultiplier?: number;
    };
}

export interface RecruiterEffect {
    type: 'RECRUITER_EFFECT';
}

export interface RevealAndPutInHandEffect {
    type: 'REVEAL_AND_PUT_IN_HAND';
    count: number;
    filter: { cardTypes?: string[]; minCost?: number; maxCost?: number };
    onOthers?: 'DISCARD' | 'DECK';
}

export interface DiscardHandEffect {
    type: 'DISCARD_HAND';
}

export interface MoveGainedToHandEffect {
    type: 'MOVE_GAINED_TO_HAND';
}

export interface ReorderRemainingRevealedEffect {
    type: 'REORDER_REMAINING_REVEALED';
    destination: 'deck' | 'discardPile';
}

export interface ChooseFromRevealedEffect {
    type: 'CHOOSE_FROM_REVEALED';
    message?: string;
    min?: number;
    max?: number;
    destination: 'discardPile' | 'deck' | 'hand' | 'playArea';
    filter?: { cardTypes?: string[]; cardIds?: string[] };
    next?: EffectDefinition[];
}

export interface MonasteryEffect {
    type: 'MONASTERY_EFFECT';
}

export interface ExorcistEffect {
    type: 'EXORCIST_EFFECT';
}

export interface ReceiveHexEffect {
    type: 'RECEIVE_HEX';
}

export interface ReceiveBoonEffect {
    type: 'RECEIVE_BOON';
    boonId?: string;
}

export interface DruidChooseBoonEffect {
    type: 'DRUID_CHOOSE_BOON';
}

export interface MultiplyMoneyEffect {
    type: 'MULTIPLY_MONEY';
    multiplier: number;
}

export interface PassToLeftEffect {
    type: 'PASS_TO_LEFT';
}

export interface SwindlerAttackEffect {
    type: 'SWINDLER_ATTACK';
}

export interface ReplaceAttackEffect {
    type: 'REPLACE_ATTACK';
    trashedCardId: string;
}

export interface NameCardEffect {
    type: 'NAME_CARD';
}

export interface SelectAndApplyEffect {
    type: 'SELECT_AND_APPLY';
    message?: string;
    min?: number;
    max?: number;
    filter?: { cardIds?: string[]; cardTypes?: string[] };
    next?: EffectDefinition | EffectDefinition[];
    /** Source zone to select from */
    source?: 'hand' | 'deck' | 'discard' | 'play' | 'aside';
    /** @deprecated Use source */
    sourceZone?: 'aside' | 'deck' | 'discardPile' | 'hand' | 'limbo' | 'playArea';
    /** @deprecated Use onSuccess */
    action?: 'TRASH' | 'DISCARD' | 'GAIN' | 'PLAY';
    /** Rising Sun: Optional choice */
    optional?: boolean;
}

export interface ReorderEffect {
    type: 'REORDER';
    sourceZone: string;
    destination?: string;
    position?: 'top' | 'bottom' | 'TOP' | 'BOTTOM';
    message?: string;
}

export interface MoveToPositionEffect {
    type: 'MOVE_TO_POSITION';
    from: 'hand' | 'aside' | 'discardPile';
    position: 'TOP' | 'BOTTOM' | 'RANDOM' | 'CHOOSE';
}


export interface DrawEffect {
    type: 'DRAW';
    amount: EffectAmount;
}

export interface AddActionEffect {
    type: 'ADD_ACTIONS';
    amount: EffectAmount;
}

export interface AddBuyEffect {
    type: 'ADD_BUYS';
    amount: EffectAmount;
}

export interface AddMoneyEffect {
    type: 'ADD_MONEY';
    amount: EffectAmount;
}

export interface AddPotionEffect {
    type: 'ADD_POTION';
    amount: EffectAmount;
}

export interface ModifyResourceEffect {
    type: 'MODIFY_RESOURCE';
    resource: 'actions' | 'buys' | 'coins' | 'potions' | 'coffers' | 'villagers' | 'favors' | 'debt' | 'vpTokens';
    amount: EffectAmount;
    operation?: 'add' | 'remove' | 'set'; // Default to 'add'
}

export interface AddMoneyPerCardInHandEffect {
    type: 'ADD_MONEY_PER_CARD_IN_HAND';
    amount: number; // amount per card
}

export interface GainCardEffect {
    type: 'GAIN_CARD';
    /** Specific card to gain, or null for choice */
    cardId?: string;
    /** Where to put the gained card */
    destination?: 'discardPile' | 'hand' | 'deck' | 'aside' | 'exile';
    /** Link the gained card to the source card (e.g. for Blockade) */
    linkToSource?: boolean;
    onSuccess?: EffectDefinition[];
    /** If no cardId, filters */
    minCost?: number;
    maxCost?: number;
    potionCost?: number;
    minDecoratedCost?: number;
    maxDecoratedCost?: number;
    /** If no cardId, type filter */
    cardTypes?: string[];
    allowedTypes?: string[];
    /** Effects triggered when the card is gained */
    onGainEffects?: EffectDefinition[];
    /** Count of cards to gain (default 1) */
    count?: number;
    amount?: number;
    message?: string;
    filter?: CardFilter;
    next?: EffectDefinition[];
}

/** Remodel: Gain card costing up to X more than trashed card */
export interface GainCardPlusCostEffect {
    type: 'GAIN_CARD_PLUS_COST';
    costBonus: number;
    destination: 'discardPile' | 'hand' | 'deck';
    /** Filter by card types (e.g., ['TREASURE'] for Mine) */
    cardTypes?: string[];
    /** Effects triggered when the card is gained */
    onGainEffects?: EffectDefinition[];
}

export interface TrashEffect {
    type: 'TRASH';
    /** Min cards to trash */
    min?: number;
    /** Max cards to trash */
    max?: number;
    /** Exact amount to trash */
    amount?: number;
    /** Source zone to trash from (defaults to hand) */
    source?: 'hand' | 'deck' | 'discardPile' | 'aside' | 'playArea' | 'limbo';
    /** @deprecated Use source */
    from?: 'hand' | 'deck' | 'discardPile' | 'aside' | 'playArea' | 'limbo';
    /** If true, trash all matching cards without prompt */
    forceAll?: boolean;
    /** Filter for allowed cards to trash */
    filter?: { cardIds?: string[]; cardTypes?: string[]; uniqueNames?: boolean };
    /** Next effects to apply after trashing */
    next?: EffectDefinition[];
    /** Rule support: If trash succeeded (enough cards), do this */
    onSuccess?: EffectDefinition[];
    /** Rule support: If trash failed (not enough cards), do this */
    onFailure?: EffectDefinition[];
    /** Rule support: Exact count required for success */
    requiredCount?: number;
    /** Prompt message */
    message?: string;
    /** Context for special actions */
    context?: any;
}

export interface ChoiceEffect {
    type: 'CHOICE';
    /** Options to choose from */
    options: string[];
    /** What happens for each option */
    effects: Record<string, EffectDefinition[]>;
    isOptional?: boolean;
}

export interface DiscardEffect {
    type: 'DISCARD';
    isOptional?: boolean;
    from?: 'hand' | 'deck';
    /** Min cards to discard */
    min?: number;
    /** Max cards to discard */
    max?: number;
    /** Source zone (defaults to hand) */
    source?: 'hand' | 'deck' | 'discardPile' | 'aside' | 'playArea';
    /** Fixed amount to discard */
    amount?: number;
    /** Avoid prompt if true */
    forceAll?: boolean;
    /** If true, draw cards equal to discarded */
    drawAfter?: boolean;
    /** Optional filter */
    filter?: CardFilter;
    /** Rule support: If discard succeeded (enough cards), do this */
    onSuccess?: EffectDefinition[];
    /** Rule support: If discard failed (not enough cards), do this */
    onFailure?: EffectDefinition[];
    /** Rule support: Exact count required for success */
    requiredCount?: number;
    /** Prompt message */
    message?: string;
    /** Next effects to apply after discard */
    next?: EffectDefinition[];
}

export interface AttackEffect {
    type: 'ATTACK';
    /** Effect to apply to each other player */
    attackEffects?: EffectDefinition[];
    /** @deprecated Use attackEffects */
    effects?: EffectDefinition[];
}

export interface KnightAttackEffect {
    type: 'KNIGHT_ATTACK';
}

export interface KnightAttackStepEffect {
    type: 'KNIGHT_ATTACK_STEP';
    attackerId: string;
    sourceCardInstanceId?: string;
}

/** Council Room: Each other player draws cards */
export interface AllOthersDrawEffect {
    type: 'ALL_OTHERS_DRAW';
    amount: number;
}

/** Bureaucrat attack: Reveal Victory card and put on deck */
export interface RevealVictoryToDeckEffect {
    type: 'REVEAL_VICTORY_TO_DECK';
}

/** Adventurer: Reveal cards until X treasures found */
export interface RevealUntilTreasuresEffect {
    type: 'REVEAL_UNTIL_TREASURES';
    count: number;
    destination?: 'hand' | 'discardPile' | 'trash';
}

/** Library: Draw until hand size reaches target */
export interface DrawUntilHandSizeEffect {
    type: 'DRAW_UNTIL_HAND_SIZE';
    targetSize: number;
    maySkipActions?: boolean;
}

/** Throne Room: Play an action card twice */
export interface PlayActionTwiceEffect {
    type: 'PLAY_ACTION_TWICE';
}

export interface PlayActionThriceEffect {
    type: 'PLAY_ACTION_THRICE';
}

export interface DrawTreasuresEffect {
    type: 'DRAW_TREASURES';
    amount: number;
}

/** Harbinger: Look through discard pile and put card on deck */
export interface SelectFromDiscardEffect {
    type: 'SELECT_FROM_DISCARD';
    destination: 'deck' | 'hand' | 'discardPile';
    filter?: { cardTypes?: string[] };
}

/** Artisan: Put a card from hand on top of deck */
export interface TopdeckFromHandEffect {
    type: 'TOPDECK_FROM_HAND';
}

/** Vassal: Discard top card, play if Action */
export interface RevealAndPlayActionEffect {
    type: 'REVEAL_AND_PLAY_ACTION';
}

/** Poacher: Discard cards equal to empty supply piles */
export interface DiscardPerEmptySupplyEffect {
    type: 'DISCARD_PER_EMPTY_SUPPLY';
}

/** Bandit: Each other player reveal 2, trash non-copper treasure, discard rest */
export interface BanditAttackEffect {
    type: 'BANDIT_ATTACK';
}

/** Sentry: Look at top 2, trash/discard/topdeck any number */
export interface SentryLookAtEffect {
    type: 'SENTRY_LOOK_AT';
}

/** Bandit intermediate step: Reveal 2, trash treasure if found */
export interface RevealAndTrashTreasureEffect {
    type: 'REVEAL_AND_TRASH_TREASURE';
    count: number;
    filter?: { type: string, exclude?: string };
}
/** Merchant: +1 Card, +1 Action, First Silver gives +1 Coin */
export interface MerchantBonusEffect {
    type: 'MERCHANT_BONUS';
}

/** Harbinger: Look through discard and put card on deck */
export interface TopdeckFromDiscardEffect {
    type: 'TOPDECK_FROM_DISCARD';
}

export interface ChooseFromZoneEffect {
    type: 'CHOOSE_FROM_ZONE';
    sourceZone: 'discardPile' | 'deck' | 'hand' | 'aside' | 'playArea' | 'supply' | 'trash' | 'limbo' | 'linked' | 'blackMarketDeck' | 'blackMarketRevealed' | string;
    destination?: 'deck' | 'hand' | 'discardPile' | 'trash' | 'aside' | 'playArea' | 'supply' | 'blackMarketDeck' | 'blackMarketRevealed' | string;
    min?: number;
    max?: number;
    optional?: boolean;
    filter?: CardFilter;
    message?: string;
    context?: any;
    onNoMatch?: EffectDefinition | EffectDefinition[];
    effects?: EffectDefinition[];
    onSuccess?: EffectDefinition[];
    requiredCount?: number;
    next?: EffectDefinition[];
}


export interface DiscardToHandSizeEffect {
    type: 'DISCARD_TO_HAND_SIZE';
    /** @deprecated Use targetSize */
    targetHandSize?: number;
    targetSize?: number;
    /** @deprecated Use targetSize */
    amount?: number;
    next?: EffectDefinition[];
}

export interface DiscardThenDrawEffect {
    type: 'DISCARD_THEN_DRAW';
}

export interface ReduceCostsEffect {
    type: 'REDUCE_COSTS';
    amount: number;
}

export interface FinalizeCleanupEffect {
    type: 'FINALIZE_CLEANUP';
}

export interface StartNextTurnEffect {
    type: 'START_NEXT_TURN';
}

export interface CompositeFilterBucket {
    id: string;
    label: string;
    min?: number;
    max?: number;
    reorder?: boolean;
}

export interface CompositeFilterEffect {
    type: 'COMPOSITE_FILTER';
    sourceZone: 'hand' | 'limbo' | 'discardPile' | 'aside' | string;
    buckets: CompositeFilterBucket[];
    globalConstraints?: {
        minTotal?: number;
        maxTotal?: number;
    };
    message?: string;
    next?: EffectDefinition[];
}

export interface TrashSelfEffect {
    type: 'TRASH_SELF';
}

export interface ProcessMasqueradeFinishEffect {
    type: 'PROCESS_MASQUERADE_FINISH';
}

export interface MoveCardsEffect {
    type: 'MOVE_CARDS';
    /** Source zone to move from */
    source: 'hand' | 'deck' | 'discardPile' | 'limbo' | 'playArea' | 'aside' | 'trash' | 'supply' | 'last_selection';
    /** Destination zone to move to */
    destination: 'hand' | 'deck' | 'discardPile' | 'trash' | 'limbo' | 'playArea' | 'aside' | 'supply' | 'blackMarketDeck' | 'blackMarketRevealed' | string;
    /** Number of cards to move (default all matching or 1 if specific) */
    count?: EffectAmount | 'ALL';
    /** Where to place in destination (for deck) */
    position?: 'TOP' | 'BOTTOM' | 'RANDOM';
    /** Whether to place cards at the bottom of the destination zone */
    toBottom?: boolean;
    /** Filter for specific cards */
    filter?: CardFilter;
    /** Effects to apply to EACH moved card */
    onSuccess?: EffectDefinition[];
    /** Link to source card */
    linkToSource?: boolean;
    next?: EffectDefinition[];
}

export interface PlayTargetEffect {
    type: 'PLAY_TARGET';
    times?: number; // Default 1
    /** Zone to play from (default: result of previous choice) */
    sourceZone?: 'aside' | 'hand' | 'limbo' | 'deck' | 'discardPile';
    /** Whether to play all matching cards in the zone */
    all?: boolean;
    /** Custom prompt message when choosing which card to play */
    message?: string;
}

export interface SetAsideLinkedEffect {
    type: 'SET_ASIDE_LINKED';
    count: number;
    /** Whether card is face down */
    faceDown?: boolean;
    /** Zone to pick from (usually hand) */
    source?: 'hand';
}

export interface ReturnLinkedCardsEffect {
    type: 'RETURN_LINKED_CARDS';
}

export interface MoveToMatEffect {
    type: 'MOVE_TO_MAT';
    mat: string; // 'island' | 'nativeVillage' | 'tavern' | 'exile' etc.
    /** Cards to move (usually current played card + selection) */
    targets?: 'SELF' | 'SELECTED' | 'BOTH' | 'TOP_OF_DECK';
    targetCardInstanceId?: string;
}

export interface CheckPreviousTurnEffect {
    type: 'CHECK_PREVIOUS_TURN';
    /** Query to perform */
    query: 'GAINED_CARDS_BY_OPPONENT';
    /** What to do if match found */
    onMatch?: EffectDefinition[];
}


export interface TakeFromMatEffect {
    type: 'TAKE_FROM_MAT';
    mat: string; // 'nativeVillage' | 'island' | 'tavern' etc.
    destination?: 'hand' | 'discardPile' | 'deck' | 'aside';
    targetCardIds?: string[];
}

export interface AddTokenEffect {
    type: 'ADD_TOKEN';
    tokenType: 'embargo' | 'coin';
    targetSource?: 'supply' | 'player'; // supply = on pile, player = on player mat
}

export interface ScheduleExtraTurnEffect {
    type: 'SCHEDULE_EXTRA_TURN';
    cardLimit?: number;
}

export interface PeekBottomEffect {
    type: 'PEEK_BOTTOM';
}

export interface RevealHandEffect {
    type: 'REVEAL_HAND';
    message?: string;
}

export interface ReturnToSupplyEffect {
    type: 'RETURN_TO_SUPPLY';
    min?: number;
    max?: number;
    message?: string;
    filter?: { cardIds?: string[], cardTypes?: string[] };
}

export interface SeaChartCheckEffect {
    type: 'SEA_CHART_CHECK';
}

export interface EachPlayerEffect {
    type: 'EACH_PLAYER';
    includesSelf?: boolean;
    filter?: 'OTHERS' | 'ALL' | 'LEFT_PLAYER';
    effects: EffectDefinition[];
}


export interface PeekTopDeckEffect {
    type: 'PEEK_TOP_DECK';
    amount: number;
    message?: string;
    options: { label: string; value: any; effects?: EffectDefinition[] }[];
}

export interface DiscardTopDeckEffect {
    type: 'DISCARD_TOP_DECK';
}

// ============================================================================
// Guilds Effects
// ============================================================================

/** Add Coffers tokens (Guilds - Coin tokens for later use) */
export interface AddCoffersEffect {
    type: 'ADD_COFFERS';
    amount: EffectAmount;
}

/** Spend Coffers tokens for coins */
export interface SpendCoffersEffect {
    type: 'SPEND_COFFERS';
    amount?: number; // If undefined, player chooses how many to spend
}

/** Add Villagers tokens (Renaissance - Actions tokens for later use) */
export interface AddVillagersEffect {
    type: 'ADD_VILLAGERS';
    amount: EffectAmount;
}

/** Overpay effect - allows paying more than the card cost for a bonus */
export interface OverpayEffect {
    type: 'OVERPAY';
    message?: string;
    perCoinEffects: EffectDefinition[];
}

// Alchemy Interfaces
export interface AddMoneyPotionEffect {
    type: 'ADD_MONEY_POTION';
    amount: number;
}

export interface SetupAlchemistReactionEffect {
    type: 'SETUP_ALCHEMIST_REACTION';
}

export interface ApothecaryEffect {
    type: 'APOTHECARY_EFFECT';
}

export interface ScryingPoolAttackEffect {
    type: 'SCRYING_POOL_ATTACK';
}

export interface ScryingPoolDrawEffect {
    type: 'SCRYING_POOL_DRAW';
}

export interface GainCurseToOthersEffect {
    type: 'GAIN_CURSE_TO_OTHERS';
}

export interface SetupHerbalistReactionEffect {
    type: 'SETUP_HERBALIST_REACTION';
}

export interface PhilosophersStoneEffect {
    type: 'PHILOSOPHERS_STONE_EFFECT';
}

export interface PossessionEffect {
    type: 'POSSESSION_EFFECT';
}

export interface TransmuteEffect {
    type: 'TRANSMUTE_EFFECT';
}

export interface GainCardFromSupplyEffect {
    type: 'GAIN_CARD_FROM_SUPPLY';
    allowedTypes: string[];
    maxCost: number;
    destination: 'discardPile' | 'deck' | 'hand';
}

export interface ReturnToPileEffect {
    type: 'RETURN_TO_PILE';
}


export interface GainCopyOfSelfEffect {
    type: 'GAIN_COPY_OF_SELF';
    destination?: 'discardPile' | 'hand' | 'deck';
}

export interface TopdeckWhenDiscardedEffect {
    type: 'TOPDECK_WHEN_DISCARDED';
}

// ============================================================================
// Adventures Effects
// ============================================================================

/** Move this card to Plateau Taverne (Tavern Mat) */
export interface MoveToTavernEffect {
    type: 'MOVE_TO_TAVERN' | 'MOVE_TO_TAVERN_MAT';
}

/** Call a card from Plateau Taverne */
export interface CallFromTavernEffect {
    type: 'CALL_FROM_TAVERN';
    cardId?: string; // If undefined, player chooses which to call
    callEffects?: EffectDefinition[]; // Effects to apply when called
}

/** Flip Journey Token and execute effects based on result */
export interface FlipJourneyTokenEffect {
    type: 'FLIP_JOURNEY_TOKEN';
    onFaceUp?: EffectDefinition[];
    onFaceDown?: EffectDefinition[];
}

/** Give -1 Coin token to another player (Bridge Troll) */
export interface TakeMinusCoinTokenEffect {
    type: 'TAKE_MINUS_COIN_TOKEN';
}

/** Give -1 Card token to another player (Relic) */
export interface TakeMinusCardTokenEffect {
    type: 'TAKE_MINUS_CARD_TOKEN';
}

/** Exchange Traveller card for its upgrade */
export interface ExchangeTravellerEffect {
    type: 'EXCHANGE_TRAVELLER';
    upgradesTo: string; // Card ID to exchange to
}

/** Make this a permanent duration (stays in play for rest of game) */
export interface PermanentDurationEffect {
    type: 'PERMANENT_DURATION';
    permanentEffects: EffectDefinition[]; // Effects to apply at start of each turn
}

export interface SetAsideEffect {
    type: 'SET_ASIDE';
    min?: number;
    max?: number;
    amount?: number;
    from: 'hand' | 'deck' | 'discardPile';
    message?: string;
    faceDown?: boolean;
}

export interface ReturnSetAsideToHandEffect {
    type: 'RETURN_SET_ASIDE_TO_HAND';
}

export interface PutCopperOnTavernEffect {
    type: 'PUT_COPPER_ON_TAVERN';
}

export interface AddMoneyPerCopperOnTavernEffect {
    type: 'ADD_MONEY_PER_COPPER_ON_TAVERN';
}

export interface DeckToDiscardEffect {
    type: 'DECK_TO_DISCARD';
}



// ============================================================================
// Empires Effects
// ============================================================================

/** Take debt tokens (Empires - used instead of coins for some cards) */
export interface TakeDebtEffect {
    type: 'TAKE_DEBT';
    amount: EffectAmount;
}

/** Pay off debt tokens */
export interface PayDebtEffect {
    type: 'PAY_DEBT';
    amount?: number; // If undefined, pay as much as possible
}

/** Add VP tokens to a gathering pile (Empires - Farmers' Market, Temple, Wild Hunt) */
export interface GatherVpEffect {
    type: 'GATHER_VP';
    pileId: string;
    amount: number;
}

/** Take VP tokens from a gathering pile */
export interface TakeVpFromPileEffect {
    type: 'TAKE_VP_FROM_PILE';
    pileId: string;
}

/** Reveal top cards of deck (Adventures/Empires) */
export interface RevealTopDeckEffect {
    type: 'REVEAL_TOP_DECK';
    amount: number;
    cause?: string;
    onSuccess?: EffectDefinition[];
    onTreasure?: EffectDefinition[];
    onActionOrVictory?: EffectDefinition[];
    next?: EffectDefinition[];
}

/** Alias for RevealTopDeckEffect */
export interface RevealTopOfDeckEffect {
    type: 'REVEAL_TOP_OF_DECK';
    amount: number;
    cause?: string;
    onSuccess?: EffectDefinition[];
    onTreasure?: EffectDefinition[];
    onActionOrVictory?: EffectDefinition[];
    next?: EffectDefinition[];
}

/** Compare top card of deck with neighbor (Empires - Chariot Race) */
export interface CompareTopDeckWithNeighborEffect {
    type: 'COMPARE_TOP_OF_DECK_WITH_NEIGHBOR';
    direction: 'LEFT' | 'RIGHT';
    condition: 'COST_GREATER' | 'COST_LESS' | 'COST_EQUAL';
    onTrue: EffectDefinition[];
    onFalse: EffectDefinition[];
}

/** Switch effects based on last trashed card (Empires - Sacrifice) */
export interface SwitchOnLastTrashedEffect {
    type: 'SWITCH_ON_LAST_TRASHED';
    cases: {
        condition: { type: 'HAS_TYPE', cardType: string } | { type: 'MIN_COST', amount: number },
        effects: EffectDefinition[]
    }[];
}


/** Change the current turn phase (Empires - Villa) */
export interface ChangePhaseEffect {
    type: 'CHANGE_PHASE';
    phase: 'ACTION' | 'BUY';
}

/** Add VP tokens to player (non-gathering) */
export interface AddVpTokensEffect {
    type: 'ADD_VP_TOKENS';
    amount: number;
}

/** Add VP tokens based on number of cards moved/trashed (Empires - Temple) */
export interface AddVpTokensPerMovedEffect {
    type: 'ADD_VP_TOKENS_PER_MOVED';
    amount: number;
}
export interface AddCardsPerActionInPlayEffect {
    type: 'ADD_CARDS_PER_ACTION_IN_PLAY';
    multiplier: number;
}

export interface ReplaceActionInstructionsEffect {
    type: 'REPLACE_ACTION_INSTRUCTIONS';
    /** Replacement instructions (e.g. +1 Action, +1 Card) */
    replacement: EffectDefinition[];
    /** Condition: e.g. "first Action played this turn" */
    condition: 'FIRST_ACTION_PLAYED_THIS_TURN';
}

export interface PlayAsSupplyActionEffect {
    type: 'PLAY_AS_SUPPLY_ACTION';
    maxCost: number;
    cardTypes?: string[];
}

export interface RecursiveApplyEffect {
    type: 'RECURSIVE_APPLY';
    effects: EffectDefinition[];
}
export interface AddFavorsEffect {
    type: 'ADD_FAVORS';
    amount: number | 'COST';
    multiplier?: string;
}

export interface SpendFavorsEffect {
    type: 'SPEND_FAVORS';
    amount: number;
}

export interface RotatePileEffect {
    type: 'ROTATE_PILE';
    pileId: string;
}

export interface CardFilter {
    cardIds?: string[];
    cardTypes?: Array<'TREASURE' | 'ACTION' | 'VICTORY' | 'CURSE' | 'DURATION' | 'REACTION' | 'ATTACK' | 'TREASURE-VICTORY' | string>;
    excludeIds?: string[];
    excludeTypes?: string[];
    minCost?: number;
    maxCost?: number;
    exactCost?: number | number[] | 'LAST_TRASHED_COST' | 'SAME_AS_TRASHED';
    hasPotion?: boolean;
}

export interface RegisterTriggerEffect {
    type: 'REGISTER_TRIGGER';
    trigger: 'ON_GAIN' | 'ON_BUY' | 'ON_TRASH' | 'ON_CLEANUP' | 'ON_PLAY' | 'START_TURN' | string;
    filter?: CardFilter;
    effects: EffectDefinition[];
    /** Duration of the trigger: 'TURN', 'PERMANENT', 'ONCE', etc. */
    duration?: 'TURN' | 'PERMANENT' | 'ONCE' | 'UNTIL_NEXT_TURN' | string;
    isPermanent?: boolean;
    once?: boolean;
}

export interface TopdeckThisEffect {
    type: 'TOPDECK_THIS';
}

export interface AddCostReductionEffect {
    type: 'ADD_COST_REDUCTION';
    amount: number;
}

// ============================================================================
// Plunder Expansion Effects
// ============================================================================

export interface AbundanceEffect {
    type: 'ABUNDANCE_EFFECT';
}

export interface PendantEffect {
    type: 'PENDANT_EFFECT';
}

export interface TaskmasterEffect {
    type: 'TASKMASTER_EFFECT';
}

export interface MaroonEffect {
    type: 'MAROON_EFFECT';
}

export interface FortuneHunterEffect {
    type: 'FORTUNE_HUNTER_EFFECT';
}

export interface SearchEffect {
    type: 'SEARCH_EFFECT';
}

export interface MapmakerEffect {
    type: 'MAPMAKER_EFFECT';
}

export interface FirstMateEffect {
    type: 'FIRST_MATE_EFFECT';
}

export interface LongshipEffect {
    type: 'LONGSHIP_EFFECT';
}

export interface CutthroatAttackEffect {
    type: 'CUTTHROAT_ATTACK';
}

export interface FrigateAttackEffect {
    type: 'FRIGATE_ATTACK';
}

export interface TricksterAttackEffect {
    type: 'TRICKSTER_ATTACK';
}

export interface MaroonResolveEffect {
    type: 'MAROON_RESOLVE';
}

export interface PilgrimMoveCheckEffect {
    type: 'PILGRIM_MOVE_CHECK';
}

export interface ToolsMoveCheckEffect {
    type: 'TOOLS_MOVE_CHECK';
}

export interface ReplayLastActionEffect {
    type: 'REPLAY_LAST_ACTION';
}

// ============================================================================
// Allies Expansion Effects
// ============================================================================

export interface BarbarianAttackEffect {
    type: 'BARBARIAN_ATTACK';
}

export interface NextGainToDeckEffect {
    type: 'NEXT_GAIN_TO_DECK';
}

export interface DrawPerCostEffect {
    type: 'DRAW_PER_COST';
}

export interface AddActionsPerCostEffect {
    type: 'ADD_ACTIONS_PER_COST';
}

export interface AddMoneyPerCostEffect {
    type: 'ADD_MONEY_PER_COST';
}

export interface AddFavorsPerCostEffect {
    type: 'ADD_FAVORS_PER_COST';
}

export interface CarpenterEffect {
    type: 'CARPENTER_EFFECT';
}

export interface CourierEffect {
    type: 'COURIER_EFFECT';
}

export interface HighwaymanAttackEffect {
    type: 'HIGHWAYMAN_ATTACK';
}

export interface HunterEffect {
    type: 'HUNTER_EFFECT';
}

export interface RoyalGalleyEffect {
    type: 'ROYAL_GALLEY_EFFECT';
}

export interface SentinelEffect {
    type: 'SENTINEL_EFFECT';
}

export interface SpecialistEffect {
    type: 'SPECIALIST_EFFECT';
}

export interface SwapEffect {
    type: 'SWAP_EFFECT';
}

export interface SycophantEffect {
    type: 'SYCOPHANT_EFFECT';
}

export interface SorceressAugurAttackEffect {
    type: 'SORCERESS_AUGUR_ATTACK';
}

export interface ArcherAttackEffect {
    type: 'ARCHER_ATTACK';
}

export interface WarlordEffect {
    type: 'WARLORD_EFFECT';
}

export interface GainGoldPerEmptyPilesEffect {
    type: 'GAIN_GOLD_PER_EMPTY_PILES';
}

export interface AddTokenToThisEffect {
    type: 'ADD_TOKEN_TO_THIS';
}

export interface DrawPerTokenOnThisEffect {
    type: 'DRAW_PER_TOKEN_ON_THIS';
}

export interface ScheduleNextTurnEffect {
    type: 'SCHEDULE_NEXT_TURN';
    effects: EffectDefinition[];
}

export interface GainCardNotInPlayEffect {
    type: 'GAIN_CARD_NOT_IN_PLAY';
    filter?: CardFilter;
}

export interface SelectFromTopdeckEffect {
    type: 'SELECT_FROM_TOPDECK';
    amount: number;
    count: number;
    destination: 'hand' | 'discardPile' | 'deck' | 'aside';
}

export interface ElderEffect {
    type: 'ELDER_EFFECT';
}

export interface StudentEffect {
    type: 'STUDENT_EFFECT';
}

export interface MoveThisToHandEffect {
    type: 'MOVE_THIS_TO_HAND';
}

export interface SorcererWizardAttackEffect {
    type: 'SORCERER_WIZARD_ATTACK';
}

export interface LichTrashEffect {
    type: 'LICH_TRASH_EFFECT';
}

// ============================================================================
// Rising Sun Expansion Kingdom Effects
// ============================================================================

export interface AristocratEffect {
    type: 'ARISTOCRAT_EFFECT';
}

export interface ArtistEffect {
    type: 'ARTIST_EFFECT';
}

export interface ChangeEffect {
    type: 'CHANGE_EFFECT';
}

export interface DaimyoEffect {
    type: 'DAIMYO_EFFECT';
}

export interface ImperialEnvoyEffect {
    type: 'IMPERIAL_ENVOY_EFFECT';
}

export interface MountainShrineEffect {
    type: 'MOUNTAIN_SHRINE_EFFECT';
}

export interface RiceBrokerEffect {
    type: 'RICE_BROKER_EFFECT';
}

export interface RiverShrineEffect {
    type: 'RIVER_SHRINE_EFFECT';
}

export interface SnakeWitchAttackEffect {
    type: 'SNAKE_WITCH_ATTACK';
}




