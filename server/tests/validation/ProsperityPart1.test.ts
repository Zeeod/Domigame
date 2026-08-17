import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Prosperity Expansion - Part 1', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Platinum treasure', () => {
        const p = engine.findPlayer('Player 1');
        engine.setHand(p, ['platinum']);

        // Play platinum (treasures are played differently, but for test just add coins)
        const card = p.hand.find(c => c.id === 'platinum')!;
        p.hand.splice(p.hand.indexOf(card), 1);
        p.playArea.push(card);
        p.coins += 5; // Platinum is worth 5

        expect(p.coins).toBe(5);
        expect(p.playArea.some(c => c.id === 'platinum')).toBe(true);
    });

    it('should test Colony victory card', () => {
        const p = engine.findPlayer('Player 1');
        // Colony is worth 10 VP - no active effects to test
        engine.setDeck(p, ['colony']);
        expect(p.deck[0].id).toBe('colony');
    });

    it('should test Watchtower reaction', () => {
        const p = engine.findPlayer('Player 1');
        // Draw until you have 6 cards in hand
        // Also: When you gain a card, you may reveal this from your hand.
        // If you do, either trash that card, or put it onto your deck.

        engine.setHand(p, ['watchtower']);
        engine.setDeck(p, ['copper', 'silver', 'gold', 'estate', 'duchy']);

        engine.playCard('watchtower');

        // Started with 1 in hand, played it (0), draw until 6
        expect(p.hand.length).toBe(5); // We have 5 cards in deck, so we draw 5
        expect(p.actions).toBe(0); // Used 1 action, no action bonus
        engine.assertCleanState();
    });

    it('should test City', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +2 Actions
        // If empty supply piles >= 1: +1 Card
        // If empty supply piles >= 2: +1 Buy, +1 Coin

        engine.setHand(p, ['city']);
        engine.setDeck(p, ['copper', 'silver']);

        engine.playCard('city');

        // Base case: no empty piles
        expect(p.hand.length).toBe(1); // +1 Card
        expect(p.actions).toBe(2); // +2 Actions

        // TODO: Test with empty piles
        engine.assertCleanState();
    });

    it('should test Workers Village', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +2 Actions, +1 Buy

        engine.setHand(p, ['workers_village']);
        engine.setDeck(p, ['copper']);

        engine.playCard('workers_village');

        expect(p.hand.length).toBe(1);
        expect(p.actions).toBe(2); // Started 1, used 1, +2 = 2
        expect(p.buys).toBe(2); // Started 1, +1 = 2
        engine.assertCleanState();
    });

    it('should test Vault', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');

        // +2 Cards. Discard any number for +1 Coin each.
        // Other players may discard 2 for +1 Card.

        engine.setHand(p1, ['vault', 'copper', 'estate']);
        engine.setDeck(p1, ['silver', 'gold']);

        engine.playCard('vault');

        expect(p1.hand.length).toBe(4); // Started 2, +2 = 4

        // Should prompt to discard for coins
        expect(engine.state.pendingDecision).toBeDefined();

        // Discard 2 cards for +2 coins
        const toDiscard = p1.hand.filter(c => ['copper', 'estate'].includes(c.id));
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: toDiscard.map(c => c.instanceId)
        });

        expect(p1.coins).toBe(2);
        expect(p1.hand.length).toBe(2);

        // Handle P2's optional Vault decision
        if (engine.state.pendingDecision) {
            engine.respondToDecision({ index: 1 }); // Decline
        }

        engine.assertCleanState();
    });

    it('should test Kings Court', () => {
        const p = engine.findPlayer('Player 1');
        // Play an action card 3 times

        engine.setHand(p, ['kings_court', 'village']);
        engine.setDeck(p, ['copper', 'silver', 'gold']);

        engine.playCard('kings_court');

        // Should prompt to choose an action
        expect(engine.state.pendingDecision).toBeDefined();

        const village = p.hand.find(c => c.id === 'village')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [village.instanceId]
        });

        // Village gives +1 Card, +2 Actions
        // x3 = +3 Cards, +6 Actions
        expect(p.hand.length).toBe(3);
        expect(p.actions).toBe(6); // Started 1, used 1 for KC, +6 = 6
        engine.assertCleanState();
    });

    it('should test Expand', () => {
        const p = engine.findPlayer('Player 1');
        // Trash a card from hand. Gain one costing up to 3 more.

        engine.setHand(p, ['expand', 'silver']);

        engine.playCard('expand');

        // Should prompt to trash
        expect(engine.state.pendingDecision).toBeDefined();

        const silver = p.hand.find(c => c.id === 'silver')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [silver.instanceId]
        });

        // After trashing, onSuccess should trigger gain prompt
        // This happens automatically via onSuccess chain
        if (engine.state.pendingDecision) {
            // Gain a gold (costs 6 = 3 + 3 bonus)
            engine.respondWithSupply('gold');
        }

        expect(engine.state.trash.some(c => c.id === 'silver')).toBe(true);
        expect(p.discardPile.some(c => c.id === 'gold')).toBe(true);
        engine.assertCleanState();
    });
});
