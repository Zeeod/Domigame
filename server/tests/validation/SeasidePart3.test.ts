
import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Seaside Expansion Part 3', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Bazaar (Bazar)', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +2 Actions, +1 Coin
        engine.setHand(p, ['bazaar']);
        engine.setDeck(p, ['copper']);

        engine.playCard('bazaar');

        expect(p.hand.length).toBe(1); // Drew copper
        expect(p.actions).toBe(2); // Started 1, used 1, +2 = 2
        expect(p.coins).toBe(1);
        engine.assertCleanState();
    });

    it('should test Warehouse (Entrepot)', () => {
        const p = engine.findPlayer('Player 1');
        // +3 Cards, +1 Action. Discard 3 cards.
        engine.setHand(p, ['warehouse', 'silver']);
        engine.setDeck(p, ['copper', 'estate', 'duchy']);

        engine.playCard('warehouse');

        // Hand before discard: Silver + 3 drawn = 4 cards
        expect(p.hand.length).toBe(4);
        expect(engine.state.pendingDecision).toBeDefined();
        expect(engine.state.pendingDecision?.message).toMatch(/Défaussez/);

        // Discard 3
        const toDiscard = p.hand.filter(c => ['copper', 'estate', 'duchy'].includes(c.id));
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: toDiscard.map(c => c.instanceId)
        });

        // Left with Silver
        expect(p.hand.length).toBe(1);
        expect(p.hand[0].id).toBe('silver');
        expect(p.actions).toBe(1);
        engine.assertCleanState();
    });

    it('should test Cutpurse (Coupe-bourse)', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');

        // P1 plays Cutpurse. +2 Coin. 
        // P2 must discard Copper (or reveal hand if no Copper).

        engine.setHand(p1, ['cutpurse']);
        engine.setHand(p2, ['copper', 'silver', 'estate', 'estate', 'estate']);

        engine.playCard('cutpurse');

        expect(p1.coins).toBe(2);

        // P2 prompt
        // Assuming Attack handling creates choice for P2
        expect(engine.state.pendingDecision).toBeDefined();
        expect(engine.state.pendingDecision?.playerId).toBe(p2.id); // Should be P2

        const copper = p2.hand.find(c => c.id === 'copper')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [copper.instanceId]
        });

        expect(p2.discardPile.some(c => c.id === 'copper')).toBe(true);
        expect(p2.hand.find(c => c.id === 'copper')).toBeUndefined();

        engine.assertCleanState();
    });

    it('should test Treasury (Tresorerie)', () => {
        const p = engine.findPlayer('Player 1');
        // +1 Card, +1 Action, +1 Coin.
        // When discarding from play (cleanup), if no Victory bought, can put on deck.

        engine.setHand(p, ['treasury']);
        engine.setDeck(p, ['copper']);
        p.buys = 1;

        engine.playCard('treasury');
        expect(p.hand.length).toBe(1);
        expect(p.coins).toBe(1);

        // Buy something NOT Victory (e.g. Silver)
        const silver = engine.createCard('silver');
        // Trick: to test "boughtVictoryCard", we simulate a buy or manually flag
        // Let's just do clean up.

        // Advance Turn triggers cleanup
        // treasury's discardEffect should prompt/auto-place?
        // Usually optional "You may put..."

        engine.advanceTurn();

        // Pending decision for Treasury top-decking?
        // Note: advanceTurn() might process things automatically if no choice? 
        // Or if choice is needed, it pauses.

        // If it pauses, check decision.
        const decision = engine.state.pendingDecision;
        // If decision exists, it's likely Treasury.
        if (decision) {
            expect(decision.message).toMatch(/Voulez-vous mettre Trésorerie sur votre deck/);
            engine.respondToDecision({ type: 'YES' });

            // Should be on top of deck (which is empty after shuffle/draw? No, clean up happens before draw?)
            // Cleanup: Discard hand/play. Then Draw new hand.
            // Treasury effect happens "When you discard this from play" -> triggers during Cleanup.
            // If put on deck, it goes to deck. Then we draw 5.
            // So if deck was empty, we draw it immediately for next turn?

            // Let's check P2 turn then back to P1.
        }

        // Finish P1 turn (if paused)
        if (engine.state.pendingDecision) engine.processStack();

        // P2 Turn
        engine.advanceTurn();

        // Back to P1
        expect(p.hand.some(c => c.id === 'treasury')).toBe(true);

        engine.assertCleanState();
    });

    it('should test Tactician (Tacticien)', () => {
        const p = engine.findPlayer('Player 1');
        // Discard hand. If discarded >=1, +5 cards +1 Action, +1 Buy NEXT turn.

        engine.setHand(p, ['tactician', 'silver', 'copper']);
        // Ensure huge deck for +5 draw
        engine.setDeck(p, Array(15).fill('copper'));

        engine.playCard('tactician');

        // Prompt to discard hand
        // Wait, Tactician says "Discard your hand". Not "Choose cards".
        // It might be automatic or "Confirm" style?
        // Or "Choose all cards".

        // Assuming implementation might be manual discard choice or automatic.
        // Usually "Discard your hand" is select all.

        // If decision:
        if (engine.state.pendingDecision) {
            const toDiscard = p.hand.filter(c => c.id !== 'tactician'); // Tactician is in play
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: toDiscard.map(c => c.instanceId)
            });
        }

        expect(p.hand.length).toBe(0);

        // End turn -> P2 -> P1
        engine.advanceTurn();
        engine.advanceTurn();

        // P1 Start of turn
        // Tactician Duration effect: +5 Cards, +1 Buy, +1 Action
        // Normal draw is 5. Total 10?
        expect(p.hand.length).toBe(10);
        expect(p.actions).toBe(2); // 1 base + 1
        expect(p.buys).toBe(2); // 1 base + 1

        engine.assertCleanState();
    });

    it('should test Smugglers (Contrebandiers)', () => {
        const p1 = engine.findPlayer('Player 1');
        const p2 = engine.findPlayer('Player 2');

        // Setup: P2 needs to have gained a card costing <= 6 on their LAST turn.
        // We need to simulate history or inject state.

        // Round 1: P2 buys Silver
        // P1 sets up

        // Round 1: P1 starts. Advance to P2.
        engine.advanceTurn();
        expect(engine.activePlayerId).toBe(p2.id);

        // P2 gains Silver
        engine.gainCard('silver', p2.id); // This logs GAIN

        // End P2 turn -> P1
        engine.advanceTurn();

        // Now P1 turn
        expect(engine.activePlayerId).toBe(p1.id);
        engine.setHand(p1, ['smugglers']);

        engine.playCard('smugglers');

        // Should prompt to gain a copy of Silver
        // (Implementation scans previous turn gained cards)

        // If generic "Choose card to gain" from list [Silver]
        expect(engine.state.pendingDecision).toBeDefined();
        // Respond with Silver
        // Usually expects 'GAIN' or 'CARD_CHOICE'

        // We need to know pending decision structure for Smugglers
        // If it finds exactly one, maybe auto-gain? 
        // If implemented correctly, it should allow choice if multiple gained.

        // Assuming it prompts:
        if (engine.state.pendingDecision) {
            // Smugglers prompts CHOOSE_CARDS from supply
            // Respond with 'silver' card ID
            engine.respondWithSupply('silver');
        }

        expect(p1.discardPile.some(c => c.id === 'silver')).toBe(true);

        engine.assertCleanState();
    });

});
