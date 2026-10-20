import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play } from '../../helpers/play.js';

describe('Marchand (Merchant)', () => {
    it('+1 Card +1 Action, and +1 coin the first time a Silver is played this turn', () => {
        let state = makeGame(['merchant']);
        const p = player(state);
        p.hand = cards('merchant', 'silver', 'silver');
        p.deck = cards('copper');

        state = play(state, 'merchant');
        expect(player(state).actions).toBe(1);
        expect(player(state).hand.length).toBe(3);

        state = play(state, 'silver');
        expect(player(state).coins).toBe(3); // 2 + 1 (Merchant)
        state = play(state, 'silver');
        expect(player(state).coins).toBe(5); // second Silver: no bonus
    });

    it('two Merchants give +1 each for the first Silver', () => {
        let state = makeGame(['merchant']);
        player(state).hand = cards('merchant', 'merchant', 'silver');
        player(state).deck = cards('copper', 'copper');

        state = play(state, 'merchant');
        state = play(state, 'merchant');
        state = play(state, 'silver');
        expect(player(state).coins).toBe(4);
    });
});
