/**
 * Promos: Church, Dismantle, Governor, Marchland, Stash, Walled Village, Summon.
 * (Black Market, Envoy, Prince, Captain, Sauna/Avanto: see Promos.test.ts)
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, untilTurnOf, act } from '../../helpers/play.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';
import { EffectUtils } from '../../../shared/engine/EffectUtils.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');

describe('Promos', () => {
    it('Église : met de côté jusqu\'à 3 cartes, reprises au prochain tour, puis peut écarter', () => {
        let s = makeGame(['church']);
        player(s).hand = cards('church', 'gold', 'estate', 'copper');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'church');
        expect(player(s).actions).toBe(1);
        s = chooseCards(s, ['gold', 'estate']);
        expect(player(s).hand.length).toBe(1);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand)).toEqual(expect.arrayContaining(['gold', 'estate']));
        expect(player(s).hand.length).toBe(7);
        s = chooseCards(s, ['estate']);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Démantèlement : une carte moins chère et un Or si la carte coûte 1 ou plus', () => {
        let s = makeGame(['dismantle', 'village']);
        player(s).hand = cards('dismantle', 'silver');
        s = play(s, 'dismantle');
        s = chooseCards(s, ['silver']);
        expect(() => chooseSupply(s, 'village')).toThrow();
        s = chooseSupply(s, 'estate');
        expect(ids(player(s).discardPile).sort()).toEqual(['estate', 'gold']);
        s = makeGame(['dismantle']);
        player(s).hand = cards('dismantle', 'copper');
        s = play(s, 'dismantle');
        s = chooseCards(s, ['copper']);
        expect(player(s).discardPile.length).toBe(0);
    });

    it('Gouverneur : +1 Action ; chacun reçoit un Argent, vous un Or', () => {
        let s = makeGame(['governor']);
        player(s).hand = cards('governor');
        s = play(s, 'governor');
        expect(player(s).actions).toBe(1);
        s = chooseOption(s, 1);
        expect(ids(player(s).discardPile)).toEqual(['gold']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['silver']);
    });

    it('Gouverneur : chacun pioche 1, vous 3', () => {
        let s = makeGame(['governor']);
        player(s).hand = cards('governor');
        player(s).deck = cards(...filler());
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'governor');
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(3);
        expect(player(s, 'p2').hand.length).toBe(1);
    });

    it('Frontière : 1 PV par 3 cartes Victoire ; en la recevant, +1 Achat et défausse pour +1 💰 chacune', () => {
        let s = toBuy(makeGame(['marchland']));
        player(s).coins = 5; player(s).buys = 1;
        player(s).hand = cards('estate', 'curse');
        s = buy(s, 'marchland');
        expect(player(s).buys).toBe(1);
        s = chooseCards(s, ['estate', 'curse']);
        expect(player(s).coins).toBe(2);
        const p = player(s);
        p.hand = cards('marchland', 'estate', 'estate', 'duchy', 'estate'); p.deck = []; p.discardPile = []; p.vpTokens = 0;
        expect(VictoryChecker.scorePlayer(s, p)).toBe(1 + 3 + 3);       // 5 Victory cards → 1; estates 3; duchy 3
    });

    it('Cachette : 2 💰 ; mise sur le dessus quand on mélange', () => {
        let s = toBuy(makeGame(['stash']));
        player(s).hand = cards('stash');
        s = play(s, 'stash');
        expect(player(s).coins).toBe(2);
        const p = player(s);
        p.deck = []; p.discardPile = cards('copper', 'estate', 'stash', 'copper', 'silver');
        EffectUtils.reshuffleDiscard(s, p);
        expect(p.deck[0].id).toBe('stash');
        expect(p.deck.length).toBe(5);
    });

    it('Village fortifié : revient sur la pioche si au plus une autre Action en jeu', () => {
        let s = makeGame(['walled_village', 'smithy']);
        player(s).hand = cards('walled_village', 'smithy');
        player(s).deck = cards(...Array(10).fill('estate'));
        s = play(s, 'walled_village');
        s = play(s, 'smithy');
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('walled_village');
    });

    it('Appel : reçoit une Action jusqu\'à 4, mise de côté et jouée au prochain tour', () => {
        let s = toBuy(makeGame(['smithy']));
        s.landscapes = ['summon'];
        player(s).coins = 5; player(s).buys = 1;
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'summon' });
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).aside)).toEqual(['smithy']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toContain('smithy');
        expect(player(s).hand.length).toBe(8);
    });
});
