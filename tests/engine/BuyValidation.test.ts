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

describe('Dette, Coffres et Villageois (actions du joueur)', () => {
    const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };

    it('rembourser sa Dette, à tout moment de son tour', () => {
        let s = makeGame(['village']);
        player(s).debt = 4; player(s).coins = 3;
        s = act(s, 'p1', { type: 'PAY_DEBT', amount: 2 }); // in the Action phase too
        expect(player(s).debt).toBe(2);
        expect(player(s).coins).toBe(1);
        expect(() => act(s, 'p1', { type: 'PAY_DEBT', amount: 2 })).toThrow(/pièces/);
        expect(() => act(s, 'p2', { type: 'PAY_DEBT', amount: 1 })).toThrow(/tour/);
    });

    it('acheter rembourse d\'abord la Dette', () => {
        let s = toBuy(makeGame(['village']));
        player(s).debt = 2; player(s).coins = 4; player(s).buys = 2;
        expect(() => act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' })).toThrow(/Pas assez/); // 4 - 2 < 3
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'estate' });
        expect(player(s).debt).toBe(0);
        expect(player(s).coins).toBe(0);
    });

    it('Coffres en phase Achat, Villageois en phase Action', () => {
        let s = makeGame(['village']);
        player(s).coffers = 2; player(s).villagers = 1;
        expect(() => act(s, 'p1', { type: 'SPEND_COFFERS', amount: 1 })).toThrow(/phase Achat/);
        s = act(s, 'p1', { type: 'SPEND_VILLAGERS', amount: 1 });
        expect(player(s).actions).toBe(2);
        expect(player(s).villagers).toBe(0);
        s = toBuy(s);
        s = act(s, 'p1', { type: 'SPEND_COFFERS', amount: 2 });
        expect(player(s).coins).toBe(2);
        expect(player(s).coffers).toBe(0);
    });
});
