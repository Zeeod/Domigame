/**
 * Verbose engine tracing. Silent unless the DOMINION_DEBUG environment variable is set
 * (e.g. `DOMINION_DEBUG=1 npm test`). Use it instead of console.log in the engine.
 */
const enabled = typeof process !== 'undefined' && !!process.env?.DOMINION_DEBUG;

export function debugLog(...args: unknown[]): void {
    if (enabled) console.log(...args);
}
