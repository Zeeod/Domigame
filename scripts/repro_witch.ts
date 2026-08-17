
import { EffectEngine } from '../shared/engine/EffectEngine';
import { createGameState, GameState, createPlayerState } from '../shared/engine/GameState';
import { CardRegistry } from '../shared/cards/index';
import { createCardInstance, createCardInstances } from '../shared/engine/CardInstance';

async function testWitch() {
    console.log('--- Testing Witch Logic (Exact Test Setup) ---');

    // Mimic BaseGame.test.ts beforeEach
    const state = createGameState('base_game_seed');

    // Initialize 2 players
    const p1 = createPlayerState('p1', 'Player 1', '#fff');
    const p2 = createPlayerState('p2', 'Player 2', '#000');
    state.players.push(p1);
    state.players.push(p2);

    // Initialize common supply
    state.supply['curse'] = { cardId: 'curse', count: 10, cards: [] };
    state.supply['copper'] = { cardId: 'copper', count: 46, cards: [] };
    state.supply['witch'] = { cardId: 'witch', count: 10, cards: [] };

    console.log('State initialized.');

    // Mimic test body
    const witchCard = createCardInstance('witch');
    p1.hand = [witchCard];
    p1.deck = createCardInstances('copper', 2);

    // Setup P2
    p2.hand = [];
    p2.discardPile = [];

    // Play Witch
    const witchDef = CardRegistry.get('witch')!;
    if (!witchDef) {
        console.error('CRITICAL: Witch definition not found in CardRegistry!');
        return;
    }

    console.log('Applying Witch effects...', JSON.stringify(witchDef.effects, null, 2));

    try {
        EffectEngine.applyEffects(state, p1.id, witchDef.effects!);
    } catch (e) {
        console.error('Error in applyEffects:', e);
    }

    // Process stack (Simulate what test does if needed, though applyEffects usually drains stack)
    // The test originally had:
    // EffectEngine.applyEffects(state, p1.id, witchDef.effects!);
    // expect(p1.hand.length).toBe(3);

    console.log(`P1 Hand Size: ${p1.hand.length}`);
    console.log(`P1 Hand: ${p1.hand.map((c: any) => c.id).join(', ')}`);
    console.log(`P2 Discard Size: ${p2.discardPile.length}`);
    console.log(`P2 Discard: ${p2.discardPile.map((c: any) => c.id).join(', ')}`);

    // assertions
    if (p1.hand.length !== 3) {
        console.error('FAIL: P1 Hand Size mismatch');
    } else {
        console.log('PASS: P1 Hand Size');
    }

    // Check if P2 has curse
    const curse = p2.discardPile.find((c: any) => c.id === 'curse');
    if (!curse) {
        console.error('FAIL: P2 did not gain Curse');
    } else {
        console.log('PASS: P2 gained Curse');
    }

    // Check logs
    if (!state.history || state.history.length === 0) {
        console.error('FAIL: History is empty!');
    } else {
        console.log(`PASS: History has ${state.history.length} entries.`);
        const logTypes = state.history.map(l => l.type);
        console.log('Log Types:', logTypes);

        if (!logTypes.includes('DRAW_CARDS') && !logTypes.includes('DRAW')) {
            console.error('FAIL: Log missing DRAW event');
        }
        if (!logTypes.includes('GAIN_CARD') && !logTypes.includes('GAIN')) {
            console.error('FAIL: Log missing GAIN event');
        }
    }
}

testWitch().catch(console.error);
