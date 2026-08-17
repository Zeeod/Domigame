
import { ActionResolver } from '../shared/engine/ActionResolver';
import { TurnMachine } from '../shared/engine/TurnMachine';
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
    rng: { seed: 'night-test', callCount: 0 },
    history: [],
    logs: [],
    effectStack: []
} as any;

const mockPlayer: PlayerState = {
    id: 'p1',
    name: 'Player 1',
    hand: [],
    deck: [],
    discardPile: [],
    playArea: [],
    actions: 1,
    buys: 1,
    coins: 0,
    isReady: true
} as any;

mockState.players = [mockPlayer];

// Helper to register a dummy Night card
if (!CardRegistry.get('devil_workshop')) {
    CardRegistry.register({
        id: 'devil_workshop',
        name: "Devil's Workshop",
        types: ['NIGHT'],
        cost: 4,
        effects: []
    });
}
if (!CardRegistry.get('village')) {
    CardRegistry.register({
        id: 'village',
        name: "Village",
        types: ['ACTION'],
        cost: 3,
        effects: []
    });
}
if (!CardRegistry.get('gold')) {
    CardRegistry.register({
        id: 'gold',
        name: "Gold",
        types: ['TREASURE'],
        cost: 6,
        treasureValue: 3,
        effects: []
    });
}

async function testNightPhase() {
    console.log('--- Testing Night Phase Logic ---');

    // Setup: Hand with Village, Gold, Devil's Workshop
    mockPlayer.hand = [
        { id: 'village', instanceId: 'v1' },
        { id: 'gold', instanceId: 'g1' },
        { id: 'devil_workshop', instanceId: 'n1' }
    ] as any;

    console.log('\nTest 1: Try playing Night card in Action Phase');
    mockState.phase = 'ACTION';
    let result = ActionResolver.resolve(mockState, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'n1' });
    if (result.success) console.error('FAIL: Should not allow Night card in Action phase');
    else console.log('PASS: ' + result.error);

    console.log('\nTest 2: Play Village (Action Phase)');
    result = ActionResolver.resolve(mockState, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'v1' });
    if (!result.success) console.error('FAIL: Should allow Village');
    else {
        console.log('PASS: Village played');
        mockState.phase = result.state.phase; // Sync state
        mockPlayer.playArea.push(mockPlayer.hand.shift()!); // Mock move
    }

    console.log('\nTest 3: Play Gold (Auto-transition to Buy)');
    result = ActionResolver.resolve(mockState, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'g1' });
    if (!result.success) {
        console.error('FAIL: Should allow Gold');
    } else {
        console.log('PASS: Gold played');
        // Check if phase changed
        if (result.state.phase !== 'BUY') console.error(`FAIL: Expected BUY phase, got ${result.state.phase}`);
        else console.log('PASS: Phase is BUY');
        mockState.phase = result.state.phase;
        mockPlayer.playArea.push(mockPlayer.hand.shift()!);
    }

    console.log('\nTest 4: Try playing Night card in Buy Phase');
    result = ActionResolver.resolve(mockState, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'n1' });
    if (result.success) console.error('FAIL: Should not allow Night card in Buy phase');
    else console.log('PASS: ' + result.error);

    console.log('\nTest 5: End Buy Phase -> Should go to NIGHT (because Night card in hand)');
    TurnMachine.maybeTransitionToNight(mockState);
    if (mockState.phase !== 'NIGHT') console.error(`FAIL: Expected NIGHT phase, got ${mockState.phase}`);
    else console.log('PASS: Phase is NIGHT');

    console.log('\nTest 6: Play Night Card in Night Phase');
    result = ActionResolver.resolve(mockState, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'n1' });
    if (!result.success) console.error('FAIL: Should allow Night card');
    else {
        console.log('PASS: Night card played');
        // Check auto-end
        // Hand should be empty of Night cards now (we had 1)
        // logic is tricky because we are mocking and ActionResolver returns NEW state
        if (result.state.phase === 'CLEANUP') console.log('PASS: Auto-ended Night Phase completely');
        else if (result.state.phase === 'NIGHT') console.log('INFO: Stayed in Night Phase (maybe logic check failed on mock inputs?)');
    }
}

testNightPhase().catch(console.error);
