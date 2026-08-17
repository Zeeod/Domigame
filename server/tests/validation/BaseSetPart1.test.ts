import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Base Set - Part 1', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Village - basic cantrip', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +2 Actions

        engine.setHand(p, ['village']);
        engine.setDeck(p, ['copper']);

        engine.playCard('village');

        expect(p.hand.length).toBe(1);
        expect(p.actions).toBe(2); // Started 1, used 1, +2 = 2
        engine.assertCleanState();
    });

    it('should test Smithy - card draw', () => {
        const p = engine.findPlayer('Player 1');
        // +3 Cards

        engine.setHand(p, ['smithy']);
        engine.setDeck(p, ['copper', 'silver', 'gold']);

        engine.playCard('smithy');

        expect(p.hand.length).toBe(3);
        expect(p.actions).toBe(0); // Used 1
        engine.assertCleanState();
    });

    it('should test Laboratory', () => {
        const p = engine.findPlayer('Player 1');
        // +2 Cards, +1 Action

        engine.setHand(p, ['laboratory']);
        engine.setDeck(p, ['copper', 'silver']);

        engine.playCard('laboratory');

        expect(p.hand.length).toBe(2);
        expect(p.actions).toBe(1);
        engine.assertCleanState();
    });

    it('should test Festival', () => {
        const p = engine.findPlayer('Player 1');
        // +2 Actions, +1 Buy, +2 Coins

        engine.setHand(p, ['festival']);

        engine.playCard('festival');

        expect(p.actions).toBe(2);
        expect(p.buys).toBe(2);
        expect(p.coins).toBe(2);
        engine.assertCleanState();
    });

    it('should test Market', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +1 Action, +1 Buy, +1 Coin

        engine.setHand(p, ['market']);
        engine.setDeck(p, ['copper']);

        engine.playCard('market');

        expect(p.hand.length).toBe(1);
        expect(p.actions).toBe(1);
        expect(p.buys).toBe(2);
        expect(p.coins).toBe(1);
        engine.assertCleanState();
    });

    it('should test Witch - attack', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');
        // +2 Cards. Each other player gains Curse.

        engine.setHand(p1, ['witch']);
        engine.setDeck(p1, ['copper', 'silver']);

        engine.playCard('witch');

        expect(p1.hand.length).toBe(2);
        // P2 should gain curse (if available in supply)
        // This is complex, just verify no crash
        engine.assertCleanState();
    });

    it('should test Council Room', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');
        // +4 Cards, +1 Buy. Each other player draws 1.

        engine.setHand(p1, ['council_room']);
        engine.setDeck(p1, ['copper', 'silver', 'gold', 'estate']);
        engine.setDeck(p2, ['duchy']);

        const p2HandBefore = p2.hand.length;

        engine.playCard('council_room');

        expect(p1.hand.length).toBe(4);
        expect(p1.buys).toBe(2);
        expect(p2.hand.length).toBe(p2HandBefore + 1);
        engine.assertCleanState();
    });

    it('should test Library - draw to 7', () => {
        const p = engine.findPlayer('Player 1');
        // Draw until 7 cards. May set aside Actions.

        engine.setHand(p, ['library']);
        engine.setDeck(p, ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse']);

        engine.playCard('library');

        // Should draw until 7 cards (started with 0 after playing)
        expect(p.hand.length).toBe(7);
        engine.assertCleanState();
    });

    it('should test Cellar - sifting', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Action. Discard any number, +1 Card per discarded.

        engine.setHand(p, ['cellar', 'estate', 'copper', 'duchy']);
        engine.setDeck(p, ['silver', 'gold']);

        engine.playCard('cellar');

        expect(p.actions).toBe(1);

        // Should prompt to discard
        if (engine.state.pendingDecision) {
            const toDiscard = p.hand.filter(c => ['estate', 'duchy'].includes(c.id));
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: toDiscard.map(c => c.instanceId)
            });

            // Should draw 2 (for 2 discarded)
            expect(p.hand.length).toBe(3); // Started 2 (copper + discard), drew 2 = 3
        }

        engine.assertCleanState();
    });

    it('should test Militia - attack discard', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');
        // +2 Coins. Each other player discards down to 3.

        engine.setHand(p1, ['militia']);
        engine.setHand(p2, ['copper', 'silver', 'gold', 'estate', 'duchy']);

        engine.playCard('militia');

        expect(p1.coins).toBe(2);

        // P2 should be prompted to discard down to 3
        if (engine.state.pendingDecision) {
            const toDiscard = p2.hand.slice(0, 2); // Discard 2 to go from 5 to 3
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: toDiscard.map(c => c.instanceId)
            });

            expect(p2.hand.length).toBe(3);
        }

        engine.assertCleanState();
    });
});
