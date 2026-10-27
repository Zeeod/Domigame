/**
 * Allies: behaviour tests (Kingdom cards, split piles, Allies and Favors).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, endPhase, untilTurnOf, act } from '../../helpers/play.js';
import { createCardInstance } from '../../../shared/engine/CardInstance.js';
import { SupplyGenerator } from '../../../shared/engine/SupplyGenerator.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { getMat } from '../../../shared/engine/Mats.js';
import { setupAllies } from '../../../shared/engine/expansions/AlliesRules.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const options = (s: any, ...idx: number[]) => choose(s, { type: 'OPTIONS', optionIndices: idx });
/** A game using this Ally, every player with `n` Favors. */
const withAlly = (kingdom: string[], ally: string, n = 5) => {
    const s = makeGame(kingdom);
    s.landscapes = [ally];
    for (const p of s.players) p.favors = n;
    return s;
};
const pile = (s: any, id: string, cardIds: string[]) => {
    s.supply[id] = { cardId: cardIds[cardIds.length - 1], count: cardIds.length, cards: cardIds.map(c => createCardInstance(c)) };
};

describe('Alliés — cartes Royaume', () => {
    it('Barbare : +2 💰 ; les autres écartent leur carte du dessus', () => {
        let s = makeGame(['barbarian']);
        player(s).hand = cards('barbarian');
        player(s, 'p2').deck = cards('silver', 'copper');
        s = play(s, 'barbarian');
        expect(player(s).coins).toBe(2);
        expect(ids(s.trash)).toEqual(['silver']);
        expect(() => chooseSupply(s, 'estate')).toThrow(); // must share a type (Treasure)
        s = chooseSupply(s, 'copper');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['copper']);
        s = makeGame(['barbarian']);
        player(s, 'p2').deck = cards('estate');
        player(s).hand = cards('barbarian');
        s = play(s, 'barbarian');
        expect(ids(player(s, 'p2').discardPile)).toContain('curse');
    });

    it('Babiole : deux options ; les cartes reçues peuvent aller sur la pioche', () => {
        let s = toBuy(makeGame(['bauble']));
        player(s).hand = cards('bauble');
        s = play(s, 'bauble');
        s = options(s, 0, 3);
        expect(player(s).buys).toBe(2);
        player(s).coins = 3;
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        expect(player(s).deck[0].id).toBe('silver');
    });

    it('Courtier : écarte une carte, +1 Faveur par 💰 de son coût', () => {
        let s = makeGame(['broker']);
        player(s).hand = cards('broker', 'silver');
        s = play(s, 'broker');
        s = chooseCards(s, ['silver']);
        s = chooseOption(s, 3);
        expect(player(s).favors).toBe(3);
    });

    it('Capitale : défausser 2 cartes pour +2 💰, payer 2 💰 pour +2 Cartes', () => {
        let s = makeGame(['capital_city']);
        player(s).hand = cards('capital_city', 'estate', 'estate', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'capital_city');
        expect(player(s).actions).toBe(2);
        s = chooseOption(s, 0);
        s = chooseCards(s, ['estate', 'estate']);
        expect(player(s).coins).toBe(2);
        s = chooseOption(s, 0);
        expect(player(s).coins).toBe(0);
        expect(player(s).hand.length).toBe(4);
    });

    it('Charpentier : sans pile vide +1 Action et une carte à 4 ; sinon écarte et améliore', () => {
        let s = makeGame(['carpenter']);
        player(s).hand = cards('carpenter', 'carpenter', 'copper');
        s = play(s, 'carpenter');
        expect(player(s).actions).toBe(1);
        s = chooseSupply(s, 'silver');
        s.supply.estate.count = 0;
        s = play(s, 'carpenter');
        s = chooseCards(s, ['copper']);
        expect(() => chooseSupply(s, 'silver')).toThrow();
        s = chooseSupply(s, 'curse');
        expect(ids(s.trash)).toEqual(['copper']);
    });

    it('Contrat : 2 💰, +1 Faveur, une Action mise de côté jouée au prochain tour', () => {
        let s = toBuy(makeGame(['contract', 'village']));
        player(s).hand = cards('contract', 'village');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'contract');
        expect([player(s).coins, player(s).favors]).toEqual([2, 1]);
        s = chooseCards(s, ['village']);
        expect(ids(player(s).aside)).toEqual(['village']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea).sort()).toEqual(['contract', 'village']);
        expect(player(s).actions).toBe(3);
    });

    it('Messager : défausse la carte du dessus, peut jouer une carte de la défausse', () => {
        let s = makeGame(['courier']);
        player(s).hand = cards('courier');
        player(s).deck = cards('silver', 'copper');
        s = play(s, 'courier');
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toEqual(['courier', 'silver']);
        expect(player(s).coins).toBe(3);
    });

    it('Émissaire : +1 Action et +2 Faveurs s\'il a fait mélanger', () => {
        let s = makeGame(['emissary']);
        player(s).hand = cards('emissary', 'emissary');
        player(s).deck = cards('copper', 'copper', 'copper');
        player(s).discardPile = cards(...filler(5));
        s = play(s, 'emissary');
        expect([player(s).actions, player(s).favors]).toEqual([0, 0]);
        player(s).actions = 1;
        s = play(s, 'emissary');
        expect([player(s).actions, player(s).favors]).toEqual([1, 2]);
        expect(player(s).hand.length).toBe(6);
    });

    it('Galerie : +1 Achat par carte reçue à 3 ou 4', () => {
        let s = makeGame(['galleria']);
        player(s).hand = cards('galleria');
        s = play(s, 'galleria');
        s = toBuy(s);
        player(s).coins = 20; player(s).buys = 2;
        s = buy(s, 'silver');
        expect(player(s).buys).toBe(2);
        s = buy(s, 'gold');
        expect(player(s).buys).toBe(1);
    });

    it('Maître de guilde : +1 Faveur par carte reçue ce tour', () => {
        let s = makeGame(['guildmaster']);
        player(s).hand = cards('guildmaster');
        s = play(s, 'guildmaster');
        s = toBuy(s);
        player(s).buys = 3;
        s = buy(s, 'silver');
        s = buy(s, 'copper');
        expect(player(s).favors).toBe(2);
    });

    it('Bandit de grand chemin : le premier Trésor des autres ne fait rien', () => {
        let s = makeGame(['highwayman']);
        player(s).hand = cards('highwayman');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards('silver', 'silver', 'copper', 'copper', 'copper', ...filler());
        s = play(s, 'highwayman');
        s = endTurn(s);
        player(s, 'p2').hand = cards('silver', 'silver');
        s = toBuy(s);
        const silver = player(s, 'p2').hand.filter(c => c.id === 'silver');
        s = act(s, 'p2', { type: 'PLAY_CARD', cardInstanceId: silver[0].instanceId });
        expect(player(s, 'p2').coins).toBe(0);
        s = act(s, 'p2', { type: 'PLAY_CARD', cardInstanceId: silver[1].instanceId });
        expect(player(s, 'p2').coins).toBe(2);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(8);
        expect((s as any).highwaymen).toEqual([]);
    });

    it('Chasseur : une Action, un Trésor et une Victoire en main, le reste défaussé', () => {
        let s = makeGame(['hunter']);
        player(s).hand = cards('hunter');
        player(s).deck = cards('village', 'silver', 'estate', 'gold');
        s = play(s, 'hunter');
        expect(ids(player(s).hand).sort()).toEqual(['estate', 'silver', 'village']);
        player(s).hand = cards('hunter');
        player(s).deck = cards('silver', 'gold', 'estate');
        s = play(s, 'hunter');
        s = chooseOption(s, 1); // Or
        expect(ids(player(s).hand).sort()).toEqual(['estate', 'gold']);
        expect(ids(player(s).discardPile)).toContain('silver');
    });

    it('Importateur : +4 Faveurs à la mise en place ; une carte à 5 au prochain tour', () => {
        let s = makeGame(['importer']);
        expect(player(s).favors).toBe(4);
        expect(player(s, 'p2').favors).toBe(4);
        player(s).hand = cards('importer');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'importer');
        s = untilTurnOf(s, 'p1');
        s = chooseSupply(s, 'duchy');
        expect(ids(player(s).discardPile)).toContain('duchy');
    });

    it('Aubergiste : +3 Cartes puis défausse 3', () => {
        let s = makeGame(['innkeeper']);
        player(s).hand = cards('innkeeper', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'innkeeper');
        s = chooseOption(s, 1);
        s = chooseCards(s, ['estate', 'copper', 'copper']);
        expect(player(s).hand.length).toBe(1);
        expect(player(s).actions).toBe(1);
    });

    it('Marquis : +1 Carte par carte en main, défausse jusqu\'à 10', () => {
        let s = makeGame(['marquis']);
        player(s).hand = cards('marquis', ...filler(6));
        player(s).deck = cards(...filler(20));
        s = play(s, 'marquis');
        expect(player(s).hand.length).toBe(12);
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s).hand.length).toBe(10);
        expect(player(s).buys).toBe(2);
    });

    it('Campement de marchands : peut revenir sur la pioche', () => {
        let s = makeGame(['merchant_camp']);
        player(s).hand = cards('merchant_camp');
        player(s).deck = cards(...filler(20));
        s = play(s, 'merchant_camp');
        expect([player(s).actions, player(s).coins]).toEqual([2, 1]);
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('merchant_camp');
    });

    it('Modifier : écarte une carte, puis +1 Carte +1 Action ou une carte jusqu\'à 2 de plus', () => {
        let s = makeGame(['modify', 'village']);
        player(s).hand = cards('modify', 'silver');
        s = play(s, 'modify');
        s = chooseCards(s, ['silver']);
        s = chooseOption(s, 1);
        s = chooseSupply(s, 'duchy');
        expect(ids(player(s).discardPile)).toEqual(['duchy']);
    });

    it('Galère royale : joue une Action non-Durée, rejouée au prochain tour', () => {
        let s = makeGame(['royal_galley', 'village']);
        player(s).hand = cards('royal_galley', 'village');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'royal_galley');
        s = chooseCards(s, ['village']);
        expect(player(s).actions).toBe(2);
        expect(ids(player(s).aside)).toEqual(['village']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea).sort()).toEqual(['royal_galley', 'village']);
    });

    it('Sentinelle : regarde 5 cartes, en écarte jusqu\'à 2', () => {
        let s = makeGame(['sentinel']);
        player(s).hand = cards('sentinel');
        player(s).deck = cards('estate', 'curse', 'gold', 'silver', 'copper', 'province');
        s = play(s, 'sentinel');
        s = chooseCards(s, ['estate', 'curse'], 'limbo');
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
        if (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(ids(player(s).deck).sort()).toEqual(['copper', 'gold', 'province', 'silver']);
    });

    it('Tirailleur : +1 Carte +1 Action +1 💰 ; recevoir une Attaque fait défausser les autres', () => {
        let s = makeGame(['skirmisher', 'militia']);
        player(s).hand = cards('skirmisher');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards(...filler(5));
        s = play(s, 'skirmisher');
        expect([player(s).actions, player(s).coins, player(s).hand.length]).toEqual([1, 1, 1]);
        s = toBuy(s);
        player(s).coins = 4;
        s = buy(s, 'militia');
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s, 'p2').hand.length).toBe(3);
    });

    it('Spécialiste : joue une carte puis la rejoue ou en reçoit une copie', () => {
        let s = makeGame(['specialist', 'village']);
        player(s).hand = cards('specialist', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'specialist');
        s = chooseCards(s, ['village']);
        s = chooseOption(s, 0);
        expect(player(s).actions).toBe(4);
        s = makeGame(['specialist']);
        player(s).hand = cards('specialist', 'silver');
        s = play(s, 'specialist');
        s = chooseCards(s, ['silver']);
        s = chooseOption(s, 1);
        expect(ids(player(s).discardPile)).toContain('silver');
    });

    it('Échange : remet une Action sur sa pile, reçoit en main une autre Action à 5', () => {
        let s = makeGame(['swap', 'village', 'smithy']);
        player(s).hand = cards('swap', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'swap');
        s = chooseCards(s, ['village']);
        expect(s.supply.village.count).toBe(11);
        expect(() => chooseSupply(s, 'village')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).hand)).toContain('smithy');
    });

    it('Sycophante : défausse 3 cartes pour +3 💰 ; +2 Faveurs reçue ou écartée', () => {
        let s = makeGame(['sycophant']);
        player(s).hand = cards('sycophant', 'estate', 'estate', 'estate');
        s = play(s, 'sycophant');
        s = chooseCards(s, ['estate', 'estate', 'estate']);
        expect(player(s).coins).toBe(3);
        s = toBuy(s);
        player(s).coins = 2;
        s = buy(s, 'sycophant');
        expect(player(s).favors).toBe(2);
    });

    it('Ville et Subalterne', () => {
        let s = makeGame(['town', 'underling']);
        player(s).hand = cards('town', 'underling');
        player(s).deck = cards(...filler());
        s = play(s, 'town');
        s = chooseOption(s, 0);
        expect(player(s).actions).toBe(2);
        s = play(s, 'underling');
        expect([player(s).actions, player(s).favors]).toEqual([2, 1]);
    });
});

