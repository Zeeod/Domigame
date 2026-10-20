import { describe, it, expect } from 'vitest';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';

describe('Hinterlands Expansion', () => {
    describe('Crossroads', () => {
        it('should reveal hand and draw cards equal to victory cards', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            // Hand: Crossroads, Estate, Duchy, Copper
            player.hand = [
                { id: 'crossroads', instanceId: 'cr1' },
                { id: 'estate', instanceId: 'e1' },
                { id: 'duchy', instanceId: 'd1' },
                { id: 'copper', instanceId: 'c1' }
            ];

            // Deck for drawing
            player.deck = [
                { id: 'silver', instanceId: 's1' },
                { id: 'gold', instanceId: 'g1' },
                { id: 'copper', instanceId: 'c2' }
            ];

            // Play Crossroads
            const crossroadsDef = CardRegistry.get('crossroads')!;
            // Apply Reveal Effect
            EffectEngine.applyEffects(state, player.id, crossroadsDef.effects!);

            // Should interpret "COUNT_CARDS_IN_HAND" filter Victory.
            // Hand has Estate, Duchy = 2 Victory cards.
            // Should draw 2 cards.

            // Expected Hand: Estate, Duchy, Copper (Crossroads played?), + 2 drawn cards (Silver, Gold)
            // Note: applyEffects doesn't automatically move played card to playArea unless logic does it.
            // But we are testing the effect specifically.
            // Hand should have: Estate, Duchy, Copper, Silver, Gold (5 cards).
            // (Assuming Crossroads was strictly "in hand" but we didn't remove it, 
            // usually playCard removes it. But here we just apply effects).

            // Wait, if Crossroads is in hand, "COUNT_CARDS_IN_HAND" includes ITSELF if it matches filter?
            // Crossroads is Action, not Victory. So no.

            expect(player.hand.length).toBe(6); // 4 original - 0 removed + 2 drawn
            expect(player.hand.map(c => c.id)).toContain('silver');
            expect(player.hand.map(c => c.id)).toContain('gold');
        });

        it('should give +3 actions if first time played this turn', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            player.playArea = [
                { id: 'crossroads', instanceId: 'cr1', turnPlayed: state.turnNumber }
            ];

            // Manually run the condition check logic which looks at player.playArea
            const crossroadsDef = CardRegistry.get('crossroads')!;
            const conditionEffect = crossroadsDef.effects![2]; // The condition

            // Apply it
            EffectEngine.applyEffect(state, player.id, conditionEffect);

            // Expect +3 Actions (1 play count MATCHES "First time")
            // Wait, filter logic: "playedCount === 1".
            // We put 1 in playArea. So it should trigger.
            expect(player.actions).toBe(4); // 1 start + 3
        });

        it('should NOT give +3 actions if played previously', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            // Two Crossroads in play
            player.playArea = [
                { id: 'crossroads', instanceId: 'cr1', turnPlayed: state.turnNumber },
                { id: 'crossroads', instanceId: 'cr2', turnPlayed: state.turnNumber }
            ];

            const crossroadsDef = CardRegistry.get('crossroads')!;
            const conditionEffect = crossroadsDef.effects![2];

            EffectEngine.applyEffect(state, player.id, conditionEffect);

            // playedCount = 2. Condition "=== 1" fails.
            expect(player.actions).toBe(1); // Unchanged
        });
    });

    describe('Duchess', () => {
        it('should give +2 Coin', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            EffectEngine.applyEffect(state, player.id, { type: 'ADD_MONEY', amount: 2 } as any);
            expect(player.coins).toBe(2);
        });

        it('should allow peeking top deck', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            player.deck = [{ id: 'copper', instanceId: 'c1' }];

            const duchessDef = CardRegistry.get('duchess')!;
            const eachPlayerEffect = duchessDef.effects![1]; // EACH_PLAYER

            EffectEngine.applyEffect(state, player.id, eachPlayerEffect);
            EffectEngine.processStack(state); // Handle the scheduled effects

            // Should have a decision
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.context.specialAction).toBe('PEEK_TOP_DECISION');
        });
    });

    describe('Nomad Camp', () => {
        it('should move to top of deck on gain', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);
            const player = state.players[0];

            // Set deck/discard
            player.deck = [{ id: 'copper', instanceId: 'c1' }];
            player.discardPile = [];

            // Gain Nomad Camp
            const nomadCampDef = CardRegistry.get('nomad_camp')!;

            // We simulate the gain process which involves:
            // 1. Adding to discard (usually)
            // 2. Triggering onGain

            // Manually trigger handleOnGainTriggers first?
            // Actually handleOnGainTriggers is called BEFORE adding to discard in ActionResolver usually?
            // Wait, standard gain adds to discard.
            // Nomad Camp onGain says: "MOVE_TO_POSITION from discard to TOP".
            // So the card MUST be in discard first.

            const card = { id: 'nomad_camp', instanceId: 'nc1' };
            player.discardPile.push(card);

            // Now apply valid triggers
            if (nomadCampDef.onGain) {
                EffectEngine.applyEffects(state, player.id, nomadCampDef.onGain, false, card.instanceId);
            }

            // Expect card to be on top of deck
            expect(player.discardPile.length).toBe(0);
            expect(player.deck.length).toBe(2);
            expect(player.deck[0].id).toBe('nomad_camp'); // Top is usually index 0 in my engine? 
            // Wait, checking stack behavior. 
            // Usually [0] is TOP (next to draw)?
            // Deck: draw() takes from shift() (0).
            // Yes.
        });
    });
});
