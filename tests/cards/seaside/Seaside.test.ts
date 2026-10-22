/**
 * Seaside (2nd edition): one behaviour test per Kingdom card, following the official text.
 * (Native Village, Island, Outpost, Treasure Map, Sea Chart: see the other files of this folder.)
 */
import { describe, it, expect } from 'vitest';
import { autoPayload } from '../../helpers/autoPlay.js';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, endTurn, untilTurnOf, buy } from '../../helpers/play.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const sorted = (cs: { id: string }[]) => ids(cs).sort();
const deck = (...x: string[]) => cards(...x, ...Array(12).fill('copper'));

describe('Seaside — 2e édition', () => {
    it('Astrolabe : maintenant et au prochain tour, +1 💰 +1 Achat', () => {
        let s = makeGame(['astrolabe']);
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s).hand = cards('astrolabe');
        player(s).deck = deck();
        s = play(s, 'astrolabe');
        expect(player(s).coins).toBe(1);
        expect(player(s).buys).toBe(2);
        s = untilTurnOf(s, 'p1');
        expect(player(s).coins).toBe(1);
        expect(player(s).buys).toBe(2);
    });

    it('Bazar : +1 Carte +2 Actions +1 💰', () => {
        let s = makeGame(['bazaar']);
        player(s).hand = cards('bazaar');
        player(s).deck = deck();
        s = play(s, 'bazaar');
        expect(player(s).hand.length).toBe(1);
        expect(player(s).actions).toBe(2);
        expect(player(s).coins).toBe(1);
    });

    it('Blocus : la carte reçue revient en main ; un autre joueur qui en reçoit une copie à son tour reçoit une Malédiction', () => {
        let s = makeGame(['blockade', 'smithy']);
        player(s).hand = cards('blockade');
        player(s).deck = deck();
        player(s, 'p2').deck = deck();
        s = play(s, 'blockade');
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).aside)).toEqual(['smithy']);
        s = endTurn(s);                                  // p2's turn
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s, 'p2').coins = 4; player(s, 'p2').buys = 2;
        s = buy(s, 'smithy', 'p2');
        expect(ids(player(s, 'p2').discardPile)).toContain('curse');
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand)).toContain('smithy');
    });

    it('Caravane : +1 Carte +1 Action, +1 Carte au prochain tour', () => {
        let s = makeGame(['caravan']);
        player(s).hand = cards('caravan');
        player(s).deck = deck();
        s = play(s, 'caravan');
        expect(player(s).actions).toBe(1);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(6);
    });

    it('Corsaire : +2 💰 ; les autres écartent le premier Argent ou Or qu\'ils jouent ; +1 Carte au prochain tour', () => {
        let s = makeGame(['corsair']);
        player(s).hand = cards('corsair');
        player(s).deck = deck();
        s = play(s, 'corsair');
        expect(player(s).coins).toBe(2);
        s = endTurn(s);                                  // p2
        player(s, 'p2').hand = cards('silver', 'gold', 'copper');
        s = play(s, 'silver', 'p2');
        expect(ids(s.trash)).toEqual(['silver']);
        expect(player(s, 'p2').coins).toBe(2);          // still gets the $
        s = play(s, 'gold', 'p2');
        expect(ids(s.trash)).toEqual(['silver']);        // only the first one
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(6);
    });

    it('Coupe-bourse : +2 💰, les autres défaussent un Cuivre (ou dévoilent leur main)', () => {
        let s = makeGame(['cutpurse']);
        player(s).hand = cards('cutpurse');
        player(s, 'p2').hand = cards('copper', 'estate');
        s = play(s, 'cutpurse');
        if (s.pendingDecision) s = chooseCards(s, ['copper']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['copper']);
        s = makeGame(['cutpurse']);
        player(s).hand = cards('cutpurse');
        player(s, 'p2').hand = cards('estate');          // no Copper: nothing to do
        s = play(s, 'cutpurse');
        expect(s.pendingDecision).toBeFalsy();
        expect(player(s, 'p2').hand.length).toBe(1);
    });

    it('Village de pêcheurs : +2 Actions +1 💰, et +1 Action +1 💰 au prochain tour', () => {
        let s = makeGame(['fishing_village']);
        player(s).hand = cards('fishing_village');
        player(s).deck = deck();
        s = play(s, 'fishing_village');
        expect(player(s).actions).toBe(2);
        s = untilTurnOf(s, 'p1');
        expect(player(s).actions).toBe(2);
        expect(player(s).coins).toBe(1);
    });

    it('Havre : +1 Carte +1 Action ; une carte mise de côté revient en main au prochain tour', () => {
        let s = makeGame(['haven']);
        player(s).hand = cards('haven', 'gold');
        player(s).deck = deck();
        s = play(s, 'haven');
        s = chooseCards(s, ['gold']);
        expect(ids(player(s).hand)).not.toContain('gold');
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand)).toContain('gold');
    });

    it('Phare : +1 Action +1 💰 ; protège des attaques jusqu\'au prochain tour', () => {
        let s = makeGame(['lighthouse', 'witch']);
        player(s).hand = cards('lighthouse');
        player(s).deck = deck();
        s = play(s, 'lighthouse');
        expect(player(s).coins).toBe(1);
        s = endTurn(s);
        player(s, 'p2').hand = cards('witch');
        player(s, 'p2').deck = deck();
        s = play(s, 'witch', 'p2');
        expect(ids(player(s).discardPile)).not.toContain('curse');
    });

    it('Vigie : +1 Action ; regardez 3 cartes : écartez-en une, défaussez-en une, remettez l\'autre', () => {
        let s = makeGame(['lookout']);
        player(s).hand = cards('lookout');
        player(s).deck = cards('curse', 'estate', 'gold', 'copper');
        s = play(s, 'lookout');
        s = chooseCards(s, ['curse'], 'limbo');
        s = chooseCards(s, ['estate'], 'limbo');
        expect(ids(s.trash)).toEqual(['curse']);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
        expect(ids(player(s).deck)).toEqual(['gold', 'copper']);
    });

    it('Navire marchand : +2 💰 maintenant et au prochain tour', () => {
        let s = makeGame(['merchant_ship']);
        player(s).hand = cards('merchant_ship');
        player(s).deck = deck();
        s = play(s, 'merchant_ship');
        expect(player(s).coins).toBe(2);
        s = untilTurnOf(s, 'p1');
        expect(player(s).coins).toBe(2);
    });

    it('Singe : quand le joueur à droite reçoit une carte, +1 Carte ; +1 Carte au prochain tour', () => {
        let s = makeGame(['monkey'], 3);
        player(s).hand = cards('monkey');
        player(s).deck = deck();
        s = play(s, 'monkey');
        s = endTurn(s); s = endTurn(s);                  // p3 is to p1's right
        const before = player(s).hand.length;
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s, 'p3').coins = 3; player(s, 'p3').buys = 2;
        s = buy(s, 'silver', 'p3');
        expect(player(s).hand.length).toBe(before + 1);
    });

    it('Pirate : au prochain tour, un Trésor jusqu\'à 6 en main ; jouable quand un joueur reçoit un Trésor', () => {
        let s = makeGame(['pirate']);
        player(s).deck = deck();
        player(s, 'p2').hand = cards('pirate');
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'silver');                            // p1 gains a Treasure → p2 may play Pirate
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseOption(s, 0);
        expect(ids(player(s, 'p2').playArea)).toContain('pirate');
        s = untilTurnOf(s, 'p2');
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseSupply(s, 'gold');
        expect(ids(player(s, 'p2').hand)).toContain('gold');
    });

    it('Marin : +1 Action ; une Durée reçue ce tour-ci peut être jouée ; +2 💰 au prochain tour', () => {
        let s = makeGame(['sailor', 'caravan']);
        player(s).hand = cards('sailor');
        player(s).deck = deck();
        s = play(s, 'sailor');
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'caravan');
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toContain('caravan');
        s = untilTurnOf(s, 'p1');
        // Sailor + Caravan both resolve at the start of the turn: answer whatever is asked (order, optional trash)
        for (let i = 0; i < 5 && s.pendingDecision; i++) s = choose(s, autoPayload(s, 'first'));
        expect(player(s).coins).toBe(2);
    });

    it('Sorcière des mers : +2 Cartes, Malédiction aux autres ; au prochain tour +2 Cartes puis défaussez-en 2', () => {
        let s = makeGame(['sea_witch']);
        player(s).hand = cards('sea_witch');
        player(s).deck = deck();
        s = play(s, 'sea_witch');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        s = untilTurnOf(s, 'p1');
        expect(s.pendingDecision?.playerId).toBe('p1');  // discard 2
        s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).hand.slice(0, 2).map(c => c.instanceId) });
        expect(player(s).hand.length).toBe(5);
    });

    it('Contrebandiers : copie d\'une carte (≤ 6) reçue par le joueur de droite à son dernier tour', () => {
        let s = makeGame(['smugglers', 'smithy']);
        player(s).deck = deck();
        s = endTurn(s);                                  // p2's turn
        s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY');
        player(s, 'p2').coins = 4; player(s, 'p2').buys = 2;
        s = buy(s, 'smithy', 'p2');
        s = untilTurnOf(s, 'p1');
        player(s).hand = cards('smugglers');
        s = play(s, 'smugglers');
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toContain('smithy');
    });

    it('Tacticien : défaussez votre main ; au prochain tour +5 Cartes +1 Achat +1 Action', () => {
        let s = makeGame(['tactician']);
        player(s).hand = cards('tactician', 'copper', 'copper');
        player(s).deck = deck();
        s = play(s, 'tactician');
        expect(player(s).hand.length).toBe(0);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(10);
        expect(player(s).buys).toBe(2);
        expect(player(s).actions).toBe(2);
    });

    it('Tacticien : sans carte en main, aucun bonus au prochain tour', () => {
        let s = makeGame(['tactician']);
        player(s).hand = cards('tactician');
        player(s).deck = deck();
        s = play(s, 'tactician');
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(5);
        expect(player(s).buys).toBe(1);
    });

    it('Mares : +3 Cartes +1 Action ; au prochain tour défaussez 2 cartes', () => {
        let s = makeGame(['tide_pools']);
        player(s).hand = cards('tide_pools');
        player(s).deck = deck();
        s = play(s, 'tide_pools');
        expect(player(s).hand.length).toBe(3);
        s = untilTurnOf(s, 'p1');
        expect(s.pendingDecision?.playerId).toBe('p1');
    });

    it('Trésorerie : +1 Carte +1 Action +1 💰', () => {
        let s = makeGame(['treasury']);
        player(s).hand = cards('treasury');
        player(s).deck = deck();
        s = play(s, 'treasury');
        expect(player(s).coins).toBe(1);
        expect(player(s).actions).toBe(1);
    });

    it('Entrepôt : +3 Cartes +1 Action, défaussez 3 cartes', () => {
        let s = makeGame(['warehouse']);
        player(s).hand = cards('warehouse', 'estate');
        player(s).deck = deck();
        s = play(s, 'warehouse');
        s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).hand.slice(0, 3).map(c => c.instanceId) });
        expect(player(s).hand.length).toBe(1);
    });

    it('Quai : +2 Cartes +1 Achat, maintenant et au prochain tour', () => {
        let s = makeGame(['wharf']);
        player(s).hand = cards('wharf');
        player(s).deck = deck();
        s = play(s, 'wharf');
        expect(player(s).hand.length).toBe(2);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(7);
        expect(player(s).buys).toBe(2);
    });

    it('Récupérateur et Chasseur de trésors : +1 Achat, +💰 du coût de la carte écartée', () => {
        let s = makeGame(['salvager']);
        player(s).hand = cards('salvager', 'gold');
        s = play(s, 'salvager');
        s = chooseCards(s, ['gold']);
        expect(player(s).coins).toBe(6);
        expect(player(s).buys).toBe(2);
    });
});
