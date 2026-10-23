/**
 * Cards whose smoke test still fails (details: logs/smoke_report.json after `npx vitest run tests/smoke`).
 * Fix a card → remove it from this list. Goal: empty list.
 */
export const KNOWN_BROKEN: ReadonlySet<string> = new Set<string>([
    'sacrifice', // [first] effet(s) sans gestionnaire : SWITCH_ON_LAST_TRASHED
    'temple', // [first] effet(s) sans gestionnaire : ADD_VP_TOKENS_PER_MOVED
    'overlord', // [first] effet(s) sans gestionnaire : PLAY_AS_SUPPLY_ACTION
    'charm', // [last] effet(s) sans gestionnaire : ADD_TURN_TRIGGER
    'encampment', // [first] effet(s) sans gestionnaire : RETURN_TO_SUPPLY_AT_CLEANUP
    'fortune', // [first] effet(s) sans gestionnaire : MULTIPLY_MONEY
    'skulk', // [first] effet(s) sans gestionnaire : RECEIVE_HEX
    'cursed_village', // [first] effet(s) sans gestionnaire : RECEIVE_HEX
    'pixie', // [first] effet(s) sans gestionnaire : CHOICE
    'seer', // [first] effet(s) sans gestionnaire : undefined
    'inventor', // [first] effet(s) sans gestionnaire : GAIN_CARD_FROM_SUPPLY
    'lich', // [first] effet(s) sans gestionnaire : SKIP_NEXT_TURN
]);
