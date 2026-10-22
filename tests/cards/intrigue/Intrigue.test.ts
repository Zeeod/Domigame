/**
 * Intrigue (2nd edition): one behaviour test per Kingdom card, following the official text.
 */
import { describe, it, expect } from 'vitest';
import { CardRegistry } from '../../../shared/cards/index.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption } from '../../helpers/play.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const sorted = (cs: { id: string }[]) => ids(cs).sort();

describe('Intrigue — 2e édition', () => {
    it('Baron : +1 Achat ; défaussez un Domaine pour +4 💰, sinon recevez un Domaine', () => {
        let s = makeGame(['baron']);
        player(s).hand = cards('baron', 'estate');
        s = play(s, 'baron');
        s = chooseCards(s, ['estate']);
        expect(player(s).coins).toBe(4);
        expect(player(s).buys).toBe(2);

        s = makeGame(['baron']);
        player(s).hand = cards('baron', 'copper');
        s = play(s, 'baron');
        if (s.pendingDecision) s = chooseCards(s, []);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
    });

    it('Pont : +1 Achat +1 💰, les cartes coûtent 1 de moins ce tour-ci', () => {
        let s = makeGame(['bridge']);
        player(s).hand = cards('bridge');
        s = play(s, 'bridge');
        expect(player(s).coins).toBe(1);
        expect(player(s).buys).toBe(2);
        expect(EconomyEngine.getCardCost(s, 'p1', 'silver')).toBe(2);
    });

    it('Conspirateur : +2 💰 ; si 3 Actions jouées ce tour-ci, +1 Carte +1 Action', () => {
        let s = makeGame(['conspirator', 'village']);
        player(s).hand = cards('village', 'village', 'conspirator');
        player(s).deck = cards('copper', 'copper', 'copper');
        s = play(s, 'village'); s = play(s, 'village'); s = play(s, 'conspirator');
        expect(player(s).coins).toBe(2);
        expect(player(s).actions).toBe(3); // 1-1+2-1+2-1+1
    });

    it('Courtisan : un choix différent par type de la carte révélée', () => {
        let s = makeGame(['courtier']);
        player(s).hand = cards('courtier', 'nobles'); // Action – Victory: 2 choices
        s = play(s, 'courtier');
        s = chooseCards(s, ['nobles']);
        expect((s.pendingDecision as any).constraints.min).toBe(2);
        s = choose(s, { type: 'OPTIONS', optionIndices: [1, 2] });
        expect(player(s).buys).toBe(2);
        expect(player(s).coins).toBe(3);
    });

    it('Cour : +3 Cartes, remettez une carte de votre main sur la pioche', () => {
        let s = makeGame(['courtyard']);
        player(s).hand = cards('courtyard');
        player(s).deck = cards('copper', 'silver', 'gold', 'estate');
        s = play(s, 'courtyard');
        s = chooseCards(s, ['gold']);
        expect(player(s).deck[0].id).toBe('gold');
        expect(player(s).hand.length).toBe(2);
    });

    it('Diplomate : +2 Cartes ; +2 Actions si 5 cartes ou moins en main', () => {
        let s = makeGame(['diplomat']);
        player(s).hand = cards('diplomat', 'copper');
        player(s).deck = cards('copper', 'copper');
        s = play(s, 'diplomat');
        expect(player(s).actions).toBe(2);
    });

    it('Duc : 1 PV par Duché', () => {
        const d: any = CardRegistry.get('duke');
        expect(d.vpCalculator([{ id: 'duchy' }, { id: 'duchy' }, { id: 'estate' }])).toBe(2);
    });

    it('Ferme : Trésor-Victoire, +2 💰, 2 PV', () => {
        const f: any = CardRegistry.get('farm');
        expect(f.types).toEqual(['TREASURE', 'VICTORY']);
        expect(f.victoryPoints).toBe(2);
        let s = makeGame(['farm']);
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s).hand = cards('farm');
        s = play(s, 'farm');
        expect(player(s).coins).toBe(2);
    });

    it('Ferronnerie : recevez une carte jusqu\'à 4 ; bonus selon ses types', () => {
        let s = makeGame(['ironworks', 'village']);
        player(s).hand = cards('ironworks');
        player(s).deck = cards('copper');
        s = play(s, 'ironworks');
        s = chooseSupply(s, 'village');
        expect(player(s).actions).toBe(1); // Action → +1 Action
        s = makeGame(['ironworks']);
        player(s).hand = cards('ironworks');
        s = play(s, 'ironworks');
        s = chooseSupply(s, 'silver');
        expect(player(s).coins).toBe(1); // Treasure → +1 💰
    });

    it('Rôdeur : écarter une Action de la réserve (pas la recevoir)', () => {
        let s = makeGame(['lurker', 'village']);
        player(s).hand = cards('lurker');
        s = play(s, 'lurker');
        s = chooseOption(s, 0);
        s = chooseSupply(s, 'village');
        expect(ids(s.trash)).toEqual(['village']);
        expect(s.supply['village'].count).toBe(9);
        expect(player(s).discardPile.length).toBe(0);
    });

    it('Rôdeur : recevoir une Action du rebut', () => {
        let s = makeGame(['lurker']);
        s.trash = cards('village', 'copper');
        player(s).hand = cards('lurker');
        s = play(s, 'lurker');
        s = chooseOption(s, 1);
        const v = (s.pendingDecision as any).context.cards.find((c: any) => c.id === 'village');
        s = choose(s, { type: 'CARDS', cardInstanceIds: [v.instanceId] });
        expect(ids(player(s).discardPile)).toEqual(['village']);
        expect(ids(s.trash)).toEqual(['copper']);
    });

    it('Mascarade : +2 Cartes, chacun passe une carte à gauche, puis écart optionnel', () => {
        let s = makeGame(['masquerade']);
        player(s).hand = cards('masquerade', 'estate');
        player(s).deck = cards('copper', 'copper');
        player(s, 'p2').hand = cards('curse');
        s = play(s, 'masquerade');
        s = chooseCards(s, ['estate']);           // p1 passes Estate
        s = chooseCards(s, ['curse']);            // p2 passes Curse
        expect(ids(player(s).hand).filter(x => x === 'curse').length).toBe(1);
        expect(ids(player(s, 'p2').hand)).toEqual(['estate']);
        s = chooseCards(s, ['curse']);            // p1 trashes the Curse
        expect(ids(s.trash)).toEqual(['curse']);
    });

    it('Moulin : +1 Carte +1 Action ; défaussez 2 cartes pour +2 💰 ; 1 PV', () => {
        let s = makeGame(['mill']);
        player(s).hand = cards('mill', 'estate', 'estate');
        player(s).deck = cards('copper');
        s = play(s, 'mill');
        s = chooseCards(s, ['estate', 'estate']);
        expect(player(s).coins).toBe(2);
        expect((CardRegistry.get('mill') as any).victoryPoints).toBe(1);
    });

    it('Village minier : +1 Carte +2 Actions ; peut s\'écarter pour +2 💰', () => {
        let s = makeGame(['mining_village']);
        player(s).hand = cards('mining_village');
        player(s).deck = cards('copper');
        s = play(s, 'mining_village');
        s = chooseOption(s, 0);
        expect(ids(s.trash)).toEqual(['mining_village']);
        expect(player(s).coins).toBe(2);
        expect(player(s).actions).toBe(2);
    });

    it('Larbin : défaussez votre main, +4 Cartes ; les autres avec 5 cartes ou plus aussi', () => {
        let s = makeGame(['minion'], 3);
        player(s).hand = cards('minion', 'estate', 'estate');
        player(s).deck = cards('copper', 'copper', 'copper', 'copper');
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper', 'copper');
        player(s, 'p2').deck = cards('silver', 'silver', 'silver', 'silver');
        player(s, 'p3').hand = cards('copper', 'copper', 'copper', 'copper');
        s = play(s, 'minion');
        s = chooseOption(s, 1);
        expect(sorted(player(s).hand)).toEqual(['copper', 'copper', 'copper', 'copper']);
        expect(sorted(player(s, 'p2').hand)).toEqual(['silver', 'silver', 'silver', 'silver']);
        expect(player(s, 'p3').hand.length).toBe(4);     // only 4 cards: unaffected
    });

    it('Nobles : +3 Cartes ou +2 Actions ; 2 PV', () => {
        let s = makeGame(['nobles']);
        player(s).hand = cards('nobles');
        s = play(s, 'nobles');
        s = chooseOption(s, 1);
        expect(player(s).actions).toBe(2);
    });

    it('Pion : deux options différentes', () => {
        let s = makeGame(['pawn']);
        player(s).hand = cards('pawn');
        s = play(s, 'pawn');
        s = choose(s, { type: 'OPTIONS', optionIndices: [2, 3] });
        expect(player(s).buys).toBe(2);
        expect(player(s).coins).toBe(1);
    });

    it('Remplacement : Action ou Trésor reçu va sur la pioche ; Victoire → Malédiction aux autres', () => {
        let s = makeGame(['remplacement']);
        player(s).hand = cards('remplacement', 'estate');
        s = play(s, 'remplacement');
        s = chooseCards(s, ['estate']);
        s = chooseSupply(s, 'silver');
        expect(player(s).deck[0].id).toBe('silver');

        s = makeGame(['remplacement']);
        player(s).hand = cards('remplacement', 'estate');
        s = play(s, 'remplacement');
        s = chooseCards(s, ['estate']);
        s = chooseSupply(s, 'estate');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
    });

    it('Taudis : +2 Actions, dévoile la main, +2 Cartes s\'il n\'y a pas d\'Action', () => {
        let s = makeGame(['shanty_town']);
        player(s).hand = cards('shanty_town', 'copper');
        player(s).deck = cards('copper', 'copper');
        s = play(s, 'shanty_town');
        expect(player(s).hand.length).toBe(3);
        expect(player(s).actions).toBe(2);
    });

    it('Intendant : +2 Cartes, +2 💰 ou écarter 2 cartes', () => {
        let s = makeGame(['steward']);
        player(s).hand = cards('steward', 'estate', 'curse');
        s = play(s, 'steward');
        s = chooseOption(s, 2);
        s = chooseCards(s, ['estate', 'curse']);
        expect(sorted(s.trash)).toEqual(['curse', 'estate']);
    });

    it('Escroc : +2 💰 ; la victime écarte sa carte du dessus et reçoit une carte de même coût choisie par l\'attaquant', () => {
        let s = makeGame(['swindler', 'village']);
        player(s).hand = cards('swindler');
        player(s, 'p2').deck = cards('silver');
        s = play(s, 'swindler');
        expect(player(s).coins).toBe(2);
        expect(s.pendingDecision?.playerId).toBe('p1');   // the attacker chooses
        s = chooseSupply(s, 'village');
        expect(ids(s.trash)).toEqual(['silver']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['village']);
    });

    it('Bourreau : +3 Cartes ; les autres défaussent 2 cartes ou reçoivent une Malédiction en main', () => {
        let s = makeGame(['torturer']);
        player(s).hand = cards('torturer');
        player(s).deck = cards('copper', 'copper', 'copper');
        s = play(s, 'torturer');
        s = chooseOption(s, 1);
        expect(ids(player(s, 'p2').hand)).toContain('curse');
    });

    it('Poste de traite : écartez 2 cartes, recevez UN Argent en main', () => {
        let s = makeGame(['trading_post']);
        player(s).hand = cards('trading_post', 'estate', 'curse');
        s = play(s, 'trading_post');
        s = chooseCards(s, ['estate', 'curse']);
        expect(ids(player(s).hand)).toEqual(['silver']);
        expect(s.supply['silver'].count).toBe(39);
    });

    it('Poste de traite : avec une seule carte écartée, pas d\'Argent', () => {
        let s = makeGame(['trading_post']);
        player(s).hand = cards('trading_post', 'estate');
        s = play(s, 'trading_post');
        s = chooseCards(s, ['estate']);
        expect(player(s).hand.length).toBe(0);
    });

    it('Amélioration : +1 Carte +1 Action, recevez une carte coûtant EXACTEMENT 1 de plus', () => {
        let s = makeGame(['upgrade']);
        player(s).hand = cards('upgrade', 'estate');      // Estate costs 2 → exactly 3
        player(s).deck = cards('copper');
        s = play(s, 'upgrade');
        s = chooseCards(s, ['estate']);
        expect(() => chooseSupply(s, 'copper')).toThrow(); // costs 0: refused
        s = chooseSupply(s, 'silver');
        expect(ids(player(s).discardPile)).toEqual(['silver']);
    });

    it('Puits aux souhaits : nommez une carte ; si c\'est celle du dessus, prenez-la', () => {
        let s = makeGame(['wishing_well']);
        player(s).hand = cards('wishing_well');
        player(s).deck = cards('copper', 'gold');
        s = play(s, 'wishing_well');
        s = choose(s, { type: 'NAMED_CARD', cardId: 'gold' });
        expect(sorted(player(s).hand)).toEqual(['copper', 'gold']);
    });
});
