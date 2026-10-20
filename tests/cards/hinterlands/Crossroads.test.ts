import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, chooseCards } from '../../helpers/play.js';

describe('Croisée des chemins (Crossroads)', () => {
    it('+1 Card per Victory card in hand, and +3 Actions the first time', () => {
        let state = makeGame(['crossroads']);
        player(state).hand = cards('crossroads', 'estate', 'duchy', 'copper');
        player(state).deck = cards('silver', 'gold', 'copper');

        state = play(state, 'crossroads');
        const p = player(state);
        expect(p.hand.map(c => c.id).sort()).toEqual(['copper', 'duchy', 'estate', 'gold', 'silver']);
        expect(p.actions).toBe(3); // 1 - 1 + 3
    });

    it('no +3 Actions for the second Crossroads, even if another Action was played first', () => {
        let state = makeGame(['crossroads', 'village']);
        player(state).hand = cards('village', 'crossroads', 'crossroads');
        player(state).deck = cards('copper', 'copper', 'copper');

        state = play(state, 'village');          // 1 - 1 + 2 = 2 actions
        state = play(state, 'crossroads');       // first Crossroads: +3 → 4
        expect(player(state).actions).toBe(4);
        state = play(state, 'crossroads');       // second: no bonus → 3
        expect(player(state).actions).toBe(3);
    });

    it('with Throne Room: +3 Actions only once', () => {
        let state = makeGame(['crossroads', 'throne_room']);
        player(state).hand = cards('throne_room', 'crossroads');
        player(state).deck = cards('copper', 'copper', 'copper');

        state = play(state, 'throne_room');
        state = chooseCards(state, ['crossroads']);
        expect(player(state).actions).toBe(3);   // 1 - 1 (Throne Room) + 3 (first play only)
    });
});
