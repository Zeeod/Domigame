/**
 * Hinterlands (2nd edition): behaviour tests following the official card texts.
 * (Crossroads: see Crossroads.test.ts)
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn } from '../../helpers/play.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { CardRegistry } from '../../../shared/cards/index.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const pass = (s: any) => choose(s, { type: 'CARDS', cardInstanceIds: [] });

describe('Arrière-pays — 2e édition', () => {
    it('Berserker : reçoit une carte moins chère ; les autres défaussent jusqu\'à 3 ; joué quand reçu avec une Action en jeu', () => {
        let s = makeGame(['berserker', 'smithy', 'village']);
        player(s).hand = cards('berserker');
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'estate', 'estate');
        s = play(s, 'berserker');
        expect(() => chooseSupply(s, 'berserker')).toThrow();
        s = chooseSupply(s, 'smithy');
        s = chooseCards(s, ['estate', 'estate']);
        expect(player(s, 'p2').hand.length).toBe(3);

        s = makeGame(['berserker', 'village', 'workshop']);
        player(s).hand = cards('village', 'workshop');
        player(s).deck = cards(...filler());
        s = play(s, 'village');
        s = play(s, 'workshop');           // gain a card costing up to 4… Berserker costs 5: use a buy instead
        s = chooseSupply(s, 'village');
        s = toBuy(s);
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'berserker');
        expect(ids(player(s).playArea)).toContain('berserker');   // played on gain
    });

    it('Village frontalier : +1 Carte +2 Actions ; en le recevant, une carte moins chère', () => {
        let s = toBuy(makeGame(['border_village', 'smithy']));
        player(s).coins = 6; player(s).buys = 2;
        s = buy(s, 'border_village');
        expect(() => chooseSupply(s, 'border_village')).toThrow();
        expect(() => chooseSupply(s, 'gold')).toThrow();
        s = chooseSupply(s, 'duchy');
        expect(ids(player(s).discardPile).sort()).toEqual(['border_village', 'duchy']);
    });

    it('Cartographe : regarde 4 cartes, en défausse, remet le reste', () => {
        let s = makeGame(['cartographer']);
        player(s).hand = cards('cartographer');
        player(s).deck = cards('copper', 'estate', 'curse', 'gold', 'silver', ...filler());
        s = play(s, 'cartographer');
        s = chooseCards(s, ['estate', 'curse'], 'limbo');
        while (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate']);
        expect(ids(player(s).deck.slice(0, 2)).sort()).toEqual(['gold', 'silver']);
    });

    it('Chaudron : 2 💰 +1 Achat ; à la 3e Action reçue ce tour, Malédiction aux autres', () => {
        let s = toBuy(makeGame(['cauldron', 'village']));
        player(s).hand = cards('cauldron');
        s = play(s, 'cauldron');
        expect(player(s).coins).toBe(2);
        expect(player(s).buys).toBe(2);
        player(s).coins = 20; player(s).buys = 5;
        s = buy(s, 'village'); s = buy(s, 'village');
        expect(ids(player(s, 'p2').discardPile)).toEqual([]);
        s = buy(s, 'village');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        s = buy(s, 'village');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
    });

    it('Développement : écarte une carte, reçoit une carte à +1 et une à −1 sur la pioche', () => {
        let s = makeGame(['develop', 'smithy', 'village']);
        player(s).hand = cards('develop', 'silver');       // 3 → 4 and 2
        s = play(s, 'develop');
        s = chooseCards(s, ['silver']);
        s = chooseOption(s, 0);                          // +1 first
        s = chooseSupply(s, 'smithy');
        expect(() => chooseSupply(s, 'village')).toThrow();
        s = chooseSupply(s, 'estate');
        expect(ids(player(s).deck.slice(0, 2))).toEqual(['estate', 'smithy']);
    });

    it('Terres cultivées : en la recevant, écarte une carte et reçoit une carte coûtant exactement 2 de plus', () => {
        let s = toBuy(makeGame(['farmland', 'smithy']));
        player(s).hand = cards('estate', 'gold', 'gold');
        s = play(s, 'gold'); s = play(s, 'gold');
        player(s).buys = 2;
        s = buy(s, 'farmland');
        s = chooseCards(s, ['estate']);
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile).sort()).toEqual(['farmland', 'smithy']);
    });

    it('Or des fous : 1 💰 le premier, 4 💰 les suivants ; s\'écarte pour un Or quand un autre reçoit une Province', () => {
        let s = toBuy(makeGame(['fools_gold']));
        player(s).hand = cards('fools_gold', 'fools_gold', 'fools_gold');
        s = play(s, 'fools_gold'); s = play(s, 'fools_gold'); s = play(s, 'fools_gold');
        expect(player(s).coins).toBe(9);

        s = toBuy(makeGame(['fools_gold']));
        player(s).coins = 8; player(s).buys = 2;
        player(s).hand = cards('fools_gold');            // own Province: no reaction
        player(s, 'p2').hand = cards('fools_gold');
        s = buy(s, 'province');
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseOption(s, 0);
        expect(ids(s.trash)).toEqual(['fools_gold']);
        expect(player(s, 'p2').deck[0].id).toBe('gold');
    });

    it('Chien de garde : +2 Cartes, +2 de plus avec 5 cartes ou moins ; jouable en réaction à une Attaque', () => {
        let s = makeGame(['guard_dog', 'witch']);
        player(s).hand = cards('guard_dog');
        player(s).deck = cards(...filler());
        s = play(s, 'guard_dog');
        expect(player(s).hand.length).toBe(4);

        s = makeGame(['guard_dog', 'witch']);
        player(s).hand = cards('witch');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('guard_dog');
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'witch');
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseCards(s, ['guard_dog']);
        for (let i = 0; i < 3 && s.pendingDecision; i++) s = pass(s);
        expect(ids(player(s, 'p2').playArea)).toEqual(['guard_dog']);
        expect(player(s, 'p2').hand.length).toBe(4);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
    });

    it('Marchandeur : +2 💰 ; à chaque achat, une carte non-Victoire moins chère', () => {
        let s = makeGame(['haggler', 'smithy']);
        player(s).hand = cards('haggler');
        s = play(s, 'haggler');
        s = toBuy(s);
        player(s).coins = 8; player(s).buys = 2;
        s = buy(s, 'province');
        expect(() => chooseSupply(s, 'duchy')).toThrow();
        s = chooseSupply(s, 'gold');
        expect(ids(player(s).discardPile).sort()).toEqual(['gold', 'province']);
    });

    it('Grand-route : +1 Carte +1 Action, les cartes coûtent 1 de moins ce tour-ci', () => {
        let s = makeGame(['highway']);
        player(s).hand = cards('highway');
        player(s).deck = cards(...filler());
        s = play(s, 'highway');
        expect(EconomyEngine.getCardCost(s, 'p1', 'gold')).toBe(5);
        expect(EconomyEngine.getCardCost(s, 'p2', 'gold')).toBe(5);
    });

    it('Auberge : +2 Cartes +2 Actions, défausse 2 ; en la recevant, mélange des Actions de la défausse dans la pioche', () => {
        let s = makeGame(['inn', 'smithy']);
        player(s).hand = cards('inn', 'estate', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'inn');
        s = chooseCards(s, ['estate', 'estate']);
        expect(player(s).actions).toBe(2);

        s = toBuy(makeGame(['inn', 'smithy']));
        player(s).discardPile = cards('smithy', 'copper');
        player(s).deck = cards('estate');
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'inn');
        const pick = player(s).discardPile.filter(c => c.id !== 'copper').map(c => c.instanceId);
        s = choose(s, { type: 'CARDS', cardInstanceIds: pick });
        expect(ids(player(s).deck).sort()).toEqual(['estate', 'inn', 'smithy']);
        expect(ids(player(s).discardPile)).toEqual(['copper']);
    });

    it('Touche-à-tout : Argent, regarde le dessus, pioche jusqu\'à 5, peut écarter une non-Trésor', () => {
        let s = makeGame(['jack_of_all_trades']);
        player(s).hand = cards('jack_of_all_trades', 'estate');
        player(s).deck = cards('curse', ...filler());
        s = play(s, 'jack_of_all_trades');
        for (let i = 0; i < 3 && s.pendingDecision && s.pendingDecision.type !== 'CHOOSE_CARDS'; i++) s = chooseOption(s, 0);
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'silver']);
        expect(player(s).hand.length).toBe(5);
        s = chooseCards(s, ['estate']);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Margrave : +3 Cartes +1 Achat ; les autres piochent 1 puis défaussent jusqu\'à 3', () => {
        let s = makeGame(['margrave']);
        player(s).hand = cards('margrave');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper', 'copper');
        player(s, 'p2').deck = cards('estate');
        s = play(s, 'margrave');
        expect(player(s).hand.length).toBe(3);
        expect(player(s).buys).toBe(2);
        s = chooseCards(s, ['estate', 'copper', 'copper']);
        expect(player(s, 'p2').hand.length).toBe(3);
    });

    it('Nomades : +1 Achat +2 💰 ; +2 💰 quand on la reçoit ou l\'écarte', () => {
        let s = toBuy(makeGame(['nomads']));
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'nomads');
        expect(player(s).coins).toBe(2);
        s = makeGame(['nomads', 'chapel']);
        player(s).hand = cards('chapel', 'nomads');
        s = play(s, 'chapel');
        s = chooseCards(s, ['nomads']);
        expect(player(s).coins).toBe(2);
    });

    it('Oasis : +1 Carte +1 Action +1 💰, défausse une carte', () => {
        let s = makeGame(['oasis']);
        player(s).hand = cards('oasis', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'oasis');
        s = chooseCards(s, ['estate']);
        expect([player(s).hand.length, player(s).actions, player(s).coins]).toEqual([1, 1, 1]);
    });

    it('Stratagème : une Action en jeu peut revenir sur la pioche en fin de tour', () => {
        let s = makeGame(['scheme', 'smithy']);
        player(s).hand = cards('scheme', 'smithy');
        player(s).deck = cards(...Array(10).fill('estate'));
        s = play(s, 'scheme');
        s = play(s, 'smithy');
        s = endTurn(s);   // auto: picks the first Action (Scheme or Smithy) onto the deck
        expect(ids(player(s).hand).some(id => id === 'scheme' || id === 'smithy')).toBe(true);
    });

    it('Souk : +1 Achat, +7 💰 moins 1 par carte en main ; en le recevant, écarte jusqu\'à 2 cartes', () => {
        let s = makeGame(['souk']);
        player(s).hand = cards('souk', 'copper', 'copper', 'copper');
        s = play(s, 'souk');
        expect(player(s).coins).toBe(4);
        s = toBuy(makeGame(['souk']));
        player(s).hand = cards('estate', 'curse', 'copper');
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'souk');
        s = chooseCards(s, ['estate', 'curse']);
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
    });

    it('Marchand d\'épices : écarte un Trésor pour +2 Cartes +1 Action ou +2 💰 +1 Achat', () => {
        let s = makeGame(['spice_merchant']);
        player(s).hand = cards('spice_merchant', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'spice_merchant');
        s = chooseCards(s, ['copper']);
        s = chooseOption(s, 1);
        expect(player(s).coins).toBe(2);
        expect(player(s).buys).toBe(2);
    });

    it('Écuries : défausse un Trésor pour +3 Cartes +1 Action', () => {
        let s = makeGame(['stables']);
        player(s).hand = cards('stables', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'stables');
        s = chooseCards(s, ['copper']);
        expect(player(s).hand.length).toBe(3);
        expect(player(s).actions).toBe(1);
    });

    it('Commerçant : un Argent par 💰 du coût ; en réaction, échange une carte reçue contre un Argent', () => {
        let s = makeGame(['trader']);
        player(s).hand = cards('trader', 'estate');
        s = play(s, 'trader');
        s = chooseCards(s, ['estate']);
        expect(ids(player(s).discardPile)).toEqual(['silver', 'silver']);

        s = toBuy(makeGame(['trader']));
        player(s).hand = cards('trader');
        player(s).coins = 0; player(s).buys = 2;
        s = buy(s, 'curse');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
        expect(s.supply.curse.count).toBe(10);
    });

    it('Piste : +1 Carte +1 Action ; peut être jouée quand on la reçoit, l\'écarte ou la défausse', () => {
        let s = toBuy(makeGame(['trail']));
        player(s).coins = 4; player(s).buys = 2;
        player(s).deck = cards(...filler());
        s = buy(s, 'trail');
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toEqual(['trail']);

        s = makeGame(['trail', 'chapel']);
        player(s).hand = cards('chapel', 'trail');
        player(s).deck = cards(...filler());
        s = play(s, 'chapel');
        s = chooseCards(s, ['trail']);
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea).sort()).toEqual(['chapel', 'trail']);
        expect(ids(s.trash)).toEqual([]);

        s = makeGame(['trail', 'oasis']);
        player(s).hand = cards('oasis', 'trail');
        player(s).deck = cards(...filler());
        s = play(s, 'oasis');
        s = chooseCards(s, ['trail']);
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea).sort()).toEqual(['oasis', 'trail']);
    });

    it('Tunnel : 2 PV ; défaussé hors Ajustement, peut être dévoilé pour un Or', () => {
        expect(CardRegistry.get('tunnel')?.victoryPoints).toBe(2);
        let s = makeGame(['tunnel', 'oasis']);
        player(s).hand = cards('oasis', 'tunnel');
        player(s).deck = cards(...filler());
        s = play(s, 'oasis');
        s = chooseCards(s, ['tunnel']);
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile).sort()).toEqual(['gold', 'tunnel']);
    });

    it('Tisserand : deux Argents ou une carte jusqu\'à 4 ; jouable quand défaussé hors Ajustement', () => {
        let s = makeGame(['weaver', 'smithy']);
        player(s).hand = cards('weaver');
        s = play(s, 'weaver');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['silver', 'silver']);
        s = makeGame(['weaver', 'smithy']);
        player(s).hand = cards('weaver');
        s = play(s, 'weaver');
        s = chooseOption(s, 1);
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Charron : +1 Carte +1 Action, défausse une carte pour une Action coûtant autant ou moins', () => {
        let s = makeGame(['wheelwright', 'smithy', 'market', 'village']);
        player(s).hand = cards('wheelwright', 'silver');
        player(s).deck = cards(...filler());
        s = play(s, 'wheelwright');
        s = chooseCards(s, ['silver']);
        expect(() => chooseSupply(s, 'market')).toThrow();
        expect(() => chooseSupply(s, 'silver')).toThrow();
        s = chooseSupply(s, 'village');
        expect(ids(player(s).discardPile)).toContain('silver');
    });

    it('Hutte de la sorcière : +4 Cartes, défausse 2 ; deux Actions → Malédiction aux autres', () => {
        let s = makeGame(['witchs_hut', 'smithy']);
        player(s).hand = cards('witchs_hut', 'smithy', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'witchs_hut');
        s = chooseCards(s, ['smithy', 'village']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        s = makeGame(['witchs_hut', 'smithy']);
        player(s).hand = cards('witchs_hut', 'smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'witchs_hut');
        s = chooseCards(s, ['smithy', 'copper']);
        expect(ids(player(s, 'p2').discardPile)).toEqual([]);
    });

    it('Les cartes de 1re édition sont marquées comme anciennes', () => {
        for (const id of ['duchess', 'nomad_camp', 'oracle', 'mandarin', 'embassy', 'cache']) {
            expect(CardRegistry.get(id)?.isLegacy).toBe(true);
        }
    });
});
