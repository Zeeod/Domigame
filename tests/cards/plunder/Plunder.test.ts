/**
 * Plunder: behaviour tests (Kingdom cards, Loot, Events, Traits) and the "when you shuffle" choices.
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, endPhase, untilTurnOf, act } from '../../helpers/play.js';
import { createCardInstance } from '../../../shared/engine/CardInstance.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { getMat, peekMat } from '../../../shared/engine/Mats.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const options = (s: any, ...idx: number[]) => choose(s, { type: 'OPTIONS', optionIndices: idx });
/** A Loot pile with these Loots on top (last = top). */
const lootPile = (s: any, ...top: string[]) => {
    const rest = ['sword', 'staff', 'jewels', 'hammer'];
    s.nonSupply.loot_pile = { cardId: 'loot_pile', count: rest.length + top.length, cards: [...rest, ...top].map(c => createCardInstance(c)) };
};
const event = (s: any, id: string, coins = 20) => {
    s.landscapes = [...(s.landscapes || []), id];
    s = toBuy(s);
    player(s).coins = coins; player(s).buys = Math.max(player(s).buys, 2);
    return act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: id });
};
const withTrait = (kingdom: string[], pile: string, trait: string) => {
    const s = makeGame(kingdom);
    s.landscapes = [trait];
    s.supply[pile].traits = [trait];
    return s;
};

