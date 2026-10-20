import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, createPlayerState, GameState } from '../../shared/engine/GameState.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance, createCardInstances, CardInstance } from '../../shared/engine/CardInstance.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';

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
