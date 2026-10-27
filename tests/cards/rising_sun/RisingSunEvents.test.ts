/**
 * Rising Sun: the 10 Events.
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, chooseCards, chooseSupply, endTurn, act } from '../../helpers/play.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const event = (s: any, id: string, coins = 20) => {
    s.landscapes = [...(s.landscapes || []), id];
    s = toBuy(s);
    player(s).coins = coins; player(s).buys = Math.max(player(s).buys, 2);
    return act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: id });
};

describe('Soleil Levant — Événements', () => {
    it('Amasser : une Action jusqu\'à 5 si aucune Action en jeu', () => {
        let s = makeGame(['village', 'market']);
        s = event(s, 'amass', 2);
        expect(() => chooseSupply(s, 'gold')).toThrow();
        s = chooseSupply(s, 'market');
        expect(ids(player(s).discardPile)).toEqual(['market']);
        s = makeGame(['village']);
        player(s).playArea = cards('village');
        s = event(s, 'amass', 2);
        expect(s.pendingDecision).toBeFalsy();
    });

    it('Ascétisme : 1 💰 par carte écartée', () => {
        let s = makeGame([]);
        player(s).hand = cards('estate', 'estate', 'curse');
        s = event(s, 'asceticism', 4);
        s = chooseCards(s, ['estate', 'curse']);
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
        expect(player(s).coins).toBe(0);
    });

    it('Crédit : une Action ou un Trésor jusqu\'à 8, autant de Dette', () => {
        let s = makeGame(['village']);
        s = event(s, 'credit', 2);
        expect(() => chooseSupply(s, 'province')).toThrow();
        s = chooseSupply(s, 'gold');
        expect(player(s).debt).toBe(6);
    });

    it('Prévoyance : la première Action dévoilée revient en main à la fin du tour', () => {
        let s = makeGame(['village']);
        player(s).deck = cards('copper', 'estate', 'village', ...filler(10));
        s = event(s, 'foresight', 2);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate']);
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('village');
        expect(player(s).hand.length).toBe(6);
    });

    it('Kintsugi : améliore seulement si un Or a été reçu pendant la partie', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('silver', 'silver');
        s = event(s, 'kintsugi', 3);
        s = chooseCards(s, ['silver']);
        expect(s.pendingDecision).toBeFalsy();
        player(s).coins = 9; player(s).buys = 3;
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'gold' });
        s = act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'kintsugi' });
        s = chooseCards(s, ['silver']);
        s = chooseSupply(s, 'duchy');
        expect(ids(player(s).discardPile)).toContain('duchy');
    });

    it('Entraînement : une Action de la main jouée deux fois', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village');
        player(s).deck = cards(...filler());
        s = event(s, 'practice', 3);
        s = chooseCards(s, ['village']);
        expect(player(s).hand.length).toBe(2);
        expect(ids(player(s).playArea)).toEqual(['village']);
    });

    it('Commerce maritime : +1 Carte par Action en jeu, puis écarter autant', () => {
        let s = makeGame(['village']);
        player(s).playArea = cards('village', 'village');
        player(s).hand = cards('estate');
        player(s).deck = cards(...filler());
        s = event(s, 'sea_trade', 4);
        expect(player(s).hand.length).toBe(3);
        s = chooseCards(s, ['estate', 'copper']);
        expect(ids(s.trash).sort()).toEqual(['copper', 'estate']);
    });

    it('Recevoir le tribut : jusqu\'à 3 Actions différentes absentes du jeu, après 3 cartes reçues', () => {
        let s = makeGame(['village', 'smithy', 'market', 'festival']);
        player(s).playArea = cards('village');
        player(s).gainedThisTurn = ['copper', 'copper'];
        s = event(s, 'receive_tribute', 5);
        expect(s.pendingDecision).toBeFalsy();
        player(s).gainedThisTurn = ['copper', 'copper', 'copper'];
        player(s).coins = 5; player(s).buys = 3;
        s = act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'receive_tribute' });
        expect(() => chooseSupply(s, 'village')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(() => chooseSupply(s, 'smithy')).toThrow();
        s = chooseSupply(s, 'market');
        s = chooseSupply(s, 'festival');
        expect(ids(player(s).discardPile).sort()).toEqual(['festival', 'market', 'smithy']);
    });

    it('Rassemblement : une carte à 3, à 4 et à 5 exactement', () => {
        let s = makeGame(['village', 'smithy', 'market']);
        s = event(s, 'gather', 7);
        expect(() => chooseSupply(s, 'smithy')).toThrow();
        s = chooseSupply(s, 'village');
        s = chooseSupply(s, 'smithy');
        s = chooseSupply(s, 'market');
        expect(ids(player(s).discardPile).sort()).toEqual(['market', 'smithy', 'village']);
    });

    it('Continuer : une Action non-Attaque jusqu\'à 4 jouée en phase Action, +1 Action +1 Achat, une fois par tour', () => {
        let s = makeGame(['village', 'militia', 'smithy']);
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = event(s, 'continue', 8);
        expect(() => chooseSupply(s, 'militia')).toThrow();
        s = chooseSupply(s, 'village');
        expect(s.phase).toBe('ACTION');
        expect(ids(player(s).playArea)).toEqual(['village']);
        expect([player(s).actions, player(s).buys]).toEqual([1 + 1 + 2, 2]);
        player(s).coins = 8;
        s = toBuy(s);
        expect(() => act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'continue' })).toThrow();
    });
});
