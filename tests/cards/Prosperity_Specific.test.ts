import { describe, it, expect } from 'vitest';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { EconomyEngine } from '../../shared/engine/EconomyEngine.js';
const getCardCost = (s: any, pid: string, id: string) => EconomyEngine.getCardCost(s, pid, id);

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
});
