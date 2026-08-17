
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance, createCardInstances } from '../../shared/engine/CardInstance.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';

describe('Nocturne Mechanics', () => {
    let state: GameState;
    let p1: any;

    beforeEach(() => {
        state = createGameState('nocturne_seed');
        p1 = createPlayerState('p1', 'Player 1', '#fff');
        state.players.push(p1);

        // Setup Supply
        state.supply['cemetery'] = { cardId: 'cemetery', count: 10, cards: [] };
        state.supply['copper'] = { cardId: 'copper', count: 60, cards: [] };
        state.supply['silver'] = { cardId: 'silver', count: 40, cards: [] };
    });

    describe('Cemetery (Cimetière)', () => {
        it('should trigger on-gain effect when bought', () => {
            p1.coins = 4;
            p1.buys = 1;
            p1.hand = createCardInstances('copper', 5);

            // Buy Cemetery
            const result = ActionResolver.resolve(state, p1.id, {
                type: 'BUY_CARD',
                cardId: 'cemetery'
            });

            expect(result.success).toBe(true);
            state = result.state;

            // Should have triggered onGain -> Prompt to trash
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.message).toContain("écarter");

            // Verify Cemetery is in discard
            const p1Result = state.players.find(p => p.id === p1.id)!;
            expect(p1Result.discardPile.some((c: any) => c.id === 'cemetery')).toBe(true);
        });

        it('should trigger on-gain effect when gained via effect (Workshop)', () => {
            p1.hand = createCardInstances('copper', 5);

            // Simulate Workshop effect: Gain a card costing up to 4
            const workshopEffect: any = { type: 'GAIN_CARD', maxCost: 4 };
            EffectEngine.applyEffects(state, p1.id, [workshopEffect]);

            // Prompt for choice
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.context?.specialAction).toBe('GAINER');

            // Resolve choice: pick Cemetery
            EffectEngine.resolveDecision(state, p1.id, {
                type: 'SUPPLY',
                cardId: 'cemetery'
            });

            // After gaining Cemetery, it should prompt for the TRASH effect of Cemetery
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.message).toContain("écarter");
        });
    });
});
