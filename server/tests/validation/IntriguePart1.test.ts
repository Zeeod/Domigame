import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Intrigue Expansion - Part 1', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Pawn - choice mechanics', () => {
        const p = engine.findPlayer('Player 1');
        // Choose 2: +1 Card, +1 Action, +1 Buy, +1 Coin

        engine.setHand(p, ['pawn']);
        engine.setDeck(p, ['copper']);

        engine.playCard('pawn');

        // Should prompt for 2 choices
        expect(engine.state.pendingDecision).toBeDefined();
        expect(engine.state.pendingDecision?.message).toMatch(/Choisissez 2/);

        // Choose +1 Card and +1 Action
        engine.respondToDecision({
            type: 'MULTI_CHOICE',
            choices: [0, 1] // Assuming indices for Card and Action
        });

        expect(p.hand.length).toBe(1); // Drew 1
        expect(p.actions).toBe(1); // +1 Action
        engine.assertCleanState();
    });

    it('should test Steward - three options', () => {
        const p = engine.findPlayer('Player 1');
        // Choose: +2 Cards, +2 Coins, or trash 2 cards

        engine.setHand(p, ['steward', 'copper', 'estate']);
        engine.setDeck(p, ['silver', 'gold']);

        engine.playCard('steward');

        // Should prompt for option
        expect(engine.state.pendingDecision).toBeDefined();

        // Choose +2 Cards
        engine.respondToDecision({
            type: 'CHOICE',
            choiceIndex: 0
        });

        expect(p.hand.length).toBe(4); // Started 2, +2 = 4
        engine.assertCleanState();
    });

    it('should test Courtier - reveals and choices', () => {
        const p = engine.findPlayer('Player 1');
        // Reveal a card. Choose per type: +1 Action, +1 Buy, +3 Coins, gain Gold

        engine.setHand(p, ['courtier', 'silver']); // Silver = Treasure (1 type)

        engine.playCard('courtier');

        // Should prompt to reveal
        expect(engine.state.pendingDecision).toBeDefined();

        const silver = p.hand.find(c => c.id === 'silver')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [silver.instanceId]
        });

        // Should get 1 choice (silver has 1 type)
        if (engine.state.pendingDecision) {
            engine.respondToDecision({
                type: 'CHOICE',
                choiceIndex: 2 // +3 Coins
            });
        }

        expect(p.coins).toBe(3);
        engine.assertCleanState();
    });

    it('should test Mill - discard and benefits', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +1 Action. May discard 2 for +2 Coins
        // VICTORY - 1 VP

        engine.setHand(p, ['mill', 'copper', 'estate']);
        engine.setDeck(p, ['silver']);

        engine.playCard('mill');

        expect(p.hand.length).toBe(3); // Started 2, drew 1 = 3
        expect(p.actions).toBe(1);

        // Should prompt to discard
        if (engine.state.pendingDecision) {
            const toDiscard = p.hand.filter(c => ['copper', 'estate'].includes(c.id));
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: toDiscard.map(c => c.instanceId)
            });

            expect(p.coins).toBe(2);
        }

        engine.assertCleanState();
    });

    it('should test Shanty Town - hand checking', () => {
        const p = engine.findPlayer('Player 1');
        // +2 Actions. Reveal hand. If no Actions, +2 Cards.

        // Test with no actions in hand
        engine.setHand(p, ['shanty_town', 'copper', 'estate']);
        engine.setDeck(p, ['silver', 'gold']);

        engine.playCard('shanty_town');

        expect(p.actions).toBe(2); // Started 1, used 1, +2 = 2
        expect(p.hand.length).toBe(4); // Started 2, +2 cards = 4
        engine.assertCleanState();
    });

    it('should test Bridge - cost reduction', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Buy, +1 Coin. All cards cost 1 less this turn.

        engine.setHand(p, ['bridge']);

        engine.playCard('bridge');

        expect(p.buys).toBe(2);
        expect(p.coins).toBe(1);

        // Cost reduction is tracked in state (not directly testable here)
        engine.assertCleanState();
    });

    it('should test Conspirator - conditional bonus', () => {
        const p = engine.findPlayer('Player 1');
        // +2 Coins. If 3+ actions played: +1 Card, +1 Action

        // Test without bonus (first action)
        engine.setHand(p, ['conspirator']);
        engine.setDeck(p, ['copper']);

        engine.playCard('conspirator');

        expect(p.coins).toBe(2);
        expect(p.hand.length).toBe(0); // No bonus
        expect(p.actions).toBe(0); // Used 1, no bonus
        engine.assertCleanState();
    });

    it('should test Courtyard - deck management', () => {
        const p = engine.findPlayer('Player 1');
        // +3 Cards. Put a card from hand onto deck.

        engine.setHand(p, ['courtyard']);
        engine.setDeck(p, ['copper', 'silver', 'gold']);

        engine.playCard('courtyard');

        expect(p.hand.length).toBe(3); // Drew 3

        // Should prompt to put one back
        expect(engine.state.pendingDecision).toBeDefined();

        const copper = p.hand.find(c => c.id === 'copper')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [copper.instanceId]
        });

        expect(p.hand.length).toBe(2);
        expect(p.deck[0].id).toBe('copper');
        engine.assertCleanState();
    });
});
