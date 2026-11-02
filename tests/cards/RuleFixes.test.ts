/**
 * Rules fixed after the rulebook check (Allies, Plunder, Rising Sun, Remodel-like gains with Debt).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, chooseCards, chooseOption, buy, endTurn, untilTurnOf } from '../helpers/play.js';
import { setupRisingSun } from '../../shared/engine/expansions/RisingSunCards.js';
import { VictoryChecker } from '../../shared/engine/VictoryChecker.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');

describe('Écarts de règles corrigés', () => {
    it('Route minière : deux Routes minières jouées, deux Trésors reçus peuvent être joués', () => {
        let s = makeGame(['mining_road']);
        player(s).hand = cards('mining_road', 'mining_road');
        s = play(s, 'mining_road');
        s = play(s, 'mining_road');
        s = toBuy(s);
        player(s).coins = 12;
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea).filter(id => id === 'silver').length).toBe(2);
        s = buy(s, 'silver'); // third: no Mining Road left
        expect(s.pendingDecision).toBeNull();
    });

    it('Garnison sans jeton : défaussée au Nettoyage', () => {
        let s = makeGame([]);
        player(s).hand = cards('garrison');
        player(s).deck = cards(...filler());
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'garrison');
        s = endTurn(s); // nothing gained: no token
        expect(ids(player(s).playArea)).not.toContain('garrison');
        expect(ids(player(s).discardPile)).toContain('garrison');
    });

    it('Garnison avec jetons : reste en jeu et pioche au tour suivant', () => {
        let s = makeGame([]);
        player(s).hand = cards('garrison');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'garrison');
        s = toBuy(s);
        player(s).buys = 2; // one Buy left after this one: the turn does not end by itself
        s = buy(s, 'copper');
        s = endTurn(s);
        expect(ids(player(s).playArea)).toContain('garrison');
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(6);
    });

    it('Liche : le tour passé compte pour départager les égalités', () => {
        let s = makeGame([]);
        player(s).hand = cards('lich');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler(20));
        s = play(s, 'lich');
        s = endTurn(s);           // p1 ends turn 1
        s = endTurn(s);           // p2 plays; p1's next turn is skipped
        // p1 has had 2 turns (one played, one skipped), p2 one so far
        expect(player(s).turnsTaken).toBe(2);
        const ranking = VictoryChecker.ranking(s);
        expect(ranking.scores.find(x => x.playerId === 'p1')!.turns).toBe(2);
    });

    it('Capitale : avec une seule carte en main, on peut la défausser mais sans +2 💰', () => {
        let s = makeGame(['capital_city']);
        player(s).hand = cards('capital_city');
        player(s).deck = cards('estate');
        s = play(s, 'capital_city'); // draws the Estate: 1 card in hand
        expect(s.pendingDecision?.message).toMatch(/dernière carte/);
        s = chooseOption(s, 0);
        if (s.pendingDecision?.type === 'CHOOSE_CARDS') s = chooseCards(s, ['estate']);
        expect(player(s).hand.length).toBe(0);
        expect(player(s).coins).toBe(0);
    });

    it('Tanuki : écarter une carte à Dette permet de recevoir une carte avec autant de Dette', () => {
        let s = makeGame(['tanuki', 'engineer', 'overlord', 'smithy']);
        player(s).hand = cards('tanuki', 'engineer');
        s = play(s, 'tanuki');
        s = chooseCards(s, ['engineer']);
        const allowed: string[] = (s.pendingDecision?.constraints as any)?.filter?.cardIds || [];
        expect(allowed).toContain('engineer');      // 4 Debt ≤ 4 Debt, $0 ≤ $2
        expect(allowed).toContain('estate');        // $2 ≤ $2
        expect(allowed).not.toContain('overlord');  // 8 Debt > 4 Debt
        expect(allowed).not.toContain('silver');    // $3 > $2
    });

    it('Grand chef : la carte Présage qui retire le dernier Soleil donne aussi +1 Action', () => {
        let s = makeGame(['tea_house']);
        s.landscapes = ['great_leader'];
        setupRisingSun(s);
        s.landscapeState['great_leader'].tokens.sun = 1;
        player(s).hand = cards('tea_house');
        player(s).deck = cards(...filler(4));
        s = play(s, 'tea_house');
        expect(player(s).actions).toBe(2); // 1 - 1 + 1 (Tea House) + 1 (Great Leader)
    });

    it('Vent divin : le Fléau part aussi, et les nouvelles piles sont mises en place', () => {
        let s = makeGame(['tea_house', 'young_witch']);
        s.supply['village'] = { cardId: 'village', count: 10, cards: [] } as any;
        (s.landscapeState as any).young_witch_bane = { state: { baneId: 'village' }, tokens: {} };
        s.landscapes = ['divine_wind'];
        setupRisingSun(s);
        s.landscapeState['divine_wind'].tokens.sun = 1;
        player(s).hand = cards('tea_house');
        player(s).deck = cards('copper');
        s = play(s, 'tea_house');
        expect(s.supply['village']).toBeUndefined();
        expect(s.kingdomCards.length).toBe(10);
        for (const k of s.kingdomCards) expect(s.supply[k]).toBeTruthy();
    });
});
