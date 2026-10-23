/**
 * Adventures: behaviour tests (cards, tokens, Reserve calls, Travellers, Events).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, untilTurnOf, act } from '../../helpers/play.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';
import { getMat } from '../../../shared/engine/Mats.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const pass = (s: any) => choose(s, { type: 'CARDS', cardInstanceIds: [] });
const event = (s: any, id: string, coins = 10) => {
    s.landscapes = [...(s.landscapes || []), id];
    s = toBuy(s);
    player(s).coins = coins; player(s).buys = Math.max(player(s).buys, 2);
    return act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: id });
};

describe('Aventures — cartes', () => {
    it('Amulette : maintenant et au prochain tour, un choix', () => {
        let s = makeGame(['amulet']);
        player(s).hand = cards('amulet');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'amulet');
        s = chooseOption(s, 2);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
        s = untilTurnOf(s, 'p1');
        expect(s.pendingDecision?.playerId).toBe('p1');
        s = chooseOption(s, 0);
        expect(player(s).coins).toBe(1);
    });

    it('Artisan : défausse N cartes, reçoit sur la pioche une carte coûtant exactement N', () => {
        let s = makeGame(['artificer', 'village']);
        player(s).hand = cards('artificer', 'estate', 'estate', 'curse');
        player(s).deck = cards(...filler());
        s = play(s, 'artificer');
        s = chooseCards(s, ['estate', 'estate', 'curse']);
        s = chooseSupply(s, 'village');
        expect(player(s).deck[0].id).toBe('village');
    });

    it('Troll du pont : jeton -1 💰 aux autres, +1 Achat, cartes à -1 pendant vos tours', () => {
        let s = makeGame(['bridge_troll']);
        player(s).hand = cards('bridge_troll');
        s = play(s, 'bridge_troll');
        expect(player(s, 'p2').minusCoinToken).toBe(true);
        expect(player(s).buys).toBe(2);
        expect(EconomyEngine.getCardCost(s, 'p1', 'gold')).toBe(5);
    });

    it('Jeton -1 💰 : le prochain gain de 💰 est diminué de 1', () => {
        let s = toBuy(makeGame([]));
        player(s).minusCoinToken = true;
        player(s).hand = cards('silver', 'silver');
        s = play(s, 'silver');
        expect(player(s).coins).toBe(1);
        s = play(s, 'silver');
        expect(player(s).coins).toBe(3);
    });

    it('Garde de caravane : jouable en réaction à une Attaque, +1 💰 au prochain tour', () => {
        let s = makeGame(['caravan_guard', 'militia']);
        player(s).hand = cards('militia');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('caravan_guard', 'copper', 'copper', 'copper', 'copper');
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'militia');
        s = chooseCards(s, ['caravan_guard']);
        while (s.pendingDecision && s.pendingDecision.playerId === 'p2' && (s.pendingDecision as any).context?.specialAction === 'REACTION_DECISION') s = pass(s);
        expect(ids(player(s, 'p2').playArea)).toEqual(['caravan_guard']);
    });

    it('Pièce du royaume : sur la Taverne, appelée après une Action pour +2 Actions', () => {
        let s = makeGame(['coin_of_the_realm', 'smithy']);
        player(s).hand = cards('coin_of_the_realm');
        s = toBuy(s);
        s = play(s, 'coin_of_the_realm');
        expect(player(s).coins).toBe(1);
        expect(ids(getMat(player(s), 'tavern'))).toEqual(['coin_of_the_realm']);

        s = makeGame(['coin_of_the_realm', 'smithy']);
        getMat(player(s), 'tavern').push(...cards('coin_of_the_realm'));
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'smithy');
        s = chooseOption(s, 0);
        expect(player(s).actions).toBe(2);
        expect(ids(player(s).playArea).sort()).toEqual(['coin_of_the_realm', 'smithy']);
    });

    it('Terres lointaines : 4 PV si sur la Taverne en fin de partie', () => {
        let s = makeGame(['distant_lands']);
        player(s).hand = cards('distant_lands');
        s = play(s, 'distant_lands');
        player(s).vpTokens = 0; player(s).deck = []; player(s).discardPile = [];
        expect(VictoryChecker.scorePlayer(s, player(s))).toBe(4);
    });

    it('Double : appelé quand on reçoit une carte jusqu\'à 6, en reçoit une copie', () => {
        let s = toBuy(makeGame(['duplicate']));
        getMat(player(s), 'tavern').push(...cards('duplicate'));
        player(s).coins = 6; player(s).buys = 2;
        s = buy(s, 'gold');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['gold', 'gold']);
    });

    it('Donjon : +1 Action, +2 Cartes puis défausse 2, maintenant et au prochain tour', () => {
        let s = makeGame(['dungeon']);
        player(s).hand = cards('dungeon');
        player(s).deck = cards('estate', 'curse', ...filler());
        s = play(s, 'dungeon');
        s = chooseCards(s, ['estate', 'curse']);
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate']);
    });

    it('Matériel : met de côté jusqu\'à 2 cartes, reprises au prochain tour', () => {
        let s = makeGame(['gear']);
        player(s).hand = cards('gear', 'gold');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'gear');
        s = chooseCards(s, ['gold']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand)).toContain('gold');
    });

    it('Géant : jeton Voyage face cachée +1 💰 ; face visible +5 💰 et attaque', () => {
        let s = makeGame(['giant']);
        player(s).hand = cards('giant', 'giant');
        player(s, 'p2').deck = cards('copper', 'gold');
        s = play(s, 'giant');
        expect(player(s).coins).toBe(1);
        player(s).actions = 1;
        s = play(s, 'giant');
        expect(player(s).coins).toBe(6);
        expect(ids(player(s, 'p2').discardPile).sort()).toEqual(['copper', 'curse']);
    });

    it('Guide : appelé au début du tour, défausse la main et pioche 5', () => {
        let s = makeGame(['guide']);
        player(s).hand = cards('guide');
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'guide');
        expect(ids(getMat(player(s), 'tavern'))).toEqual(['guide']);
        s = untilTurnOf(s, 'p1');
        expect(s.pendingDecision?.playerId).toBe('p1');
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(5);
        expect(ids(player(s).playArea)).toEqual(['guide']);
    });

    it('Bois hantés : un autre joueur qui achète place sa main sur sa pioche ; +3 Cartes au prochain tour', () => {
        let s = makeGame(['haunted_woods']);
        player(s).hand = cards('haunted_woods');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'haunted_woods');
        s = endTurn(s);
        s = toBuy(s);
        player(s, 'p2').hand = cards('estate');
        player(s, 'p2').coins = 3; player(s, 'p2').buys = 2;
        s = buy(s, 'silver', 'p2');
        expect(player(s, 'p2').deck[0].id).toBe('estate');
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(8);
    });

    it('Mercenaire (Hireling) : +1 Carte au début de chaque tour', () => {
        let s = makeGame(['hireling']);
        player(s).hand = cards('hireling');
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler(30));
        s = play(s, 'hireling');
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(6);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(6);
    });

    it('Cité perdue : +2 Cartes +2 Actions ; reçue → les autres piochent', () => {
        let s = toBuy(makeGame(['lost_city']));
        player(s, 'p2').deck = cards(...filler());
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'lost_city');
        expect(player(s, 'p2').hand.length).toBe(1);
    });

    it('Pie : prend le Trésor du dessus ; Action ou Victoire → une Pie', () => {
        let s = makeGame(['magpie']);
        player(s).hand = cards('magpie');
        player(s).deck = cards('copper', 'silver');
        s = play(s, 'magpie');
        expect(ids(player(s).hand)).toEqual(['copper', 'silver']);
        s = makeGame(['magpie']);
        player(s).hand = cards('magpie');
        player(s).deck = cards('copper', 'estate');
        s = play(s, 'magpie');
        expect(ids(player(s).discardPile)).toEqual(['magpie']);
    });

    it('Messager : premier achat → une carte jusqu\'à 4 pour vous et une copie pour chacun', () => {
        let s = toBuy(makeGame(['messenger', 'smithy']));
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'messenger');
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile).sort()).toEqual(['messenger', 'smithy']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['smithy']);
    });

    it('Avare : un Cuivre sur la Taverne, ou +1 💰 par Cuivre sur la Taverne', () => {
        let s = makeGame(['miser']);
        player(s).hand = cards('miser', 'copper');
        s = play(s, 'miser');
        s = chooseOption(s, 0);
        expect(ids(getMat(player(s), 'tavern'))).toEqual(['copper']);
    });

    it('Port : acheté, on en reçoit un autre', () => {
        let s = toBuy(makeGame(['port']));
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'port');
        expect(ids(player(s).discardPile)).toEqual(['port', 'port']);
    });

    it('Ranger : +1 Achat ; +5 Cartes une fois sur deux (jeton Voyage)', () => {
        let s = makeGame(['ranger']);
        player(s).hand = cards('ranger', 'ranger');
        player(s).deck = cards(...filler());
        s = play(s, 'ranger');
        expect(player(s).hand.length).toBe(1);
        player(s).actions = 1;
        s = play(s, 'ranger');
        expect(player(s).hand.length).toBe(5);
    });

    it('Raser : écarte une carte, regarde autant de cartes que son coût, en garde une', () => {
        let s = makeGame(['raze']);
        player(s).hand = cards('raze', 'estate');
        player(s).deck = cards('copper', 'gold', 'silver');
        s = play(s, 'raze');
        s = chooseOption(s, 1);                 // trash the Estate: look at 2
        s = chooseOption(s, 1);                 // keep Gold
        expect(ids(player(s).hand)).toEqual(['gold']);
        expect(ids(player(s).discardPile)).toEqual(['copper']);
    });

    it('Relique : 2 💰, chaque autre joueur place son jeton -1 Carte ; il pioche une carte de moins', () => {
        let s = toBuy(makeGame(['relic']));
        player(s).hand = cards('relic');
        s = play(s, 'relic');
        expect(player(s).coins).toBe(2);
        expect(player(s, 'p2').minusCardToken).toBe(true);
        player(s, 'p2').deck = cards(...filler());
        s = endTurn(s);                               // p2's turn: their next hand is drawn at the end of it
        s = endTurn(s);
        expect(player(s, 'p2').hand.length).toBe(4);
        expect(player(s, 'p2').minusCardToken).toBe(false);
    });

    it('Carrosse royal : appelé après une Action pour la rejouer', () => {
        let s = makeGame(['royal_carriage', 'smithy']);
        getMat(player(s), 'tavern').push(...cards('royal_carriage'));
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'smithy');
        s = chooseOption(s, 0);
        expect(player(s).hand.length).toBe(6);
    });

    it('Conteur : joue des Trésors puis paie tout pour piocher', () => {
        let s = makeGame(['storyteller']);
        player(s).hand = cards('storyteller', 'silver', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'storyteller');
        s = chooseCards(s, ['silver', 'copper']);
        expect(player(s).coins).toBe(0);
        expect(player(s).hand.length).toBe(5);       // $1 + $2 + $1 = 4, +1 Card
    });

    it('Sorcière des marais : les autres reçoivent une Malédiction à chaque achat ; +3 💰 au prochain tour', () => {
        let s = makeGame(['swamp_hag']);
        player(s).hand = cards('swamp_hag');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'swamp_hag');
        s = endTurn(s);
        s = toBuy(s);
        player(s, 'p2').coins = 3; player(s, 'p2').buys = 2;
        s = buy(s, 'silver', 'p2');
        expect(ids(player(s, 'p2').discardPile).sort()).toEqual(['curse', 'silver']);
    });

    it('Transmogrification : au début du tour, écarte et reçoit en main une carte jusqu\'à 1 de plus', () => {
        let s = makeGame(['transmogrify']);
        player(s).hand = cards('transmogrify');
        player(s).deck = cards('estate', ...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'transmogrify');
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 0);
        s = chooseCards(s, ['estate']);
        s = chooseSupply(s, 'silver');
        expect(ids(player(s).hand)).toContain('silver');
    });

    it('Trésor caché (Treasure Trove) : 2 💰, un Or et un Cuivre', () => {
        let s = toBuy(makeGame(['treasure_trove']));
        player(s).hand = cards('treasure_trove');
        s = play(s, 'treasure_trove');
        expect(player(s).coins).toBe(2);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'gold']);
    });

    it('Marchand de vin : +1 Achat +4 💰, défaussé de la Taverne avec 2 💰 restants', () => {
        let s = makeGame(['wine_merchant']);
        player(s).hand = cards('wine_merchant');
        player(s).deck = cards(...filler(20));
        s = play(s, 'wine_merchant');
        expect(player(s).coins).toBe(4);
        s = toBuy(s);
        s = endTurn(s);
        expect(getMat(player(s), 'tavern').length).toBe(0);
    });

    it('Voyageurs : Page → Chercheur de trésors à la défausse', () => {
        let s = makeGame(['page']);
        s.nonSupply.treasure_hunter = { cardId: 'treasure_hunter', count: 5, cards: [] } as any;
        player(s).hand = cards('page');
        player(s).deck = cards(...filler(20));
        s = play(s, 'page');
        s = toBuy(s);
        s = endTurn(s);
        expect(ids([...player(s).hand, ...player(s).discardPile, ...player(s).deck])).toContain('treasure_hunter');
        expect(s.supply.page.count).toBe(11);
        expect(s.nonSupply.treasure_hunter.count).toBe(4);
    });

    it('Soldat : +2 💰 +1 par autre Attaque ; les autres (4+ cartes) défaussent', () => {
        let s = makeGame(['peasant', 'militia']);
        player(s).hand = cards('soldier');
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper');
        s = play(s, 'soldier');
        expect(player(s).coins).toBe(2);
        s = chooseCards(s, ['copper']);
        expect(player(s, 'p2').hand.length).toBe(3);
    });

    it('Disciple : joue une Action deux fois et en reçoit une copie', () => {
        let s = makeGame(['peasant', 'smithy']);
        player(s).hand = cards('disciple', 'smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'disciple');
        s = chooseCards(s, ['smithy']);
        expect(player(s).hand.length).toBe(6);
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Champion : protège des Attaques et donne +1 Action par Action jouée', () => {
        let s = makeGame(['peasant', 'witch', 'smithy']);
        player(s, 'p2').playArea = cards('champion');
        player(s).hand = cards('witch');
        player(s).deck = cards(...filler());
        s = play(s, 'witch');
        expect(ids(player(s, 'p2').discardPile)).toEqual([]);
        s = makeGame(['peasant', 'smithy']);
        player(s).playArea = cards('champion');
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'smithy');
        expect(player(s).actions).toBe(1);
    });
});

describe('Aventures — jetons et Événements', () => {
    it('Arts perdus : jeton +1 Action sur une pile, effet quand on joue une carte de cette pile', () => {
        let s = makeGame(['smithy']);
        s = event(s, 'lost_arts', 6);
        s = chooseSupply(s, 'smithy');
        expect(player(s).advTokens?.plus1Action).toBe('smithy');
        s = makeGame(['smithy']);
        player(s).advTokens = { plus1Action: 'smithy' };
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'smithy');
        expect(player(s).actions).toBe(1);
        expect(player(s).hand.length).toBe(3);
    });

    it('Bac : les cartes de la pile coûtent 2 de moins pendant vos tours', () => {
        let s = makeGame(['smithy']);
        player(s).advTokens = { minus2Cost: 'smithy' };
        expect(EconomyEngine.getCardCost(s, 'p1', 'smithy')).toBe(2);
        expect(EconomyEngine.getCardCost(s, 'p1', 'silver')).toBe(3);
    });

    it('Plan : jeton Écart, on peut écarter une carte en achetant une carte de cette pile', () => {
        let s = toBuy(makeGame(['smithy']));
        player(s).advTokens = { trashing: 'smithy' };
        player(s).hand = cards('estate');
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'smithy');
        s = chooseCards(s, ['estate']);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Aumône : une fois par tour, sans Trésor en jeu, une carte jusqu\'à 4', () => {
        let s = makeGame(['smithy']);
        s = event(s, 'alms', 0);
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
        expect(() => act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'alms' })).toThrow();
    });

    it('Emprunt : +1 Achat, jeton -1 Carte et +1 💰', () => {
        let s = makeGame([]);
        s = event(s, 'borrow', 0);
        expect(player(s).minusCardToken).toBe(true);
        expect(player(s).coins).toBe(1);
    });

    it('Quête : défausser une Attaque pour un Or', () => {
        let s = makeGame(['witch']);
        player(s).hand = cards('witch');
        s = event(s, 'quest', 0);
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile).sort()).toEqual(['gold', 'witch']);
    });

    it('Épargne : une carte mise de côté revient en main après la pioche', () => {
        let s = makeGame([]);
        player(s).hand = cards('gold');
        player(s).deck = cards(...filler(20));
        s = event(s, 'save', 1);
        s = chooseCards(s, ['gold']);
        expect(player(s).hand.length).toBe(0);
        s = endTurn(s);
        expect(player(s).hand.length).toBe(6);
        expect(ids(player(s).hand)).toContain('gold');
    });

    it('Éclaireurs : regarde 5 cartes, en défausse 3', () => {
        let s = makeGame([]);
        player(s).deck = cards('estate', 'curse', 'copper', 'gold', 'silver');
        s = event(s, 'scouting_party', 2);
        s = chooseCards(s, ['estate', 'curse', 'copper'], 'limbo');
        while (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'curse', 'estate']);
        expect(player(s).deck.length).toBe(2);
    });

    it('Feu de joie : écarte jusqu\'à 2 cartes en jeu', () => {
        let s = toBuy(makeGame([]));
        player(s).hand = cards('copper', 'copper');
        s = play(s, 'copper'); s = play(s, 'copper');
        s = event(s, 'bonfire', 3);
        s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).playArea.map(c => c.instanceId) });
        expect(ids(s.trash)).toEqual(['copper', 'copper']);
    });

    it('Expédition : 2 cartes de plus pour la prochaine main', () => {
        let s = makeGame([]);
        player(s).deck = cards(...filler(20));
        s = event(s, 'expedition', 3);
        s = endTurn(s);
        expect(player(s).hand.length).toBe(7);
    });

    it('Bal : jeton -1 💰 et 2 cartes jusqu\'à 4', () => {
        let s = makeGame(['smithy']);
        s = event(s, 'ball', 5);
        expect(player(s).minusCoinToken).toBe(true);
        s = chooseSupply(s, 'smithy');
        s = chooseSupply(s, 'silver');
        expect(ids(player(s).discardPile).sort()).toEqual(['silver', 'smithy']);
    });

    it('Raid : un Argent par Argent en jeu ; jeton -1 Carte aux autres', () => {
        let s = toBuy(makeGame([]));
        player(s).hand = cards('silver', 'silver');
        s = play(s, 'silver'); s = play(s, 'silver');
        s = event(s, 'raid', 5);
        expect(ids(player(s).discardPile)).toEqual(['silver', 'silver']);
        expect(player(s, 'p2').minusCardToken).toBe(true);
    });

    it('Route maritime : une Action jusqu\'à 4 et le jeton +1 Achat sur sa pile', () => {
        let s = makeGame(['smithy']);
        s = event(s, 'seaway', 5);
        s = chooseSupply(s, 'smithy');
        expect(player(s).advTokens?.plus1Buy).toBe('smithy');
    });

    it('Commerce : un Argent par carte écartée', () => {
        let s = makeGame([]);
        player(s).hand = cards('estate', 'curse');
        s = event(s, 'trade', 5);
        s = chooseCards(s, ['estate', 'curse']);
        expect(ids(player(s).discardPile)).toEqual(['silver', 'silver']);
    });

    it('Pèlerinage : retourne le jeton Voyage ; face visible → copies de cartes en jeu', () => {
        let s = toBuy(makeGame([]));
        player(s).journeyFaceDown = true;
        player(s).hand = cards('silver');
        s = play(s, 'silver');
        s = event(s, 'pilgrimage', 4);
        s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).playArea.map(c => c.instanceId) });
        expect(ids(player(s).discardPile)).toEqual(['silver']);
    });

    it('Héritage : les Domaines prennent les capacités de la carte choisie pendant vos tours', () => {
        let s = makeGame(['village']);
        s = event(s, 'inheritance', 7);
        s = chooseSupply(s, 'village');
        expect(s.supply.village.count).toBe(9);
        s.phase = 'ACTION'; s.phaseIndex = s.phasePipeline!.indexOf('ACTION');
        player(s).actions = 1;
        player(s).hand = cards('estate');
        player(s).deck = cards(...filler());
        s = play(s, 'estate');
        expect(player(s).actions).toBe(2);
        expect(player(s).hand.length).toBe(1);
        expect(() => act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'inheritance' })).toThrow();
    });
});
