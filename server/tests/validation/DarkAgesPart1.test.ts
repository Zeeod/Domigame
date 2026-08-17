import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Dark Ages Expansion - Part 1', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Squire - gain attack on trash', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Coin. Choose: +2 Actions, +2 Buys, gain Silver
        // When trash: gain Attack

        engine.setHand(p, ['squire']);

        engine.playCard('squire');

        expect(p.coins).toBe(1);
        expect(engine.state.pendingDecision).toBeDefined();

        // Choose +2 Actions
        engine.respondToDecision({
            type: 'CHOICE',
            choiceIndex: 0
        });

        expect(p.actions).toBe(2);
        engine.assertCleanState();
    });

    it('should test Poor House', () => {
        const p = engine.findPlayer('Player 1');
        // +4 Coins. Reveal hand. -1 Coin per Treasure revealed.

        engine.setHand(p, ['poor_house', 'copper', 'silver']);

        engine.playCard('poor_house');

        // +4, -2 (copper + silver) = 2 coins
        expect(p.coins).toBe(2);
        engine.assertCleanState();
    });

    it('should test Beggar reaction', () => {
        const p = engine.findPlayer('Player 1');
        // Gain 3 Coppers to hand
        // Reaction: discard, gain 2 Silvers onto deck

        engine.setHand(p, ['beggar']);

        engine.playCard('beggar');

        // Should gain 3 coppers
        expect(p.hand.filter(c => c.id === 'copper').length).toBe(3);
        engine.assertCleanState();
    });

    it('should test Armory', () => {
        const p = engine.findPlayer('Player 1');
        // Gain a card costing up to 4, put on deck

        engine.setHand(p, ['armory']);

        engine.playCard('armory');

        expect(engine.state.pendingDecision).toBeDefined();

        // Gain a silver (costs 3)
        engine.respondWithSupply('silver');

        expect(p.deck[0].id).toBe('silver');
        engine.assertCleanState();
    });

    it('should test Market Square reaction', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +1 Action, +1 Buy
        // Reaction: trash this, gain Gold

        engine.setHand(p, ['market_square']);
        engine.setDeck(p, ['copper']);

        engine.playCard('market_square');

        expect(p.hand.length).toBe(1);
        expect(p.actions).toBe(1);
        expect(p.buys).toBe(2);
        engine.assertCleanState();
    });

    it('should test Scavenger', () => {
        const p = engine.findPlayer('Player 1');
        // +2 Coins. May put deck into discard. Look through discard, put card on deck.

        engine.setHand(p, ['scavenger']);
        engine.setDiscard(p, ['silver', 'gold', 'copper']);

        engine.playCard('scavenger');

        expect(p.coins).toBe(2);

        // Should prompt for discard pile search
        if (engine.state.pendingDecision) {
            // Choose to put deck into discard (optional)
            engine.respondToDecision({
                type: 'YES'
            });
        }

        // Then select card to top-deck
        if (engine.state.pendingDecision) {
            const gold = p.discardPile.find(c => c.id === 'gold')!;
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: [gold.instanceId]
            });
        }

        engine.assertCleanState();
    });

    it('should test Storeroom', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Buy. Discard any number for +1 Card each.
        // Then discard any number for +1 Coin each.

        engine.setHand(p, ['storeroom', 'copper', 'estate', 'duchy']);
        engine.setDeck(p, ['silver', 'gold', 'province']);

        engine.playCard('storeroom');

        expect(p.buys).toBe(2);

        // First decision: discard for cards
        if (engine.state.pendingDecision) {
            const toDiscard = p.hand.filter(c => ['copper'].includes(c.id));
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: toDiscard.map(c => c.instanceId)
            });
        }

        // Should have drawn 1 card
        expect(p.hand.length).toBe(3); // Started 3, discarded 1, drew 1 = 3

        // Second decision: discard for coins
        if (engine.state.pendingDecision) {
            const toDiscard = p.hand.filter(c => ['estate'].includes(c.id));
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: toDiscard.map(c => c.instanceId)
            });

            expect(p.coins).toBe(1);
        }

        engine.assertCleanState();
    });

    it('should test Forager', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Action, +1 Buy. Trash a card. +1 Coin per different Treasure in trash.

        engine.setHand(p, ['forager', 'estate']);
        engine.state.trash = [
            engine.createCard('copper'),
            engine.createCard('silver'),
            engine.createCard('gold')
        ];

        engine.playCard('forager');

        expect(p.actions).toBe(1);
        expect(p.buys).toBe(2);

        // Should prompt to trash
        expect(engine.state.pendingDecision).toBeDefined();

        const estate = p.hand.find(c => c.id === 'estate')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [estate.instanceId]
        });

        // Should get +3 coins (3 different treasures in trash)
        expect(p.coins).toBe(3);
        engine.assertCleanState();
    });
});
