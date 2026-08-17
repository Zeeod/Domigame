import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../engine/GameState.js';
import { createPlayerState } from '../engine/PlayerState.js';
import { ProphecyManager } from '../engine/ProphecyManager.js';
import { CardRegistry } from '../cards/index.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import { RulesValidator } from '../engine/RulesValidator.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { TriggerEffectHandler } from '../engine/effects/TriggerEffectHandler.js';
import { CleanupEffectHandler } from '../engine/effects/CleanupEffectHandler.js';
import { RisingSunLandscapes } from '../cards/landscapes/RisingSunCards.js';
import { EconomyEngine } from '../engine/EconomyEngine.js';
import { EffectEngine } from '../engine/EffectEngine.js';

describe('Prophecy Logic & Fulfillment', () => {
    let state: GameState;
    let p1: any;

    beforeEach(() => {
        RisingSunLandscapes.register();
        state = createGameState('test-game');
        p1 = createPlayerState('p1', 'Player 1');
        state.players = [p1];
        state.currentPlayerIndex = 0;

        // Setup a basic supply
        state.supply['silver'] = { cardId: 'silver', count: 10, cards: Array(10).fill(0).map(() => createCardInstance('silver')) };
        state.supply['gold'] = { cardId: 'gold', count: 10, cards: Array(10).fill(0).map(() => createCardInstance('gold')) };
        state.supply['copper'] = { cardId: 'copper', count: 10, cards: Array(10).fill(0).map(() => createCardInstance('copper')) };
    });

    it('should scale Sun tokens correctly for regular prophecies', () => {
        ProphecyManager.activateProphecy(state, 'enlightenment', 2);
        expect(state.landscapeState['enlightenment'].tokens['sun']).toBe(5);

        ProphecyManager.activateProphecy(state, 'enlightenment', 3);
        expect(state.landscapeState['enlightenment'].tokens['sun']).toBe(8);

        ProphecyManager.activateProphecy(state, 'enlightenment', 4);
        expect(state.landscapeState['enlightenment'].tokens['sun']).toBe(10);
    });

    it('should scale Sun tokens correctly for Great Leader', () => {
        ProphecyManager.activateProphecy(state, 'great_leader', 2);
        expect(state.landscapeState['great_leader'].tokens['sun']).toBe(8);

        ProphecyManager.activateProphecy(state, 'great_leader', 4);
        expect(state.landscapeState['great_leader'].tokens['sun']).toBe(13);
    });

    it('should remove a Sun token when playing an Omen', () => {
        ProphecyManager.activateProphecy(state, 'enlightenment', 2);
        const initialTokens = state.landscapeState['enlightenment'].tokens['sun'];

        // Setup hand with an Omen (Poet is an Omen)
        const omen = createCardInstance('poet');
        p1.hand.push(omen);

        // Let's use ActionResolver to be sure
        const result = ActionResolver.resolve(state, p1.id, { type: 'PLAY_CARD', cardInstanceId: omen.instanceId });
        state = result.state;

        expect(state.landscapeState['enlightenment'].tokens['sun']).toBe(initialTokens - 1);
    });

    it('should fulfill prophecy when tokens reach zero', () => {
        ProphecyManager.activateProphecy(state, 'flourishing_trade', 2);
        state.landscapeState['flourishing_trade'].tokens['sun'] = 1;

        // Condition for Flourishing Trade: Gain an Action card
        TriggerEffectHandler.handleOnGainTriggers(state, p1, 'village');

        expect(state.landscapeState['flourishing_trade'].tokens['sun']).toBe(0);
    });

    it('should apply Enlightenment passive effect: Treasures as Actions', () => {
        ProphecyManager.activateProphecy(state, 'enlightenment', 2);
        state.landscapeState['enlightenment'].tokens['sun'] = 0; // Fulfilled
        state.phase = 'ACTION';

        // Setup deck so DRAW effect works
        p1.deck = [createCardInstance('village')];

        const copper = createCardInstance('copper');
        p1.hand.push(copper);
        p1.actions = 1;

        // Validation should allow playing copper during Action phase
        const validation = RulesValidator.validate(state, p1.id, { type: 'PLAY_CARD', cardInstanceId: copper.instanceId });
        expect(validation.valid).toBe(true);

        // Executing play
        const result = ActionResolver.resolve(state, p1.id, { type: 'PLAY_CARD', cardInstanceId: copper.instanceId });
        expect(result.success).toBe(true);
        state = result.state;
        p1 = state.players[0];

        expect(p1.actions).toBe(1); // Spent 1, but Enlightenment gives +1 Action
        expect(p1.hand.length).toBe(1); // Drew 1 from deck
        expect(p1.actionsPlayed).toBe(1);
    });

    it('should apply Flourishing Trade passive effect: Cost reduction', () => {
        ProphecyManager.activateProphecy(state, 'flourishing_trade', 2);
        state.landscapeState['flourishing_trade'].tokens['sun'] = 0; // Fulfilled

        const cost = EconomyEngine.getCardCost(state, p1.id, 'gold');
        const originalCost = CardRegistry.get('gold')!.cost;
        expect(cost).toBe(originalCost - 1);
    });

    it('should remove Sun token at start of turn for Sickness', () => {
        ProphecyManager.activateProphecy(state, 'sickness', 2);
        const initialTokens = state.landscapeState['sickness'].tokens['sun'];

        CleanupEffectHandler.handleStartNextTurn(state);

        expect(state.landscapeState['sickness'].tokens['sun']).toBe(initialTokens - 1);
    });

    it('should apply Progress passive effect: gained cards go to deck', () => {
        ProphecyManager.activateProphecy(state, 'progress', 2);
        ProphecyManager.fulfillProphecy(state); // Ensure triggers are registered
        console.log('Registered triggers after Progress fulfill:', state.triggers);
        state.phase = 'BUY';
        p1.buys = 1;
        p1.coins = 3;

        const initialDeckSize = p1.deck.length;

        // Buying a silver
        const result = ActionResolver.resolve(state, p1.id, { type: 'BUY_CARD', cardId: 'silver' });
        expect(result.success).toBe(true);

        // UPDATE state references after Immer produces a new state
        state = result.state;
        p1 = state.players[0];

        // Should be on deck, not discard
        expect(p1.deck.length).toBe(initialDeckSize + 1);
        expect(p1.deck[p1.deck.length - 1].id).toBe('silver');

        // Not in discard
        expect(p1.discardPile.some((c: any) => c.id === 'silver')).toBe(false);
    });

    it('should trigger Sickness passive effect: choice at start of turn', () => {
        ProphecyManager.activateProphecy(state, 'sickness', 2);
        ProphecyManager.fulfillProphecy(state); // Ensure triggers are registered

        // Trigger start of turn
        CleanupEffectHandler.handleStartNextTurn(state);
        EffectEngine.processStack(state); // Manual stack processing since we bypassed ActionResolver

        // Should have a pending decision for sickness
        expect(state.pendingDecision).toBeDefined();
        expect(state.pendingDecision?.message).toContain('Maladie');
        expect(state.pendingDecision?.options?.length).toBe(2);
    });
});
