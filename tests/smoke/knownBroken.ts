/**
 * Cards whose smoke test still fails (details: logs/smoke_report.json after `npx vitest run tests/smoke`).
 * Fix a card → remove it from this list. Goal: empty list.
 */
export const KNOWN_BROKEN: ReadonlySet<string> = new Set<string>([
    'skulk', // [first] effet(s) sans gestionnaire : RECEIVE_HEX
    'cursed_village', // [first] effet(s) sans gestionnaire : RECEIVE_HEX
    'pixie', // [first] effet(s) sans gestionnaire : CHOICE
    'seer', // [first] effet(s) sans gestionnaire : undefined
    'inventor', // [first] effet(s) sans gestionnaire : GAIN_CARD_FROM_SUPPLY
    'lich', // [first] effet(s) sans gestionnaire : SKIP_NEXT_TURN
]);
