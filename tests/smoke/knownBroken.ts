/**
 * Cards whose smoke test still fails (details: logs/smoke_report.json after `npx vitest run tests/smoke`).
 * Fix a card → remove it from this list. Goal: empty list.
 */
export const KNOWN_BROKEN: ReadonlySet<string> = new Set<string>([
    'lich', // [first] effet(s) sans gestionnaire : SKIP_NEXT_TURN
]);