describe('Pillage — cartes Royaume', () => {
    it('Mise en place : la pile de 30 Butins', () => {
        const s = makeGame(['sack_of_loot']);
        expect(s.nonSupply.loot_pile.count).toBe(30);
        expect(new Set(ids(s.nonSupply.loot_pile.cards!)).size).toBe(15);
    });

    it('Cage : jusqu\'à 4 cartes de côté ; à la prochaine Victoire reçue, elle s\'écarte et les cartes reviennent', () => {
        let s = toBuy(makeGame([]));
        player(s).hand = cards('cage', 'gold', 'estate');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'cage');
        s = chooseCards(s, ['gold', 'estate']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toEqual(['cage']);
        s = toBuy(s);
        player(s).coins = 2; player(s).buys = 2;
        s = buy(s, 'estate');
        expect(ids(s.trash)).toEqual(['cage']);
        s = endTurn(s);
        expect(ids(player(s).hand)).toEqual(expect.arrayContaining(['gold', 'estate']));
    });

    it('Grotte : de côté, défaussées au prochain tour puis autant de cartes piochées', () => {
        let s = makeGame([]);
        player(s).hand = cards('grotto', 'estate', 'estate');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'grotto');
        s = chooseCards(s, ['estate', 'estate']);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(7);
        expect(ids(player(s).discardPile)).toEqual(['estate', 'estate']);
    });

    it('Œuf orné de joyaux : 1 💰 +1 Achat ; écarté → un Butin', () => {
        let s = toBuy(makeGame(['jewelled_egg']));
        lootPile(s, 'doubloons');
        player(s).hand = cards('jewelled_egg', 'chapel');
        s = play(s, 'jewelled_egg');
        expect([player(s).coins, player(s).buys]).toEqual([1, 2]);
        s = makeGame(['jewelled_egg', 'chapel']);
        lootPile(s, 'amphora');
        player(s).hand = cards('chapel', 'jewelled_egg');
        s = play(s, 'chapel');
        s = chooseCards(s, ['jewelled_egg']);
        expect(ids(player(s).discardPile)).toEqual(['amphora']);
    });

    it('Fouille : quand une pile se vide, elle s\'écarte et donne un Butin', () => {
        let s = makeGame(['search']);
        lootPile(s, 'hammer');
        player(s).hand = cards('search');
        s = play(s, 'search');
        expect(player(s).coins).toBe(2);
        s = toBuy(s);
        s.supply.estate.count = 1;
        player(s).coins = 2; player(s).buys = 2;
        s = buy(s, 'estate');
        expect(ids(s.trash)).toEqual(['search']);
        expect(ids(player(s).discardPile)).toContain('hammer');
    });

    it('Chamane : peut écarter ; au début du tour, une carte du rebut jusqu\'à 6', () => {
        let s = makeGame(['shaman']);
        player(s).hand = cards('shaman', 'estate');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'shaman');
        s = chooseCards(s, ['estate']);
        expect([player(s).actions, player(s).coins]).toEqual([1, 1]);
        s.trash.push(createCardInstance('gold'));
        s = endTurn(s);
        s = chooseOption(s, 1); // p2 : l'Or
        expect(ids(player(s, 'p2').discardPile)).toContain('gold');
    });

    it('Sanctuaire isolé : au prochain Trésor reçu, écarte jusqu\'à 2 cartes', () => {
        let s = makeGame([]);
        player(s).hand = cards('secluded_shrine', 'estate', 'curse', 'copper');
        s = play(s, 'secluded_shrine');
        s = toBuy(s);
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'silver');
        s = chooseCards(s, ['estate', 'curse']);
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
    });

    it('Sirène : Malédictions ; reçue sans écarter d\'Action → écartée ; pioche jusqu\'à 8', () => {
        let s = makeGame(['siren']);
        player(s).hand = cards('siren');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'siren');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(8);
        s = toBuy(s);
        player(s).hand = cards('estate');
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'siren');
        expect(ids(s.trash)).toEqual(['siren']);
    });

    it('Passager clandestin : jouable quand un joueur reçoit une Durée ; +2 Cartes au tour suivant', () => {
        let s = toBuy(makeGame(['stowaway', 'longship']));
        player(s, 'p2').hand = cards('stowaway');
        player(s, 'p2').deck = cards(...filler());
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'longship');
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = choose(s, { type: 'OPTION', optionIndex: 0 }, 'p2');
        expect(ids(player(s, 'p2').playArea)).toEqual(['stowaway']);
    });

    it('Contremaître : répété au prochain tour s\'il a reçu une carte à exactement 5', () => {
        let s = makeGame(['taskmaster', 'market']);
        player(s).hand = cards('taskmaster');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'taskmaster');
        s = toBuy(s);
        player(s).coins = 5;
        s = buy(s, 'market');
        s = untilTurnOf(s, 'p1');
        expect([player(s).actions, player(s).coins]).toEqual([2, 1]);
        expect(ids(player(s).playArea)).toEqual(['taskmaster']);
        s = endTurn(s);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toEqual([]);
    });

    it('Abondance : à la prochaine Action reçue, +1 Achat +3 💰', () => {
        let s = toBuy(makeGame(['village']));
        player(s).hand = cards('abundance');
        s = play(s, 'abundance');
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'village');
        expect([player(s).coins, player(s).buys]).toEqual([3, 2]);
    });

    it('Mousse : au prochain tour, +2 💰 ou écarter pour une Durée', () => {
        let s = makeGame(['cabin_boy', 'longship']);
        player(s).hand = cards('cabin_boy');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'cabin_boy');
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 1);
        s = chooseSupply(s, 'longship');
        expect(ids(s.trash)).toEqual(['cabin_boy']);
        expect(ids(player(s).discardPile)).toContain('longship');
    });

    it('Creuset, Pendentif, Outils, Mine d\'argent', () => {
        let s = toBuy(makeGame(['crucible']));
        player(s).hand = cards('crucible', 'gold', 'pendant', 'silver', 'tools', 'silver_mine');
        s = play(s, 'crucible');
        s = chooseCards(s, ['gold']);
        expect(player(s).coins).toBe(6);
        s = play(s, 'silver');
        s = play(s, 'pendant');
        expect(player(s).coins).toBe(6 + 2 + 3); // Creuset, Argent, Pendentif
        s = play(s, 'tools');
        expect(() => chooseSupply(s, 'gold')).toThrow();
        s = chooseSupply(s, 'silver');
        s = play(s, 'silver_mine');
        s = chooseSupply(s, 'silver');
        expect(ids(player(s).hand)).toContain('silver');
    });

    it('Vaisseau amiral : la prochaine Action non-Ordre est rejouée', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('flagship', 'village');
        player(s).actions = 2;
        player(s).deck = cards(...filler());
        s = play(s, 'flagship');
        s = play(s, 'village');
        expect(player(s).actions).toBe(4);
    });

    it('Chasseur de fortune : peut jouer un Trésor parmi les 3 cartes du dessus', () => {
        let s = makeGame([]);
        player(s).hand = cards('fortune_hunter');
        player(s).deck = cards('estate', 'gold', 'copper');
        s = play(s, 'fortune_hunter');
        s = chooseOption(s, 0); // Or
        expect(player(s).coins).toBe(5);
        if (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(ids(player(s).deck).sort()).toEqual(['copper', 'estate']);
    });

    it('Gondole : maintenant ou plus tard +2 💰 ; reçue → peut jouer une Action', () => {
        let s = toBuy(makeGame(['gondola', 'village']));
        player(s).hand = cards('village');
        player(s).deck = cards(...filler());
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'gondola');
        s = chooseCards(s, ['village']);
        expect(ids(player(s).playArea)).toEqual(['village']);
    });

    it('Village portuaire : +1 💰 après la prochaine Action qui donne des 💰', () => {
        let s = makeGame(['harbor_village', 'market']);
        player(s).hand = cards('harbor_village', 'market');
        player(s).deck = cards(...filler());
        s = play(s, 'harbor_village');
        s = play(s, 'market');
        expect(player(s).coins).toBe(2);
    });

    it('Débarquement : revient sur la pioche si un tour commence par un Trésor', () => {
        let s = makeGame([]);
        player(s).hand = cards('landing_party');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'landing_party');
        s = untilTurnOf(s, 'p1');
        s = toBuy(s);
        s = play(s, 'copper');
        expect(player(s).deck[0].id).toBe('landing_party');
    });

    it('Cartographe : 2 cartes en main sur 4 ; jouable quand un joueur reçoit une Victoire', () => {
        let s = makeGame([]);
        player(s).hand = cards('mapmaker');
        player(s).deck = cards('gold', 'estate', 'silver', 'curse');
        s = play(s, 'mapmaker');
        s = chooseCards(s, ['gold', 'silver'], 'limbo');
        expect(ids(player(s).hand).sort()).toEqual(['gold', 'silver']);
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate']);
    });

    it('Marron, Cabanes du marais, Corde', () => {
        let s = makeGame([]);
        player(s).hand = cards('maroon', 'mill', 'swamp_shacks');
        player(s).deck = cards(...filler(20));
        s = play(s, 'maroon');
        s = chooseCards(s, ['mill']); // Action – Victoire
        expect(player(s).hand.length).toBe(5);
        player(s).actions = 1;
        player(s).playArea.push(...cards('copper', 'copper', 'copper', 'copper', 'copper'));
        s = play(s, 'swamp_shacks');
        expect([player(s).actions, player(s).hand.length]).toEqual([2, 6]);
    });

    it('Trésor enfoui : joué quand on le reçoit ; +1 Achat +3 💰 au prochain tour', () => {
        let s = toBuy(makeGame(['buried_treasure']));
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'buried_treasure');
        expect(ids(player(s).playArea)).toEqual(['buried_treasure']);
        s = untilTurnOf(s, 'p1');
        expect([player(s).buys, player(s).coins]).toEqual([2, 3]);
    });

    it('Équipage : +3 Cartes, revient sur la pioche au prochain tour', () => {
        let s = makeGame([]);
        player(s).hand = cards('crew');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'crew');
        expect(player(s).hand.length).toBe(3);
        s = untilTurnOf(s, 'p1');
        expect(player(s).deck[0].id).toBe('crew');
    });

    it('Coupe-jarret : défausse jusqu\'à 3 ; un Butin au prochain Trésor à 5+ reçu', () => {
        let s = makeGame([]);
        lootPile(s, 'jewels');
        player(s).hand = cards('cutthroat');
        player(s, 'p2').hand = cards(...filler(5));
        s = play(s, 'cutthroat');
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s, 'p2').hand.length).toBe(3);
        s = toBuy(s);
        player(s).coins = 6; player(s).buys = 2;
        s = buy(s, 'gold');
        expect(ids(player(s).discardPile)).toContain('jewels');
    });

    it('Agrandir : maintenant et au prochain tour', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('enlarge', 'copper');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'enlarge');
        s = chooseCards(s, ['copper']);
        s = chooseSupply(s, 'estate');
        s = untilTurnOf(s, 'p1');
        s = chooseCards(s, ['copper']);
        s = chooseSupply(s, 'curse');
        expect(ids(s.trash)).toEqual(['copper', 'copper']);
    });

    it('Figurine : +2 Cartes, défausse une Action pour +1 Achat +1 💰', () => {
        let s = toBuy(makeGame([]));
        player(s).hand = cards('figurine', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'figurine');
        s = chooseCards(s, ['village']);
        expect([player(s).coins, player(s).buys, player(s).hand.length]).toEqual([1, 2, 2]);
    });

    it('Second : joue des Actions de même nom, puis pioche jusqu\'à 6', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('first_mate', 'village', 'village');
        player(s).deck = cards(...filler(20));
        s = play(s, 'first_mate');
        s = chooseOption(s, 0);
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toEqual(['first_mate', 'village', 'village']);
        expect(player(s).hand.length).toBe(6);
    });

    it('Frégate : chaque Action jouée par un autre le fait défausser jusqu\'à 4', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('frigate');
        player(s).deck = cards(...filler(20));
        s = play(s, 'frigate');
        expect(player(s).coins).toBe(3);
        s = endTurn(s);
        player(s, 'p2').hand = cards('village', ...filler(5));
        player(s, 'p2').deck = cards(...filler());
        s = act(s, 'p2', { type: 'PLAY_CARD', cardInstanceId: player(s, 'p2').hand[0].instanceId });
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s, 'p2').hand.length).toBe(4);
    });

    it('Drakkar et Route minière', () => {
        let s = makeGame([]);
        player(s).hand = cards('mining_road');
        s = play(s, 'mining_road');
        expect([player(s).actions, player(s).buys, player(s).coins]).toEqual([1, 2, 2]);
        s = toBuy(s);
        player(s).coins = 6;
        s = buy(s, 'gold');
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toContain('gold');
        expect(player(s).coins).toBe(3);
    });

    it('Pioche : écarte une carte à 3+ → un Butin en main', () => {
        let s = toBuy(makeGame(['pickaxe']));
        lootPile(s, 'orb');
        player(s).hand = cards('pickaxe', 'silver');
        s = play(s, 'pickaxe');
        s = chooseCards(s, ['silver']);
        expect(ids(player(s).hand)).toEqual(['orb']);
    });

    it('Pèlerin : +4 Cartes, une sur la pioche', () => {
        let s = makeGame([]);
        player(s).hand = cards('pilgrim');
        player(s).deck = cards('gold', ...filler(5));
        s = play(s, 'pilgrim');
        s = chooseCards(s, ['gold']);
        expect(player(s).deck[0].id).toBe('gold');
    });

    it('Intendant : chaque tour, une carte de côté ou une carte en main', () => {
        let s = makeGame([]);
        player(s).hand = cards('quartermaster');
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler(30));
        s = play(s, 'quartermaster');
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 0);
        s = chooseSupply(s, 'silver');
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 1);
        expect(ids(player(s).hand)).toContain('silver');
        expect(ids(player(s).playArea)).toEqual(['quartermaster']);
    });

    it('Filou : Malédictions ; un Trésor défaussé du jeu revient en main à la fin du tour', () => {
        let s = makeGame([]);
        player(s).hand = cards('trickster');
        player(s).deck = cards(...filler(20));
        s = play(s, 'trickster');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        s = toBuy(s);
        player(s).hand = cards('gold');
        s = play(s, 'gold');
        s = endPhase(s);
        s = chooseOption(s, 0);
        expect(ids(player(s).hand)).toContain('gold');
    });

    it('Village prospère : un Butin si 3 Trésors différents en jeu', () => {
        let s = toBuy(makeGame(['wealthy_village']));
        lootPile(s, 'staff');
        player(s).playArea = cards('copper', 'silver', 'gold');
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'wealthy_village');
        expect(ids(player(s).discardPile).sort()).toEqual(['staff', 'wealthy_village']);
    });

    it('Sac de butin et Trésor du roi', () => {
        let s = toBuy(makeGame(['sack_of_loot']));
        lootPile(s, 'sword');
        player(s).hand = cards('sack_of_loot', 'kings_cache', 'silver');
        s = play(s, 'sack_of_loot');
        expect(ids(player(s).discardPile)).toEqual(['sword']);
        s = play(s, 'kings_cache');
        s = chooseCards(s, ['silver']);
        expect(player(s).coins).toBe(1 + 6);
    });
});

