
import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { PlayerState, createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { sage } from '../../shared/cards/dark_ages/sage.js';
import { estate } from '../../shared/cards/base/estate.js';
import { copper } from '../../shared/cards/base/copper.js';
import { silver } from '../../shared/cards/base/silver.js';
import { gold } from '../../shared/cards/base/gold.js';

// Register cards
CardRegistry.register(sage);
CardRegistry.register(estate);
CardRegistry.register(copper); // Cost 0
CardRegistry.register(silver); // Cost 3
CardRegistry.register(gold);   // Cost 6

function createTestState(): GameState {
    const state = createGameState('test_game');
    const p1 = createPlayerState('p1', 'Player1');
    state.players = [p1];

    // Ensure players have decks
    state.players.forEach((p: PlayerState) => {
        p.deck = [];
        p.discardPile = [];
        p.hand = [];
    });
    return state;
}

function testSage() {
    console.log('--- Testing Sage (Dark Ages) ---');
    const state = createTestState();
    const p1 = state.players[0];

    // Setup Deck: Top -> [Copper, Copper, Silver, Gold] -> Bottom
    // Sage should reveal Copper (0), Copper (0) -> Keep revealing.
    // Reveal Silver (3) -> Stop.
    // Put Silver in Hand.
    // Discard Copper, Copper.
    // Gold remains in Deck (not revealed).

    p1.deck = [
        createCardInstance('copper'),
        createCardInstance('copper'),
        createCardInstance('silver'),
        createCardInstance('gold')
    ];

    // Debug: deck is treated specific way (shift() takes from front). 
    // Usually index 0 is TOP.
    // So [Copper, Copper, Silver, Gold]
    // 1. Reveal Copper. < 3.
    // 2. Reveal Copper. < 3.
    // 3. Reveal Silver. >= 3. STOP.

    // Logic check: Sage effect
    console.log('Deck size before:', p1.deck.length);

    if (sage.effects) {
        EffectEngine.applyEffects(state, p1.id, sage.effects, false);
    }

    console.log('Hand:', p1.hand.map(c => c.id).join(', '));
    console.log('Discard:', p1.discardPile.map(c => c.id).join(', '));
    console.log('Deck:', p1.deck.map(c => c.id).join(', '));

    // Expectations:
    // Hand: only Silver.
    // Discard: Copper, Copper.
    // Deck: Gold.

    const hasSilverInHand = p1.hand.some(c => c.id === 'silver');
    const handSizeCorrect = p1.hand.length === 1; // Only Silver
    const discardHasCoppers = p1.discardPile.filter(c => c.id === 'copper').length === 2;
    const deckHasGold = p1.deck.length === 1 && p1.deck[0].id === 'gold';

    if (hasSilverInHand && handSizeCorrect && discardHasCoppers && deckHasGold) {
        console.log('PASS: Correctly picked Silver and discarded Coppers.');
    } else {
        console.error('FAIL: Logic incorrect.');
        if (!handSizeCorrect) console.error('  Hand size wrong (expected 1): ' + p1.hand.length);
        if (!discardHasCoppers) console.error('  Discard content wrong.');
        if (!deckHasGold) console.error('  Deck content wrong.');
    }
}

testSage();
