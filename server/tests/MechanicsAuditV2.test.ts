import { it, expect, describe } from 'vitest';
import { setupGame, createCardInstance, createPlayer } from './validation/TestUtils.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';

describe('Expanded Mechanic Verification', () => {
    it('GATHER_VP and TAKE_VP_FROM_PILE should work correctly', () => {
        const state = setupGame(['village']);
        const player = state.players[0];

        // 1. Gather VP on Village pile
        EffectEngine.applyEffect(state, player.id, { type: 'GATHER_VP', pileId: 'village', amount: 2 } as any);
        expect(state.supply['village'].tokens?.vp).toBe(2);

        // 2. Take VP from Village pile
        EffectEngine.applyEffect(state, player.id, { type: 'TAKE_VP_FROM_PILE', pileId: 'village' } as any);
        expect(player.vpTokens).toBe(2);
        expect(state.supply['village'].tokens?.vp).toBe(0);
    });

    it('TAKE_DEBT and PAY_DEBT should work correctly', () => {
        const state = setupGame(['village']);
        const player = state.players[0];
        player.coins = 5;

        // 1. Take 3 Debt
        EffectEngine.applyEffect(state, player.id, { type: 'TAKE_DEBT', amount: 3 } as any);
        expect(player.debt).toBe(3);

        // 2. Pay 2 Debt
        EffectEngine.applyEffect(state, player.id, { type: 'PAY_DEBT', amount: 2 } as any);
        expect(player.debt).toBe(1);
        expect(player.coins).toBe(3);

        // 3. Pay remaining Debt (auto-amount)
        EffectEngine.applyEffect(state, player.id, { type: 'PAY_DEBT' } as any);
        expect(player.debt).toBe(0);
        expect(player.coins).toBe(2);
    });

    it('ADD_FAVORS and SPEND_FAVORS should work correctly', () => {
        const state = setupGame(['village']);
        const player = state.players[0];

        // 1. Add 3 Favors
        EffectEngine.applyEffect(state, player.id, { type: 'ADD_FAVORS', amount: 3 } as any);
        expect(player.favors).toBe(3);

        // 2. Spend 2 Favors
        EffectEngine.applyEffect(state, player.id, { type: 'SPEND_FAVORS', amount: 2 } as any);
        expect(player.favors).toBe(1);
    });

    it('CHANGE_PHASE should switch between Action and Buy phases', () => {
        const state = setupGame(['village']);
        const player = state.players[0];
        state.phase = 'BUY';

        EffectEngine.applyEffect(state, player.id, { type: 'CHANGE_PHASE', phase: 'ACTION' } as any);
        expect(state.phase).toBe('ACTION');

        EffectEngine.applyEffect(state, player.id, { type: 'CHANGE_PHASE', phase: 'BUY' } as any);
        expect(state.phase).toBe('BUY');
    });

    it('ROTATE_PILE should rotate mixed supply piles', () => {
        const state = setupGame(['village']);
        const player = state.players[0];
        // Mock a mixed pile
        state.supply['split'] = {
            cardId: 'card1',
            count: 10,
            isMixed: true,
            cards: [
                createCardInstance('card1'), createCardInstance('card1'),
                createCardInstance('card2'), createCardInstance('card2')
            ]
        };

        EffectEngine.applyEffect(state, player.id, { type: 'ROTATE_PILE', pileId: 'split' } as any);
        expect(state.supply['split'].cardId).toBe('card2');
        expect(state.supply['split'].cards[0].id).toBe('card2');
        expect(state.supply['split'].cards[3].id).toBe('card1');
    });

    it('ADD_MONEY_PER_CARD_IN_HAND should count correctly', () => {
        const state = setupGame(['village']);
        const player = state.players[0];
        player.hand = [createCardInstance('silver'), createCardInstance('silver'), createCardInstance('estate')];
        player.coins = 0;

        // 1. No filter
        EffectEngine.applyEffect(state, player.id, { type: 'ADD_MONEY_PER_CARD_IN_HAND', amount: 1 } as any);
        expect(player.coins).toBe(3);

        // 2. With filter (Treasure only)
        player.coins = 0;
        EffectEngine.applyEffect(state, player.id, { type: 'ADD_MONEY_PER_CARD_IN_HAND', amount: 2, filter: { cardTypes: ['TREASURE'] } } as any);
        expect(player.coins).toBe(4); // 2 treasures * 2 coins
    });

    it('PLAY_THIS_CARD should re-execute effects', () => {
        const state = setupGame(['village']);
        const player = state.players[0];
        const village = createCardInstance('village');
        player.playArea = [village];
        player.actions = 0;

        EffectEngine.applyEffect(state, player.id, { type: 'PLAY_THIS_CARD' } as any, village.instanceId);

        // Village is: +1 Card, +2 Actions. 
        // We should have +2 Actions (recursive apply adds them).
        expect(player.actions).toBe(2);
    });

    it('GAIN_THIS_CARD should move the card instance', () => {
        const state = setupGame(['village']);
        const player = state.players[0];
        const village = createCardInstance('village');
        player.playArea = [village];

        EffectEngine.applyEffect(state, player.id, { type: 'GAIN_THIS_CARD', destination: 'hand' } as any, village.instanceId);

        expect(player.playArea.length).toBe(0);
        expect(player.hand.some(c => c.instanceId === village.instanceId)).toBe(true);
    });
});
