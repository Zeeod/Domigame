import { describe, it, expect } from 'vitest';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { VictoryChecker } from '../../shared/engine/VictoryChecker.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { TriggerEffectHandler } from '../../shared/engine/effects/TriggerEffectHandler.js';

describe('Prosperity Expansion', () => {
    it('should add victory tokens to player state', () => {
        const state = createGameState('test-seed');
        const p1 = createPlayerState('p1', 'Player 1');
        state.players.push(p1);
        const player = state.players[0];

        // Initial tokens should be 0
        expect(player.vpTokens).toBe(0);

        // Apply ADD_VICTORY_TOKENS effect
        EffectEngine.applyEffect(state, player.id, { type: 'ADD_VICTORY_TOKENS', amount: 3 } as any);

        expect(player.vpTokens).toBe(3);
    });

    it('should include vpTokens in score calculation', () => {
        const state = createGameState('test-seed');
        const p1 = createPlayerState('p1', 'Player 1');
        state.players.push(p1);
        const player = state.players[0];

        // Add 5 tokens
        player.vpTokens = 5;

        // Initial score should be 5 + starting victory cards (0 in createPlayerState)
        // createPlayerState hands are empty, so score comes only from tokens if we don't setup hand

        // Let's add standard starting deck for consistency if needed, but for Unit Test, simple is better.
        // VictoryChecker checks hand, deck, discard, playArea.
        // Empty deck => 0 VP from cards.

        const scores = VictoryChecker.getCurrentScores(state);
        const playerScore = scores.find(s => s.playerId === player.id)?.score;

        expect(playerScore).toBe(5);
    });

    it('should handle Bishop VP gain (half cost of trashed card)', () => {
        const state = createGameState('test-seed');
        const p1 = createPlayerState('p1', 'Player 1');
        state.players.push(p1);
        const player = state.players[0];

        // Put a Gold in hand (Cost 6)
        player.hand = [{ id: 'gold', instanceId: 'gold_1' }];

        // Manually trigger the Bishop trash effect
        const goldDef = CardRegistry.get('gold')!;
        expect(goldDef.cost).toBe(6);

        state.lastTrashedCard = player.hand[0];
        state.lastTrashedCards = [player.hand[0]];
        player.hand = [];

        EffectEngine.applyEffect(state, player.id, { type: 'ADD_VICTORY_TOKENS', amount: 'HALF_LAST_TRASHED_COST' } as any);

        expect(player.vpTokens).toBe(3);
    });

    describe('Hoard', () => {
        it('should gain Gold when buying a Victory card', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            // Initialize supply for Gold
            state.supply['gold'] = { cardId: 'gold', count: 30, cards: [] };

            // Put Hoard in play
            player.playArea = [{ id: 'hoard', instanceId: 'hoard_1' }];

            // Mock ON_BUY trigger manually since we are testing EffectEngine logic, not main loop
            TriggerEffectHandler.handleOnBuyTriggers(state, player, 'estate');

            // Expect a Gold in discard
            const gold = player.discardPile.find(c => c.id === 'gold');
            expect(gold).toBeDefined();
        });

        it('should NOT gain Gold when buying a non-Victory card', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            player.playArea = [{ id: 'hoard', instanceId: 'hoard_1' }];
            TriggerEffectHandler.handleOnBuyTriggers(state, player, 'silver');

            const gold = player.discardPile.find(c => c.id === 'gold');
            expect(gold).toBeUndefined();
        });
    });

    describe('Tiara', () => {
        it('should allow playing a Treasure twice', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            // Hand has Tiara and Gold
            player.hand = [
                { id: 'tiara', instanceId: 'tiara_1' },
                { id: 'gold', instanceId: 'gold_1' }
            ];

            // We simulate playing Tiara
            // This is complex because it involves a Choice.
            // Ideally we test that the effect prompts for choice.
            const tiaraDef = CardRegistry.get('tiara')!;
            const effect = tiaraDef.effects![1]; // The choice effect

            const result = EffectEngine.applyEffect(state, player.id, effect);
            expect(result.needsChoice).toBe(true);
            expect(state.pendingDecision?.context.filter.cardTypes).toContain('TREASURE');
        });

        it('should trigger topdeck option on gain', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            player.playArea = [{ id: 'tiara', instanceId: 'tiara_1' }];

            // Handle gain trigger
            TriggerEffectHandler.handleOnGainTriggers(state, player, 'silver');

            // Expect a choice to topdeck
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.type).toBe('SELECT_OPTION');
        });
    });

    describe('Rabble', () => {
        it('should attack other players: reveal 3, discard Actions/Treasures', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            const p2 = createPlayerState('p2', 'Player 2');
            state.players.push(p1, p2);

            // Construct p2 deck: [Copper, Estate, Market]
            // Copper = Treasure (Discard)
            // Estate = Victory (Keep)
            // Market = Action (Discard)
            p2.deck = [
                { id: 'copper', instanceId: 'c1' },
                { id: 'estate', instanceId: 'e1' },
                { id: 'market', instanceId: 'm1' }
            ];

            // Apply Rabble attack effect on p1 targeting others
            const rabbleDef = CardRegistry.get('rabble')!;
            const attackEffect = rabbleDef.effects![1]; // The attack

            EffectEngine.applyEffect(state, p1.id, attackEffect);

            // EffectQueue should now have the attack step for p2
            expect(state.effectStack.length).toBeGreaterThan(0);

            // Process the stack to handle the attack
            EffectEngine.processStack(state);

            // Now p2 should have revealed cards.
            // Copper and Market discarded. Estate put back on deck.
            expect(p2.discardPile.map(c => c.id).sort()).toEqual(['copper', 'market'].sort());
            expect(p2.deck.map(c => c.id)).toEqual(['estate']);
        });
    });
});
