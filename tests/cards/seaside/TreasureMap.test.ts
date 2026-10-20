import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play } from '../../helpers/play.js';

describe('Carte au trésor (Treasure Map)', () => {
    it('trashing two Treasure Maps gains 4 Golds onto the deck', () => {
        let state = makeGame(['treasure_map']);
        player(state).hand = cards('treasure_map', 'treasure_map', 'copper');
        player(state).deck = cards('estate');

        state = play(state, 'treasure_map');
        const p = player(state);
        expect(state.trash.filter(c => c.id === 'treasure_map').length).toBe(2);
        expect(p.deck.slice(0, 4).map(c => c.id)).toEqual(['gold', 'gold', 'gold', 'gold']);
        expect(p.deck[4].id).toBe('estate');
        expect(p.hand.map(c => c.id)).toEqual(['copper']);
    });

    it('with no other Treasure Map, it is trashed alone and gives nothing', () => {
        let state = makeGame(['treasure_map']);
        player(state).hand = cards('treasure_map', 'copper');

        state = play(state, 'treasure_map');
        expect(state.trash.map(c => c.id)).toEqual(['treasure_map']);
        expect(player(state).deck.some(c => c.id === 'gold')).toBe(false);
    });
});
