import { describe, it, expect, beforeEach } from 'vitest';
import { TestEngine } from './TestUtils';
import { createCardInstance } from '../../../shared/engine/CardInstance';

describe('Complexity Audit - Prosperity & Intrigue 2nd Edition', () => {
    let engine: TestEngine;

    beforeEach(() => {
        engine = new TestEngine();
    });

    it('should test Tiara (Play Treasure twice, topdeck on gain)', () => {
        const p = engine.getPlayer(engine.activePlayerId);

        // Setup hand
        engine.setHand(['tiara', 'gold']);

        console.log('[STEP] Playing Tiara');
        engine.playCard('tiara');

        // Should prompt to choose a treasure to play twice
        console.log('[STEP] Checking Tiara prompt');
        expect(engine.state.pendingDecision?.message).toContain('jouer deux fois');
        engine.handleChoice('gold');

        // Gold should be played twice -> +6 money
        expect(p.coins).toBe(6);
        expect(p.playArea.some(c => c.id === 'gold')).toBe(true);
        expect(p.playArea.some(c => c.id === 'tiara')).toBe(true);

        // Gain a silver
        console.log('[STEP] Gaining Silver');
        engine.gainCard('silver');

        // Tiara should trigger "ON_GAIN" -> Prompt to topdeck
        console.log('[STEP] Checking Tiara ON_GAIN prompt');
        expect(engine.state.pendingDecision?.message).toContain('Diadème');
        engine.handleChoice(0); // Choose YES to topdeck

        expect(p.deck[0].id).toBe('silver');
    });

    it('should test War Chest (Start of buy phase gain)', () => {
        const p = engine.getPlayer(engine.activePlayerId);

        // Setup hand with War Chest and some money
        engine.setHand(['war_chest', 'copper']);
        p.coins = 1;

        // End Action phase to trigger start of Buy phase
        console.log('[STEP] Ending Action Phase');
        engine.endActionPhase();

        // War Chest should trigger prompt (from hand)
        console.log('[STEP] Checking War Chest prompt');
        expect(engine.state.pendingDecision?.message).toContain('Coffre de Guerre');
        engine.handleChoice('silver');

        expect(p.discardPile.some(c => c.id === 'silver')).toBe(true);
    });

    it('should test Replace (Trash, Gain, Attack, Topdeck)', () => {
        const p1 = engine.getPlayer(engine.activePlayerId);
        const p2 = engine.state.players[1];

        // Setup P1: Replace, Estate in hand.
        p1.hand = [createCardInstance('silver'), createCardInstance('remplacement')];
        p2.hand = [createCardInstance('copper')];

        console.log('[STEP] Playing Remplacement');
        engine.playCard('remplacement');

        // Choice 1: Trash Estate
        console.log('[STEP] Trashing Silver');
        expect(engine.state.pendingDecision?.message).toMatch(/écarte/i);
        engine.handleChoice('silver');

        // Estate costs 2 -> Gain up to 4. 
        // Let's gain a "Duchy" (Victory) to trigger attack
        console.log('[STEP] Gaining Duchy (Attack)');
        expect(engine.state.pendingDecision?.message).toContain('coûtant');
        engine.handleChoice('duchy');

        // P2 should gain a curse
        expect(p2.discardPile.some(c => c.id === 'curse')).toBe(true);
        // Duchy is Victory, so it's NOT topdecked (stays in discard)
        expect(p1.discardPile.some(c => c.id === 'duchy')).toBe(true);
        expect(p1.deck.length).toBe(0);

        // Case 2: Gain an Action -> should be topdecked
        // Reset and play again (simplified)
        p1.hand = [createCardInstance('silver'), createCardInstance('remplacement')];
        engine.playCard('remplacement');
        engine.handleChoice('silver');

        console.log('[STEP] Gaining Village (Topdeck)');
        engine.handleChoice('village');

        // Village is Action, should be on top of deck
        expect(p1.deck[0].id).toBe('village');
    });
});
