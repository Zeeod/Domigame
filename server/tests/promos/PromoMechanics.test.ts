import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, createPlayerState, GameState } from '../../../shared/engine/GameState.js';
import { CardRegistry } from '../../../shared/cards/index.js';
import { createCardInstance, createCardInstances, CardInstance } from '../../../shared/engine/CardInstance.js';
import { EffectEngine } from '../../../shared/engine/EffectEngine.js';

describe('Promo Mechanics', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test_game');
        state.players = [
            createPlayerState('p1', 'Player 1', '#f00'),
            createPlayerState('p2', 'Player 2', '#00f')
        ];
        state.currentPlayerIndex = 0;
    });

    describe('Black Market (Marché Noir)', () => {
        it('should reveal 3 cards from Black Market deck and allow buying one', () => {
            const player = state.players[0];
            state.blackMarketDeck = [
                createCardInstance('village'),
                createCardInstance('smithy'),
                createCardInstance('market')
            ];
            player.coins = 10;
            player.buys = 1;

            const bm = CardRegistry.get('black_market')!;
            const res = EffectEngine.applyEffects(state, 'p1', bm.effects || [], false);

            expect(res.needsChoice).toBe(true);
            expect(state.pendingDecision?.type).toBe('CHOOSE_CARDS');
            expect(state.blackMarketRevealed?.length).toBe(3);

            const buyId = (state.blackMarketRevealed || [])[0].instanceId;
            EffectEngine.resolveDecision(state, 'p1', { type: 'CARDS', cardInstanceIds: [buyId] });

            expect(player.discardPile.some(c => c.instanceId === buyId)).toBe(true);
            expect(state.blackMarketRevealed?.length).toBe(0);
            expect(state.blackMarketDeck.length).toBe(0);
        });
    });

    describe('Envoy (Délégué)', () => {
        it('should draw 4, then reveal top 5 and opponent chooses one to discard', () => {
            const player = state.players[0];
            const opponent = state.players[1];
            player.deck = createCardInstances('copper', 10);
            player.hand = createCardInstances('copper', 4);

            const envoy = CardRegistry.get('envoy')!;
            const res = EffectEngine.applyEffects(state, 'p1', envoy.effects as any);

            expect(player.hand.length).toBe(4);
            expect(res.needsChoice).toBe(true);
            expect(state.pendingDecision?.playerId).toBe(opponent.id);
            expect(player.aside.length).toBe(5);
            expect(state.pendingDecision?.constraints?.max).toBe(1);

            // Resolve opponent's choice
            const discardedId = player.aside[0].instanceId;
            EffectEngine.resolveDecision(state, opponent.id, { type: 'CARDS', cardInstanceIds: [discardedId] });

            expect(player.hand.length).toBe(8); // 4 initial + 4 from Envoy
            expect(player.aside.length).toBe(0);
            expect(player.discardPile.find(c => c.instanceId === discardedId)).toBeDefined();
        });
    });

    describe('Prince (Le Prince)', () => {
        it('should move card to aside and play it every turn', () => {
            const player = state.players[0];
            const village = createCardInstances('village', 1)[0];
            player.hand = [village];

            const prince = CardRegistry.get('prince')!;
            const res = EffectEngine.applyEffects(state, 'p1', prince.effects as any, false, 'prince_inst');

            expect(res.needsChoice).toBe(true);
            EffectEngine.resolveDecision(state, 'p1', { type: 'CARDS', cardInstanceIds: [village.instanceId] });

            expect(player.aside.length).toBe(2); // Prince + Village
            expect(state.triggers?.some(t => t.type === 'START_TURN')).toBe(true);
        });
    });

    describe('Captain (Le Capitaine)', () => {
        it('should play an action from supply costing up to 4', () => {
            const player = state.players[0];
            player.actions = 1;

            const captain = CardRegistry.get('captain')!;
            const res = EffectEngine.applyEffects(state, 'p1', captain.effects as any);

            expect(res.needsChoice).toBe(true);
            // Simulate choosing 'village' from supply
            // NOTE: Captain uses ZONE_CHOICE which expects {id} for supply cards
            EffectEngine.resolveDecision(state, 'p1', { type: 'CARDS', cardInstanceIds: [{ id: 'village' }] });

            // Village gives +2 Actions. p1 started with 1. Captain played, village played -> 1 + 2 = 3.
            expect(player.actions).toBe(3);
        });
    });

    describe('Marchland (Marche-frontière)', () => {
        it('should gain coins based on victory cards in hand and discard hand', () => {
            const player = state.players[0];
            player.hand = [
                ...createCardInstances('estate', 2),
                ...createCardInstances('copper', 3)
            ];
            player.coins = 0;

            const marchland = CardRegistry.get('marchland')!;
            const res = EffectEngine.applyEffects(state, 'p1', marchland.effects as any);

            expect(res.needsChoice).toBe(true);
            expect(state.pendingDecision?.type).toBe('SELECT_OPTION');

            // Resolve choosing 'Bonus PV en main' (index 1)
            EffectEngine.resolveDecision(state, 'p1', { type: 'OPTION', optionIndex: 1 });

            expect(player.coins).toBe(4); // 2 Estates * 2 = 4
            expect(player.hand.length).toBe(0);
            expect(player.discardPile.length).toBe(5);
        });
    });
});
