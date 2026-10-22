/**
 * Cards whose smoke test still fails (details: logs/smoke_report.json after `npx vitest run tests/smoke`).
 * Fix a card → remove it from this list. Goal: empty list.
 */
export const KNOWN_BROKEN: ReadonlySet<string> = new Set<string>([
    'poacher', // [first] effet(s) sans gestionnaire : DISCARD_PER_EMPTY_SUPPLY
    'masquerade', // [first] effet(s) sans gestionnaire : PASS_TO_LEFT
    'city', // [first] effet(s) sans gestionnaire : IF_EMPTY_PILES
    'scavenger', // [first] effet(s) sans gestionnaire : MAY_DISCARD_DECK
    'storeroom', // [first] effet(s) sans gestionnaire : DISCARD_FOR_COINS
    'vagrant', // [first] effet(s) sans gestionnaire : REVEAL_TOP_AND_MAYBE_TAKE
    'wandering_minstrel', // [first] effet(s) sans gestionnaire : REVEAL_AND_SORT_ACTIONS
    'counterfeit', // [first] effet(s) sans gestionnaire : PLAY_TREASURE_TWICE_THEN_TRASH
    'ironmonger', // [first] effet(s) sans gestionnaire : IRONMONGER_REVEAL
    'band_of_misfits', // [first] effet(s) sans gestionnaire : PLAY_AS_SUPPLY_ACTION
    'catacombs', // [first] effet(s) sans gestionnaire : CATACOMBS_CHOICE
    'hermit', // [first] effet(s) sans gestionnaire : MAY_TRASH_NON_TREASURE
    'rebuild', // [first] effet(s) sans gestionnaire : REBUILD_EFFECT
    'rogue', // [first] effet(s) sans gestionnaire : ROGUE_EFFECT
    'survivors', // [first] effet(s) sans gestionnaire : CHOICE
    'trader', // [first] effet(s) sans gestionnaire : GAIN_SILVERS_PER_COST
    'highway', // [first] effet(s) sans gestionnaire : COST_REDUCTION
    'inn', // [last] effet(s) sans gestionnaire : MOVE_TO_DECK_AND_SHUFFLE
    'oracle', // [first] après avoir joué : nombre de cartes 306 → 304
    'mandarin', // [first] effet(s) sans gestionnaire : TOPDECK_ALL_TREASURES_IN_PLAY
    'tournament', // [first] effet(s) sans gestionnaire : TOURNAMENT_EFFECT
    'young_witch', // [first] effet(s) sans gestionnaire : GAIN_CURSE_UNLESS_BANE
    'harvest', // [first] effet(s) sans gestionnaire : ADD_MONEY_PER_UNIQUE_CARD
    'horn_of_plenty', // [first] effet(s) sans gestionnaire : GAIN_CARD_COST_UNIQUE_IN_PLAY
    'hunting_party', // [first] effet(s) sans gestionnaire : REVEAL_UNTIL_UNIQUE
    'jester', // [first] effet(s) sans gestionnaire : JESTER_EFFECT
    'taxman', // [last] effet(s) sans gestionnaire : GAIN_TREASURE
    'butcher', // [last] effet(s) sans gestionnaire : PAY_COFFERS_AND_GAIN
    'soothsayer', // [first] effet(s) sans gestionnaire : DRAW_IF_GAINED_CURSE
    'raze', // [first] effet(s) sans gestionnaire : LOOK_AT_TOP_COST
    'ranger', // [first] effet(s) sans gestionnaire : FLIP_JOURNEY_TOKEN
    'artificer', // [last] effet(s) sans gestionnaire : GAIN_CARD_EXACT_COST_DISCARDED
    'bridge_troll', // [first] effet(s) sans gestionnaire : TAKE_MINUS_COIN_TOKEN, COST_REDUCTION
    'giant', // [first] effet(s) sans gestionnaire : FLIP_JOURNEY_TOKEN
    'haunted_woods', // [first] effet(s) sans gestionnaire : HAUNTED_WOODS_EFFECT
    'relic', // [first] effet(s) sans gestionnaire : PUT_MINUS_CARD_TOKEN
    'storyteller', // [first] effet(s) sans gestionnaire : PLAY_TREASURES_FROM_HAND, PAY_ALL_COINS_TO_DRAW
    'swamp_hag', // [first] effet(s) sans gestionnaire : SWAMP_HAG_EFFECT
    'sacrifice', // [first] effet(s) sans gestionnaire : SWITCH_ON_LAST_TRASHED
    'temple', // [first] effet(s) sans gestionnaire : ADD_VP_TOKENS_PER_MOVED
    'overlord', // [first] effet(s) sans gestionnaire : PLAY_AS_SUPPLY_ACTION
    'charm', // [last] effet(s) sans gestionnaire : ADD_TURN_TRIGGER
    'encampment', // [first] effet(s) sans gestionnaire : RETURN_TO_SUPPLY_AT_CLEANUP
    'fortune', // [first] effet(s) sans gestionnaire : MULTIPLY_MONEY
    'skulk', // [first] effet(s) sans gestionnaire : RECEIVE_HEX
    'philosophers_stone', // [first] effet(s) sans gestionnaire : ADD_COINS_PER_CARDS
    'transmute', // [first] effet(s) sans gestionnaire : SWITCH_ON_LAST_TRASHED
    'cursed_village', // [first] effet(s) sans gestionnaire : RECEIVE_HEX
    'pixie', // [first] effet(s) sans gestionnaire : CHOICE
    'seer', // [first] effet(s) sans gestionnaire : undefined
    'inventor', // [first] effet(s) sans gestionnaire : GAIN_CARD_FROM_SUPPLY
    'lich', // [first] effet(s) sans gestionnaire : SKIP_NEXT_TURN
]);
