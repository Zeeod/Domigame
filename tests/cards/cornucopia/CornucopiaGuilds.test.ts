/**
 * Cornucopia & Guilds (2nd edition, 2024): behaviour tests following the official card texts.
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, untilTurnOf } from '../../helpers/play.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';
import { CardRegistry } from '../../../shared/cards/index.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const pass = (s: any) => choose(s, { type: 'CARDS', cardInstanceIds: [] });

describe('Abondance & Guildes — 2e édition', () => {
    // ------------------------------------------------------------ Cornucopia half
    it('Carnaval : une carte de chaque nom parmi les 4 du dessus, le reste défaussé', () => {
        let s = makeGame(['carnival']);
        player(s).hand = cards('carnival');
        player(s).deck = cards('copper', 'copper', 'silver', 'copper', 'gold');
        s = play(s, 'carnival');
        expect(ids(player(s).hand).sort()).toEqual(['copper', 'silver']);
        expect(ids(player(s).discardPile)).toEqual(['copper', 'copper']);
        expect(ids(player(s).deck)).toEqual(['gold']);
    });

    it('Ouvriers agricoles : +1 Carte +2 Actions ; en les recevant, une carte mise de côté est jouée au prochain tour', () => {
        let s = makeGame(['farmhands', 'smithy']);
        player(s).hand = cards('farmhands');
        player(s).deck = cards(...filler());
        s = play(s, 'farmhands');
        expect([player(s).hand.length, player(s).actions]).toEqual([1, 2]);

        s = toBuy(makeGame(['farmhands', 'smithy']));
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'farmhands');
        s = chooseCards(s, ['smithy']);
        expect(ids(player(s).aside)).toEqual(['smithy']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toContain('smithy');
        expect(player(s).hand.length).toBe(8);
    });

    it('Joute : met de côté une Province pour recevoir une Récompense en main', () => {
        let s = makeGame(['joust']);
        expect(s.nonSupply?.courser?.count).toBe(1);
        player(s).hand = cards('joust', 'province');
        player(s).deck = cards(...filler());
        s = play(s, 'joust');
        expect(player(s).coins).toBe(1);
        s = chooseOption(s, 0);
        s = chooseOption(s, s.pendingDecision!.options!.findIndex((o: any) => o.label === 'Coursier'));
        expect(ids(player(s).hand)).toContain('courser');
        expect(ids(player(s).aside)).toEqual(['province']);
        s = endTurn(s);
        expect(ids([...player(s).hand, ...player(s).discardPile, ...player(s).deck])).toContain('province');
        expect(player(s).aside.length).toBe(0);
    });

    it('Corne d\'abondance : une carte jusqu\'au nombre de noms différents en jeu ; écartée si c\'est une Victoire', () => {
        let s = toBuy(makeGame(['horn_of_plenty']));
        player(s).hand = cards('copper', 'silver', 'horn_of_plenty');
        s = play(s, 'copper'); s = play(s, 'silver'); s = play(s, 'horn_of_plenty');
        expect(() => chooseSupply(s, 'duchy')).toThrow();
        s = chooseSupply(s, 'silver');
        expect(ids(player(s).playArea)).toContain('horn_of_plenty');

        s = toBuy(makeGame(['horn_of_plenty']));
        player(s).hand = cards('copper', 'horn_of_plenty');
        s = play(s, 'copper'); s = play(s, 'horn_of_plenty');
        s = chooseSupply(s, 'estate');
        expect(ids(s.trash)).toEqual(['horn_of_plenty']);
    });

    it('Partie de chasse : pioche jusqu\'à une carte absente de la main', () => {
        let s = makeGame(['hunting_party']);
        player(s).hand = cards('hunting_party', 'copper', 'estate');
        player(s).deck = cards('silver', 'copper', 'estate', 'gold', ...filler());
        s = play(s, 'hunting_party');            // draws Silver, then reveals Copper, Estate, Gold
        expect(ids(player(s).hand).sort()).toEqual(['copper', 'estate', 'gold', 'silver']);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate']);
    });

    it('Bouffon : Victoire → Malédiction ; sinon vous choisissez qui reçoit une copie', () => {
        let s = makeGame(['jester']);
        player(s).hand = cards('jester');
        player(s, 'p2').deck = cards('silver', 'estate');
        s = play(s, 'jester');
        expect(player(s).coins).toBe(2);
        expect(s.pendingDecision?.playerId).toBe('p1');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
        s = makeGame(['jester']);
        player(s).hand = cards('jester');
        player(s, 'p2').deck = cards('estate');
        s = play(s, 'jester');
        expect(ids(player(s, 'p2').discardPile).sort()).toEqual(['curse', 'estate']);
    });

    it('Hameau : défausses optionnelles pour +1 Action et +1 Achat', () => {
        let s = makeGame(['hamlet']);
        player(s).hand = cards('hamlet', 'estate', 'curse');
        player(s).deck = cards(...filler());
        s = play(s, 'hamlet');
        s = chooseCards(s, ['estate']);
        s = chooseCards(s, ['curse']);
        expect(player(s).actions).toBe(2);
        expect(player(s).buys).toBe(2);
    });

    it('Ménagerie : +3 Cartes si la main n\'a pas de doublon, sinon +1', () => {
        let s = makeGame(['menagerie']);
        player(s).hand = cards('menagerie', 'copper', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'menagerie');
        expect(player(s).hand.length).toBe(5);
        s = makeGame(['menagerie']);
        player(s).hand = cards('menagerie', 'copper', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'menagerie');
        expect(player(s).hand.length).toBe(3);
    });

    it('Refonte : deux fois, écarte une carte et reçoit une carte coûtant exactement 1 de plus', () => {
        let s = makeGame(['remake']);
        player(s).hand = cards('remake', 'estate', 'copper');
        s = play(s, 'remake');
        s = chooseCards(s, ['estate']);
        expect(() => chooseSupply(s, 'estate')).toThrow();
        s = chooseSupply(s, 'silver');
        s = chooseCards(s, ['copper']);
        expect(s.pendingDecision).toBeFalsy();          // nothing costs exactly $1
        expect(ids(player(s).discardPile)).toEqual(['silver']);
    });

    it('Boutique : +1 Carte +1 💰, joue une Action dont vous n\'avez pas de copie en jeu', () => {
        let s = makeGame(['shop', 'smithy']);
        player(s).hand = cards('shop', 'shop', 'smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'shop');
        s = chooseCards(s, ['smithy']);
        expect(ids(player(s).playArea).sort()).toEqual(['shop', 'smithy']);
        expect(player(s).coins).toBe(1);
        expect(player(s).actions).toBe(0);              // played by Shop: no Action used
    });

    it('Jeune sorcière : les autres reçoivent une Malédiction sauf s\'ils dévoilent le Fléau', () => {
        let s = makeGame(['young_witch', 'chapel']);
        (s.landscapeState as any).young_witch_bane = { state: { baneId: 'chapel' }, tokens: {} };
        player(s).hand = cards('young_witch', 'estate', 'estate');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('chapel');
        s = play(s, 'young_witch');
        s = chooseCards(s, ['estate', 'estate']);
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseOption(s, 0);
        expect(ids(player(s, 'p2').discardPile)).toEqual([]);
    });

    it('Foire : 2 PV par tranche de 5 noms différents', () => {
        const s = makeGame(['fairgrounds']);
        const p = player(s);
        p.hand = cards('fairgrounds', 'copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse', 'smithy', 'village');
        p.deck = []; p.discardPile = []; p.vpTokens = 0;
        // 10 different names → 4 VP; + estate 1, duchy 3, province 6, curse -1
        expect(VictoryChecker.scorePlayer(s, p)).toBe(4 + 1 + 3 + 6 - 1);
    });

    // ------------------------------------------------------------ Guilds half
    it('Conseiller : le voisin de gauche choisit la carte défaussée parmi 3', () => {
        let s = makeGame(['advisor']);
        player(s).hand = cards('advisor');
        player(s).deck = cards('gold', 'copper', 'estate', ...filler());
        s = play(s, 'advisor');
        expect(s.pendingDecision?.playerId).toBe('p2');
        const gold = player(s).limbo.find(c => c.id === 'gold')!;
        s = choose(s, { type: 'CARDS', cardInstanceIds: [gold.instanceId] });
        expect(ids(player(s).discardPile)).toEqual(['gold']);
        expect(ids(player(s).hand).sort()).toEqual(['copper', 'estate']);
    });

    it('Boulanger : +1 Carte +1 Action +1 Coffre ; chaque joueur commence avec 1 Coffre', () => {
        let s = makeGame(['baker']);
        expect(player(s).coffers).toBe(1);
        expect(player(s, 'p2').coffers).toBe(1);
        player(s).hand = cards('baker');
        player(s).deck = cards(...filler());
        s = play(s, 'baker');
        expect(player(s).coffers).toBe(2);
    });

    it('Boucher : +2 Coffres, écarte une carte et dépense des Coffres pour une carte plus chère', () => {
        let s = makeGame(['butcher', 'smithy']);
        player(s).hand = cards('butcher', 'estate');
        s = play(s, 'butcher');
        s = chooseCards(s, ['estate']);
        s = chooseOption(s, 2);                          // spend 2 Coffers → up to $4
        s = chooseSupply(s, 'smithy');
        expect(player(s).coffers).toBe(0);
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Cirier : +1 Action +1 Achat +1 Coffre', () => {
        let s = makeGame(['candlestick_maker']);
        player(s).hand = cards('candlestick_maker');
        s = play(s, 'candlestick_maker');
        expect([player(s).actions, player(s).buys, player(s).coffers]).toEqual([1, 2, 1]);
    });

    it('Maréchal-ferrant : surpaiement → +1 Carte en fin de tour par 💰', () => {
        let s = toBuy(makeGame(['farrier']));
        player(s).coins = 5; player(s).buys = 1;
        player(s).deck = cards(...filler(20));
        s = buy(s, 'farrier');
        expect(s.pendingDecision?.options?.length).toBe(4);   // overpay 0..3
        s = chooseOption(s, 3);
        expect(player(s).hand.length).toBe(8);               // turn ended: 5 + 3
    });

    it('Passeur : +2 Cartes +1 Action, défausse ; en le recevant, une carte de la pile mise de côté', () => {
        let s = makeGame(['ferryman']);
        const pile = s.ferrymanPile!;
        expect(pile).toBeTruthy();
        expect([3, 4]).toContain(CardRegistry.get(pile)!.cost);
        expect(s.supply[pile]).toBeUndefined();
        s = toBuy(s);
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'ferryman');
        expect(ids(player(s).discardPile).sort()).toEqual(['ferryman', pile].sort());
    });

    it('Détrousseur : +2 Coffres, les autres défaussent jusqu\'à 3 ; recevoir en phase Action fait piocher', () => {
        let s = makeGame(['footpad', 'workshop']);
        player(s).hand = cards('footpad', 'workshop', 'village');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper');
        s = play(s, 'village');
        s = play(s, 'footpad');
        expect(player(s).coffers).toBe(2);
        s = chooseCards(s, ['copper']);
        const before = player(s).hand.length;
        s = play(s, 'workshop');
        s = chooseSupply(s, 'silver');
        expect(player(s).hand.length).toBe(before - 1 + 1);  // Workshop left the hand, +1 Card from Footpad
    });

    it('Héraut : joue l\'Action du dessus ; surpaiement → cartes de la défausse sur la pioche', () => {
        let s = makeGame(['herald', 'village']);
        player(s).hand = cards('herald');
        player(s).deck = cards('copper', 'village', ...filler());
        s = play(s, 'herald');
        expect(ids(player(s).playArea).sort()).toEqual(['herald', 'village']);

        s = toBuy(makeGame(['herald']));
        player(s).coins = 6; player(s).buys = 2;
        player(s).discardPile = cards('gold', 'estate');
        s = buy(s, 'herald');
        s = chooseOption(s, 1);                               // overpay $1
        s = choose(s, { type: 'CARDS', cardInstanceIds: [player(s).discardPile.find(c => c.id === 'gold')!.instanceId] });
        expect(player(s).deck[0].id).toBe('gold');
    });

    it('Infirmerie : +1 Carte, peut écarter ; surpaiement → jouée une fois par 💰', () => {
        let s = toBuy(makeGame(['infirmary']));
        player(s).coins = 5; player(s).buys = 2;
        player(s).hand = cards('estate', 'curse');
        player(s).deck = cards(...filler());
        s = buy(s, 'infirmary');
        s = chooseOption(s, 2);                               // overpay $2: play it twice
        s = chooseCards(s, ['estate']);
        s = chooseCards(s, ['curse']);
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
        expect(ids(player(s).playArea)).toContain('infirmary');
    });

    it('Compagnon : nomme une carte, pioche 3 cartes qui ne sont pas celle-ci', () => {
        let s = makeGame(['journeyman']);
        player(s).hand = cards('journeyman');
        player(s).deck = cards('copper', 'silver', 'copper', 'estate', 'gold', ...filler());
        s = play(s, 'journeyman');
        s = choose(s, { type: 'NAMED_CARD', cardId: 'copper' });
        expect(ids(player(s).hand).sort()).toEqual(['estate', 'gold', 'silver']);
        expect(ids(player(s).discardPile)).toEqual(['copper', 'copper']);
    });

    it('Guilde des marchands : +1 Achat +1 💰 ; +1 Coffre par carte achetée', () => {
        let s = makeGame(['merchant_guild']);
        player(s).hand = cards('merchant_guild');
        s = play(s, 'merchant_guild');
        s = toBuy(s);
        player(s).coins = 5;
        s = buy(s, 'silver');
        expect(player(s).coffers).toBe(1);
    });

    it('Place : +1 Carte +2 Actions, défausse un Trésor pour +1 Coffre', () => {
        let s = makeGame(['plaza']);
        player(s).hand = cards('plaza', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'plaza');
        s = chooseCards(s, ['copper']);
        expect(player(s).coffers).toBe(1);
    });

    it('Devin : un Or ; les autres reçoivent une Malédiction et piochent', () => {
        let s = makeGame(['soothsayer']);
        player(s).hand = cards('soothsayer');
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'soothsayer');
        expect(ids(player(s).discardPile)).toEqual(['gold']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        expect(player(s, 'p2').hand.length).toBe(1);
    });

    it('Tailleur de pierre : 2 cartes moins chères ; surpaiement → 2 Actions coûtant le surplus', () => {
        let s = makeGame(['stonemason', 'village']);
        player(s).hand = cards('stonemason', 'silver');
        s = play(s, 'stonemason');
        s = chooseCards(s, ['silver']);
        s = chooseSupply(s, 'estate');
        s = chooseSupply(s, 'copper');
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate']);

        s = toBuy(makeGame(['stonemason', 'village']));
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'stonemason');
        s = chooseOption(s, 3);
        s = chooseSupply(s, 'village');
        s = chooseSupply(s, 'village');
        expect(ids(player(s).discardPile).sort()).toEqual(['stonemason', 'village', 'village']);
    });

    // ------------------------------------------------------------ Rewards
    it('Récompenses : Diadème, Coursier, Domaine seigneurial, Huscarl, Navet géant, Renommée', () => {
        let s = makeGame(['joust', 'village']);
        player(s).hand = cards('coronet', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'coronet');
        s = chooseCards(s, ['village']);
        expect(player(s).actions).toBe(4);              // 1 - 1 + 2 + 2

        s = makeGame(['joust']);
        player(s).hand = cards('courser');
        s = play(s, 'courser');
        s = chooseOption(s, 5);                          // +2 $ and 4 Silvers
        expect(player(s).coins).toBe(2);
        expect(ids(player(s).discardPile)).toEqual(['silver', 'silver', 'silver', 'silver']);

        s = makeGame(['joust']);
        player(s).hand = cards('demesne');
        s = play(s, 'demesne');
        expect([player(s).actions, player(s).buys]).toEqual([2, 3]);
        player(s).vpTokens = 0;
        player(s).deck = []; player(s).hand = [];
        expect(VictoryChecker.scorePlayer(s, player(s))).toBe(1);   // the Demesne itself: 1 Gold

        s = makeGame(['joust', 'village']);
        player(s).hand = cards('village', 'housecarl');
        player(s).deck = cards(...filler());
        s = play(s, 'village'); s = play(s, 'housecarl');
        expect(player(s).hand.length).toBe(1 + 2);

        s = toBuy(makeGame(['joust']));
        player(s).coffers = 1;
        player(s).hand = cards('huge_turnip', 'renown');
        s = play(s, 'huge_turnip');
        expect(player(s).coins).toBe(3);
        s = play(s, 'renown');
        expect(EconomyEngine.getCardCost(s, 'p1', 'gold')).toBe(4);
    });

    it('Les cartes de 1re édition sont marquées comme anciennes', () => {
        for (const id of ['fortune_teller', 'farming_village', 'horse_traders', 'harvest', 'tournament', 'doctor', 'masterpiece', 'taxman']) {
            expect(CardRegistry.get(id)?.isLegacy).toBe(true);
        }
    });
});
