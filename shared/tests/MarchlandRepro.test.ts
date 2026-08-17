import { describe, it, expect } from 'vitest';
import { createGameState, GameState } from '../engine/GameState.js';
import { createPlayerState } from '../engine/PlayerState.js';
import { EffectEngine } from '../engine/EffectEngine.js';
import { CardRegistry } from '../cards/index.js';

describe('Marchland Reproduction', () => {
    it('should resolve Marchland-like dynamic ADD_MONEY', () => {
        const state = createGameState('repro');
        const player = createPlayerState('p1', 'Player 1', '#f00');
        state.players = [player];
        state.currentPlayerIndex = 0;

        // Mock cards
        CardRegistry.register({ id: 'estate', name: 'Domaine', cost: 2, types: ['VICTORY'], victoryPoints: 1 });

        player.hand = [
            { id: 'estate', instanceId: 'e1' } as any,
            { id: 'estate', instanceId: 'e2' } as any,
            { id: 'copper', instanceId: 'c1' } as any
        ];

        const effect = {
            type: 'ADD_MONEY',
            amount: { type: 'DYNAMIC', metric: 'VICTORY_CARDS_IN_HAND', multiplier: 2 }
        };

        const res = EffectEngine.applyEffects(state, 'p1', [effect as any]);
        expect(res.needsChoice).toBe(false);
        expect(player.coins).toBe(4);
    });

    it('should resolve CHOOSE_OPTION with dynamic effects', () => {
        const state = createGameState('repro');
        const player = createPlayerState('p1', 'Player 1', '#f00');
        state.players = [player];
        state.currentPlayerIndex = 0;

        CardRegistry.register({ id: 'estate', name: 'Domaine', cost: 2, types: ['VICTORY'], victoryPoints: 1 });
        player.hand = [{ id: 'estate', instanceId: 'e1' } as any];

        const marchlandEffect = {
            type: 'CHOOSE_OPTION',
            options: [
                { label: 'Opt 1', effects: [{ type: 'DRAW', amount: 1 }] },
                {
                    label: 'Opt 2',
                    effects: [
                        { type: 'ADD_MONEY', amount: { type: 'DYNAMIC', metric: 'VICTORY_CARDS_IN_HAND', multiplier: 2 } }
                    ]
                }
            ],
            context: { specialAction: 'CHOOSE_OPTION' }
        };

        const res = EffectEngine.applyEffects(state, 'p1', [marchlandEffect as any]);
        expect(res.needsChoice).toBe(true);

        const res2 = EffectEngine.resolveDecision(state, 'p1', { type: 'OPTION', optionIndex: 1 });
        expect(res2.needsChoice).toBe(false);
        expect(player.coins).toBe(2);
    });
});
