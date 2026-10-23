/**
 * Renaissance: behaviour tests (Kingdom cards, Artifacts, Projects).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, untilTurnOf, act } from '../../helpers/play.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { EffectUtils } from '../../../shared/engine/EffectUtils.js';
import { getMat } from '../../../shared/engine/Mats.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const project = (s: any, id: string, coins = 10) => {
    s.landscapes = [...(s.landscapes || []), id];
    s = toBuy(s);
    player(s).coins = coins; player(s).buys = Math.max(player(s).buys, 2);
    return act(s, 'p1', { type: 'BUY_LANDSCAPE', landscapeId: id });
};

describe('Renaissance — cartes', () => {
    it('Troupe de théâtre : +4 Villageois et s\'écarte', () => {
        let s = makeGame(['acting_troupe']);
        player(s).hand = cards('acting_troupe');
        s = play(s, 'acting_troupe');
        expect(player(s).villagers).toBe(4);
        expect(ids(s.trash)).toEqual(['acting_troupe']);
    });

    it('Garde-frontière : 2 cartes dévoilées, une en main ; 2 Actions → Lanterne ou Cor', () => {
        let s = makeGame(['border_guard', 'village']);
        player(s).hand = cards('border_guard');
        player(s).deck = cards('village', 'smithy', ...filler());
        s = play(s, 'border_guard');
        s = chooseOption(s, 0);
        s = chooseOption(s, 0);                  // Lantern
        expect(player(s).artifacts).toContain('lantern');
        expect(player(s).hand.length).toBe(1);
        expect(player(s).discardPile.length).toBe(1);
    });

    it('Cargo : une carte reçue ce tour mise de côté, en main au prochain tour', () => {
        let s = makeGame(['cargo_ship', 'smithy']);
        player(s).hand = cards('cargo_ship');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'cargo_ship');
        s = toBuy(s);
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'smithy');
        s = chooseOption(s, 0);
        expect(ids(getMat(player(s), 'cargo_ship'))).toEqual(['smithy']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand)).toContain('smithy');
    });

    it('Ducat : +1 Coffre +1 Achat ; reçu → peut écarter un Cuivre', () => {
        let s = toBuy(makeGame(['ducat']));
        player(s).hand = cards('copper');
        player(s).coins = 2; player(s).buys = 2;
        s = buy(s, 'ducat');
        s = chooseCards(s, ['copper']);
        expect(ids(s.trash)).toEqual(['copper']);
    });

    it('Expérience : reçue, on en reçoit une autre (une seule)', () => {
        let s = toBuy(makeGame(['experiment']));
        player(s).coins = 3; player(s).buys = 2;
        s = buy(s, 'experiment');
        expect(ids(player(s).discardPile)).toEqual(['experiment', 'experiment']);
    });

    it('Porte-drapeau : reçu → prend le Drapeau (+1 Carte pour la nouvelle main)', () => {
        let s = toBuy(makeGame(['flag_bearer']));
        player(s).coins = 4;
        player(s).deck = cards(...filler(20));
        s = buy(s, 'flag_bearer');
        expect(player(s).artifacts).toContain('flag');
        expect(player(s).hand.length).toBe(6);
    });

    it('Planque : écarter une Victoire donne une Malédiction', () => {
        let s = makeGame(['hideout']);
        player(s).hand = cards('hideout', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'hideout');
        s = chooseCards(s, ['estate']);
        expect(ids(player(s).discardPile)).toEqual(['curse']);
    });

    it('Amélioration : en fin de tour, écarte une Action pour une carte à +1', () => {
        let s = makeGame(['improve', 'smithy', 'remodel']);
        player(s).hand = cards('improve');
        player(s).deck = cards(...filler(20));
        s = play(s, 'improve');
        expect(player(s).coins).toBe(2);
        s = toBuy(s);
        s = act(s, 'p1', { type: 'END_PHASE' });
        s = chooseOption(s, 0);                  // trash Improve (3) → gain a $4
        s = chooseSupply(s, 'smithy');
        expect(ids(s.trash)).toEqual(['improve']);
    });

    it('Inventeur : une carte jusqu\'à 4, puis les cartes coûtent 1 de moins', () => {
        let s = makeGame(['inventor', 'smithy']);
        player(s).hand = cards('inventor');
        s = play(s, 'inventor');
        s = chooseSupply(s, 'smithy');
        expect(EconomyEngine.getCardCost(s, 'p1', 'gold')).toBe(5);
    });

    it('Laquais : +2 Cartes ; reçu → +2 Villageois', () => {
        let s = toBuy(makeGame(['lackeys']));
        player(s).coins = 2;
        player(s).deck = cards(...filler());
        s = buy(s, 'lackeys');
        expect(player(s).villagers).toBe(2);
    });

    it('Village de montagne : prend une carte de la défausse, sinon +1 Carte', () => {
        let s = makeGame(['mountain_village']);
        player(s).hand = cards('mountain_village');
        player(s).discardPile = cards('gold');
        s = play(s, 'mountain_village');
        s = chooseCards(s, ['gold'], 'discardPile');
        expect(ids(player(s).hand)).toEqual(['gold']);
    });

    it('Mécène : +1 Villageois +2 💰 ; dévoilé → +1 Coffre', () => {
        let s = makeGame(['patron']);
        player(s).hand = cards('patron');
        s = play(s, 'patron');
        expect(player(s).villagers).toBe(1);
        const p = player(s);
        p.hand = cards('patron');
        EffectUtils.revealCards(s, p.hand, 'ALL', 'test');
        expect(p.coffers).toBe(1);
    });

    it('Prêtre : +2 💰, écarte une carte, puis +2 💰 par carte écartée ce tour', () => {
        let s = makeGame(['priest', 'chapel']);
        player(s).hand = cards('priest', 'estate', 'chapel', 'copper', 'copper');
        s = play(s, 'priest');
        s = chooseCards(s, ['estate']);
        expect(player(s).coins).toBe(2);
        player(s).actions = 1;
        s = play(s, 'chapel');
        s = chooseCards(s, ['copper', 'copper']);
        expect(player(s).coins).toBe(6);
    });

    it('Recruteur : +1 Villageois par 💰 du coût de la carte écartée', () => {
        let s = makeGame(['recruiter']);
        player(s).hand = cards('recruiter', 'gold');
        player(s).deck = cards(...filler());
        s = play(s, 'recruiter');
        s = chooseCards(s, ['gold']);
        expect(player(s).villagers).toBe(6);
    });

    it('Recherche : met de côté une carte par 💰, en main au prochain tour', () => {
        let s = makeGame(['research']);
        player(s).hand = cards('research', 'estate');
        player(s).deck = cards('gold', 'gold', ...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'research');
        s = chooseCards(s, ['estate']);
        expect(getMat(player(s), 'research').length).toBe(2);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand).filter(id => id === 'gold').length).toBe(2);
    });

    it('Sceptre : +2 💰 ou rejouer une Action en jeu', () => {
        let s = makeGame(['scepter', 'village']);
        player(s).hand = cards('village', 'scepter');
        player(s).deck = cards(...filler());
        s = play(s, 'village');
        s = toBuy(s);
        s = play(s, 'scepter');
        s = chooseOption(s, 1);
        expect(player(s).actions).toBe(4);
    });

    it('Érudit : défausse la main, +7 Cartes', () => {
        let s = makeGame(['scholar']);
        player(s).hand = cards('scholar', 'estate');
        player(s).deck = cards(...filler());
        s = play(s, 'scholar');
        expect(player(s).hand.length).toBe(7);
    });

    it('Sculpteur : une carte jusqu\'à 4 en main ; Trésor → +1 Villageois', () => {
        let s = makeGame(['sculptor']);
        player(s).hand = cards('sculptor');
        s = play(s, 'sculptor');
        s = chooseSupply(s, 'silver');
        expect(ids(player(s).hand)).toEqual(['silver']);
        expect(player(s).villagers).toBe(1);
    });

    it('Voyant : les cartes coûtant de 2 à 4 en main, le reste remis', () => {
        let s = makeGame(['seer']);
        player(s).hand = cards('seer');
        player(s).deck = cards('copper', 'silver', 'gold', 'estate', ...filler());
        s = play(s, 'seer');
        if (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(ids(player(s).hand).sort()).toEqual(['copper', 'estate', 'silver']);
        expect(player(s).deck[0].id).toBe('gold');
    });

    it('Marchand de soie : reçu → +1 Coffre +1 Villageois', () => {
        let s = toBuy(makeGame(['silk_merchant']));
        player(s).coins = 4;
        player(s).deck = cards(...filler());
        s = buy(s, 'silk_merchant');
        expect([player(s).coffers, player(s).villagers]).toEqual([1, 1]);
    });

    it('Épices : 2 💰 +1 Achat ; reçues → +2 Coffres', () => {
        let s = toBuy(makeGame(['spices']));
        player(s).coins = 5;
        player(s).deck = cards(...filler());
        s = buy(s, 'spices');
        expect(player(s).coffers).toBe(2);
    });

    it('Bretteur : +3 Cartes, +1 Coffre, Coffre au trésor à 4 Coffres', () => {
        let s = makeGame(['swashbuckler']);
        player(s).hand = cards('swashbuckler');
        player(s).deck = cards(...filler());
        player(s).discardPile = cards('estate');
        player(s).coffers = 3;
        s = play(s, 'swashbuckler');
        expect(player(s).coffers).toBe(4);
        expect(player(s).artifacts).toContain('treasure_chest');
    });

    it('Trésorier : +3 💰 ; prendre la Clé (+1 💰 au début de chaque tour)', () => {
        let s = makeGame(['treasurer']);
        player(s).hand = cards('treasurer');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'treasurer');
        s = chooseOption(s, s.pendingDecision!.options!.length - 1);
        expect(player(s).artifacts).toContain('key');
        s = untilTurnOf(s, 'p1');
        expect(player(s).coins).toBe(1);
    });

    it('Scélérat : +2 Coffres ; les autres (5+ cartes) défaussent une carte à 2 💰 ou plus', () => {
        let s = makeGame(['villain']);
        player(s).hand = cards('villain');
        player(s, 'p2').hand = cards('silver', 'copper', 'copper', 'copper', 'copper');
        s = play(s, 'villain');
        expect(player(s).coffers).toBe(2);
        s = chooseCards(s, ['silver']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['silver']);
    });
});

describe('Renaissance — Projets', () => {
    it('Caserne / Foire : au début du tour, +1 Action / +1 Achat', () => {
        let s = makeGame([]);
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = project(s, 'barracks', 6);
        expect(player(s).projects).toContain('barracks');
        s = untilTurnOf(s, 'p1');
        expect(player(s).actions).toBe(2);
    });

    it('Canal : pendant vos tours, les cartes coûtent 1 de moins', () => {
        const s = makeGame([]);
        player(s).projects = ['canal'];
        expect(EconomyEngine.getCardCost(s, 'p1', 'gold')).toBe(5);
    });

    it('Citadelle : la première Action jouée est rejouée', () => {
        let s = makeGame(['smithy']);
        player(s).projects = ['citadel'];
        player(s).hand = cards('smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'smithy');
        expect(player(s).hand.length).toBe(6);
    });

    it('Hôtel de la guilde / Académie : Coffre par Trésor reçu, Villageois par Action reçue', () => {
        let s = toBuy(makeGame(['smithy']));
        player(s).projects = ['guildhall', 'academy'];
        player(s).coins = 20; player(s).buys = 3;
        s = buy(s, 'silver');
        s = buy(s, 'smithy');
        expect(player(s).coffers).toBe(1);
        expect(player(s).villagers).toBe(1);
    });

    it('Égouts : quand vous écartez une carte, vous pouvez en écarter une autre', () => {
        let s = makeGame(['chapel']);
        player(s).projects = ['sewers'];
        player(s).hand = cards('chapel', 'estate', 'curse');
        s = play(s, 'chapel');
        s = chooseCards(s, ['estate']);
        s = chooseCards(s, ['curse']);
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
    });

    it('Exploration : sans achat, +1 Coffre +1 Villageois en fin de phase Achat', () => {
        let s = toBuy(makeGame([]));
        player(s).projects = ['exploration'];
        player(s).deck = cards(...filler());
        s = act(s, 'p1', { type: 'END_PHASE' });
        expect([player(s).coffers, player(s).villagers]).toEqual([1, 1]);
    });

    it('Réseau routier : quand un autre joueur reçoit une carte Victoire, +1 Carte', () => {
        let s = toBuy(makeGame([]));
        player(s, 'p2').projects = ['road_network'];
        player(s, 'p2').deck = cards(...filler());
        player(s).coins = 2; player(s).buys = 2;
        s = buy(s, 'estate');
        expect(player(s, 'p2').hand.length).toBe(1);
    });

    it('Complot : un jeton par tour, ou +1 Carte par jeton', () => {
        let s = makeGame([]);
        player(s).projects = ['sinister_plot'];
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler(30));
        s = untilTurnOf(s, 'p2');
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 0);
        expect((player(s) as any).sinisterPlot).toBe(1);
    });

    it('Flotte : un tour supplémentaire après la fin de la partie', () => {
        let s = toBuy(makeGame([]));
        player(s, 'p2').projects = ['fleet'];
        s.supply.province.count = 1;
        player(s).coins = 8; player(s).deck = cards(...filler()); player(s, 'p2').deck = cards(...filler());
        s = buy(s, 'province');
        expect(s.isGameOver).toBeFalsy();
        expect(s.players[s.currentPlayerIndex].id).toBe('p2');
        s = endTurn(s);
        expect(s.isGameOver).toBe(true);
    });
});
