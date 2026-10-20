import { describe, it, expect } from 'vitest';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { getCardCost } from '../../shared/engine/CardCosts.js';

describe('Prosperity Specific Cards', () => {

    describe('Quarry (Carrière)', () => {
        it('should reduce Action cards cost by 2 when in play', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);

            // Setup: Quarry is in play
            p1.playArea = [{ id: 'quarry', instanceId: 'q1' }];

            // Test on a 5-cost Action (Market)
            const marketCost = getCardCost(state, p1.id, 'market');
            expect(marketCost).toBe(3); // 5 - 2 = 3

            // Test on a 3-cost Action (Village)
            const villageCost = getCardCost(state, p1.id, 'village');
            expect(villageCost).toBe(1); // 3 - 2 = 1

            // Test on a 2-cost Action (Cellar)
            const cellarCost = getCardCost(state, p1.id, 'cellar');
            expect(cellarCost).toBe(0); // 2 - 2 = 0

            // Test on a Treasure (Gold) - Should NOT reduce
            const goldCost = getCardCost(state, p1.id, 'gold');
            expect(goldCost).toBe(6);
        });

        it('should stack with multiple Quarries', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);

            // Setup: 2 Quarries in play
            p1.playArea = [
                { id: 'quarry', instanceId: 'q1' },
                { id: 'quarry', instanceId: 'q2' }
            ];

            // Test on a 5-cost Action (Market)
            const marketCost = getCardCost(state, p1.id, 'market');
            expect(marketCost).toBe(1); // 5 - 4 = 1
        });
    });

    describe('Clerk (Greffier)', () => {
        it('should prompt to topdeck itself', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);

            // Clerk is played (in play area)
            const clerkInstance = { id: 'clerk', instanceId: 'clerk1' };
            p1.playArea = [clerkInstance];

            // Get Clerk Definition
            const clerkDef = CardRegistry.get('clerk')!;
            // Apply second effect (Choice)
            const choiceEffect = clerkDef.effects![1];

            const result = EffectEngine.applyEffect(state, p1.id, choiceEffect);

            expect(result.needsChoice).toBe(true);
            expect(state.pendingDecision?.type).toBe('CHOOSE_FROM_ZONE');
            expect(state.pendingDecision?.constraints?.sourceZone).toBe('play'); // Or PLAY_AREA depending on implementation normalization
        });
    });

    describe('Anvil (Enclume)', () => {
        it('should gain a card after discarding a Treasure', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);

            // Setup hand with a Treasure (Silver) and Anvil (played)
            const silver = { id: 'silver', instanceId: 's1' };
            p1.hand = [silver];
            p1.playArea = [{ id: 'anvil', instanceId: 'a1' }];

            // Setup Supply for gain target (e.g. Smithy - cost 4)
            state.supply['smithy'] = { cardId: 'smithy', count: 10, cards: [] };

            // Apply Anvil effect
            const anvilDef = CardRegistry.get('anvil')!;
            const effect = anvilDef.effects![1]; // The discard effect

            // 1. Initial Call -> Request Choice
            let result = EffectEngine.applyEffect(state, p1.id, effect);
            expect(result.needsChoice).toBe(true);
            expect(state.pendingDecision?.type).toBe('CHOOSE_CARDS');

            // 2. Resolve Decision (Discard Silver)
            result = EffectEngine.resolveDecision(state, p1.id, {
                cardIds: ['silver']
            });

            // NOW we expect the onSuccess (Gain Card) to trigger immediately
            // Since Gain needs a choice (which card to gain?), it should return needsChoice: true
            // If implementation is broken, it might finish without prompting for gain.

            // Verify Silver is discarded
            expect(p1.discardPile.length).toBe(1);
            expect(p1.discardPile[0].id).toBe('silver');

            // Verify we are now prompted to gain a card
            expect(result.needsChoice).toBe(true);
            expect(state.pendingDecision?.type).toBe('CHOOSE_CARDS'); // Supply choice
            expect(state.pendingDecision?.message).toContain('coût max: 4');
        });

        it('should NOT gain a card if no Treasure is discarded', () => {
            const state = createGameState('test-seed');
            const p1 = createPlayerState('p1', 'Player 1');
            state.players.push(p1);

            // Empty hand, nothing to discard
            p1.hand = [];

            // Apply Anvil effect
            const anvilDef = CardRegistry.get('anvil')!;
            const effect = anvilDef.effects![1];

            // Should ask choice (min 0)
            let result = EffectEngine.applyEffect(state, p1.id, effect);

            // Resolve with empty selection
            result = EffectEngine.resolveDecision(state, p1.id, {
                cardIds: []
            });

            // Should NOT prompt for gain
            expect(result.needsChoice).toBe(false);
            expect(state.pendingDecision).toBeNull();
        });
    });

});
