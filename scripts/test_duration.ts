
import { TurnMachine } from '../shared/engine/TurnMachine';
import { ActionResolver } from '../shared/engine/ActionResolver';
import { GameState, PlayerState } from '../shared/engine/GameState';
import { CardRegistry } from '../shared/cards/index';

// Mock State
const mockState: GameState = {
    players: [],
    supply: {},
    trash: [],
    phase: 'ACTION',
    turnNumber: 1,
    currentPlayerIndex: 0,
    rng: { seed: 'duration-test', callCount: 0 },
    history: [],
    logs: [],
    effectStack: []
} as any;

const p1: PlayerState = {
    id: 'p1', name: 'Player 1',
    hand: [], deck: [], discardPile: [], playArea: [],
    actions: 1, buys: 1, coins: 0,
    turnNumber: 1
} as any;

mockState.players = [p1];

// Register Dummy Caravan logic if needed, or rely on existing
// Helper to overwrite Caravan definition for predictable test
const caravanDef = CardRegistry.get('caravan');
if (caravanDef) {
    // Ensure durationTurns is set
    (caravanDef as any).durationTurns = 1;
    (caravanDef as any).durationEffects = [{ type: 'ADD_ACTIONS', amount: 1 }]; // Simple check
}

async function testDuration() {
    console.log('--- Testing Duration Logic ---');

    // Setup
    p1.hand = [{ id: 'caravan', instanceId: 'c1' } as any];
    p1.deck = [{ id: 'copper', instanceId: 'cop1' } as any]; // Start with something in deck

    console.log('\nTest 1: Play Caravan');
    const result = ActionResolver.resolve(mockState, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'c1' });
    if (!result.success) {
        console.error('FAIL: Could not play Caravan', result.error);
        return;
    }
    console.log('PASS: Played Caravan');

    // Check Duration Turns initialized
    const playedCard = p1.playArea.find(c => c.instanceId === 'c1');
    if (playedCard && playedCard.durationTurns === 1) console.log('PASS: Duration Turns initialized to 1');
    else console.error(`FAIL: Duration Turns not set correctly: ${playedCard?.durationTurns}`);

    console.log('\nTest 2: End Action & Buy -> Cleanup');
    TurnMachine.endActionPhase(mockState);
    TurnMachine.endBuyPhase(mockState);
    // Manual trigger of cleanup processing if needed, but endBuyPhase calls performCleanup
    // Then we need to call finalizeCleanup (usually triggered by effect stack)
    // For test, we call finalizeCleanup directly or through effect engine?
    // finalizeCleanup is an effect 'FINALIZE_CLEANUP' handled by EffectEngine
    mockState.effectStack = []; // Clear intermediate effects
    TurnMachine.finalizeCleanup(mockState);

    // Check Persistence
    // p1.playArea should still have Caravan
    const keptCard = p1.playArea.find(c => c.instanceId === 'c1');
    if (keptCard) console.log('PASS: Caravan stayed in Play Area');
    else console.error('FAIL: Caravan was discarded during cleanup');

    // Check Turn Number (should be 2 now)
    if (mockState.turnNumber === 2) console.log('PASS: Turn Number advanced to 2');
    else console.error(`FAIL: Turn Number is ${mockState.turnNumber}`);

    // Verify Start of Turn effects (ACTIONS increased?)
    // TurnMachine.startNextTurn resets resources THEN applies effects.
    // If Caravan works, p1.actions should be 1 (base) + 1 (Caravan) = 2.
    // Wait, startNextTurn was called by finalizeCleanup.
    if (p1.actions === 2) console.log('PASS: Duration Effect applied (Actions = 2)');
    else console.error(`FAIL: Actions = ${p1.actions}, expected 2`);

    // Verify Duration Decrement
    // In startNextTurn loop, durationTurns should have decremented.
    const durationCardNextTurn = p1.playArea.find(c => c.instanceId === 'c1');
    if (durationCardNextTurn && durationCardNextTurn.durationTurns === 0) console.log('PASS: Duration Turns decremented to 0');
    else console.error(`FAIL: Duration Turns is ${durationCardNextTurn?.durationTurns}`);

    console.log('\nTest 3: End Turn 2 -> Check Discard');
    mockState.phase = 'ACTION'; // Reset phase for cleanliness (startNextTurn sets it to ACTION)
    TurnMachine.endActionPhase(mockState);
    TurnMachine.endBuyPhase(mockState);
    mockState.effectStack = [];
    TurnMachine.finalizeCleanup(mockState);

    // Now Caravan should be discarded (durationTurns was 0)
    const discardedCaravan = p1.discardPile.find(c => c.instanceId === 'c1');
    const inPlayCaravan = p1.playArea.find(c => c.instanceId === 'c1');

    if (discardedCaravan && !inPlayCaravan) console.log('PASS: Caravan discarded after duration expired');
    else console.error('FAIL: Caravan not discarded properly', { inPlay: !!inPlayCaravan, inDiscard: !!discardedCaravan });
}

testDuration().catch(console.error);
