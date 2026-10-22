import { getMat } from '../../../shared/engine/Mats.js';

import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from '../../helpers/TestUtils';

describe('Seaside Expansion Part 2', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Island (Ile)', () => {
        const p = engine.findPlayer('Player 1');
        // Island, Copper, Estate
        // Island puts itself and another card onto Island Mat
        // Island targets: BOTH (Self + Selected).
        // So Island moves to Mat immediately? Or after choice?
        // EffectEngine logic: handleMoveToMat checks targets.
        // If BOTH: Moves source (Island) to Mat, THEN asks for choice.

        engine.setHand(p, ['island', 'copper']);
        engine.setDeck(p, ['estate', 'estate', 'estate', 'estate', 'estate']);

        // Play Island
        engine.playCard('island');

        // Island should have moved itself to Mat.
        // And Prompt for 1 card to move to Mat.
        const islandMat = getMat(p, 'island');
        // Verify Island is already there?
        // If handleMoveToMat executed immediately for 'BOTH', Island is there.
        // If it waits for decision, maybe not.
        // Let's assume it moves immediately based on code reading.

        expect(engine.state.pendingDecision).toBeDefined();
        expect(engine.state.pendingDecision?.type).toBe('CHOOSE_CARDS');

        // Select Copper to join Island
        const copper = p.hand.find(c => c.id === 'copper');
        if (!copper) throw new Error("Copper not found");

        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [copper.instanceId]
        });

        // Now Island Mat should describe 2 cards: Island and Copper.
        expect(islandMat.length).toBe(2);
        expect(islandMat.some((c: any) => c.id === 'island')).toBe(true);
        expect(islandMat.some((c: any) => c.id === 'copper')).toBe(true);

        // Hand should be empty (Island played, Copper moved)
        expect(p.hand.length).toBe(0);

        engine.assertCleanState();
    });

    it('should test Native Village (Village Indigene) - Option 1: Set Aside', () => {
        const p = engine.findPlayer('Player 1');
        // Native Village: +2 Actions. Choose: Set aside top card of deck to Mat, OR put all Mat cards into hand.

        engine.setHand(p, ['native_village']);
        engine.setDeck(p, ['silver', 'gold']); // Deck has cards

        engine.playCard('native_village');

        // Should prompt for choice
        expect(engine.state.pendingDecision).toBeDefined();
        // Option 1: "Placer une carte..."
        engine.respondToDecision({
            type: 'CHOICE',
            choiceIndex: 0
        });

        const mat = getMat(p, 'nativeVillage');
        expect(mat.length).toBe(1);
        expect(mat[0].id).toBe('silver'); // Top card (first in array for setDeck usually treated as top? TestUtils setDeck: [top, ..., bottom] usually? No, [0] is drawn first usually? shift() takes 0. Yes.)

        expect(p.actions).toBe(2);
        engine.assertCleanState();
    });

    it('should test Native Village - Option 2: Take Cards', () => {
        const p = engine.findPlayer('Player 1');
        engine.setHand(p, ['native_village']);
        // Pre-populate mat
        getMat(p, 'nativeVillage').length = 0; // Clear
        // Cannot easily push to mat without helper or using effect. 
        // We can manually push for test setup if we cast.
        const gold = engine.createCard('gold');
        getMat(p, 'nativeVillage').push(gold);

        engine.playCard('native_village');

        engine.respondToDecision({
            type: 'CHOICE',
            choiceIndex: 1 // Take cards
        });

        const mat = getMat(p, 'nativeVillage');
        expect(mat.length).toBe(0);
        expect(p.hand.some(c => c.id === 'gold')).toBe(true);
        expect(p.actions).toBe(2);
        engine.assertCleanState();
    });

    // Lookout: see tests/cards/seaside/Seaside.test.ts

    it('should test Salvager (Naufrageur)', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Buy. Trash a card from hand. +Coins = Cost.
        engine.setHand(p, ['salvager', 'silver']); // Silver cost 3

        engine.playCard('salvager');

        expect(p.buys).toBe(2); // Started 1, +1 = 2

        // Trash Silver
        const silver = p.hand.find(c => c.id === 'silver')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [silver.instanceId]
        });

        expect(engine.state.trash.find(c => c.id === 'silver')).toBeDefined();
        expect(p.coins).toBe(3); // +3 from Silver

        engine.assertCleanState();
    });

    it('should test Sea Witch (Sorciere des Mers)', () => {
        const p = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');
        // Draw 2. Each other player gains Curse.
        engine.setHand(p, ['sea_witch']);
        engine.setDeck(p, ['copper', 'copper', 'copper']);

        engine.playCard('sea_witch');

        expect(p.hand.length).toBe(2); // Drew 2
        expect(p2.discardPile.some(c => c.id === 'curse')).toBe(true);

        engine.assertCleanState();
    });

    it('should test Haven (Havre)', () => {
        const p = engine.findPlayer('Player 1');
        // Draw 1, +1 Action. Set aside a card from hand face down.
        // Return it at start of next turn.
        engine.setHand(p, ['haven', 'gold']);
        engine.setDeck(p, ['silver']);

        engine.playCard('haven');

        // Draw 1 (Silver). Hand: Gold, Silver.
        expect(p.hand.length).toBe(2);
        expect(p.actions).toBe(1); // Started 1, Used 1, +1 = 1.

        // Prompt to set aside
        const gold = p.hand.find(c => c.id === 'gold')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [gold.instanceId]
        });

        // Gold should be in ASIDE, face down?
        expect(p.aside.find(c => c.id === 'gold')).toBeDefined();
        // Check linked
        const haven = p.playArea.find(c => c.id === 'haven');
        expect(haven?.linkedCards?.some(c => c.id === 'gold')).toBe(true);

        // Advance Turn
        engine.advanceTurn(); // P1 cleanup. Haven stays (Duration).
        // P2 Turn
        engine.advanceTurn();
        // P1 Turn Start
        // Haven should return Gold to hand.

        expect(p.hand.some(c => c.id === 'gold')).toBe(true);
        // Haven should be discarded this CleanUp? Or used? 
        // Duration cards are discarded from Play in CleanUp phase of the turn they "expire".
        // They expire after doing their "start of turn" effect.
        // So they are in Play during start of turn, execute, then discarded in text CleanUp.
        // advanceTurn() calls startTurn() then endTurn().
        // If we just started P1 turn, we haven't reached cleanup yet.
        // So Haven should still be in play?
        // Actually TestEngine advanceTurn typically runs full turn flow?
        // "advanceTurn" -> End current turn. Start next.
        // We called advanceTurn (P1->P2). P1 cleanup: Haven stays.
        // We called advanceTurn (P2->P1). P2 cleanup. P1 Start.
        // P1 Start effects run (Return Gold).
        // This test stops at Start of P1 turn (technically activePlayer set to P1).
        // So Gold should be in hand.

        expect(p.hand.some(c => c.id === 'gold')).toBe(true);

        engine.assertCleanState();
    });

});
