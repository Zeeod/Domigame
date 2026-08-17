
import { TurnMachine } from '../shared/engine/TurnMachine';
import { ActionResolver } from '../shared/engine/ActionResolver';
import { GameState, PlayerState } from '../shared/engine/GameState';
import { CardRegistry } from '../shared/cards/index';
import { EffectEngine } from '../shared/engine/EffectEngine';

// Ensure expansions are loaded
import '../shared/engine/registerExpansions';

// Mock State
const mockState: GameState = {
    players: [],
    supply: {
        'silver': { count: 10, instanceIds: [] },
        'curse': { count: 10, instanceIds: [] }
    },
    trash: [],
    phase: 'ACTION',
    turnNumber: 1,
    currentPlayerIndex: 0,
    rng: { seed: 'blockade-test', callCount: 0 },
    history: [],
    logs: [],
    effectStack: []
} as any;

const p1: PlayerState = {
    id: 'p1', name: 'Player 1',
    hand: [], deck: [], discardPile: [], playArea: [], aside: [],
    actions: 1, buys: 1, coins: 0,
    turnNumber: 1
} as any;

mockState.players = [p1];

async function testBlockade() {
    console.log('--- Testing Blockade Logic ---');

    // Setup: Give Blockade to Player 1
    const blockadeCard = { id: 'blockade', instanceId: 'b1' } as any;
    p1.hand = [blockadeCard];

    // Ensure Blockade definition exists
    const blockadeDef = CardRegistry.get('blockade');
    if (!blockadeDef) {
        console.error('FAIL: Blockade card definition not found. Is Seaside loaded?');
        return;
    }

    console.log('\nTest 1: Play Blockade');
    const result = ActionResolver.resolve(mockState, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'b1' });

    // ActionResolver returns a NEW state, so we must use it
    let currentState = result.state;

    if (!result.success && !currentState.pendingDecision) {
        console.error('FAIL: Could not play Blockade', result.error);
        return;
    }

    // Check for Pending Decision (Gain card up to 4)
    if (!currentState.pendingDecision) {
        console.error('FAIL: Blockade did not create a pending decision (to gain card)');
        return;
    }

    console.log('PASS: Blockade prompted for choice:', currentState.pendingDecision.message);

    // Simulate Player Choosing Silver (Cost 3 <= 4)
    console.log('\nTest 2: Choose Silver');
    const decisionResult = {
        type: 'CHOOSE' as any,
        choiceId: currentState.pendingDecision.id,
        payload: {
            type: 'SUPPLY',
            cardId: 'silver'
        }
    };

    // Resolve Decision
    const decisionRes = ActionResolver.resolve(currentState, 'p1', decisionResult);
    if (!decisionRes.success) {
        console.error('FAIL: Could not resolve decision', decisionRes.error);
        return;
    }

    currentState = decisionRes.state;
    // Update player reference from new state
    const p1State = currentState.players.find(p => p.id === 'p1');
    if (!p1State) return;

    // Check if Silver was gained to ASIDE
    const silverInAside = p1State.aside.find(c => c.id === 'silver');
    if (silverInAside) {
        console.log('PASS: Silver gained to ASIDE');
    } else {
        console.error('FAIL: Silver not found in ASIDE', { aside: p1State.aside, discard: p1State.discardPile });
        return;
    }

    // Check Linking
    const blockadeInPlay = p1State.playArea.find(c => c.instanceId === 'b1');
    if (blockadeInPlay && blockadeInPlay.linkedCards && blockadeInPlay.linkedCards.find(c => c.id === 'silver')) {
        console.log('PASS: Silver is linked to Blockade');
    } else {
        console.error('FAIL: Silver is not linked to Blockade', { linkedCards: blockadeInPlay?.linkedCards });
    }

    console.log('\nTest 3: End Turn -> Start Next Turn');
    // End Turn
    TurnMachine.endActionPhase(currentState);
    TurnMachine.endBuyPhase(currentState);
    // Mimic cleanup
    currentState.effectStack = [];
    TurnMachine.finalizeCleanup(currentState);

    // Check if Silver is in hand
    // IMPORTANT: ActionResolver.startNextTurn creates a new state or modifies in place?
    // finalizeCleanup modifies the passed state variable but returns EffectResult with potentially new state.
    // In test script, we need to capture it if finalizeCleanup returns new state.

    // Wait, TurnMachine.finalizeCleanup in my previous view returned EffectResult.
    // But ActionResolver doesn't call it directly normally?
    // It's called by 'FINALIZE_CLEANUP' effect handler.
    // The test calls TurnMachine.finalizeCleanup(currentState) directly.
    // But finalizeCleanup signature: public static finalizeCleanup(state: GameState): EffectResult
    // So it returns { state, needsChoice }.

    const cleanupRes = TurnMachine.finalizeCleanup(currentState);
    currentState = cleanupRes.state;

    const p1AfterTurn = currentState.players.find(p => p.id === 'p1');
    if (!p1AfterTurn) return;

    const silverInHand = p1AfterTurn.hand.find(c => c.id === 'silver');
    const silverInAsideAfter = p1AfterTurn.aside.find(c => c.id === 'silver');

    if (silverInHand && !silverInAsideAfter) {
        console.log('PASS: Silver returned to HAND at start of next turn');
    } else {
        console.error('FAIL: Silver did not return to hand', {
            inHand: !!silverInHand,
            inAside: !!silverInAsideAfter,
            handSize: p1AfterTurn.hand.length
        });
    }
}

testBlockade().catch(console.error);
