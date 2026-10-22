import { describe, it, expect } from 'vitest';
import { EconomyEngine } from '../../shared/engine/EconomyEngine.js';
import { makeGame, cards, player, play } from '../helpers/play.js';

const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };

describe('Prosperity Specific Cards', () => {
    describe('Quarry (Carrière)', () => {
        it('reduces Action cards cost by 2 this turn', () => {
            let s = toBuy(makeGame(['quarry']));
            player(s).hand = cards('quarry');
            s = play(s, 'quarry');
            expect(EconomyEngine.getCardCost(s, 'p1', 'market')).toBe(3);
            expect(EconomyEngine.getCardCost(s, 'p1', 'village')).toBe(1);
            expect(EconomyEngine.getCardCost(s, 'p1', 'cellar')).toBe(0);
            expect(EconomyEngine.getCardCost(s, 'p1', 'gold')).toBe(6);
        });

        it('stacks with multiple Quarries, even if one leaves play', () => {
            let s = toBuy(makeGame(['quarry']));
            player(s).hand = cards('quarry', 'quarry');
            s = play(s, 'quarry'); s = play(s, 'quarry');
            expect(EconomyEngine.getCardCost(s, 'p1', 'market')).toBe(1);
            player(s).playArea = [];
            expect(EconomyEngine.getCardCost(s, 'p1', 'market')).toBe(1);
        });
    });
});
