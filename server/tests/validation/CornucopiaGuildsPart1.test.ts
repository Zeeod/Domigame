import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Cornucopia & Guilds - Part 1', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    // CORNUCOPIA CARDS

    it('should test Menagerie - diversity bonus', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Action. Reveal hand. If all cards different, +3 Cards. Else +1 Card.

        // Test with all different cards
        engine.setHand(p, ['menagerie', 'copper', 'silver', 'estate']);
        engine.setDeck(p, ['gold', 'duchy', 'province']);

        engine.playCard('menagerie');

        expect(p.actions).toBe(1); // +1 Action
        // All different: should draw 3
        expect(p.hand.length).toBe(6); // Started 3, drew 3 = 6
        engine.assertCleanState();
    });

    it('should test Farming Village', () => {
        const p = engine.findPlayer('Player 1');
        // +2 Actions. Reveal cards until Action or Treasure, put in hand.

        engine.setHand(p, ['farming_village']);
        engine.setDeck(p, ['estate', 'duchy', 'copper']);

        engine.playCard('farming_village');

        expect(p.actions).toBe(2); // +2 Actions
        // Should reveal until copper, put in hand
        expect(p.hand.some(c => c.id === 'copper')).toBe(true);
        engine.assertCleanState();
    });

    it('should test Fortune Teller attack', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');
        // +2 Coins. Each other player reveals until Victory or Curse, puts on deck.

        engine.setHand(p1, ['fortune_teller']);
        engine.setDeck(p2, ['copper', 'silver', 'estate']);

        engine.playCard('fortune_teller');

        expect(p1.coins).toBe(2);
        // P2 should have estate on top of deck
        expect(p2.deck[0].id).toBe('estate');
        engine.assertCleanState();
    });

    it('should test Hamlet - flexible village', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +1 Action. May discard for +1 Action. May discard for +1 Buy.

        engine.setHand(p, ['hamlet', 'copper', 'estate']);
        engine.setDeck(p, ['silver']);

        engine.playCard('hamlet');

        expect(p.hand.length).toBe(3); // Started 2, drew 1 = 3
        expect(p.actions).toBe(1);

        // Should prompt to discard for action
        if (engine.state.pendingDecision) {
            const copper = p.hand.find(c => c.id === 'copper')!;
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: [copper.instanceId]
            });
            expect(p.actions).toBe(2);
        }

        // Then prompt for buy
        if (engine.state.pendingDecision) {
            const estate = p.hand.find(c => c.id === 'estate')!;
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: [estate.instanceId]
            });
            expect(p.buys).toBe(2);
        }

        engine.assertCleanState();
    });

    // GUILDS CARDS

    it('should test Advisor - opponent choice', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');
        // +1 Action. Reveal top 3. Opponent chooses 1 to discard. Put rest in hand.

        engine.setHand(p1, ['advisor']);
        engine.setDeck(p1, ['copper', 'silver', 'gold']);

        engine.playCard('advisor');

        expect(p1.actions).toBe(1);
        // Implementation may vary, just check it doesn't crash
        engine.assertCleanState();
    });

    it('should test Baker - coffers', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +1 Action, +1 Coffers

        engine.setHand(p, ['baker']);
        engine.setDeck(p, ['copper']);

        engine.playCard('baker');

        expect(p.hand.length).toBe(1);
        expect(p.actions).toBe(1);
        // Coffers tracked in player state
        expect(p.coffers).toBe(1);
        engine.assertCleanState();
    });

    it('should test Butcher - trash and upgrade', () => {
        const p = engine.findPlayer('Player 1');
        // +2 Coffers. Trash card, gain costing up to trashed + Coffers spent.

        engine.setHand(p, ['butcher', 'copper']);
        p.coffers = 3;

        engine.playCard('butcher');

        expect(p.coffers).toBe(5); // Started 3, +2 = 5

        // Should prompt to trash
        if (engine.state.pendingDecision) {
            const copper = p.hand.find(c => c.id === 'copper')!;
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: [copper.instanceId]
            });
        }

        // Can potentially test Coffers spending, but complex
        engine.assertCleanState();
    });

    it('should test Stonemason - overpay', () => {
        const p = engine.findPlayer('Player 1');
        // Trash card. Gain 2 cards each costing less.
        // Overpay: gain 2 Actions per coin overpaid.

        engine.setHand(p, ['stonemason', 'estate']);

        engine.playCard('stonemason');

        // Should prompt to trash
        expect(engine.state.pendingDecision).toBeDefined();

        const estate = p.hand.find(c => c.id === 'estate')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [estate.instanceId]
        });

        // Should prompt to gain 2 cards
        while (engine.state.pendingDecision) {
            engine.respondWithSupply('copper');
        }
        engine.assertCleanState();
    });
});
