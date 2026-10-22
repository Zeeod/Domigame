/**
 * Prosperity (2nd edition): behaviour tests following the official card texts.
 * (Anvil, Clerk, Tiara, Rabble: see Prosperity2E.test.ts)
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy } from '../../helpers/play.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { CardRegistry } from '../../../shared/cards/index.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const deck = (...x: string[]) => cards(...x, ...Array(12).fill('copper'));
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const pass = (s: any) => choose(s, { type: 'CARDS', cardInstanceIds: [] });
const cost = (s: any, id: string) => CardRegistry.withGameOverrides(s.cardOverrides, () => EconomyEngine.getCardCost(s, 'p1', id));

describe('Prospérité — 2e édition', () => {
    it('Banque : +1 💰 par Trésor en jeu (celle-ci comprise)', () => {
        let s = toBuy(makeGame(['bank']));
        player(s).hand = cards('copper', 'copper', 'bank');
        s = play(s, 'copper'); s = play(s, 'copper'); s = play(s, 'bank');
        expect(player(s).coins).toBe(5);
    });

    it('Évêque : +1 💰 +1 🛡️, écarte une carte pour 🛡️ = moitié de son coût, les autres peuvent écarter', () => {
        let s = makeGame(['bishop']);
        player(s).hand = cards('bishop', 'gold');
        player(s, 'p2').hand = cards('estate');
        s = play(s, 'bishop');
        s = chooseCards(s, ['gold']);
        expect(player(s).coins).toBe(1);
        expect(player(s).vpTokens).toBe(4);
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = choose(s, { type: 'CARDS', cardInstanceIds: [player(s, 'p2').hand[0].instanceId] });
        expect(ids(s.trash).sort()).toEqual(['estate', 'gold']);
    });

    it('Charlatan : +3 💰, Malédiction aux autres ; la Malédiction devient un Trésor à 1 💰', () => {
        let s = makeGame(['charlatan']);
        player(s).hand = cards('charlatan');
        s = play(s, 'charlatan');
        expect(player(s).coins).toBe(3);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        expect(s.pendingDecision).toBeFalsy();
        s = toBuy(s);
        player(s).hand = cards('curse');
        s = play(s, 'curse');
        expect(player(s).coins).toBe(4);
    });

    it('Sans Charlatan, la Malédiction ne se joue pas', () => {
        let s = toBuy(makeGame(['smithy']));
        player(s).hand = cards('curse');
        expect(() => play(s, 'curse')).toThrow();
    });

    it('Ville : bonus selon le nombre de piles vides', () => {
        let s = makeGame(['city', 'smithy', 'village']);
        player(s).hand = cards('city');
        player(s).deck = deck();
        s = play(s, 'city');
        expect(player(s).hand.length).toBe(1);
        expect(player(s).actions).toBe(2);

        s = makeGame(['city', 'smithy', 'village']);
        s.supply.smithy.count = 0;
        player(s).hand = cards('city');
        player(s).deck = deck();
        s = play(s, 'city');
        expect(player(s).hand.length).toBe(2);
        expect(player(s).buys).toBe(1);

        s = makeGame(['city', 'smithy', 'village']);
        s.supply.smithy.count = 0; s.supply.village.count = 0;
        player(s).hand = cards('city');
        player(s).deck = deck();
        s = play(s, 'city');
        expect(player(s).hand.length).toBe(2);
        expect(player(s).buys).toBe(2);
        expect(player(s).coins).toBe(1);
    });

    it('Collection : 2 💰 +1 Achat ; +1 🛡️ par carte Action reçue ce tour', () => {
        let s = toBuy(makeGame(['collection', 'smithy']));
        player(s).hand = cards('collection', 'gold');
        s = play(s, 'collection'); s = play(s, 'gold');
        expect(player(s).buys).toBe(2);
        s = buy(s, 'smithy');
        expect(player(s).vpTokens).toBe(1);
        s = buy(s, 'copper');
        expect(player(s).vpTokens).toBe(1);
    });

    it('Boule de cristal : peut jouer la carte du dessus si c\'est une Action', () => {
        let s = makeGame(['crystal_ball', 'smithy']);
        player(s).hand = cards('crystal_ball');
        player(s).deck = deck('smithy');
        s = toBuy(s);
        s = play(s, 'crystal_ball');
        expect(player(s).coins).toBe(1);
        expect(s.pendingDecision?.options?.length).toBe(4);
        s = chooseOption(s, 2);
        expect(ids(player(s).playArea)).toContain('smithy');
        expect(player(s).hand.length).toBe(3);
    });

    it('Boule de cristal : une Victoire ne peut qu\'être écartée, défaussée ou laissée', () => {
        let s = toBuy(makeGame(['crystal_ball']));
        player(s).hand = cards('crystal_ball');
        player(s).deck = deck('estate');
        s = play(s, 'crystal_ball');
        expect(s.pendingDecision?.options?.length).toBe(3);
        s = chooseOption(s, 0);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Agrandissement : écarte une carte, reçoit une carte coûtant jusqu\'à 3 de plus', () => {
        let s = makeGame(['expand']);
        player(s).hand = cards('expand', 'estate');
        s = play(s, 'expand');
        s = chooseCards(s, ['estate']);
        expect(() => chooseSupply(s, 'gold')).toThrow();
        s = chooseSupply(s, 'duchy');
        expect(ids(player(s).discardPile)).toEqual(['duchy']);
    });

    it('Forge : écarte des cartes, reçoit une carte coûtant exactement le total', () => {
        let s = makeGame(['forge', 'smithy']);
        player(s).hand = cards('forge', 'estate', 'estate');
        s = play(s, 'forge');
        s = chooseCards(s, ['estate', 'estate']);
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Grand Marché : +1 Carte +1 Action +1 Achat +2 💰 ; non achetable avec un Cuivre en jeu', () => {
        let s = makeGame(['grand_market']);
        player(s).hand = cards('grand_market');
        player(s).deck = deck();
        s = play(s, 'grand_market');
        expect([player(s).hand.length, player(s).actions, player(s).buys, player(s).coins]).toEqual([1, 1, 2, 2]);
        s = toBuy(s);
        player(s).hand = cards('copper', 'gold', 'gold');
        s = play(s, 'copper'); s = play(s, 'gold'); s = play(s, 'gold');
        expect(() => buy(s, 'grand_market')).toThrow();
    });

    it('Trésor caché : un Or quand on achète une carte Victoire', () => {
        let s = toBuy(makeGame(['hoard']));
        player(s).hand = cards('hoard', 'silver'); player(s).buys = 2;
        s = play(s, 'hoard'); s = play(s, 'silver');
        s = buy(s, 'estate');
        expect(ids(player(s).discardPile).sort()).toEqual(['estate', 'gold']);
    });

    it('Investissement : écarte une carte, puis +1 💰', () => {
        let s = toBuy(makeGame(['investment']));
        player(s).hand = cards('investment', 'estate');
        s = play(s, 'investment');
        s = chooseCards(s, ['estate']);
        s = chooseOption(s, 0);
        expect(player(s).coins).toBe(1);
    });

    it('Investissement : ou s\'écarte pour +1 🛡️ par Trésor différent en main', () => {
        let s = toBuy(makeGame(['investment']));
        player(s).hand = cards('investment', 'estate', 'silver', 'copper', 'silver');
        s = play(s, 'investment');
        s = chooseCards(s, ['estate']);
        s = chooseOption(s, 1);
        expect(player(s).vpTokens).toBe(2);
        expect(ids(s.trash).sort()).toEqual(['estate', 'investment']);
    });

    it('Cour du roi : joue une Action trois fois', () => {
        let s = makeGame(['kings_court', 'smithy']);
        player(s).hand = cards('kings_court', 'smithy');
        player(s).deck = deck();
        s = play(s, 'kings_court');
        s = chooseCards(s, ['smithy']);
        expect(player(s).hand.length).toBe(9);
    });

    it('Magnat : dévoile la main, +1 Carte par Trésor', () => {
        let s = makeGame(['magnate']);
        player(s).hand = cards('magnate', 'copper', 'silver', 'estate');
        player(s).deck = deck();
        s = play(s, 'magnate');
        expect(player(s).hand.length).toBe(5);
        expect(player(s).actions).toBe(1);
    });

    it('Monnaie : copie d\'un Trésor dévoilé ; en la recevant, écarte les Trésors en jeu', () => {
        let s = makeGame(['mint']);
        player(s).hand = cards('mint', 'silver');
        s = play(s, 'mint');
        s = chooseCards(s, ['silver']);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
        expect(ids(player(s).hand)).toEqual(['silver']);

        s = toBuy(makeGame(['mint']));
        player(s).hand = cards('copper', 'gold', 'copper'); player(s).buys = 2;
        s = play(s, 'copper'); s = play(s, 'gold'); s = play(s, 'copper');
        s = buy(s, 'mint');
        expect(ids(s.trash).sort()).toEqual(['copper', 'copper', 'gold']);
        expect(ids(player(s).discardPile)).toEqual(['mint']);
    });

    it('Monument : +2 💰 +1 🛡️', () => {
        let s = makeGame(['monument']);
        player(s).hand = cards('monument');
        s = play(s, 'monument');
        expect(player(s).coins).toBe(2);
        expect(player(s).vpTokens).toBe(1);
    });

    it('Colporteur : 2 💰 de moins par Action en jeu, seulement en phase Achat', () => {
        let s = makeGame(['peddler', 'village']);
        player(s).hand = cards('village', 'village');
        player(s).deck = deck();
        s = play(s, 'village'); s = play(s, 'village');
        s.phase = 'ACTION';
        expect(cost(s, 'peddler')).toBe(8);
        s = toBuy(s);
        expect(cost(s, 'peddler')).toBe(4);
    });

    it('Carrière : 1 💰, les Actions coûtent 2 de moins ce tour-ci', () => {
        let s = toBuy(makeGame(['quarry', 'smithy']));
        player(s).hand = cards('quarry');
        s = play(s, 'quarry');
        expect(player(s).coins).toBe(1);
        expect(cost(s, 'smithy')).toBe(2);
        expect(cost(s, 'silver')).toBe(3);
    });

    it('Chambre forte : +2 Cartes, +1 💰 par carte défaussée ; les autres peuvent défausser 2 pour piocher 1', () => {
        let s = makeGame(['vault']);
        player(s).hand = cards('vault', 'estate', 'estate');
        player(s).deck = deck();
        player(s, 'p2').hand = cards('copper', 'estate', 'estate');
        player(s, 'p2').deck = deck();
        s = play(s, 'vault');
        s = chooseCards(s, ['estate', 'estate']);
        expect(player(s).coins).toBe(2);
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseOption(s, 0);
        s = chooseCards(s, ['estate', 'estate']);
        expect(player(s, 'p2').hand.length).toBe(2);
    });

    it('Trésor de guerre : le voisin de gauche nomme une carte que vous ne pourrez pas recevoir', () => {
        let s = toBuy(makeGame(['war_chest', 'smithy']));
        player(s).hand = cards('war_chest');
        s = play(s, 'war_chest');
        expect(s.pendingDecision?.playerId).toBe('p2');
        expect(s.pendingDecision?.type).toBe('NAME_CARD');
        s = choose(s, { type: 'NAMED_CARD', cardId: 'duchy' });
        expect(s.pendingDecision?.playerId).toBe('p1');
        expect(() => chooseSupply(s, 'duchy')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Tour de guet : pioche jusqu\'à 6 ; en réaction, écarte ou met sur la pioche la carte reçue', () => {
        let s = makeGame(['watchtower']);
        player(s).hand = cards('watchtower', 'copper');
        player(s).deck = deck();
        s = play(s, 'watchtower');
        expect(player(s).hand.length).toBe(6);

        s = toBuy(makeGame(['watchtower']));
        player(s).hand = cards('watchtower', 'gold'); player(s).buys = 2;
        s = play(s, 'gold');
        s = buy(s, 'copper');
        s = chooseOption(s, 0);       // reveal Watchtower
        s = chooseOption(s, 0);       // trash it
        expect(ids(s.trash)).toEqual(['copper']);

        s = toBuy(makeGame(['watchtower']));
        player(s).hand = cards('watchtower', 'gold'); player(s).buys = 2;
        s = play(s, 'gold');
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        s = chooseOption(s, 1);       // onto the deck
        expect(player(s).deck[0]?.id).toBe('silver');
    });

    it('Village ouvrier : +1 Carte +2 Actions +1 Achat', () => {
        let s = makeGame(['workers_village']);
        player(s).hand = cards('workers_village');
        player(s).deck = deck();
        s = play(s, 'workers_village');
        expect([player(s).hand.length, player(s).actions, player(s).buys]).toEqual([1, 2, 2]);
    });

    it('Platine et Colonie', () => {
        let s = toBuy(makeGame([]));
        player(s).hand = cards('platinum');
        s = play(s, 'platinum');
        expect(player(s).coins).toBe(5);
        expect(CardRegistry.get('colony')?.victoryPoints).toBe(10);
        expect(CardRegistry.get('colony')?.cost).toBe(11);
    });
});
