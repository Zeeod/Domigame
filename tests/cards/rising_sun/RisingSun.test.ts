import { describe, it, expect } from 'vitest';
import { CardRegistry } from '../../../shared/cards/index.js';
import { makeGame, cards, player, play } from '../../helpers/play.js';

describe('Rising Sun', () => {
    it('Mountain Shrine costs 5 Debt, not coins', () => {
        const def = CardRegistry.get('mountain_shrine') as any;
        expect(def.cost).toBe(0);
        expect(def.debtCost).toBe(5);
    });

    it('Imperial Envoy: +5 Cards, +1 Buy, +2 Debt', () => {
        let state = makeGame(['imperial_envoy']);
        player(state).hand = cards('imperial_envoy');
        player(state).deck = cards('copper', 'copper', 'copper', 'copper', 'copper', 'estate');
        const buys = player(state).buys;
        state = play(state, 'imperial_envoy');
        const p = player(state);
        expect(p.hand.length).toBe(5);
        expect(p.buys).toBe(buys + 1);
        expect(p.debt).toBe(2);
    });
});