describe('Alliés — piles mixtes', () => {
    it('Cueilleuse d\'herbes : pioche dans la défausse, joue un Trésor de la défausse', () => {
        let s = makeGame([]);
        player(s).hand = cards('herb_gatherer');
        player(s).deck = cards('gold', 'estate');
        s = play(s, 'herb_gatherer');
        expect(player(s).deck.length).toBe(0);
        s = chooseOption(s, 0);
        expect(player(s).coins).toBe(3);
        expect(player(s).buys).toBe(2);
    });

    it('Acolyte : une Action/Victoire écartée pour un Or ; s\'écarte pour un Augure', () => {
        let s = makeGame([]);
        pile(s, 'augurs_pile', ['sibyl', 'acolyte', 'herb_gatherer']);
        player(s).hand = cards('acolyte', 'estate');
        s = play(s, 'acolyte');
        s = chooseCards(s, ['estate']);
        s = chooseOption(s, 0);
        expect(ids(s.trash).sort()).toEqual(['acolyte', 'estate']);
        expect(ids(player(s).discardPile).sort()).toEqual(['gold', 'herb_gatherer']);
    });

    it('Enchanteresse : la carte du dessus en main ; si nommée, Malédictions', () => {
        let s = makeGame([]);
        player(s).hand = cards('sorceress');
        player(s).deck = cards('gold');
        s = play(s, 'sorceress');
        s = choose(s, { type: 'NAMED_CARD', cardId: 'gold' });
        expect(ids(player(s).hand)).toEqual(['gold']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
    });

    it('Sibylle : +4 Cartes, une sur la pioche et une dessous', () => {
        let s = makeGame([]);
        player(s).hand = cards('sibyl', 'estate', 'curse');
        player(s).deck = cards(...filler(8));
        s = play(s, 'sibyl');
        s = chooseCards(s, ['estate']);
        s = chooseCards(s, ['curse']);
        expect(player(s).deck[0].id).toBe('estate');
        expect(player(s).deck[player(s).deck.length - 1].id).toBe('curse');
    });

    it('Plan de bataille : dévoiler une Attaque pour +1 Carte ; retourner une pile', () => {
        let s = makeGame([]);
        pile(s, 'forts_pile', ['stronghold', 'tent']);
        player(s).hand = cards('battle_plan', 'militia');
        player(s).deck = cards(...filler());
        s = play(s, 'battle_plan');
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(3);
        s = chooseOption(s, 0);
        expect(s.supply.forts_pile.cardId).toBe('stronghold');
    });

    it('Archer : la victime cache une carte, l\'attaquant choisit celle défaussée', () => {
        let s = makeGame([]);
        player(s).hand = cards('archer');
        player(s, 'p2').hand = cards('copper', 'silver', 'estate', 'gold', 'copper');
        s = play(s, 'archer');
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseCards(s, ['gold']);
        expect(s.pendingDecision?.playerId).toBe('p1');
        s = chooseOption(s, 1); // Argent
        expect(ids(player(s, 'p2').discardPile)).toEqual(['silver']);
        expect(player(s).coins).toBe(2);
    });

    it('Seigneur de guerre : les autres ne jouent pas une 3e copie ; +2 Cartes au prochain tour', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('warlord');
        player(s).deck = cards(...filler(20));
        s = play(s, 'warlord');
        s = endTurn(s);
        player(s, 'p2').hand = cards('village', 'village', 'village');
        s = act(s, 'p2', { type: 'PLAY_CARD', cardInstanceId: player(s, 'p2').hand[0].instanceId });
        s = act(s, 'p2', { type: 'PLAY_CARD', cardInstanceId: player(s, 'p2').hand[0].instanceId });
        expect(() => act(s, 'p2', { type: 'PLAY_CARD', cardInstanceId: player(s, 'p2').hand[0].instanceId })).toThrow();
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(7);
    });

    it('Territoire : 1 PV par carte Victoire différente ; un Or par pile vide', () => {
        let s = toBuy(makeGame([]));
        s.supply.territory = { cardId: 'territory', count: 4, cards: [] } as any;
        s.supply.curse.count = 0;
        player(s).coins = 6; player(s).buys = 2;
        s = buy(s, 'territory');
        expect(ids(player(s).discardPile).sort()).toEqual(['gold', 'territory']);
        player(s).deck = cards('estate', 'duchy', 'estate');
        expect(VictoryChecker.scorePlayer(s, player(s))).toBe(1 + 3 + 1 + 3);
    });

    it('Tente : +2 💰 et peut revenir sur la pioche', () => {
        let s = makeGame([]);
        player(s).hand = cards('tent');
        player(s).deck = cards(...filler(20));
        s = play(s, 'tent');
        s = chooseOption(s, 1);
        expect(player(s).coins).toBe(2);
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('tent');
    });

    it('Garnison : un jeton par carte reçue, +1 Carte par jeton au prochain tour', () => {
        let s = makeGame([]);
        player(s).hand = cards('garrison');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'garrison');
        s = toBuy(s);
        player(s).buys = 2;
        s = buy(s, 'copper');
        s = buy(s, 'copper');
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(7);
    });

    it('Fort de colline : une carte à 4 en main', () => {
        let s = makeGame([]);
        player(s).hand = cards('hill_fort');
        s = play(s, 'hill_fort');
        s = chooseSupply(s, 'silver');
        s = chooseOption(s, 0);
        expect(ids(player(s).hand)).toEqual(['silver']);
    });

    it('Forteresse : +3 💰 maintenant ou +3 Cartes au prochain tour ; 2 PV', () => {
        let s = makeGame([]);
        player(s).hand = cards('stronghold');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'stronghold');
        s = chooseOption(s, 1);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(8);
        player(s).deck = []; player(s).hand = []; player(s).discardPile = []; player(s).playArea = cards('stronghold');
        expect(VictoryChecker.scorePlayer(s, player(s))).toBe(2);
    });

    it('Vieille carte, Rive lointaine, Trésor englouti', () => {
        let s = makeGame(['village', 'smithy']);
        player(s).hand = cards('old_map', 'distant_shore', 'village', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'old_map');
        s = chooseCards(s, ['estate']);
        s = chooseOption(s, 1);
        expect(player(s).hand.length).toBe(4);
        s = play(s, 'distant_shore');
        expect(ids(player(s).discardPile)).toContain('estate');
        s = play(s, 'village');
        player(s).hand = cards('sunken_treasure');
        s = toBuy(s);
        s = play(s, 'sunken_treasure');
        expect(() => chooseSupply(s, 'village')).toThrow();
        s = chooseSupply(s, 'smithy');
    });

    it('Voyage : un tour supplémentaire limité à 3 cartes', () => {
        let s = makeGame([]);
        player(s).hand = cards('voyage');
        s = play(s, 'voyage');
        expect(s.extraTurns).toEqual([{ playerId: 'p1', type: 'VOYAGE', cardLimit: 3 }]);
    });

    it('Crieur public, Forgeron, Meunier', () => {
        let s = makeGame([]);
        player(s).hand = cards('town_crier', 'town_blacksmith', 'miller');
        player(s).deck = cards('gold', 'estate', 'silver', 'copper', ...filler(10));
        s = play(s, 'town_crier');
        s = chooseOption(s, 2);
        s = chooseOption(s, 1);
        s = play(s, 'town_blacksmith');
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(6);
        player(s).deck = cards('estate', 'gold', 'copper', 'silver');
        player(s).actions = 1;
        s = play(s, 'miller');
        s = chooseOption(s, 1);
        expect(ids(player(s).hand)).toContain('gold');
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate', 'silver']);
    });

    it('Ancien : joue une Action qui choisit une option de plus', () => {
        let s = makeGame(['town']);
        player(s).hand = cards('elder', 'town');
        player(s).deck = cards(...filler());
        s = play(s, 'elder');
        s = chooseCards(s, ['town']);
        s = options(s, 0, 1);
        expect([player(s).coins, player(s).buys, player(s).actions]).toEqual([4, 2, 2]);
    });

    it('Étudiant : écarte un Trésor → +1 Faveur et revient sur la pioche', () => {
        let s = makeGame([]);
        player(s).hand = cards('student', 'silver');
        s = play(s, 'student');
        s = chooseOption(s, 1);
        s = chooseCards(s, ['silver']);
        expect(player(s).favors).toBe(1);
        expect(player(s).deck[0].id).toBe('student');
    });

    it('Illusionniste : une carte à 4, revient en main au prochain tour', () => {
        let s = makeGame([]);
        player(s).hand = cards('conjurer');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'conjurer');
        s = chooseSupply(s, 'silver');
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand)).toContain('conjurer');
    });

    it('Sorcier : la victime nomme sa carte du dessus ; erreur → Malédiction', () => {
        let s = makeGame([]);
        player(s).hand = cards('sorcerer_wizard');
        player(s).deck = cards(...filler());
        player(s, 'p2').deck = cards('estate');
        s = play(s, 'sorcerer_wizard');
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = choose(s, { type: 'NAMED_CARD', cardId: 'copper' });
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        expect(player(s, 'p2').deck[0].id).toBe('estate');
    });

    it('Liche : +6 Cartes +2 Actions, passe un tour ; écartée → défaussée + une carte du rebut', () => {
        let s = makeGame([]);
        player(s).hand = cards('lich');
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler(30));
        s = play(s, 'lich');
        expect([player(s).hand.length, player(s).actions]).toEqual([6, 2]);
        s = endTurn(s);
        s = endTurn(s); // p2
        expect(s.players[s.currentPlayerIndex].id).toBe('p2');
        s.trash = cards('silver');
        player(s, 'p2').hand = cards('chapel', 'lich');
        s = act(s, 'p2', { type: 'PLAY_CARD', cardInstanceId: player(s, 'p2').hand[0].instanceId });
        s = chooseCards(s, ['lich']);
        s = chooseOption(s, 0);
        expect(ids(player(s, 'p2').discardPile).sort()).toEqual(['lich', 'silver']);
    });
});

