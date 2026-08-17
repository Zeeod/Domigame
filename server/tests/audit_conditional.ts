
import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { PlayerState, createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { shanty_town } from '../../shared/cards/intrigue/shanty_town.js';
import { conspirator } from '../../shared/cards/intrigue/conspirator.js';
import { ironworks } from '../../shared/cards/intrigue/ironworks.js';
import { village } from '../../shared/cards/base/village.js';
import { smithy } from '../../shared/cards/base/smithy.js';
import { estate } from '../../shared/cards/base/estate.js';
import { copper } from '../../shared/cards/base/copper.js';
import { silver } from '../../shared/cards/base/silver.js';
import { nobles } from '../../shared/cards/intrigue/nobles.js';

// Register cards
CardRegistry.register(shanty_town);
CardRegistry.register(conspirator);
CardRegistry.register(ironworks);
CardRegistry.register(village);
CardRegistry.register(smithy);
CardRegistry.register(estate);
CardRegistry.register(copper);
CardRegistry.register(silver);
CardRegistry.register(nobles);

function createTestState(): GameState {
    const state = createGameState('test_game');
    state.players = [createPlayerState('p1', 'Player1'), createPlayerState('p2', 'Player2')];
    state.players.forEach(p => {
        for (let i = 0; i < 5; i++) {
            p.deck.push(createCardInstance('copper'));
        }
    });
    return state;
}

function testShantyTown() {
    console.log('--- Testing Shanty Town (Taudis) ---');
    const state = createTestState();
    const p1 = state.players[0];

    // Case 1: No Actions in Hand
    p1.hand = [createCardInstance('estate'), createCardInstance('copper')];
    const stCard = createCardInstance('shanty_town');
    p1.playArea.push(stCard);

    console.log('Case 1: No Actions in Hand. Hand size before:', p1.hand.length);
    if (shanty_town.effects) {
        EffectEngine.applyEffects(state, p1.id, shanty_town.effects, false, stCard.instanceId);
    }

    console.log('Hand size after:', p1.hand.length);
    if (p1.hand.length === 4) {
        console.log('PASS: Drew 2 cards.');
    } else {
        console.error('FAIL: Did not draw 2 cards. (Expected 4, got ' + p1.hand.length + ')');
    }

    // Case 2: Action in Hand
    const p2 = state.players[1];
    p2.hand = [createCardInstance('village'), createCardInstance('copper')];
    const stCard2 = createCardInstance('shanty_town');
    p2.playArea.push(stCard2);

    console.log('Case 2: Action in Hand. Hand size before:', p2.hand.length);
    if (shanty_town.effects) {
        EffectEngine.applyEffects(state, p2.id, shanty_town.effects, false, stCard2.instanceId);
    }

    console.log('Hand size after:', p2.hand.length);
    if (p2.hand.length === 2) {
        console.log('PASS: Did not draw.');
    } else {
        console.error('FAIL: Drew cards incorrectly. (Expected 2, got ' + p2.hand.length + ')');
    }
}

function testConspirator() {
    console.log('\n--- Testing Conspirator ---');
    const state = createTestState();
    const p1 = state.players[0];

    // Case 1: Played only Conspirator
    const c1 = createCardInstance('conspirator');
    p1.playArea = [c1];
    p1.actions = 1;

    console.log('Case 1: 1 Action Played. Actions before:', p1.actions);
    if (conspirator.effects) {
        EffectEngine.applyEffects(state, p1.id, conspirator.effects, false, c1.instanceId);
    }

    console.log('Actions after:', p1.actions);
    if (p1.actions === 1) {
        console.log('PASS: No extra action given.');
    } else {
        console.error('FAIL: Extra action given. Actions: ' + p1.actions);
    }

    // Case 2: Played 3 Actions 
    const p2 = state.players[1];
    const c2 = createCardInstance('conspirator');
    p2.playArea = [createCardInstance('village'), createCardInstance('smithy'), c2];
    p2.actions = 1; // Base actions

    console.log('Case 2: 3 Actions Played. Actions before:', p2.actions);
    if (conspirator.effects) {
        EffectEngine.applyEffects(state, p2.id, conspirator.effects, false, c2.instanceId);
    }
    // Conspirator gives +1 Action if 3+ played.

    console.log('Actions after:', p2.actions);
    if (p2.actions === 2) {
        console.log('PASS: Extra action given.');
    } else {
        console.error('FAIL: No extra action given. Actions: ' + p2.actions);
    }
}

function testIronworks() {
    console.log('\n--- Testing Ironworks ---');
    const state = createTestState();
    const p1 = state.players[0];

    // Case 1: Gaining Silver (Treasure)
    console.log('Case 1: Gaining Silver (Treasure)');
    p1.coins = 0;

    // Simulate Last Gained Card
    const silverCard = createCardInstance('silver');
    state.lastGainedCard = silverCard;

    const treasureCondition = ironworks.effects?.find(e => e.type === 'CONDITION' && e.condition === 'IS_TREASURE');
    if (treasureCondition) {
        EffectEngine.applyEffects(state, p1.id, [treasureCondition], false);
    }

    if (p1.coins === 1) {
        console.log('PASS: +1 Coin for Treasure.');
    } else {
        console.error('FAIL: Did not get +1 Coin. Coins: ' + p1.coins);
    }

    // Case 2: Gaining Nobles (Action + Victory)
    console.log('Case 2: Gaining Nobles (Action + Victory)');
    const ghCard = createCardInstance('nobles');
    state.lastGainedCard = ghCard;
    p1.actions = 1;
    p1.hand = [];

    const actionCondition = ironworks.effects?.find(e => e.type === 'CONDITION' && e.condition === 'IS_ACTION');
    const victoryCondition = ironworks.effects?.find(e => e.type === 'CONDITION' && e.condition === 'IS_VICTORY');

    if (actionCondition) EffectEngine.applyEffects(state, p1.id, [actionCondition], false);
    if (victoryCondition) EffectEngine.applyEffects(state, p1.id, [victoryCondition], false);

    if (p1.actions === 2) console.log('PASS: +1 Action.');
    else console.error('FAIL: No +1 Action. Actions: ' + p1.actions);

    if (p1.hand.length === 1) console.log('PASS: +1 Card (Draw).');
    else console.error('FAIL: No Draw. Hand: ' + p1.hand.length);
}

testShantyTown();
testConspirator();
testIronworks();