describe('Pillage — Butins', () => {
    const loot = (id: string, extra: string[] = []) => {
        const s = toBuy(makeGame(['village']));
        player(s).hand = cards(id, ...extra);
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        return s;
    };

    it('Amphore, Doublons, Calice sans fin, Figure de proue, Joyaux', () => {
        let s = loot('amphora');
        s = play(s, 'amphora');
        s = chooseOption(s, 0);
        expect([player(s).coins, player(s).buys]).toEqual([3, 2]);
        s = toBuy(makeGame([]));
        s.nonSupply.loot_pile = { cardId: 'loot_pile', count: 1, cards: [createCardInstance('doubloons')] } as any;
        s = event(s, 'looting', 6);
        expect(ids(player(s).discardPile).sort()).toEqual(['doubloons', 'gold']);
        s = loot('endless_chalice');
        s = play(s, 'endless_chalice');
        expect([player(s).coins, player(s).buys]).toEqual([1, 2]);
        s = untilTurnOf(s, 'p1');
        expect([player(s).coins, player(s).buys]).toEqual([1, 2]);
        expect(ids(player(s).playArea)).toEqual(['endless_chalice']);
        s = loot('figurehead');
        s = play(s, 'figurehead');
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(7);
        s = loot('jewels');
        s = play(s, 'jewels');
        s = untilTurnOf(s, 'p1');
        expect(player(s).deck[player(s).deck.length - 1].id).toBe('jewels');
    });

    it('Marteau, Insigne, Orbe, Chèvre de concours', () => {
        let s = loot('hammer');
        s = play(s, 'hammer');
        s = chooseSupply(s, 'village');
        expect(player(s).coins).toBe(3);
        s = loot('insignia');
        s = play(s, 'insignia');
        player(s).buys = 2;
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        expect(player(s).deck[0].id).toBe('silver');
        s = loot('orb');
        player(s).discardPile = cards('gold');
        s = play(s, 'orb');
        s = chooseOption(s, 0);
        expect(player(s).coins).toBe(3);
        s = loot('prize_goat', ['estate']);
        s = play(s, 'prize_goat');
        s = chooseCards(s, ['estate']);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Boîte à énigme, Sextant, Bouclier, Parchemin de sort, Bâton, Épée', () => {
        let s = loot('puzzle_box', ['gold']);
        s = play(s, 'puzzle_box');
        s = chooseCards(s, ['gold']);
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('gold');
        s = loot('sextant');
        player(s).deck = cards('estate', 'gold', 'copper', 'copper', 'copper');
        s = play(s, 'sextant');
        s = chooseCards(s, ['estate'], 'limbo');
        if (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(player(s).deck.length).toBe(4);
        s = makeGame(['militia']);
        player(s).hand = cards('militia');
        player(s, 'p2').hand = cards('shield', ...filler(4));
        s = play(s, 'militia');
        if (s.pendingDecision?.playerId === 'p2' && (s.pendingDecision as any).type !== 'CHOOSE_CARDS') s = choose(s, { type: 'OPTION', optionIndex: 0 }, 'p2');
        expect(player(s, 'p2').hand.length).toBe(5);
        s = loot('spell_scroll');
        s = play(s, 'spell_scroll');
        s = chooseSupply(s, 'gold');
        s = chooseOption(s, 0);
        expect(ids(s.trash)).toEqual(['spell_scroll']);
        expect(ids(player(s).playArea)).toEqual(['gold']);
        s = loot('staff', ['village']);
        s = play(s, 'staff');
        s = chooseCards(s, ['village']);
        expect(ids(player(s).playArea)).toEqual(['staff', 'village']);
        s = loot('sword');
        player(s, 'p2').hand = cards(...filler(5));
        s = play(s, 'sword');
        s = chooseCards(s, ['copper']);
        expect(player(s, 'p2').hand.length).toBe(4);
    });
});

describe('Pillage — Événements', () => {
    it('Enterrement : une carte de la défausse sous la pioche', () => {
        let s = makeGame([]);
        player(s).discardPile = cards('gold');
        player(s).deck = cards('copper');
        s = event(s, 'bury', 1);
        s = chooseOption(s, 0);
        expect(ids(player(s).deck)).toEqual(['copper', 'gold']);
    });

    it('Esquive : au prochain mélange, jusqu\'à 3 cartes restent dans la défausse', () => {
        let s = makeGame([]);
        player(s).deck = [];
        player(s).discardPile = cards('curse', 'estate', ...filler(8));
        s = event(s, 'avoid', 2);
        s = endPhase(s);
        s = chooseCards(s, ['curse', 'estate'], 'discardPile');
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate']);
        expect(player(s).hand.length).toBe(5);
    });

    it('Livraison : les cartes reçues reviennent en main à la fin du tour', () => {
        let s = makeGame([]);
        player(s).deck = cards(...filler(20));
        s = event(s, 'deliver', 2);
        player(s).buys = 2; player(s).coins = 6;
        s = buy(s, 'gold');
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('gold');
    });

    it('Péril, Raid, Pillage, Prospérité', () => {
        let s = makeGame([]);
        lootPile(s, 'hammer', 'staff', 'orb', 'sword');
        player(s).hand = cards('village', 'copper', 'silver', 'estate');
        s = event(s, 'peril', 2);
        s = chooseCards(s, ['village']);
        expect(ids(player(s).discardPile)).toEqual(['sword']);
        s = event(s, 'foray', 3);
        s = chooseCards(s, ['copper', 'silver', 'estate']);
        expect(ids(player(s).discardPile)).toContain('orb');
        s = event(s, 'looting', 6);
        expect(ids(player(s).discardPile)).toContain('staff');
        s = event(s, 'prosper', 10);
        s = chooseOption(s, 0);
        s = chooseOption(s, 0);
        s = chooseOption(s, 1); // Terminé
        expect(ids(player(s).discardPile)).toEqual(expect.arrayContaining(['hammer', 'copper', 'silver']));
    });

    it('Ruée et Miroir : la prochaine Action reçue est jouée / copiée', () => {
        let s = makeGame(['village']);
        player(s).deck = cards(...filler());
        s = event(s, 'rush', 2);
        player(s).buys = 3; player(s).coins = 3;
        s = buy(s, 'village');
        expect(ids(player(s).playArea)).toEqual(['village']);
        s = event(s, 'mirror', 3);
        player(s).buys = 3; player(s).coins = 3;
        s = buy(s, 'village');
        expect(ids(player(s).discardPile).filter(id => id === 'village').length).toBe(2);
    });

    it('Lancement : retour en phase Action, +1 Carte +1 Action +1 Achat, une fois par tour', () => {
        let s = makeGame([]);
        player(s).deck = cards(...filler());
        s = event(s, 'launch', 3);
        expect(s.phase).toBe('ACTION');
        expect([player(s).actions, player(s).hand.length]).toEqual([2, 1]);
        expect(() => act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'launch' })).toThrow();
    });

    it('Préparatifs : la main de côté, jouée au prochain tour', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village', 'silver', 'estate');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = event(s, 'prepare', 3);
        expect(peekMat(player(s), 'prepare').length).toBe(3);
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 0); // Village d'abord
        expect(ids(player(s).playArea).sort()).toEqual(['silver', 'village']);
        expect(ids(player(s).discardPile)).toContain('estate');
    });

    it('Récupération : un Domaine du rebut puis une carte jusqu\'à 5', () => {
        let s = makeGame(['village']);
        s.trash = cards('estate');
        s = event(s, 'scrounge', 3);
        s = chooseOption(s, 1);
        s = chooseSupply(s, 'village');
        expect(ids(player(s).discardPile).sort()).toEqual(['estate', 'village']);
    });

    it('Voyage : rien n\'est défaussé du jeu et un tour supplémentaire', () => {
        let s = makeGame([]);
        player(s).deck = cards(...filler(20));
        player(s).playArea = cards('silver');
        s = event(s, 'journey', 4);
        s = endTurn(s);
        expect(s.players[s.currentPlayerIndex].id).toBe('p1');
        expect(ids(player(s).playArea)).toEqual(['silver']);
    });

    it('Maelström : écarte 3 cartes ; les autres à 5+ cartes en écartent une', () => {
        let s = makeGame([]);
        player(s).hand = cards('estate', 'estate', 'curse');
        player(s, 'p2').hand = cards(...filler(5));
        s = event(s, 'maelstrom', 4);
        s = chooseCards(s, ['estate', 'estate', 'curse']);
        s = chooseCards(s, ['copper']);
        expect(ids(s.trash).length).toBe(4);
    });

    it('Invasion : Attaque, Duché, Action sur la pioche, Butin joué', () => {
        let s = makeGame(['village']);
        lootPile(s, 'jewels');
        player(s).hand = [];
        s = event(s, 'invasion', 10);
        s = chooseSupply(s, 'village');
        expect(player(s).deck[0].id).toBe('village');
        expect(ids(player(s).discardPile)).toContain('duchy');
        expect(ids(player(s).playArea)).toEqual(['jewels']);
    });
});