describe('Alliés — Alliés et Faveurs', () => {
    it('Un Allié est tiré quand une Liaison est dans le royaume, et chacun commence avec 1 Faveur', () => {
        const l = SupplyGenerator.getLandscapes({ kingdomCardIds: ['underling', 'village'], landscapeInstructions: [], seed: 'x' });
        expect(l.filter(id => id.includes('_') || true).length).toBe(1);
        const none = SupplyGenerator.getLandscapes({ kingdomCardIds: ['village'], landscapeInstructions: ['random:any', 'random:any'], seed: 'y' });
        expect(none.length).toBe(2);
        let s = makeGame(['underling']);
        s.landscapes = ['mountain_folk'];
        (s as any).alliesSetupDone = false;
        for (const p of s.players) p.favors = 0;
        setupAllies(s);
        expect(player(s).favors).toBe(1);
    });

    const startTurn = (s: any) => { player(s).deck = cards(...filler(30)); player(s, 'p2').deck = cards(...filler(30)); return untilTurnOf(endTurn(s), 'p1'); };

    it('Guilde des architectes : 2 Faveurs pour une carte non-Victoire moins chère', () => {
        let s = toBuy(withAlly(['village'], 'architects_guild'));
        player(s).coins = 6;
        s = buy(s, 'gold');
        s = chooseOption(s, 0);
        expect(() => chooseSupply(s, 'duchy')).toThrow();
        s = chooseSupply(s, 'village');
        expect(player(s).favors).toBe(3);
    });

    it('Bande de nomades : 1 Faveur pour +1 Achat en recevant une carte à 3+', () => {
        let s = toBuy(withAlly([], 'band_of_nomads'));
        player(s).coins = 3;
        s = buy(s, 'silver');
        s = chooseOption(s, 2);
        expect(player(s).buys).toBe(1);
    });

    it('Troglodytes et Guides du désert : au début du tour, répétables', () => {
        let s = withAlly([], 'cave_dwellers', 2);
        s = startTurn(s);
        s = chooseOption(s, 0);
        s = chooseCards(s, ['copper']);
        s = chooseOption(s, 0);
        s = chooseCards(s, ['copper']);
        expect(player(s).favors).toBe(0);
        expect(s.pendingDecision).toBeFalsy();
        s = withAlly([], 'desert_guides', 1);
        s = startTurn(s);
        s = chooseOption(s, 0);
        expect([player(s).hand.length, player(s).favors]).toEqual([5, 0]);
    });

    it('Cercle de sorcières et Ligue des boutiquiers : après une Liaison', () => {
        let s = withAlly(['underling'], 'circle_of_witches', 3);
        player(s).hand = cards('underling');
        player(s).deck = cards(...filler());
        s = play(s, 'underling');
        s = chooseOption(s, 0);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        s = withAlly(['underling'], 'league_of_shopkeepers', 9);
        player(s).hand = cards('underling');
        player(s).deck = cards(...filler());
        s = play(s, 'underling');
        expect([player(s).coins, player(s).actions, player(s).buys]).toEqual([1, 2, 2]);
    });

    it('Cité-État : 2 Faveurs pour jouer l\'Action reçue', () => {
        let s = toBuy(withAlly(['village'], 'city_state'));
        player(s).coins = 3; player(s).buys = 2;
        player(s).deck = cards(...filler());
        s = buy(s, 'village');
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toEqual(['village']);
    });

    it('Havre côtier : des cartes gardées en main pour le tour suivant', () => {
        let s = withAlly([], 'coastal_haven', 2);
        player(s).hand = cards('gold', 'estate');
        player(s).deck = cards(...filler(20));
        s = endPhase(s); s = endPhase(s);
        s = chooseCards(s, ['gold']);
        expect(ids(player(s).hand)).toContain('gold');
        expect(player(s).hand.length).toBe(6);
        expect(player(s).favors).toBe(1);
    });

    it('Guilde des artisans, Peuple des montagnes, Habitants des forêts', () => {
        let s = withAlly([], 'crafters_guild', 2);
        s = startTurn(s);
        s = chooseOption(s, 0);
        s = chooseSupply(s, 'silver');
        expect(player(s).deck[0].id).toBe('silver');
        s = withAlly([], 'mountain_folk', 5);
        s = startTurn(s);
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(8);
        s = withAlly([], 'forest_dwellers', 1);
        s = startTurn(s);
        player(s).deck = cards('estate', 'gold', 'curse', ...filler());
        s = chooseOption(s, 0);
        s = chooseCards(s, ['estate', 'curse'], 'limbo');
        if (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(player(s).deck[0].id).toBe('gold');
    });

    it('Famille d\'inventeurs : une Faveur sur une pile la rend moins chère', () => {
        let s = withAlly(['village'], 'family_of_inventors', 1);
        player(s).hand = [];
        s = endPhase(s);
        const idx = (s.pendingDecision as any).options.findIndex((o: any) => o.label === 'Village');
        s = chooseOption(s, idx);
        expect(EconomyEngine.getCardCost(s, 'p1', 'village')).toBe(2);
        expect(EconomyEngine.getCardCost(s, 'p2', 'village')).toBe(2);
    });

    it('Confrérie des scribes : 1 Faveur pour +1 Carte après une Action', () => {
        let s = withAlly(['village'], 'fellowship_of_scribes');
        player(s).hand = cards('village');
        player(s).deck = cards(...filler());
        s = play(s, 'village');
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(2);
    });

    it('Bande de pickpockets : défausser jusqu\'à 4 sauf Faveur', () => {
        let s = withAlly([], 'gang_of_pickpockets', 0);
        s = startTurn(s);
        s = chooseCards(s, ['copper']);
        expect(player(s).hand.length).toBe(4);
    });

    it('Peuple des îles : 5 Faveurs pour un autre tour', () => {
        let s = withAlly([], 'island_folk', 5);
        player(s).deck = cards(...filler(20));
        (s as any).previousTurnPlayerId = 'p2';
        s = endPhase(s); s = endPhase(s);
        s = chooseOption(s, 0);
        expect(s.players[s.currentPlayerIndex].id).toBe('p1');
    });

    it('Ligue des banquiers, Villes de marché, Culte paisible, Guilde des sculpteurs', () => {
        let s = withAlly([], 'league_of_bankers', 9);
        player(s).hand = [];
        s = endPhase(s);
        expect(player(s).coins).toBe(2);
        s = withAlly(['village'], 'market_towns', 1);
        player(s).hand = cards('village');
        player(s).deck = cards(...filler());
        s = endPhase(s);
        s = chooseCards(s, ['village']);
        expect(ids(player(s).playArea)).toEqual(['village']);
        s = withAlly([], 'peaceful_cult', 2);
        player(s).hand = cards('estate', 'estate', 'copper');
        s = endPhase(s);
        s = chooseCards(s, ['estate', 'estate']);
        expect([ids(s.trash).length, player(s).favors]).toEqual([2, 0]);
        s = withAlly(['village', 'smithy'], 'woodcarvers_guild', 1);
        player(s).hand = cards('village');
        s = endPhase(s);
        s = chooseOption(s, 0);
        s = chooseCards(s, ['village']);
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Bergers des plateaux : 2 PV par paire Faveur / carte à 2', () => {
        const s = withAlly([], 'plateau_shepherds', 3);
        player(s).deck = cards('copper', 'copper', 'copper', 'copper', 'copper', 'copper', 'copper', 'estate', 'estate', 'estate');
        player(s).deck.push(...cards('bauble', 'bauble'));
        expect(VictoryChecker.scorePlayer(s, player(s))).toBe(3 + 2 * 3); // 3 Domaines (2 💰) + 2 Babioles, 3 Faveurs → 3 paires
    });

    it('Maison des trappeurs : 1 Faveur pour mettre la carte reçue sur la pioche', () => {
        let s = toBuy(withAlly([], 'trappers_lodge', 1));
        player(s).coins = 6; player(s).buys = 2;
        s = buy(s, 'gold');
        s = chooseOption(s, 0);
        expect(player(s).deck[0].id).toBe('gold');
    });

    void getMat;
});
