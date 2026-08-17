
import { EffectUtils } from '../shared/engine/EffectUtils';
import { GameState, PlayerState } from '../shared/engine/GameState';
import { CardRegistry } from '../shared/cards/index';

// Mock GameState
const mockState: GameState = {
    players: [],
    supply: {},
    trash: [],
    events: [],
    history: [],
    logs: [],
    rng: { seed: 'test-seed', state: undefined, callCount: 0 },
    phase: 'ACTION',
    turnNumber: 1,
    currentPlayerIndex: 0,
    activeLandscapes: [],
    effectStack: []
};

// Mock Player
const mockPlayer: PlayerState = {
    id: 'p1',
    name: 'Player 1',
    hand: [],
    deck: [],
    discardPile: [],
    playArea: [],
    aside: [],
    limbo: [],
    mats: {},
    tokens: {},
    actions: 1,
    buys: 1,
    coins: 0,
    score: 0,
    color: '#000',
    isBot: false,
    isHost: true,
    isReady: true,
    turnNumber: 1,
} as any;

// Helper to create dummy cards
const createCard = (id: string, instanceId: string) => ({ id, instanceId });

async function testReshuffle() {
    console.log('--- Testing Reshuffle Logic ---');

    console.log('\nTest 1: Draw from Deck (Sufficient)');
    mockPlayer.deck = [createCard('c1', '1'), createCard('c2', '2')];
    mockPlayer.hand = [];
    mockPlayer.discardPile = [];
    EffectUtils.drawCards(mockState, mockPlayer, 1);
    console.log(`Deck: ${mockPlayer.deck.length}, Hand: ${mockPlayer.hand.length}`);
    if (mockPlayer.hand.length !== 1 || mockPlayer.deck.length !== 1) console.error('FAIL: Expected 1 in hand, 1 in deck');
    else console.log('PASS');

    console.log('\nTest 2: Draw triggers Reshuffle');
    mockPlayer.deck = [createCard('c3', '3')];
    mockPlayer.discardPile = [createCard('c4', '4'), createCard('c5', '5')];
    mockPlayer.hand = [];
    // Draw 2: Should take 1 from deck, then shuffle discard (2), then take 1.
    // Result: Hand=2, Deck=1, Discard=0.
    EffectUtils.drawCards(mockState, mockPlayer, 2);
    console.log(`Deck: ${mockPlayer.deck.length}, Hand: ${mockPlayer.hand.length}, Discard: ${mockPlayer.discardPile.length}`);
    if (mockPlayer.hand.length !== 2 || mockPlayer.deck.length !== 1 || mockPlayer.discardPile.length !== 0) {
        console.error('FAIL: Expected Hand=2, Deck=1, Discard=0');
    } else {
        console.log('PASS');
    }

    console.log('\nTest 3: Draw from Empty Deck & Empty Discard');
    mockPlayer.deck = [];
    mockPlayer.discardPile = [];
    mockPlayer.hand = [];
    EffectUtils.drawCards(mockState, mockPlayer, 1);
    console.log(`Deck: ${mockPlayer.deck.length}, Hand: ${mockPlayer.hand.length}`);
    if (mockPlayer.hand.length !== 0) console.error('FAIL: Expected Hand=0');
    else console.log('PASS');

    console.log('\nTest 4: Draw more than available (Deck + Discard)');
    mockPlayer.deck = [createCard('c6', '6')];
    mockPlayer.discardPile = [createCard('c7', '7')];
    mockPlayer.hand = [];
    // Draw 5: Should get 2, result in empty deck/discard
    EffectUtils.drawCards(mockState, mockPlayer, 5);
    console.log(`Deck: ${mockPlayer.deck.length}, Hand: ${mockPlayer.hand.length}, Discard: ${mockPlayer.discardPile.length}`);
    if (mockPlayer.hand.length !== 2) console.error('FAIL: Expected Hand=2');
    else console.log('PASS');

}

testReshuffle().catch(console.error);
