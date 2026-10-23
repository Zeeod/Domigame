/**
 * Empires: behaviour tests (cards, Castles, Events, Landmarks, debt).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, untilTurnOf, act } from '../../helpers/play.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';
import { setupEmpires } from '../../../shared/engine/expansions/Empires.js';
import { getMat } from '../../../shared/engine/Mats.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const event = (s: any, id: string, coins = 20) => {
    s.landscapes = [...(s.landscapes || []), id];
    s = toBuy(s);
    player(s).coins = coins; player(s).buys = Math.max(player(s).buys, 2);
    return act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: id });
};
const withLandmarks = (s: any, ...lms: string[]) => { s.landscapes = lms; setupEmpires(s); return s; };
const score = (s: any, id = 'p1') => { const p = player(s, id); return VictoryChecker.scorePlayer(s, p); };

describe('Empires — cartes', () => {
    it('Archives : 3 cartes mises de côté, une prise maintenant et à chacun des 2 tours suivants', () => {
        let s = makeGame(['archive']);
        player(s).hand = cards('archive');
        player(s).deck = cards('gold', 'silver', 'estate', ...filler(30));
        player(s, 'p2').deck = cards(...filler(30));
        s = play(s, 'archive');
        s = chooseOption(s, 0);                 // Gold
        expect(ids(player(s).hand)).toEqual(['gold']);
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 0);
        s = untilTurnOf(s, 'p1');
        expect(getMat(player(s), 'archive').length).toBe(0);
    });

    it('Capitale : 6 💰 +1 Achat ; défaussée du jeu → 6 Dette, remboursée avec ce qui reste', () => {
        let s = toBuy(makeGame(['capital']));
        player(s).hand = cards('capital');
        player(s).deck = cards(...filler());
        s = play(s, 'capital');
        expect(player(s).coins).toBe(6);
        expect(player(s).buys).toBe(2);
        s = endTurn(s);
        expect(player(s).debt).toBe(0);         // the $6 unspent pays it off
    });

    it('Catapulte : +1 💰, écarte ; 3+ → Malédiction, Trésor → défausse jusqu\'à 3', () => {
        let s = makeGame(['catapult']);
        player(s).hand = cards('catapult', 'silver');
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper', 'copper');
        s = play(s, 'catapult');
        s = chooseCards(s, ['silver']);
        expect(ids(player(s, 'p2').discardPile)).toContain('curse');
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s, 'p2').hand.length).toBe(3);
    });

    it('Course de chars : prend la carte du dessus ; si elle coûte plus que celle du voisin, +1 💰 +1 🛡️', () => {
        let s = makeGame(['chariot_race']);
        player(s).hand = cards('chariot_race');
        player(s).deck = cards('gold');
        player(s, 'p2').deck = cards('copper');
        s = play(s, 'chariot_race');
        expect(ids(player(s).hand)).toEqual(['gold']);
        expect(player(s).coins).toBe(1);
        expect(player(s).vpTokens).toBe(1);
    });

    it('Charme : au prochain achat, une autre carte de même coût', () => {
        let s = toBuy(makeGame(['charm', 'smithy', 'remodel']));
        player(s).hand = cards('charm');
        s = play(s, 'charm');
        s = chooseOption(s, 1);
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'smithy');
        expect(() => chooseSupply(s, 'smithy')).toThrow();
        s = chooseSupply(s, 'remodel');
        expect(ids(player(s).discardPile).sort()).toEqual(['remodel', 'smithy']);
    });

    it('Quartier urbain : +2 Actions, +1 Carte par Action en main', () => {
        let s = makeGame(['city_quarter', 'village']);
        player(s).hand = cards('city_quarter', 'village', 'village', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'city_quarter');
        expect(player(s).hand.length).toBe(5);
    });

    it('Couronne : en phase Action, joue une Action deux fois ; en phase Achat, un Trésor', () => {
        let s = makeGame(['crown', 'village']);
        player(s).hand = cards('crown', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'crown');
        s = chooseCards(s, ['village']);
        expect(player(s).actions).toBe(4);
        s = toBuy(makeGame(['crown']));
        player(s).hand = cards('crown', 'gold');
        s = play(s, 'crown');
        s = chooseCards(s, ['gold']);
        expect(player(s).coins).toBe(6);
    });

    it('Emporium : reçu avec 5 Actions en jeu → +2 🛡️', () => {
        let s = toBuy(makeGame(['emporium']));
        player(s).playArea = cards('village', 'village', 'village', 'village', 'village');
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'emporium');
        expect(player(s).vpTokens).toBe(2);
    });

    it('Campement : sans Or ni Butin, retourne dans la réserve au début de l\'Ajustement', () => {
        let s = makeGame(['encampment']);
        player(s).hand = cards('encampment');
        player(s).deck = cards(...filler(20));
        s = play(s, 'encampment');
        expect(player(s).playArea.length).toBe(0);
        s = toBuy(s);
        s = endTurn(s);
        expect(s.supply.encampment.count).toBe(11);
    });

    it('Ingénieur : reçoit une carte jusqu\'à 4, peut s\'écarter pour une autre', () => {
        let s = makeGame(['engineer', 'smithy']);
        player(s).hand = cards('engineer');
        s = play(s, 'engineer');
        s = chooseSupply(s, 'smithy');
        s = chooseOption(s, 0);
        s = chooseSupply(s, 'silver');
        expect(ids(player(s).discardPile).sort()).toEqual(['silver', 'smithy']);
        expect(ids(s.trash)).toEqual(['engineer']);
    });

    it('Marché fermier : +1 💰 par 🛡️ sur la pile, puis à 4 on les prend', () => {
        let s = makeGame(['farmers_market']);
        player(s).hand = cards('farmers_market');
        s = play(s, 'farmers_market');
        expect(player(s).coins).toBe(1);
        s.supply.farmers_market.tokens = { vp: 4 };
        player(s).hand = cards('farmers_market'); player(s).actions = 1;
        s.phase = 'ACTION'; s.phaseIndex = s.phasePipeline!.indexOf('ACTION');
        s = play(s, 'farmers_market');
        expect(player(s).vpTokens).toBe(4);
        expect(ids(s.trash)).toEqual(['farmers_market']);
    });

    it('Fortune : double les 💰 une fois par tour ; reçue → un Or par Gladiateur en jeu', () => {
        let s = toBuy(makeGame(['fortune']));
        player(s).coins = 3;
        player(s).hand = cards('fortune', 'fortune');
        s = play(s, 'fortune');
        expect(player(s).coins).toBe(6);
        s = play(s, 'fortune');
        expect(player(s).coins).toBe(6);
    });

    it('Forum : +3 Cartes +1 Action, défausse 2 ; acheté → +1 Achat', () => {
        let s = toBuy(makeGame(['forum']));
        player(s).coins = 5;
        s = buy(s, 'forum');
        expect(player(s).buys).toBe(1);
    });

    it('Gladiateur : si le voisin ne dévoile pas de copie, +1 💰 et un Gladiateur écarté', () => {
        let s = makeGame(['gladiator']);
        player(s).hand = cards('gladiator', 'gold');
        s = play(s, 'gladiator');
        s = chooseOption(s, 0);                // reveal Gold (p2 has none)
        expect(player(s).coins).toBe(3);
        expect(ids(s.trash)).toEqual(['gladiator']);
    });

    it('Garde-chasse : +1 🛡️ par carte Victoire reçue', () => {
        let s = makeGame(['groundskeeper']);
        player(s).hand = cards('groundskeeper');
        player(s).deck = cards(...filler());
        s = play(s, 'groundskeeper');
        s = toBuy(s);
        player(s).coins = 8; player(s).buys = 2;
        s = buy(s, 'estate');
        expect(player(s).vpTokens).toBe(1);
    });

    it('Légionnaire : +3 💰 ; en dévoilant un Or, les autres défaussent jusqu\'à 2 puis piochent', () => {
        let s = makeGame(['legionary']);
        player(s).hand = cards('legionary', 'gold');
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper');
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'legionary');
        s = chooseOption(s, 0);
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s, 'p2').hand.length).toBe(3);
    });

    it('Suzerain : joue une Action de la réserve jusqu\'à 5', () => {
        let s = makeGame(['overlord', 'smithy']);
        player(s).hand = cards('overlord');
        player(s).deck = cards(...filler());
        s = play(s, 'overlord');
        s = chooseSupply(s, 'smithy');
        expect(player(s).hand.length).toBe(3);
    });

    it('Patricien : prend la carte du dessus si elle coûte 5 ou plus', () => {
        let s = makeGame(['patrician']);
        player(s).hand = cards('patrician');
        player(s).deck = cards('copper', 'gold');
        s = play(s, 'patrician');
        expect(ids(player(s).hand)).toEqual(['copper', 'gold']);
    });

    it('Pierres : reçues en phase Achat → Argent sur la pioche ; écartées hors Achat → Argent en main', () => {
        let s = toBuy(makeGame(['rocks']));
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'rocks');
        expect(player(s).deck[0].id).toBe('silver');
        s = makeGame(['rocks', 'chapel']);
        player(s).hand = cards('chapel', 'rocks');
        s = play(s, 'chapel');
        s = chooseCards(s, ['rocks']);
        expect(ids(player(s).hand)).toEqual(['silver']);
    });

    it('Forgeron royal : +5 Cartes, défausse les Cuivres', () => {
        let s = makeGame(['royal_blacksmith']);
        player(s).hand = cards('royal_blacksmith');
        player(s).deck = cards('copper', 'silver', 'copper', 'gold', 'estate');
        s = play(s, 'royal_blacksmith');
        expect(ids(player(s).hand).sort()).toEqual(['estate', 'gold', 'silver']);
    });

    it('Sacrifice : Action → +2 Cartes +2 Actions ; Victoire → +2 🛡️', () => {
        let s = makeGame(['sacrifice']);
        player(s).hand = cards('sacrifice', 'estate');
        s = play(s, 'sacrifice');
        s = chooseCards(s, ['estate']);
        expect(player(s).vpTokens).toBe(2);
    });

    it('Colons / Village animé : reprennent un Cuivre / des Colons de la défausse', () => {
        let s = makeGame(['settlers']);
        player(s).hand = cards('settlers');
        player(s).deck = cards('estate');
        player(s).discardPile = cards('copper');
        s = play(s, 'settlers');
        s = chooseOption(s, 0);
        expect(ids(player(s).hand).sort()).toEqual(['copper', 'estate']);
    });

    it('Temple : +1 🛡️, écarte 1 à 3 cartes différentes, +1 🛡️ sur la pile ; reçu → on prend la pile', () => {
        let s = makeGame(['temple']);
        player(s).hand = cards('temple', 'estate', 'copper', 'copper');
        s = play(s, 'temple');
        s = chooseCards(s, ['estate', 'copper']);
        expect(ids(s.trash).sort()).toEqual(['copper', 'estate']);
        expect(player(s).vpTokens).toBe(1);
        s = toBuy(s);
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'temple');
        expect(player(s).vpTokens).toBe(2);
    });

    it('Villa : reçue → en main, +1 Action, retour en phase Action', () => {
        let s = toBuy(makeGame(['villa']));
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'villa');
        expect(ids(player(s).hand)).toEqual(['villa']);
        expect(s.phase).toBe('ACTION');
    });

    it('Chasse sauvage : +3 Cartes et 1 🛡️ sur la pile, ou un Domaine et les 🛡️', () => {
        let s = makeGame(['wild_hunt']);
        player(s).hand = cards('wild_hunt', 'wild_hunt');
        player(s).deck = cards(...filler());
        s = play(s, 'wild_hunt');
        s = chooseOption(s, 0);
        expect(s.supply.wild_hunt.tokens?.vp).toBe(1);
        player(s).actions = 1;
        s = play(s, 'wild_hunt');
        s = chooseOption(s, 1);
        expect(player(s).vpTokens).toBe(1);
    });

    it('Châteaux : Humble château et Château du roi comptent les Châteaux', () => {
        const s = makeGame([]);
        const p = player(s);
        p.hand = cards('humble_castle', 'kings_castle', 'small_castle'); p.deck = []; p.discardPile = []; p.vpTokens = 0;
        expect(score(s)).toBe(3 + 6 + 2);
    });
});

describe('Empires — Événements et Monuments', () => {
    it('Fouille : +1 Achat, un Argent', () => {
        let s = makeGame([]);
        s = event(s, 'delve', 2);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
    });

    it('Mariage : coûte 4 💰 et 3 Dette, +1 🛡️ et un Or', () => {
        let s = makeGame([]);
        s = event(s, 'wedding', 4);
        expect(player(s).debt).toBe(3);
        expect(player(s).vpTokens).toBe(1);
        expect(ids(player(s).discardPile)).toEqual(['gold']);
    });

    it('Domination : une Province et +9 🛡️', () => {
        let s = makeGame([]);
        s = event(s, 'dominate', 14);
        expect(player(s).vpTokens).toBe(9);
    });

    it('Triomphe : un Domaine, +1 🛡️ par carte reçue ce tour', () => {
        let s = makeGame([]);
        s = event(s, 'delve', 2);
        s = event(s, 'triumph', 0);
        expect(player(s).debt).toBe(5);
        expect(player(s).vpTokens).toBe(2);    // Silver (Delve) + Estate
    });

    it('Conquête : 2 Argents, +1 🛡️ par Argent reçu ce tour', () => {
        let s = makeGame([]);
        s = event(s, 'conquest', 6);
        expect(player(s).vpTokens).toBe(2);
    });

    it('Taxe : 1 Dette sur chaque pile ; acheter une carte prend sa Dette', () => {
        let s = makeGame(['smithy']);
        s.landscapes = ['tax'];
        setupEmpires(s);
        expect(s.supply.smithy.tokens?.debt).toBe(1);
        s = toBuy(s);
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'smithy');
        expect(player(s).debt).toBe(1);
    });

    it('Rituel : une Malédiction, écarte une carte, +1 🛡️ par 💰 de son coût', () => {
        let s = makeGame([]);
        player(s).hand = cards('gold');
        s = event(s, 'ritual', 4);
        s = chooseCards(s, ['gold']);
        expect(player(s).vpTokens).toBe(6);
    });

    it('Champ de bataille : 2 🛡️ quand on reçoit une carte Victoire', () => {
        let s = withLandmarks(toBuy(makeGame([])), 'battlefield');
        player(s).coins = 2; player(s).buys = 2;
        s = buy(s, 'estate');
        expect(player(s).vpTokens).toBe(2);
    });

    it('Basilique : 2 🛡️ en achetant avec 2 💰 restants', () => {
        let s = withLandmarks(toBuy(makeGame([])), 'basilica');
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'silver');
        expect(player(s).vpTokens).toBe(2);
    });

    it('Tombeau : +1 🛡️ par carte écartée', () => {
        let s = withLandmarks(makeGame(['chapel']), 'tomb');
        player(s).hand = cards('chapel', 'estate', 'copper');
        s = play(s, 'chapel');
        s = chooseCards(s, ['estate', 'copper']);
        expect(player(s).vpTokens).toBe(2);
    });

    it('Aqueduc : les 🛡️ passent des piles de Trésors à l\'Aqueduc, puis au joueur qui reçoit une Victoire', () => {
        let s = withLandmarks(toBuy(makeGame([])), 'aqueduct');
        player(s).coins = 20; player(s).buys = 3;
        s = buy(s, 'silver');
        expect(s.supply.silver.tokens?.vp).toBe(7);
        s = buy(s, 'estate');
        expect(player(s).vpTokens).toBe(1);
    });

    it('Thermes : 2 🛡️ en finissant son tour sans avoir reçu de carte', () => {
        let s = withLandmarks(makeGame([]), 'baths');
        player(s).deck = cards(...filler());
        s = endTurn(s);
        expect(player(s).vpTokens).toBe(2);
    });

    it('Monuments de décompte : Fontaine, Musée, Palais, Mur, Tanière du loup, Fort des bandits', () => {
        const s = makeGame([]);
        const p = player(s);
        p.deck = []; p.discardPile = []; p.vpTokens = 0;
        p.hand = cards(...Array(10).fill('copper'), 'silver', 'gold');
        s.landscapes = ['fountain']; expect(score(s)).toBe(15);
        s.landscapes = ['museum']; expect(score(s)).toBe(6);
        s.landscapes = ['palace']; expect(score(s)).toBe(3);
        s.landscapes = ['bandit_fort']; expect(score(s)).toBe(-4);
        s.landscapes = ['wolf_den']; expect(score(s)).toBe(-6);
        p.hand = cards(...Array(17).fill('copper'));
        s.landscapes = ['wall']; expect(score(s)).toBe(-2);
    });
});
