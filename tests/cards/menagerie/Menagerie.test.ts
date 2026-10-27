/**
 * Menagerie: behaviour tests (Kingdom cards, Exile, Horses, Ways, Events).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, untilTurnOf, act } from '../../helpers/play.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { getMat, peekMat } from '../../../shared/engine/Mats.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const exiled = (s: any, p = 'p1') => ids(peekMat(player(s, p), 'exile'));
const event = (s: any, id: string, coins = 20) => {
    s.landscapes = [...(s.landscapes || []), id];
    s = toBuy(s);
    player(s).coins = coins; player(s).buys = Math.max(player(s).buys, 2);
    return act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: id });
};
const way = (s: any, cardId: string, wayId: string) => {
    s.landscapes = [...(s.landscapes || []), wayId];
    const c = player(s).hand.find(x => x.id === cardId)!;
    return act(s, 'p1', { type: 'PLAY_CARD', cardInstanceId: c.instanceId, wayId });
};

describe('Ménagerie — cartes', () => {
    it('Foire aux bestiaux : +4 💰, +1 Achat par pile vide ; peut s\'acheter en écartant une Action', () => {
        let s = toBuy(makeGame(['animal_fair', 'village']));
        player(s).hand = cards('village');
        player(s).coins = 0; player(s).buys = 2;
        s = buy(s, 'animal_fair');
        s = chooseOption(s, 0);
        s = chooseCards(s, ['village']);
        expect(ids(player(s).discardPile)).toEqual(['animal_fair']);
        expect(ids(s.trash)).toEqual(['village']);
    });

    it('Péniche : maintenant ou au prochain tour, +3 Cartes +1 Achat', () => {
        let s = makeGame(['barge']);
        player(s).hand = cards('barge');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'barge');
        s = chooseOption(s, 1);
        expect(player(s).hand.length).toBe(0);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(8);
        expect(player(s).buys).toBe(2);
    });

    it('Chat noir : jouable quand un autre joueur reçoit une Victoire, Malédiction aux autres', () => {
        let s = toBuy(makeGame(['black_cat']));
        player(s, 'p2').hand = cards('black_cat');
        player(s, 'p2').deck = cards(...filler());
        player(s).coins = 2; player(s).buys = 2;
        s = buy(s, 'estate');
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate']);
    });

    it('Chasseur de primes : exile une carte ; +3 💰 si pas de copie en Exil', () => {
        let s = makeGame(['bounty_hunter']);
        player(s).hand = cards('bounty_hunter', 'estate');
        s = play(s, 'bounty_hunter');
        s = chooseCards(s, ['estate']);
        expect(exiled(s)).toEqual(['estate']);
        expect(player(s).coins).toBe(3);
    });

    it('Caravane de chameaux : exile une carte non-Victoire ; reçue → exile un Or', () => {
        let s = toBuy(makeGame(['camel_train']));
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'camel_train');
        expect(exiled(s)).toEqual(['gold']);
    });

    it('Cardinal : +2 💰 ; chacun exile une carte à 3–6 et défausse le reste', () => {
        let s = makeGame(['cardinal']);
        player(s).hand = cards('cardinal');
        player(s, 'p2').deck = cards('silver', 'copper');
        s = play(s, 'cardinal');
        expect(exiled(s, 'p2')).toEqual(['silver']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['copper']);
    });

    it('Cavalerie : 2 Chevaux ; reçue en phase Achat → +2 Cartes +1 Achat et retour en phase Action', () => {
        let s = toBuy(makeGame(['cavalry']));
        player(s).coins = 4;
        player(s).deck = cards(...filler());
        s = buy(s, 'cavalry');
        expect(player(s).hand.length).toBe(2);
        expect(s.phase).toBe('ACTION');
    });

    it('Assemblée : chacun exile une Malédiction', () => {
        let s = makeGame(['coven']);
        player(s).hand = cards('coven');
        s = play(s, 'coven');
        expect(exiled(s, 'p2')).toEqual(['curse']);
    });

    it('Destrier / Pêcheur : coûts réduits pendant vos tours', () => {
        const s = makeGame(['destrier', 'fisherman']);
        player(s).gainedThisTurn = ['silver', 'silver'];
        expect(EconomyEngine.getCardCost(s, 'p1', 'destrier')).toBe(4);
        player(s).discardPile = [];
        expect(EconomyEngine.getCardCost(s, 'p1', 'fisherman')).toBe(2);
    });

    it('Déplacement : exile une carte, reçoit une carte d\'un autre nom jusqu\'à 2 de plus', () => {
        let s = makeGame(['displace', 'smithy']);
        player(s).hand = cards('displace', 'silver');
        s = play(s, 'displace');
        s = chooseCards(s, ['silver']);
        expect(() => chooseSupply(s, 'silver')).toThrow();
        s = chooseSupply(s, 'duchy');
        expect(exiled(s)).toEqual(['silver']);
    });

    it('Fauconnier : une carte moins chère en main ; jouable quand une carte à 2 types est reçue', () => {
        let s = makeGame(['falconer', 'smithy']);
        player(s).hand = cards('falconer');
        s = play(s, 'falconer');
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).hand)).toEqual(['smithy']);
    });

    it('Gardien de la porte : les autres exilent les Actions et Trésors qu\'ils reçoivent', () => {
        let s = makeGame(['gatekeeper']);
        player(s).hand = cards('gatekeeper');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'gatekeeper');
        s = endTurn(s);
        s = toBuy(s);
        player(s, 'p2').coins = 3; player(s, 'p2').buys = 2;
        s = buy(s, 'silver', 'p2');
        expect(exiled(s, 'p2')).toEqual(['silver']);
    });

    it('Palefrenier : Action → un Cheval ; Trésor → un Argent', () => {
        let s = makeGame(['groom', 'village']);
        player(s).hand = cards('groom');
        s = play(s, 'groom');
        s = chooseSupply(s, 'village');
        expect(ids(player(s).discardPile).sort()).toEqual(['horse', 'village']);
    });

    it('Cheval : +2 Cartes +1 Action, retourne sur sa pile', () => {
        let s = makeGame(['groom']);
        s.nonSupply.horse.count = 29;
        player(s).hand = cards('horse');
        player(s).deck = cards(...filler());
        s = play(s, 'horse');
        expect(player(s).hand.length).toBe(2);
        expect(s.nonSupply.horse.count).toBe(30);
    });

    it('Hôtellerie : reçue → défausse des Trésors pour autant de Chevaux', () => {
        let s = toBuy(makeGame(['hostelry']));
        player(s).hand = cards('copper', 'copper');
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'hostelry');
        s = chooseCards(s, ['copper', 'copper']);
        expect(ids(player(s).discardPile).filter(id => id === 'horse').length).toBe(2);
    });

    it('Four : la prochaine carte reçue, une copie en plus', () => {
        let s = makeGame(['kiln']);
        player(s).hand = cards('kiln');
        s = play(s, 'kiln');
        s = toBuy(s);
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['silver', 'silver']);
    });

    it('Écurie de louage : un Cheval par carte reçue à 4 💰 ou plus', () => {
        let s = makeGame(['livery']);
        player(s).hand = cards('livery');
        s = play(s, 'livery');
        s = toBuy(s);
        player(s).coins = 9; player(s).buys = 2;
        s = buy(s, 'gold');
        expect(ids(player(s).discardPile).sort()).toEqual(['gold', 'horse']);
    });

    it('Cerveau : au prochain tour, une Action jouée trois fois', () => {
        let s = makeGame(['mastermind', 'village']);
        player(s).hand = cards('mastermind');
        player(s).deck = cards('village', ...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'mastermind');
        s = untilTurnOf(s, 'p1');
        s = chooseCards(s, ['village']);
        expect(player(s).actions).toBe(7);
    });

    it('Enclos : +2 💰, 2 Chevaux, +1 Action par pile vide', () => {
        let s = makeGame(['paddock']);
        s.supply.estate.count = 0;
        player(s).hand = cards('paddock');
        s = play(s, 'paddock');
        expect(player(s).actions).toBe(1);
        expect(ids(player(s).discardPile)).toEqual(['horse', 'horse']);
    });

    it('Sanctuaire : +1 Carte +1 Action +1 Achat, peut exiler', () => {
        let s = makeGame(['sanctuary']);
        player(s).hand = cards('sanctuary', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'sanctuary');
        s = chooseCards(s, ['estate']);
        expect(exiled(s)).toEqual(['estate']);
    });

    it('Ferraille : un choix différent par 💰 du coût', () => {
        let s = makeGame(['scrap']);
        player(s).hand = cards('scrap', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'scrap');
        s = chooseCards(s, ['estate']);
        s = chooseOption(s, 3);   // +1 💰
        s = chooseOption(s, 3);   // then Silver (index shifts)
        expect(player(s).coins).toBe(1);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
    });

    it('Chien de berger : jouable quand vous recevez une carte', () => {
        let s = toBuy(makeGame(['sheepdog']));
        player(s).hand = cards('sheepdog');
        player(s).deck = cards(...filler());
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toEqual(['sheepdog']);
    });

    it('Traîneau : se défausse pour prendre la carte reçue en main', () => {
        let s = toBuy(makeGame(['sleigh']));
        player(s).hand = cards('sleigh');
        player(s).coins = 6; player(s).buys = 2;
        s = buy(s, 'gold');
        s = chooseOption(s, 0);
        s = chooseOption(s, 0);
        expect(ids(player(s).hand)).toEqual(['gold']);
    });

    it('Village enneigé : +4 Actions puis ignore les +Actions suivants', () => {
        let s = makeGame(['snowy_village', 'village']);
        player(s).hand = cards('snowy_village', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'snowy_village');
        s = play(s, 'village');
        expect(player(s).actions).toBe(3);
    });

    it('Réserves : 3 💰 +1 Achat, s\'exile', () => {
        let s = toBuy(makeGame(['stockpile']));
        player(s).hand = cards('stockpile');
        s = play(s, 'stockpile');
        expect(player(s).coins).toBe(3);
        expect(exiled(s)).toEqual(['stockpile']);
    });

    it('Provisions : 1 💰 et un Cheval sur la pioche', () => {
        let s = toBuy(makeGame(['supplies']));
        player(s).hand = cards('supplies');
        s = play(s, 'supplies');
        expect(player(s).deck[0].id).toBe('horse');
    });

    it('Pré communal : jouable quand défaussé hors Ajustement', () => {
        let s = makeGame(['village_green', 'oasis']);
        player(s).hand = cards('oasis', 'village_green');
        player(s).deck = cards(...filler());
        s = play(s, 'oasis');
        s = chooseCards(s, ['village_green']);
        s = chooseOption(s, 0);           // play it
        s = chooseOption(s, 0);           // now
        expect(player(s).actions).toBe(3);
    });

    it('Exil : en recevant une carte, on peut défausser ses copies exilées', () => {
        let s = toBuy(makeGame([]));
        getMat(player(s), 'exile').push(...cards('silver', 'silver'));
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        expect(exiled(s)).toEqual([]);
        expect(ids(player(s).discardPile).length).toBe(3);
    });
});

describe('Ménagerie — Voies et Événements', () => {
    it('Voie du mouton / du bœuf : remplacent les instructions de la carte', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy');
        s = way(s, 'smithy', 'way_of_the_sheep');
        expect(player(s).coins).toBe(2);
        expect(player(s).hand.length).toBe(0);
    });

    it('Voie du ver : exile un Domaine', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy');
        s = way(s, 'smithy', 'way_of_the_worm');
        expect(exiled(s)).toEqual(['estate']);
    });

    it('Voie de la tortue : mise de côté, jouée au prochain tour', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler());
        s = way(s, 'smithy', 'way_of_the_turtle');
        expect(ids(player(s).aside)).toEqual(['smithy']);
        s = untilTurnOf(s, 'p1');
        expect(player(s).hand.length).toBe(8);
    });

    it('Voie du papillon : remet la carte sur sa pile pour une carte coûtant exactement 1 de plus', () => {
        let s = makeGame(['village', 'smithy']);
        player(s).hand = cards('village');
        s = way(s, 'village', 'way_of_the_butterfly');
        s = chooseOption(s, 0);
        expect(s.supply.village.count).toBe(11);
        expect(() => chooseSupply(s, 'silver')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Voie du caméléon : +Cartes et +💰 sont échangés', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = way(s, 'smithy', 'way_of_the_chameleon');
        expect(player(s).coins).toBe(3);
        expect(player(s).hand.length).toBe(0);
    });

    it('Voie de la grenouille : +1 Action, la carte peut revenir sur la pioche au nettoyage', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = way(s, 'village', 'way_of_the_frog');
        expect(player(s).actions).toBe(1);
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('village');
    });

    it('Voie de l\'écureuil : +2 Cartes à la fin du tour', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village');
        player(s).deck = cards(...filler(20));
        s = way(s, 'village', 'way_of_the_squirrel');
        s = endTurn(s);
        expect(player(s).hand.length).toBe(7);
    });

    it('Voie du cheval : +2 Cartes +1 Action, la carte retourne sur sa pile', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = way(s, 'smithy', 'way_of_the_horse');
        expect(player(s).hand.length).toBe(2);
        expect(player(s).actions).toBe(1);
        expect(s.supply.smithy.count).toBe(11);
    });

    it('Voie de la taupe : +1 Action, défausse la main, +3 Cartes', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy', 'estate', 'estate');
        player(s).deck = cards(...filler());
        s = way(s, 'smithy', 'way_of_the_mole');
        expect(ids(player(s).hand)).toEqual(['copper', 'copper', 'copper']);
        expect(ids(player(s).discardPile)).toEqual(['estate', 'estate']);
        expect(player(s).actions).toBe(1);
    });

    it('Voies simples : singe, mule, loutre, bœuf, cochon, hibou, chameau', () => {
        const run = (wayId: string) => {
            let s = makeGame(['smithy']);
            player(s).hand = cards('smithy', 'estate');
            player(s).deck = cards(...filler());
            return way(s, 'smithy', wayId);
        };
        let s = run('way_of_the_monkey');
        expect([player(s).buys, player(s).coins]).toEqual([2, 1]);
        s = run('way_of_the_mule');
        expect([player(s).actions, player(s).coins]).toEqual([1, 1]);
        s = run('way_of_the_otter');
        expect(player(s).hand.length).toBe(3);
        s = run('way_of_the_ox');
        expect(player(s).actions).toBe(2);
        s = run('way_of_the_pig');
        expect([player(s).hand.length, player(s).actions]).toEqual([2, 1]);
        s = run('way_of_the_owl');
        expect(player(s).hand.length).toBe(6);
        s = run('way_of_the_camel');
        expect(exiled(s)).toEqual(['gold']);
    });

    it('Voie de la chèvre : écarte une carte de la main', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy', 'estate');
        s = way(s, 'smithy', 'way_of_the_goat');
        s = chooseCards(s, ['estate']);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Voie du rat : défausse un Trésor pour recevoir une copie', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy', 'copper');
        s = way(s, 'smithy', 'way_of_the_rat');
        s = chooseCards(s, ['copper']);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'smithy']);
    });

    it('Voie du phoque : +1 💰, les cartes reçues peuvent aller sur la pioche', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village');
        s = way(s, 'village', 'way_of_the_seal');
        expect(player(s).coins).toBe(1);
        s = toBuy(s);
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'silver');
        s = chooseOption(s, 0);
        expect(player(s).deck[0].id).toBe('silver');
    });

    it('Voie de la souris : joue la carte mise de côté à la mise en place', () => {
        let s = makeGame(['village']);
        (s.landscapeState as any).way_of_the_mouse = { state: { cardId: 'smithy' }, tokens: {} };
        player(s).hand = cards('village');
        player(s).deck = cards(...filler());
        s = way(s, 'village', 'way_of_the_mouse');
        expect(player(s).hand.length).toBe(3);
        expect(ids(player(s).playArea)).toEqual(['village']);
    });

    it('Bannissement : exile des cartes de même nom', () => {
        let s = makeGame([]);
        player(s).hand = cards('copper', 'copper', 'estate');
        s = event(s, 'banish', 4);
        s = chooseOption(s, 1); // 2 × Cuivre
        expect(exiled(s)).toEqual(['copper', 'copper']);
        expect(ids(player(s).hand)).toEqual(['estate']);
    });

    it('Retard : une Action mise de côté est jouée au prochain tour', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = event(s, 'delay', 0);
        s = chooseCards(s, ['village']);
        expect(ids(player(s).aside)).toEqual(['village']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toEqual(['village']);
        expect(player(s).hand.length).toBe(6);
    });

    it('Demande : un Cheval et une carte jusqu\'à 4, sur la pioche', () => {
        let s = makeGame(['smithy']);
        s.nonSupply.horse = { cardId: 'horse', count: 30, cards: [] } as any;
        s = event(s, 'demand', 5);
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).deck.slice(0, 2))).toEqual(['smithy', 'horse']);
    });

    it('Amélioration : écarte une non-Victoire pour une carte coûtant jusqu\'à 2 de plus', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('silver', 'estate');
        s = event(s, 'enhance', 3);
        expect(() => chooseCards(s, ['estate'])).toThrow();
        s = chooseCards(s, ['silver']);
        s = chooseSupply(s, 'village');
        expect(ids(s.trash)).toEqual(['silver']);
        expect(ids(player(s).discardPile)).toEqual(['village']);
    });

    it('Pari : dévoile la carte du dessus, la joue si c\'est un Trésor ou une Action', () => {
        let s = makeGame([]);
        player(s).deck = cards('silver', 'estate');
        s = event(s, 'gamble', 2);
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toEqual(['silver']);
        expect(player(s).coins).toBe(2);
        s = event(s, 'gamble', 2);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
    });

    it('Marche : joue une Action de la défausse', () => {
        let s = makeGame(['village']);
        player(s).discardPile = cards('village', 'estate');
        player(s).deck = cards(...filler());
        s = event(s, 'march', 3);
        s = chooseOption(s, 0);
        expect(ids(player(s).playArea)).toEqual(['village']);
    });

    it('Peuplement : une carte de chaque pile Action', () => {
        let s = makeGame(['village', 'smithy']);
        s = event(s, 'populate', 10);
        expect(ids(player(s).discardPile).sort()).toEqual(['smithy', 'village']);
    });

    it('Poursuite : garde les cartes nommées sur la pioche, défausse le reste', () => {
        let s = makeGame([]);
        player(s).deck = cards('gold', 'estate', 'gold', 'copper', 'silver');
        s = event(s, 'pursue', 2);
        s = choose(s, { type: 'NAMED_CARD', cardId: 'gold' });
        expect(ids(player(s).deck)).toEqual(['gold', 'gold', 'silver']);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate']);
    });

    it('Moisson : un Or mis de côté, joué au prochain tour', () => {
        let s = makeGame([]);
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = event(s, 'reap', 7);
        expect(ids(player(s).aside)).toEqual(['gold']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).playArea)).toEqual(['gold']);
        expect(player(s).coins).toBe(3);
    });

    it('Labeur : +1 Achat, peut jouer une Action de la main', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village');
        player(s).deck = cards(...filler());
        s = event(s, 'toil', 2);
        s = chooseCards(s, ['village']);
        expect(ids(player(s).playArea)).toEqual(['village']);
    });

    it('Transport : exile une Action de la réserve, ou en place une exilée sur la pioche', () => {
        let s = makeGame(['smithy']);
        s = event(s, 'transport', 3);
        s = chooseOption(s, 0);
        s = chooseOption(s, 0);
        expect(exiled(s)).toEqual(['smithy']);
        s = event(s, 'transport', 3);
        s = chooseOption(s, 1);
        expect(exiled(s)).toEqual([]);
        expect(player(s).deck[0].id).toBe('smithy');
    });

    it('Alliance : 6 cartes', () => {
        let s = makeGame([]);
        s = event(s, 'alliance', 10);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'duchy', 'estate', 'gold', 'province', 'silver']);
    });

    it('Chevauchée et Marchandage : des Chevaux', () => {
        let s = makeGame(['smithy']);
        s.nonSupply.horse = { cardId: 'horse', count: 30, cards: [] } as any;
        s = event(s, 'ride', 2);
        expect(ids(player(s).discardPile)).toEqual(['horse']);
        s = event(s, 'bargain', 4);
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile).sort()).toEqual(['horse', 'smithy']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['horse']);
    });

    it('Commerce : un Or par carte de nom différent reçue ce tour', () => {
        let s = makeGame([]);
        player(s).gainedThisTurn = ['silver', 'silver', 'estate'];
        s = event(s, 'commerce', 5);
        expect(ids(player(s).discardPile)).toEqual(['gold', 'gold']);
    });

    it('Désespoir : une Malédiction pour +1 Achat +2 💰, une fois par tour', () => {
        let s = makeGame([]);
        s = event(s, 'desperation', 0);
        s = chooseOption(s, 0);
        expect(player(s).coins).toBe(2);
        expect(() => act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: 'desperation' })).toThrow();
    });

    it('Enclave : un Or, exile un Duché', () => {
        let s = makeGame([]);
        s = event(s, 'enclave', 8);
        expect(exiled(s)).toEqual(['duchy']);
    });

    it('Ruée : 5 Chevaux sur la pioche si 5 cartes ou moins en jeu', () => {
        let s = makeGame([]);
        s.nonSupply.horse = { cardId: 'horse', count: 30, cards: [] } as any;
        s = event(s, 'stampede', 5);
        expect(ids(player(s).deck.slice(0, 5))).toEqual(['horse', 'horse', 'horse', 'horse', 'horse']);
    });

    it('Saisir le jour : un tour supplémentaire, une fois par partie', () => {
        let s = makeGame([]);
        player(s).deck = cards(...filler(20));
        s = event(s, 'seize_the_day', 4);
        expect(s.extraTurns.length).toBe(1);
    });

    it('Investissement : quand un autre joueur reçoit une copie exilée, +2 Cartes', () => {
        let s = makeGame(['smithy']);
        player(s).deck = cards(...filler());
        s = event(s, 'invest', 4);
        s = chooseOption(s, 0);
        expect(exiled(s)).toEqual(['smithy']);
        s = endTurn(s);
        s = toBuy(s);
        player(s, 'p2').coins = 4; player(s, 'p2').buys = 2;
        s = buy(s, 'smithy', 'p2');
        expect(player(s).hand.length).toBe(7);
    });
});
