/**
 * Dark Ages: behaviour tests following the official card texts.
 * (Knights: Knights.test.ts; setup: DarkAgesSetup.test.ts)
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn } from '../../helpers/play.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const pass = (s: any) => choose(s, { type: 'CARDS', cardInstanceIds: [] });
const withPiles = (s: any) => {
    s.nonSupply = s.nonSupply || {};
    s.nonSupply.spoils = { cardId: 'spoils', count: 15, cards: [] };
    s.nonSupply.madman = { cardId: 'madman', count: 10, cards: [] };
    s.nonSupply.mercenary = { cardId: 'mercenary', count: 10, cards: [] };
    s.supply.ruins = { cardId: 'ruins', count: 10, cards: [] };
    return s;
};

describe('Âge des Ténèbres', () => {
    it('Autel : écarte une carte, reçoit une carte jusqu\'à 5', () => {
        let s = makeGame(['altar', 'market']);
        player(s).hand = cards('altar', 'estate');
        s = play(s, 'altar');
        s = chooseCards(s, ['estate']);
        s = chooseSupply(s, 'market');
        expect(ids(player(s).discardPile)).toEqual(['market']);
    });

    it('Armurerie : une carte jusqu\'à 4 sur la pioche', () => {
        let s = makeGame(['armory', 'smithy']);
        player(s).hand = cards('armory');
        s = play(s, 'armory');
        s = chooseSupply(s, 'smithy');
        expect(player(s).deck[0].id).toBe('smithy');
    });

    it('Bande de marginaux : joue une Action de la réserve moins chère, qui y reste', () => {
        let s = makeGame(['band_of_misfits', 'smithy', 'market']);
        player(s).hand = cards('band_of_misfits');
        player(s).deck = cards(...filler());
        s = play(s, 'band_of_misfits');
        expect(() => chooseSupply(s, 'market')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(player(s).hand.length).toBe(3);
        expect(s.supply.smithy.count).toBe(10);
    });

    it('Camp de bandits : +1 Carte +2 Actions, reçoit un Butin', () => {
        let s = withPiles(makeGame(['bandit_camp']));
        player(s).hand = cards('bandit_camp');
        player(s).deck = cards(...filler());
        s = play(s, 'bandit_camp');
        expect(ids(player(s).discardPile)).toEqual(['spoils']);
        expect(player(s).actions).toBe(2);
    });

    it('Mendiant : 3 Cuivres en main ; en réaction, se défausse pour 2 Argents', () => {
        let s = makeGame(['beggar', 'witch']);
        player(s).hand = cards('beggar');
        s = play(s, 'beggar');
        expect(ids(player(s).hand)).toEqual(['copper', 'copper', 'copper']);

        s = makeGame(['beggar', 'witch']);
        player(s).hand = cards('witch');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('beggar');
        s = play(s, 'witch');
        s = chooseCards(s, ['beggar']);
        for (let i = 0; i < 3 && s.pendingDecision; i++) s = pass(s);
        expect(player(s, 'p2').deck[0].id).toBe('silver');
        expect(ids(player(s, 'p2').discardPile).sort()).toEqual(['beggar', 'curse', 'silver']);
    });

    it('Catacombes : prendre les 3 cartes, ou les défausser pour +3 Cartes ; écartées → une carte moins chère', () => {
        let s = makeGame(['catacombs']);
        player(s).hand = cards('catacombs');
        player(s).deck = cards('estate', 'estate', 'curse', 'gold', 'gold', 'gold');
        s = play(s, 'catacombs');
        s = chooseOption(s, 1);
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate', 'estate']);
        expect(ids(player(s).hand)).toEqual(['gold', 'gold', 'gold']);

        s = makeGame(['catacombs', 'chapel', 'smithy']);
        player(s).hand = cards('chapel', 'catacombs');
        s = play(s, 'chapel');
        s = chooseCards(s, ['catacombs']);
        expect(() => chooseSupply(s, 'catacombs')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Comte : deux choix (ici : un Cuivre, puis écarter la main)', () => {
        let s = makeGame(['count']);
        player(s).hand = cards('count', 'estate', 'curse');
        s = play(s, 'count');
        s = chooseOption(s, 2);
        s = chooseOption(s, 1);
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
        expect(ids(player(s).discardPile)).toEqual(['copper']);
    });

    it('Contrefaçon : 1 💰 +1 Achat, joue un Trésor deux fois puis l\'écarte', () => {
        let s = toBuy(makeGame(['counterfeit']));
        player(s).hand = cards('counterfeit', 'gold');
        s = play(s, 'counterfeit');
        s = chooseCards(s, ['gold']);
        expect(player(s).coins).toBe(7);
        expect(player(s).buys).toBe(2);
        expect(ids(s.trash)).toEqual(['gold']);
    });

    it('Cultiste : +2 Cartes, Ruine aux autres, peut enchaîner un Cultiste ; écarté → +3 Cartes', () => {
        let s = withPiles(makeGame(['cultist']));
        player(s).hand = cards('cultist', 'cultist');
        player(s).deck = cards(...filler());
        s = play(s, 'cultist');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['ruins']);
        s = chooseCards(s, ['cultist']);
        expect(ids(player(s).playArea)).toEqual(['cultist', 'cultist']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['ruins', 'ruins']);
    });

    it('Chariot funèbre : +5 💰, écarte une Action ou lui-même ; reçu → 2 Ruines', () => {
        let s = withPiles(makeGame(['death_cart']));
        player(s).hand = cards('death_cart');
        s = play(s, 'death_cart');
        expect(player(s).coins).toBe(5);
        expect(ids(s.trash)).toEqual(['death_cart']);
        s = withPiles(toBuy(makeGame(['death_cart'])));
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'death_cart');
        expect(ids(player(s).discardPile).sort()).toEqual(['death_cart', 'ruins', 'ruins']);
    });

    it('Fief : 1 PV par 3 Argents ; écarté → 3 Argents', () => {
        const s = makeGame(['feodum']);
        const p = player(s);
        p.hand = cards('feodum', 'silver', 'silver', 'silver', 'silver', 'silver', 'silver');
        p.deck = []; p.discardPile = []; p.vpTokens = 0;
        expect(VictoryChecker.scorePlayer(s, p)).toBe(2);
    });

    it('Fourrageur : +1 Action +1 Achat, écarte, +1 💰 par Trésor différent dans le rebut', () => {
        let s = makeGame(['forager']);
        s.trash = cards('copper', 'silver', 'silver');
        player(s).hand = cards('forager', 'copper');
        s = play(s, 'forager');
        s = chooseCards(s, ['copper']);
        expect(player(s).coins).toBe(2);
    });

    it('Forteresse : écartée, elle revient en main', () => {
        let s = makeGame(['fortress', 'chapel']);
        player(s).hand = cards('chapel', 'fortress');
        s = play(s, 'chapel');
        s = chooseCards(s, ['fortress']);
        expect(ids(player(s).hand)).toEqual(['fortress']);
        expect(s.trash.length).toBe(0);
    });

    it('Ermite : écarte une non-Trésor (main ou défausse), reçoit une carte jusqu\'à 3 ; sans achat, devient un Fou', () => {
        let s = withPiles(makeGame(['hermit', 'village']));
        player(s).hand = cards('hermit');
        player(s).discardPile = cards('estate');
        player(s).deck = cards(...filler());
        s = play(s, 'hermit');
        s = chooseOption(s, 0);
        expect(ids(s.trash)).toEqual(['estate']);
        s = chooseSupply(s, 'village');
        s = toBuy(s);
        s = endTurn(s);
        expect(ids(s.trash)).toEqual(['estate', 'hermit']);
        expect(ids([...player(s).hand, ...player(s).discardPile, ...player(s).deck])).toContain('madman');
    });

    it('Fou : +2 Actions, retourne sur sa pile, +1 Carte par carte en main', () => {
        let s = withPiles(makeGame([]));
        s.nonSupply.madman.count = 9;
        player(s).hand = cards('madman', 'copper', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'madman');
        expect(player(s).actions).toBe(2);
        expect(s.nonSupply.madman.count).toBe(10);
        expect(player(s).hand.length).toBe(4);
    });

    it('Terrains de chasse : +4 Cartes ; écartés → un Duché ou 3 Domaines', () => {
        let s = makeGame(['hunting_grounds', 'chapel']);
        player(s).hand = cards('chapel', 'hunting_grounds');
        s = play(s, 'chapel');
        s = chooseCards(s, ['hunting_grounds']);
        s = chooseOption(s, 1);
        expect(ids(player(s).discardPile)).toEqual(['estate', 'estate', 'estate']);
    });

    it('Ferronnier : dévoile la carte du dessus, peut la défausser, bonus selon son type', () => {
        let s = makeGame(['ironmonger']);
        player(s).hand = cards('ironmonger');
        player(s).deck = cards('copper', 'silver', ...filler());
        s = play(s, 'ironmonger');
        s = chooseOption(s, 0);
        expect(player(s).coins).toBe(1);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
    });

    it('Brocanteur : +1 Carte +1 Action +1 💰, écarte une carte', () => {
        let s = makeGame(['junk_dealer']);
        player(s).hand = cards('junk_dealer', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'junk_dealer');
        s = chooseCards(s, ['estate']);
        expect(player(s).coins).toBe(1);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Maraudeur : un Butin, Ruine aux autres', () => {
        let s = withPiles(makeGame(['marauder']));
        player(s).hand = cards('marauder');
        s = play(s, 'marauder');
        expect(ids(player(s).discardPile)).toEqual(['spoils']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['ruins']);
    });

    it('Place du marché : quand une de vos cartes est écartée, se défausse pour un Or', () => {
        let s = makeGame(['market_square', 'chapel']);
        player(s).hand = cards('chapel', 'estate', 'market_square');
        s = play(s, 'chapel');
        s = chooseCards(s, ['estate']);
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile).sort()).toEqual(['gold', 'market_square']);
    });

    it('Mercenaire : écarte 2 cartes pour +2 Cartes +2 💰 et une attaque', () => {
        let s = withPiles(makeGame([]));
        player(s).hand = cards('mercenary', 'estate', 'curse');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper', 'copper');
        s = play(s, 'mercenary');
        s = chooseCards(s, ['estate', 'curse']);
        expect(player(s).coins).toBe(2);
        expect(player(s).hand.length).toBe(2);
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s, 'p2').hand.length).toBe(3);
    });

    it('Mystique : +1 Action +2 💰, nomme une carte et la prend si c\'est celle du dessus', () => {
        let s = makeGame(['mystic']);
        player(s).hand = cards('mystic');
        player(s).deck = cards('gold', ...filler());
        s = play(s, 'mystic');
        s = choose(s, { type: 'NAMED_CARD', cardId: 'gold' });
        expect(ids(player(s).hand)).toEqual(['gold']);
    });

    it('Pillage : s\'écarte, 2 Butins, les autres (5+ cartes) défaussent la carte choisie', () => {
        let s = withPiles(makeGame(['pillage']));
        player(s).hand = cards('pillage');
        player(s, 'p2').hand = cards('gold', 'copper', 'copper', 'copper', 'copper');
        s = play(s, 'pillage');
        expect(s.pendingDecision?.playerId).toBe('p1');
        s = chooseOption(s, 0);   // Gold
        expect(ids(player(s, 'p2').discardPile)).toEqual(['gold']);
        expect(ids(player(s).discardPile)).toEqual(['spoils', 'spoils']);
        expect(ids(s.trash)).toEqual(['pillage']);
    });

    it('Hospice : +4 💰 moins 1 par Trésor en main', () => {
        let s = makeGame(['poor_house']);
        player(s).hand = cards('poor_house', 'copper', 'estate');
        s = play(s, 'poor_house');
        expect(player(s).coins).toBe(3);
    });

    it('Procession : joue une Action deux fois, l\'écarte, reçoit une Action coûtant 1 de plus', () => {
        let s = makeGame(['procession', 'village', 'smithy']);
        player(s).hand = cards('procession', 'village');
        player(s).deck = cards(...filler());
        s = play(s, 'procession');
        s = chooseCards(s, ['village']);
        expect(player(s).actions).toBe(4);
        s = chooseSupply(s, 'smithy');
        expect(ids(s.trash)).toEqual(['village']);
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Rats : +1 Carte +1 Action, un Rats, écarte une carte autre que Rats ; écarté → +1 Carte', () => {
        let s = makeGame(['rats']);
        player(s).hand = cards('rats', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'rats');
        s = chooseCards(s, ['estate']);
        expect(ids(player(s).discardPile)).toEqual(['rats']);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Reconstruction : écarte la première Victoire non nommée, reçoit une Victoire jusqu\'à 3 de plus', () => {
        let s = makeGame(['rebuild']);
        player(s).hand = cards('rebuild');
        player(s).deck = cards('copper', 'estate', 'duchy', ...filler());
        s = play(s, 'rebuild');
        s = choose(s, { type: 'NAMED_CARD', cardId: 'estate' });
        expect(ids(s.trash)).toEqual(['duchy']);
        s = chooseSupply(s, 'province');
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate', 'province']);
    });

    it('Voleur : prend une carte 3–6 du rebut, sinon attaque', () => {
        let s = makeGame(['rogue']);
        s.trash = cards('silver');
        player(s).hand = cards('rogue');
        s = play(s, 'rogue');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
        expect(s.trash.length).toBe(0);

        s = makeGame(['rogue']);
        player(s).hand = cards('rogue');
        player(s, 'p2').deck = cards('copper', 'gold');
        s = play(s, 'rogue');
        expect(ids(s.trash)).toEqual(['gold']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['copper']);
    });

    it('Sage : +1 Action, pioche la première carte coûtant 3 ou plus', () => {
        let s = makeGame(['sage']);
        player(s).hand = cards('sage');
        player(s).deck = cards('copper', 'estate', 'silver', 'gold');
        s = play(s, 'sage');
        expect(ids(player(s).hand)).toEqual(['silver']);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate']);
    });

    it('Charognard : +2 💰, peut défausser sa pioche, met une carte de la défausse dessus', () => {
        let s = makeGame(['scavenger']);
        player(s).hand = cards('scavenger');
        player(s).deck = cards('estate', 'estate');
        player(s).discardPile = cards('gold');
        s = play(s, 'scavenger');
        s = chooseOption(s, 0);
        s = chooseCards(s, ['gold'], 'discardPile');
        expect(ids(player(s).deck)).toEqual(['gold']);
        expect(player(s).coins).toBe(2);
    });

    it('Butin : 3 💰 et retourne sur sa pile', () => {
        let s = withPiles(toBuy(makeGame([])));
        s.nonSupply.spoils.count = 14;
        player(s).hand = cards('spoils');
        s = play(s, 'spoils');
        expect(player(s).coins).toBe(3);
        expect(s.nonSupply.spoils.count).toBe(15);
        expect(player(s).playArea.length).toBe(0);
    });

    it('Écuyer : +1 💰 et un choix ; écarté → une carte Attaque', () => {
        let s = makeGame(['squire', 'chapel', 'witch']);
        player(s).hand = cards('chapel', 'squire');
        s = play(s, 'chapel');
        s = chooseCards(s, ['squire']);
        s = chooseSupply(s, 'witch');
        expect(ids(player(s).discardPile)).toEqual(['witch']);
    });

    it('Réserve : défausse puis pioche autant, puis défausse pour +1 💰 chacune', () => {
        let s = makeGame(['storeroom']);
        player(s).hand = cards('storeroom', 'estate', 'estate');
        player(s).deck = cards('copper', 'copper', ...filler());
        s = play(s, 'storeroom');
        s = chooseCards(s, ['estate', 'estate']);
        s = chooseCards(s, ['copper']);
        expect(player(s).coins).toBe(1);
        expect(player(s).buys).toBe(2);
    });

    it('Gamin des rues : les autres défaussent jusqu\'à 4 ; peut devenir Mercenaire', () => {
        let s = withPiles(makeGame(['urchin', 'militia']));
        player(s).hand = cards('urchin', 'militia');
        player(s).deck = cards(...filler());
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'copper', 'copper');
        s = play(s, 'urchin');
        s = chooseCards(s, ['copper']);
        expect(player(s, 'p2').hand.length).toBe(4);
        s = play(s, 'militia');
        s = chooseOption(s, 0);
        expect(ids(s.trash)).toEqual(['urchin']);
        expect(ids(player(s).discardPile)).toContain('mercenary');
    });

    it('Vagabond : +1 Carte +1 Action, prend la carte du dessus si Victoire/Malédiction/Ruine/Abri', () => {
        let s = makeGame(['vagrant']);
        player(s).hand = cards('vagrant');
        player(s).deck = cards('copper', 'estate', ...filler());
        s = play(s, 'vagrant');
        expect(ids(player(s).hand)).toEqual(['copper', 'estate']);
    });

    it('Ménestrel errant : +1 Carte +2 Actions, remet les Actions, défausse le reste', () => {
        let s = makeGame(['wandering_minstrel', 'village']);
        player(s).hand = cards('wandering_minstrel');
        player(s).deck = cards('copper', 'village', 'estate', 'smithy', 'gold');
        s = play(s, 'wandering_minstrel');
        if (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(ids(player(s).deck.slice(0, 2)).sort()).toEqual(['smithy', 'village']);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
    });

    it('Survivants : défausse les 2 cartes du dessus ou les remet', () => {
        let s = makeGame([]);
        player(s).hand = cards('survivors');
        player(s).deck = cards('estate', 'curse', 'gold');
        s = play(s, 'survivors');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'estate']);
        expect(ids(player(s).deck)).toEqual(['gold']);
    });

    it('Abris : Nécropole +2 Actions ; Domaine luxuriant écarté → +1 Carte', () => {
        let s = makeGame(['chapel']);
        player(s).hand = cards('necropolis');
        s = play(s, 'necropolis');
        expect(player(s).actions).toBe(2);
        s = makeGame(['chapel']);
        player(s).hand = cards('chapel', 'overgrown_estate');
        player(s).deck = cards(...filler());
        s = play(s, 'chapel');
        s = chooseCards(s, ['overgrown_estate']);
        expect(player(s).hand.length).toBe(1);
    });
});
