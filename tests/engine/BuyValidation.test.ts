import { describe, it, expect } from 'vitest';
import { makeGame, player, act } from '../helpers/play.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

describe('Achat : piles divisées et mixtes', () => {
    it('le coût vérifié est celui de la carte du dessus', () => {
        const s = makeGame(['castles_pile']);
        // Top card: King's Castle ($10), pile id costs less
        s.supply['castles_pile'] = { cardId: 'castles_pile', count: 2, isMixed: true, cards: [createCardInstance('humble_castle'), createCardInstance('kings_castle')] } as any;
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s).coins = 5;
        expect(() => act(s, 'p1', { type: 'BUY_CARD', cardId: 'castles_pile' })).toThrow(/Pas assez/);
        expect(s.supply['castles_pile'].count).toBe(2);
    });
});