describe('Pillage — Traits', () => {
    it('Bon marché, Riche, Proche, Maudit, Pieux', () => {
        let s = withTrait(['village'], 'village', 'cheap');
        expect(EconomyEngine.getCardCost(s, 'p1', 'village')).toBe(2);
        s = toBuy(withTrait(['village'], 'village', 'rich'));
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'village');
        expect(ids(player(s).discardPile).sort()).toEqual(['silver', 'village']);
        s = toBuy(withTrait(['village'], 'village', 'nearby'));
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'village');
        expect(player(s).buys).toBe(2);
        s = toBuy(withTrait(['village'], 'village', 'cursed'));
        lootPile(s, 'orb');
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'village');
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'orb', 'village']);
        s = toBuy(withTrait(['village'], 'village', 'pious'));
        player(s).hand = cards('estate');
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'village');
        s = chooseCards(s, ['estate']);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Flatteur : recevoir une Province donne une carte Flatteuse', () => {
        let s = toBuy(withTrait(['village'], 'village', 'fawning'));
        player(s).coins = 8; player(s).buys = 2;
        s = buy(s, 'province');
        expect(ids(player(s).discardPile).sort()).toEqual(['province', 'village']);
    });

    it('Pressé : mise de côté et jouée au prochain tour', () => {
        let s = toBuy(withTrait(['village'], 'village', 'hasty'));
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'village');
        expect(ids(player(s).aside)).toEqual(['village']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toEqual(['village']);
    });

    it('Téméraire : instructions suivies deux fois, retourne sur sa pile', () => {
        let s = withTrait(['village'], 'village', 'reckless');
        player(s).hand = cards('village');
        player(s).deck = cards(...filler(20));
        s = play(s, 'village');
        expect([player(s).actions, player(s).hand.length]).toEqual([4, 2]);
        s = endTurn(s);
        expect(s.supply.village.count).toBe(11);
    });

    it('Inspirant : après l\'avoir jouée, une Action absente du jeu', () => {
        let s = withTrait(['village', 'smithy'], 'village', 'inspiring');
        player(s).hand = cards('village', 'smithy');
        player(s).deck = cards(...filler(20));
        s = play(s, 'village');
        s = chooseCards(s, ['smithy']);
        expect(ids(player(s).playArea)).toEqual(['village', 'smithy']);
    });

    it('Patient et Amical : au début de l\'Ajustement', () => {
        let s = withTrait(['village'], 'village', 'patient');
        player(s).hand = cards('village');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = endPhase(s); s = endPhase(s);
        s = chooseCards(s, ['village']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toEqual(['village']);
        s = withTrait(['village'], 'village', 'friendly');
        player(s).hand = cards('village');
        player(s).deck = cards(...filler(20));
        s = endPhase(s); s = endPhase(s);
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile).filter(id => id === 'village').length).toBe(2);
    });

    it('Timide : au début du tour, défausser pour +2 Cartes', () => {
        let s = withTrait(['village'], 'village', 'shy');
        player(s).deck = cards('village', ...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(6);
        expect(ids(player(s).discardPile)).toContain('village');
    });

    it('Infatigable : défaussée du jeu, elle revient sur la pioche à la fin du tour', () => {
        let s = withTrait(['village'], 'village', 'tireless');
        player(s).hand = cards('village');
        player(s).deck = cards(...filler(20));
        s = play(s, 'village');
        s = endTurn(s);
        expect(player(s).deck[0].id).toBe('village');
    });

    it('Destiné : au mélange, les cartes Destinées vont sur le dessus', () => {
        let s = withTrait(['village'], 'village', 'fated');
        player(s).deck = [];
        player(s).discardPile = cards('village', ...filler(9));
        player(s).hand = cards('smithy');
        s = play(s, 'smithy');
        s = chooseCards(s, ['village'], 'discardPile');
        if (s.pendingDecision) s = chooseCards(s, [], 'discardPile');
        expect(ids(player(s).hand)).toContain('village');
    });
});

describe('Alliés — choix au mélange', () => {
    it('Ordre des astrologues : une carte par Faveur sur le dessus', () => {
        let s = makeGame([]);
        s.landscapes = ['order_of_astrologers'];
        player(s).favors = 2;
        player(s).deck = [];
        player(s).discardPile = cards('gold', ...filler(9));
        player(s).hand = cards('smithy');
        s = play(s, 'smithy');
        s = chooseCards(s, ['gold'], 'discardPile');
        expect(ids(player(s).hand)).toContain('gold');
        expect(player(s).favors).toBe(1);
    });

    it('Ordre des maçons : 2 cartes par Faveur restent dans la défausse', () => {
        let s = makeGame([]);
        s.landscapes = ['order_of_masons'];
        player(s).favors = 1;
        player(s).deck = [];
        player(s).discardPile = cards('curse', 'estate', ...filler(8));
        player(s).hand = cards('smithy');
        s = play(s, 'smithy');
        s = chooseCards(s, ['curse', 'estate'], 'discardPile');
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate']);
        expect(player(s).favors).toBe(0);
    });

    void getMat;
});
