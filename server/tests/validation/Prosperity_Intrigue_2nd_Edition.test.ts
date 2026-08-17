import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Prosperity & Intrigue 2nd Edition Validation', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Magnate (+1 Action, Reveal hand, +1 Card per Treasure)', () => {
        const p = engine.findPlayer('Player 1');
        // Hand: Magnate, Copper, Silver, Estate, Estate (2 Treasures)
        engine.setHand(p, ['magnate', 'copper', 'silver', 'estate', 'estate']);
        engine.setDeck(p, ['gold', 'gold', 'gold']);

        engine.playCard('magnate');

        expect(p.actions).toBe(1); // Started 1, used 1, +1 from Magnate
        // Should draw 2 cards
        engine.expectLog('main');
    });

    it('should test Mint (Reveal Treasure to gain copy)', () => {
        const p = engine.findPlayer('Player 1');
        engine.setHand(p, ['mint', 'gold', 'estate']);

        engine.playCard('mint');

        // Should prompt to choose a treasure to copy
        expect(engine.state.pendingDecision).toBeDefined();

        engine.handleChoice('gold');

        expect(p.discardPile.some(c => c.id === 'gold')).toBe(true);
    });

    it('should test Mint onBuy (Trash treasures in play)', () => {
        const p = engine.findPlayer('Player 1');
        // Setup treasures in play
        engine.setPlayArea(p, ['copper', 'silver', 'village']);
        p.coins = 5;
        p.buys = 1;

        engine.buyCard('mint');

        // Treasures in play should be trashed, Village should remain
        expect(engine.state.trash.some(c => c.id === 'copper')).toBe(true);
        expect(engine.state.trash.some(c => c.id === 'silver')).toBe(true);
        expect(p.playArea.some(c => c.id === 'village')).toBe(true);
        expect(p.playArea.some(c => c.id === 'copper')).toBe(false);
        expect(p.playArea.some(c => c.id === 'silver')).toBe(false);
    });

    it('should test Shanty Town (+2 Actions, reveal hand, if no actions +2 Cards)', () => {
        const p = engine.findPlayer('Player 1');

        // Case 1: No actions in hand
        engine.setHand(p, ['shanty_town', 'copper', 'estate']);
        engine.setDeck(p, ['silver', 'silver']);
        engine.playCard('shanty_town');

        expect(p.actions).toBe(2);
        expect(p.hand.length).toBe(4); // 2 remaining + 2 drawn

        // Case 2: Actions in hand
        p.actions = 1;
        engine.setHand(p, ['shanty_town', 'village', 'estate']);
        engine.setDeck(p, ['silver', 'silver']);
        engine.playCard('shanty_town', null, p.id);

        expect(p.actions).toBe(2);
        expect(p.hand.length).toBe(2); // No cards drawn
    });

    it('should test Patrol (+3 Cards, reveal 4, Victory/Curse to hand, others to deck)', () => {
        const p = engine.findPlayer('Player 1');
        // Deck: Estate, Curse, Copper, Silver, Gold, Gold, Gold (7 cards)
        engine.setHand(p, ['patrol', 'copper', 'copper', 'copper', 'copper']);
        engine.setDeck(p, ['estate', 'curse', 'copper', 'silver', 'gold', 'platinum', 'gold']);

        engine.playCard('patrol');

        // Draw 3: estate, curse, copper -> Hand has 4 old + 3 new = 7 cards. (Wait, Patrol doesn't draw Victory/Curse with DRAW effect, it just draws 3)
        // Hand: 4 coppers + estate + curse + copper = 7 cards.

        // Reveal 4 from remaining deck: silver, gold, platinum, gold
        // None are Victory/Curse.
        // They should all be returned to deck.
        // Multiple cards (4) returned -> should prompt REORDER.
        expect(engine.state.pendingDecision?.type).toBe('REORDER');

        // Reorder
        const aside = p.aside;
        expect(aside.length).toBe(4);
        engine.respondToDecision({
            type: 'REORDER',
            cardInstanceIds: aside.map(c => c.instanceId)
        });

        expect(p.deck.length).toBe(4);
        expect(engine.state.pendingDecision).toBeNull();
    });
});
