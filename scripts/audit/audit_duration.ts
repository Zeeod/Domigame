
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { TurnMachine } from '../../shared/engine/TurnMachine.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { CardRegistry } from '../../shared/cards/index.js';

// Setup Mock Game
console.log('--- INITIALIZING AUDIT ---');
const state = createGameState('audit_duration_test');
const p1 = createPlayerState('p1', 'Alice', 'blue');
const p2 = createPlayerState('p2', 'Bob', 'red');
state.players = [p1, p2];
state.currentPlayerIndex = 0; // P1 starts
state.phase = 'ACTION';

// Add Deck
p1.deck = [
    createCardInstance('copper'),
    createCardInstance('copper'),
    createCardInstance('copper'),
    createCardInstance('copper'),
    createCardInstance('estate'),
    createCardInstance('estate')
];

// Helper to log pass/fail
const check = (condition: boolean, msg: string) => {
    if (condition) console.log(`[PASS] ${msg}`);
    else console.error(`[FAIL] ${msg}`);
};

// --- SETUP P1 STATE ---
// 1. Play Wharf
const wharf = createCardInstance('wharf');
wharf.isResolved = false; // Initially false when played? Or undefined. 
// Note: When you play a card, it just goes to playArea. isResolved is undefined.
p1.playArea.push(wharf);

// 2. Play Haven
const haven = createCardInstance('haven');
p1.playArea.push(haven);

// 3. Haven Effect (Set Aside Copper)
const copper = createCardInstance('copper');
p1.aside.push(copper);
haven.linkedCards = [copper]; // Link it
console.log(`Setup: P1 played Wharf & Haven. Haven set aside Copper (ID: ${copper.instanceId})`);

// --- END TURN 1 (P1) ---
console.log('\n--- ENDING P1 TURN 1 ---');
state.phase = 'BUY';
TurnMachine.endBuyPhase(state);

// Verify Persistence
const p1Wharf = p1.playArea.find(c => c.id === 'wharf');
const p1Haven = p1.playArea.find(c => c.id === 'haven');
check(!!p1Wharf, 'Wharf persisted in Play Area');
check(!!p1Haven, 'Haven persisted in Play Area');

// Verify Hand Reset
check(p1.hand.length === 5, `P1 drew 5 cards (Actual: ${p1.hand.length})`);

// --- END TURN 2 (P2) ---
console.log('\n--- ENDING P2 TURN (Skipping P2 actions) ---');
// P2 does nothing.
state.currentPlayerIndex = 1; // Should be 1 from previous step, but ensuring
state.phase = 'BUY';
TurnMachine.endBuyPhase(state);

// --- START TURN 3 (P1 Again) ---
console.log('\n--- STARTING P1 TURN 2 (Triggers) ---');
// Logic executed inside endBuyPhase(P2) -> startNextTurn(P1)
// We verify the resulting state of P1.

const logs = (state.history as any[]).map((l: any) => l.message as string);
const triggeredWharf = logs.some((m: string) => m.includes("résout l'effet de durée de Quai"));
const triggeredHaven = logs.some((m: string) => m.includes("résout l'effet de durée de Havre"));

check(triggeredWharf, 'Wharf trigger logged');
check(triggeredHaven, 'Haven trigger logged');

// Verify Effects
// Wharf: +2 Cards, +1 Buy
// Standard hand is 5. +2 = 7.
// Haven: +1 Card (The set aside Copper). +1 = 8.
// Wait, Haven returns card to HAND.
// Does Haven trigger give +Actions? No, only return.
// Start turn draw: 5 cards.
// Wharf: +2 => 7.
// Haven: +1 => 8.

check(p1.hand.length === 8, `P1 Hand Size is 8 (5 + 2 Wharf + 1 Haven). Actual: ${p1.hand.length}`);
check(p1.buys === 2, `P1 Buys is 2 (1 Base + 1 Wharf). Actual: ${p1.buys}`);

const hasCopper = p1.hand.some(c => c.instanceId === copper.instanceId);
check(hasCopper, 'Set-aside Copper returned to hand');

// --- END TURN 3 (P1 Cleanup) ---
console.log('\n--- ENDING P1 TURN 2 (Cleanup) ---');
state.phase = 'BUY';
TurnMachine.endBuyPhase(state);

// Verify Discard
const finalWharf = p1.playArea.find(c => c.id === 'wharf');
const finalHaven = p1.playArea.find(c => c.id === 'haven');

check(!finalWharf, 'Wharf discarded from Play Area');
check(!finalHaven, 'Haven discarded from Play Area');

const discardWharf = p1.discardPile.find(c => c.id === 'wharf');
const discardHaven = p1.discardPile.find(c => c.id === 'haven');
check(!!discardWharf, 'Wharf is in Discard Pile');
check(!!discardHaven, 'Haven is in Discard Pile');

console.log('--- AUDIT COMPLETE ---');
