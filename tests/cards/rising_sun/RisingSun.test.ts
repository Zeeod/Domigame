/**
 * Rising Sun: Kingdom cards, Omens / Sun tokens, Prophecies and Shadows (2024 rulebook).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, endTurn, endPhase, act, untilTurnOf } from '../../helpers/play.js';
import { EconomyEngine } from '../../../shared/engine/EconomyEngine.js';
import { ProphecyManager } from '../../../shared/engine/ProphecyManager.js';
import { SupplyGenerator } from '../../../shared/engine/SupplyGenerator.js';
import { EffectUtils } from '../../../shared/engine/EffectUtils.js';
import { getMat } from '../../../shared/engine/Mats.js';
import { setupRisingSun } from '../../../shared/engine/expansions/RisingSunCards.js';
import { CardRegistry } from '../../../shared/cards/index.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');
const options = (s: any, ...idx: number[]) => choose(s, { type: 'OPTIONS', optionIndices: idx });
/** A game using this Prophecy with `sun` Sun tokens left (0 = it has happened). */
const withProphecy = (kingdom: string[], id: string, sun = 0) => {
    const s = makeGame(kingdom);
    s.landscapes = [id];
    setupRisingSun(s);
    s.landscapeState[id].tokens.sun = sun;
    return s;
};
const sun = (s: any) => ProphecyManager.sun(s);

describe('Soleil Levant — cartes Royaume', () => {
    it('Allée : +1 Carte, +1 Action, défaussez une carte', () => {
        let s = makeGame(['alley']);
        player(s).hand = cards('alley', 'estate', 'village');
        player(s).deck = cards('copper');
        s = play(s, 'alley');
        s = chooseCards(s, ['estate']);
        expect(ids(player(s).hand).sort()).toEqual(['copper', 'village']);
        expect(player(s).actions).toBe(1);
    });

    it('Aristocrate : l\'effet dépend du nombre d\'Aristocrates en jeu', () => {
        let s = makeGame(['aristocrat']);
        player(s).hand = cards('aristocrat', 'aristocrat', 'aristocrat');
        player(s).deck = cards(...filler(6));
        s = play(s, 'aristocrat'); // 1 → +3 Actions
        expect(player(s).actions).toBe(3);
        s = play(s, 'aristocrat'); // 2 → +3 Cards
        expect(player(s).hand.length).toBe(4);
        s = play(s, 'aristocrat'); // 3 → +$3
        expect(player(s).coins).toBe(3);
        expect(player(s).actions).toBe(1);
    });

    it('Artiste : coûte 8 Dettes ; +1 Carte par carte en un seul exemplaire en jeu', () => {
        let s = makeGame(['artist', 'village']);
        expect(CardRegistry.get('artist')!.debtCost).toBe(8);
        player(s).playArea = cards('village', 'copper', 'copper', 'silver');
        player(s).hand = cards('artist');
        player(s).deck = cards(...filler(6));
        s = play(s, 'artist');
        // village, silver, artist: 3 cards with exactly one copy
        expect(player(s).hand.length).toBe(3);
        expect(player(s).actions).toBe(1);
    });

    it('Changement : avec des Dettes, +3 💰 ; sinon écarte, reçoit plus cher et prend la différence en Dettes', () => {
        let s = makeGame(['change']);
        player(s).debt = 1;
        player(s).hand = cards('change', 'copper');
        s = play(s, 'change');
        expect(player(s).coins).toBe(3);
        s = makeGame(['change']);
        player(s).hand = cards('change', 'copper', 'estate');
        s = play(s, 'change');
        s = chooseCards(s, ['copper']);
        expect(() => chooseSupply(s, 'curse')).toThrow();
        s = chooseSupply(s, 'province');
        expect(ids(s.trash)).toEqual(['copper']);
        expect(player(s).debt).toBe(8);
        expect(ids(player(s).discardPile)).toContain('province');
    });

    it('Artisan : +2 Dettes, reçoit une carte jusqu\'à 5 💰 (pas une carte à Dettes)', () => {
        let s = makeGame(['craftsman', 'mountain_shrine', 'market']);
        player(s).hand = cards('craftsman');
        s = play(s, 'craftsman');
        expect(player(s).debt).toBe(2);
        expect(() => chooseSupply(s, 'mountain_shrine')).toThrow();
        s = chooseSupply(s, 'market');
        expect(ids(player(s).discardPile)).toEqual(['market']);
    });

    it('Daimyo : rejoue la prochaine Action non-Ordre', () => {
        let s = makeGame(['daimyo', 'village', 'smithy']);
        player(s).hand = cards('daimyo', 'smithy');
        player(s).deck = cards(...filler(10));
        s = play(s, 'daimyo');
        expect(player(s).actions).toBe(1);
        s = play(s, 'smithy');
        // Daimyo +1 card, Smithy played twice: +6
        expect(player(s).hand.length).toBe(7);
        expect(player(s).playedThisTurn!['smithy']).toBe(2);
    });

    it('Daimyo : deux Daimyos font jouer la carte trois fois', () => {
        let s = makeGame(['daimyo', 'village']);
        player(s).hand = cards('daimyo', 'daimyo', 'village');
        player(s).deck = cards(...filler(10));
        s = play(s, 'daimyo');
        s = play(s, 'daimyo');
        s = play(s, 'village');
        expect(player(s).playedThisTurn!['village']).toBe(3);
        expect(player(s).actions).toBe(6);
    });

    it('Poissonnier : +1 Achat, +1 💰', () => {
        let s = makeGame(['fishmonger']);
        player(s).hand = cards('fishmonger');
        s = play(s, 'fishmonger');
        expect(player(s).buys).toBe(2);
        expect(player(s).coins).toBe(1);
    });

    it('Mine d\'Or : +1 Carte +1 Action +1 Achat ; peut recevoir un Or et 4 Dettes', () => {
        let s = makeGame(['gold_mine']);
        player(s).hand = cards('gold_mine');
        player(s).deck = cards('copper');
        s = play(s, 'gold_mine');
        s = chooseOption(s, 0);
        expect(player(s).buys).toBe(2);
        expect(player(s).debt).toBe(4);
        expect(ids(player(s).discardPile)).toEqual(['gold']);
    });

    it('Émissaire Impérial, Portée, Cave à Légumes : cartes et Dettes', () => {
        let s = makeGame(['imperial_envoy', 'litter', 'root_cellar']);
        player(s).hand = cards('litter', 'root_cellar', 'imperial_envoy');
        player(s).deck = cards(...filler(12));
        s = play(s, 'litter');
        expect(player(s).debt).toBe(1);
        s = play(s, 'root_cellar');
        expect(player(s).debt).toBe(4);
        s = play(s, 'imperial_envoy');
        expect(player(s).debt).toBe(6);
        expect(player(s).buys).toBe(2);
        expect(player(s).hand.length).toBe(2 + 3 + 5);
    });

    it('Kitsune : +1 Soleil puis deux options différentes', () => {
        let s = withProphecy(['kitsune'], 'great_leader', 3);
        player(s).hand = cards('kitsune');
        s = play(s, 'kitsune');
        expect(sun(s)).toBe(2);
        s = options(s, 1, 2);
        expect(player(s).coins).toBe(2);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        expect(ids(player(s).discardPile)).toEqual([]);
    });

    it('Sanctuaire de Montagne : +2 💰, écart facultatif, +2 Cartes s\'il y a une Action au rebut', () => {
        let s = makeGame(['mountain_shrine', 'village']);
        player(s).hand = cards('mountain_shrine', 'village', 'estate');
        player(s).deck = cards('copper', 'copper');
        s = play(s, 'mountain_shrine');
        s = chooseCards(s, ['estate']);
        expect(player(s).coins).toBe(2);
        expect(player(s).hand.length).toBe(1);
        s = makeGame(['mountain_shrine', 'village']);
        player(s).hand = cards('mountain_shrine', 'village');
        player(s).deck = cards('copper', 'copper');
        s = play(s, 'mountain_shrine');
        s = chooseCards(s, ['village']);
        expect(ids(player(s).hand)).toEqual(['copper', 'copper']);
    });

    it('Ninja : +1 Carte, les autres défaussent jusqu\'à 3', () => {
        let s = makeGame(['ninja']);
        player(s).hand = cards('ninja');
        player(s).deck = cards('copper');
        player(s, 'p2').hand = cards('copper', 'copper', 'estate', 'estate', 'silver');
        s = play(s, 'ninja');
        s = chooseCards({ ...s } as any, ['estate', 'estate']) as any;
        expect(player(s, 'p2').hand.length).toBe(3);
        expect(ids(player(s).hand)).toEqual(['copper']);
    });

    it('Poète : la carte du dessus va en main si elle coûte 3 💰 ou moins', () => {
        let s = makeGame(['poet']);
        player(s).hand = cards('poet');
        player(s).deck = cards('copper', 'silver');
        s = play(s, 'poet');
        expect(ids(player(s).hand)).toEqual(['copper', 'silver']);
        s = makeGame(['poet']);
        player(s).hand = cards('poet');
        player(s).deck = cards('copper', 'gold');
        s = play(s, 'poet');
        expect(ids(player(s).hand)).toEqual(['copper']);
        expect(ids(player(s).deck)).toEqual(['gold']);
    });

    it('Riz : +1 Achat, +1 💰 par type différent en jeu', () => {
        let s = toBuy(makeGame(['rice', 'daimyo', 'fishmonger']));
        player(s).playArea = cards('daimyo', 'fishmonger', 'copper');
        player(s).hand = cards('rice');
        s = play(s, 'rice');
        // Action, Command, Shadow, Treasure
        expect(player(s).coins).toBe(4);
        expect(player(s).buys).toBe(2);
    });

    it('Courtier en Riz : Trésor +2 Cartes, Action +5 Cartes', () => {
        let s = makeGame(['rice_broker', 'village']);
        player(s).hand = cards('rice_broker', 'copper');
        player(s).deck = cards(...filler(8));
        s = play(s, 'rice_broker');
        s = chooseCards(s, ['copper']);
        expect(player(s).hand.length).toBe(2);
        s = makeGame(['rice_broker', 'village']);
        player(s).hand = cards('rice_broker', 'village');
        player(s).deck = cards(...filler(8));
        s = play(s, 'rice_broker');
        s = chooseCards(s, ['village']);
        expect(player(s).hand.length).toBe(5);
        expect(player(s).actions).toBe(1);
    });

    it('Sanctuaire de Rivière : reçoit une carte à l\'Ajustement si rien n\'a été reçu en phase Achat', () => {
        let s = makeGame(['river_shrine', 'village']);
        player(s).hand = cards('river_shrine', 'estate', 'estate');
        player(s).deck = cards(...filler(10));
        s = play(s, 'river_shrine');
        s = chooseCards(s, ['estate', 'estate']);
        expect(s.trash.length).toBe(2);
        if (s.phase === 'ACTION') s = endPhase(s);
        s = endPhase(s); // Buy → Clean-up
        expect(s.pendingDecision?.message).toMatch(/Sanctuaire/);
        s = chooseSupply(s, 'village');
        expect(ids(player(s).discardPile)).toContain('village');
    });

    it('Sanctuaire de Rivière : rien si une carte a été reçue en phase Achat', () => {
        let s = makeGame(['river_shrine']);
        player(s).hand = cards('river_shrine', 'copper', 'copper', 'copper');
        player(s).deck = cards(...filler(10));
        s = play(s, 'river_shrine');
        s = chooseCards(s, []);
        s = toBuy(s);
        s = play(s, 'copper');
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'copper' });
        expect(s.pendingDecision?.message || '').not.toMatch(/Sanctuaire/);
        expect(player(s, 'p2').id).toBe('p2');
    });

    it('Bateau de Rivière : la carte mise de côté est jouée au tour suivant et y reste', () => {
        let s = makeGame(['riverboat']);
        expect((s as any).riverboatCard).toBeTruthy();
        (s as any).riverboatCard = 'laboratory';
        player(s).hand = cards('riverboat');
        player(s).deck = cards(...filler(14));
        s = play(s, 'riverboat');
        s = untilTurnOf(endTurn(s), 'p1');
        // Laboratory: +2 Cards +1 Action at the start of the turn
        expect(player(s).hand.length).toBe(7);
        expect(player(s).actions).toBe(2);
    });

    it('Ronin : pioche jusqu\'à 7 cartes', () => {
        let s = makeGame(['ronin']);
        player(s).hand = cards('ronin', 'copper');
        player(s).deck = cards(...filler(10));
        s = play(s, 'ronin');
        expect(player(s).hand.length).toBe(7);
    });

    it('Village Rustique : +1 Soleil, +1 Carte, +2 Actions, peut défausser 2 cartes pour +1 Carte', () => {
        let s = withProphecy(['rustic_village'], 'great_leader', 2);
        player(s).hand = cards('rustic_village', 'estate', 'estate');
        player(s).deck = cards('copper', 'silver');
        s = play(s, 'rustic_village');
        expect(sun(s)).toBe(1);
        s = chooseOption(s, 0);
        s = chooseCards(s, ['estate', 'estate']);
        expect(ids(player(s).hand)).toEqual(['copper', 'silver']);
        expect(player(s).actions).toBe(2);
    });

    it('Samouraï : attaque une fois, puis +1 💰 à chaque tour et reste en jeu', () => {
        let s = makeGame(['samurai']);
        player(s).hand = cards('samurai');
        player(s).deck = cards(...filler(15));
        player(s, 'p2').hand = cards('copper', 'copper', 'copper', 'estate', 'estate');
        s = play(s, 'samurai');
        s = chooseCards(s as any, ['estate', 'estate']);
        expect(player(s, 'p2').hand.length).toBe(3);
        s = untilTurnOf(endTurn(s), 'p1');
        expect(player(s).coins).toBe(1);
        expect(ids(player(s).playArea)).toContain('samurai');
        s = untilTurnOf(endTurn(s), 'p1');
        expect(player(s).coins).toBe(1);
        expect(ids(player(s).playArea)).toContain('samurai');
    });

    it('Sorcière aux Serpents : sans doublon, elle retourne dans sa pile et donne une Malédiction', () => {
        let s = makeGame(['snake_witch']);
        player(s).hand = cards('snake_witch', 'copper', 'estate');
        player(s).deck = cards('silver');
        const before = s.supply['snake_witch'].count;
        s = play(s, 'snake_witch');
        s = chooseOption(s, 0);
        expect(s.supply['snake_witch'].count).toBe(before + 1);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        // With a duplicate: nothing is offered
        s = makeGame(['snake_witch']);
        player(s).hand = cards('snake_witch', 'copper');
        player(s).deck = cards('copper');
        s = play(s, 'snake_witch');
        expect(s.pendingDecision).toBeFalsy();
    });

    it('Tanuki : écarte une carte, reçoit une carte coûtant jusqu\'à 2 💰 de plus', () => {
        let s = makeGame(['tanuki', 'smithy']);
        player(s).hand = cards('tanuki', 'estate');
        s = play(s, 'tanuki');
        s = chooseCards(s, ['estate']);
        expect(() => chooseSupply(s, 'gold')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Maison de Thé : +1 Soleil, +1 Carte, +1 Action, +2 💰', () => {
        let s = withProphecy(['tea_house'], 'great_leader', 5);
        player(s).hand = cards('tea_house');
        player(s).deck = cards('copper');
        s = play(s, 'tea_house');
        expect(sun(s)).toBe(4);
        expect(player(s).coins).toBe(2);
        expect(player(s).actions).toBe(1);
    });
});

describe('Soleil Levant — Ombres', () => {
    it('une Ombre se joue depuis n\'importe où dans la pioche', () => {
        let s = makeGame(['fishmonger']);
        player(s).hand = cards('estate');
        player(s).deck = cards('copper', 'copper', 'fishmonger', 'copper');
        const fish = player(s).deck[2];
        s = act(s, 'p1', { type: 'PLAY_CARD', cardInstanceId: fish.instanceId });
        expect(ids(player(s).playArea)).toEqual(['fishmonger']);
        expect(player(s).deck.length).toBe(3);
        expect(player(s).buys).toBe(2);
        expect(player(s).actions).toBe(0);
    });

    it('une Ombre ne se joue pas depuis la pioche en phase Achat, ni une carte non-Ombre', () => {
        let s = toBuy(makeGame(['fishmonger']));
        player(s).deck = cards('fishmonger', 'village');
        expect(() => act(s, 'p1', { type: 'PLAY_CARD', cardInstanceId: player(s).deck[0].instanceId })).toThrow();
        s = makeGame(['village']);
        player(s).hand = cards('estate');
        player(s).deck = cards('village');
        expect(() => act(s, 'p1', { type: 'PLAY_CARD', cardInstanceId: player(s).deck[0].instanceId })).toThrow();
    });

    it('Salle du Trône peut jouer une Ombre depuis la pioche', () => {
        let s = makeGame(['fishmonger', 'throne_room']);
        player(s).hand = cards('throne_room');
        player(s).deck = cards('copper', 'fishmonger');
        s = play(s, 'throne_room');
        s = choose(s, { type: 'CARDS', cardInstanceIds: [player(s).deck[1].instanceId] });
        expect(ids(player(s).playArea).sort()).toEqual(['fishmonger', 'throne_room']);
        expect(player(s).buys).toBe(3);
        expect(player(s).coins).toBe(2);
        expect(ids(player(s).deck)).toEqual(['copper']);
    });

    it('les Ombres vont sous la pioche au mélange', () => {
        const s = makeGame(['ninja']);
        const p = player(s);
        p.deck = [];
        p.discardPile = cards('ninja', 'copper', 'copper', 'ronin', 'estate', 'copper');
        EffectUtils.reshuffleDiscard(s, p);
        expect(ids(p.deck.slice(-2)).sort()).toEqual(['ninja', 'ronin']);
    });
});

describe('Soleil Levant — Présages et Prophéties', () => {
    it('jetons Soleil selon le nombre de joueurs', () => {
        expect([2, 3, 4, 5, 6].map(n => ProphecyManager.sunTokensFor(n))).toEqual([5, 8, 10, 12, 13]);
        const s = makeGame(['poet'], 3);
        s.landscapes = ['progress'];
        setupRisingSun(s);
        expect(sun(s)).toBe(8);
    });

    it('une Prophétie est tirée quand le royaume a un Présage', () => {
        const ls = SupplyGenerator.getLandscapes({ count: 0, kingdomCardIds: ['poet'] } as any);
        expect(ls.some(id => CardRegistry.get(id)?.types.includes('PROPHECY' as any))).toBe(true);
        const none = SupplyGenerator.getLandscapes({ count: 0, kingdomCardIds: ['village'] } as any);
        expect(none.some(id => CardRegistry.get(id)?.types.includes('PROPHECY' as any))).toBe(false);
    });

    it('Armée en approche : une pile Attaque en plus ; +1 💰 après chaque Attaque', () => {
        const s0 = makeGame(['poet']);
        s0.landscapes = ['approaching_army'];
        setupRisingSun(s0);
        const extra = (s0 as any).approachingArmyPile;
        expect(extra).toBeTruthy();
        expect(s0.supply[extra]).toBeTruthy();
        let s = withProphecy(['ninja'], 'approaching_army', 0);
        player(s).hand = cards('ninja');
        player(s).deck = cards('copper');
        player(s, 'p2').hand = cards('copper');
        s = play(s, 'ninja');
        expect(player(s).coins).toBe(1);
    });

    it('le dernier Soleil déclenche la Prophétie (Grand chef : +1 Action après chaque Action)', () => {
        let s = withProphecy(['tea_house', 'village'], 'great_leader', 1);
        player(s).hand = cards('tea_house', 'village');
        player(s).deck = cards(...filler(4));
        s = play(s, 'tea_house');
        expect(sun(s)).toBe(0);
        expect(player(s).actions).toBe(1);
        s = play(s, 'village');
        expect(player(s).actions).toBe(3); // +2 Actions, +1 from Great Leader
    });

    it('un Soleil de plus ne fait rien une fois tous retirés', () => {
        let s = withProphecy(['tea_house'], 'great_leader', 0);
        player(s).hand = cards('tea_house');
        player(s).deck = cards('copper');
        s = play(s, 'tea_house');
        expect(sun(s)).toBe(0);
    });

    it('Attendre son heure : la main est mise de côté et revient au tour suivant', () => {
        let s = withProphecy([], 'biding_time');
        player(s).hand = cards('gold', 'estate');
        player(s).deck = cards(...filler(10));
        s = endTurn(s);
        expect(ids(getMat(player(s), 'biding_time'))).toEqual(['gold', 'estate']);
        s = untilTurnOf(s, 'p1');
        expect(ids(player(s).hand)).toContain('gold');
        expect(player(s).hand.length).toBe(7);
    });

    it('Bureaucratie : une carte qui ne coûte pas 0 💰 apporte un Cuivre', () => {
        let s = toBuy(withProphecy([], 'bureaucracy_prophecy'));
        player(s).coins = 3; player(s).buys = 2;
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' });
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'silver']);
    });

    it('Illumination : les Trésors sont des Actions ; joués en phase Action, +1 Carte +1 Action', () => {
        let s = withProphecy(['tea_house'], 'enlightenment', 1);
        player(s).hand = cards('tea_house', 'gold');
        player(s).deck = cards('copper', 'silver');
        s = play(s, 'tea_house');
        expect(sun(s)).toBe(0);
        expect(s.phase).toBe('ACTION');
        s = play(s, 'gold');
        expect(s.phase).toBe('ACTION');
        expect(player(s).coins).toBe(2); // Tea House only: Gold made no $
        expect(player(s).hand.length).toBe(2);
        // Rice Broker trashing a Copper (Treasure and Action): +7 Cards
        s = withProphecy(['rice_broker'], 'enlightenment', 1);
        player(s).hand = cards('rice_broker', 'copper');
        player(s).deck = cards(...filler(10));
        player(s).hand.push(...cards('tea_house'));
        s = play(s, 'tea_house');
        s = play(s, 'rice_broker');
        s = chooseCards(s, ['copper']);
        expect(player(s).hand.length).toBe(1 + 7);
    });

    it('Commerce florissant : les cartes coûtent 1 💰 de moins ; Actions utilisables comme Achats', () => {
        let s = toBuy(withProphecy(['village'], 'flourishing_trade'));
        player(s).deck = cards(...filler(10));
        expect(EconomyEngine.getCardCost(s, 'p1', 'gold')).toBe(5);
        player(s).coins = 10; player(s).buys = 1; player(s).actions = 1;
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' });
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' });
        expect(ids(player(s).discardPile).filter(i => i === 'silver').length).toBe(2);
    });

    it('Bonne récolte : le premier Trésor de chaque nom donne d\'abord +1 Achat et +1 💰', () => {
        let s = toBuy(withProphecy([], 'good_harvest'));
        player(s).hand = cards('copper', 'copper', 'silver');
        s = play(s, 'copper');
        s = play(s, 'copper');
        s = play(s, 'silver');
        expect(player(s).coins).toBe(1 + 1 + 2 + 2);
        expect(player(s).buys).toBe(3);
    });

    it('Croissance : recevoir un Trésor fait recevoir une carte moins chère', () => {
        let s = toBuy(withProphecy(['village'], 'growth'));
        player(s).coins = 6; player(s).buys = 2;
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'gold' });
        expect(() => chooseSupply(s, 'gold')).toThrow();
        s = chooseSupply(s, 'silver');
        // The Silver chains: a card cheaper than $3
        s = chooseSupply(s, 'estate');
        expect(ids(player(s).discardPile).sort()).toEqual(['estate', 'gold', 'silver']);
    });

    it('Hiver rigoureux : pose 2 Dettes sur la pile, ou les prend', () => {
        let s = toBuy(withProphecy([], 'harsh_winter'));
        player(s).coins = 6; player(s).buys = 3;
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' });
        expect((s.supply['silver'] as any).tokens.debt).toBe(2);
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' });
        expect((s.supply['silver'] as any).tokens.debt).toBe(0);
        expect(player(s).debt).toBe(2);
    });

    it('Empereur bienveillant : en retirant le dernier Soleil, puis à chaque début de tour, une Action en main', () => {
        let s = withProphecy(['tea_house', 'village'], 'kind_emperor', 1);
        player(s).hand = cards('tea_house');
        player(s).deck = cards(...filler(14));
        s = play(s, 'tea_house');
        s = chooseSupply(s, 'village');
        expect(ids(player(s).hand)).toContain('village');
        s = endTurn(s);
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseSupply(s, 'village');
        expect(ids(player(s, 'p2').hand)).toContain('village');
    });

    it('Panique : +2 Achats par Trésor joué, qui retourne dans sa pile au lieu d\'être défaussé', () => {
        let s = toBuy(withProphecy([], 'panic'));
        player(s).hand = cards('silver');
        player(s).deck = cards(...filler(6));
        const before = s.supply['silver'].count;
        s = play(s, 'silver');
        expect(player(s).buys).toBe(3);
        s = endTurn(s);
        expect(s.supply['silver'].count).toBe(before + 1);
        expect(ids(player(s).discardPile)).not.toContain('silver');
    });

    it('Progrès : les cartes reçues vont sur la pioche', () => {
        let s = toBuy(withProphecy([], 'progress'));
        player(s).coins = 3; player(s).buys = 2;
        player(s).deck = cards('copper');
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' });
        expect(ids(player(s).deck)).toEqual(['silver', 'copper']);
    });

    it('Expansion rapide : Actions et Trésors reçus sont joués au début du tour suivant', () => {
        let s = toBuy(withProphecy(['village'], 'rapid_expansion'));
        player(s).coins = 3; player(s).buys = 2;
        player(s).deck = cards(...filler(12));
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'silver' });
        expect(ids(getMat(player(s), 'rapid_expansion'))).toEqual(['silver']);
        s = untilTurnOf(endTurn(s), 'p1');
        expect(ids(player(s).playArea)).toContain('silver');
        expect(player(s).coins).toBe(2);
    });

    it('Maladie : au début du tour, Malédiction sur la pioche ou défausser 3 cartes', () => {
        let s = withProphecy([], 'sickness');
        player(s, 'p2').deck = cards(...filler(8));
        s = endTurn(s);
        s = chooseOption(s, 0);
        expect(player(s, 'p2').deck[0].id).toBe('curse');
    });

    it('Vent divin : la Réserve Royaume est remplacée par 10 nouvelles piles', () => {
        let s = withProphecy(['tea_house', 'village'], 'divine_wind', 1);
        player(s).hand = cards('tea_house');
        player(s).deck = cards('copper');
        s = play(s, 'tea_house');
        expect(s.supply['tea_house']).toBeUndefined();
        expect(s.supply['village']).toBeUndefined();
        expect(s.kingdomCards.length).toBe(10);
        expect(s.supply['copper']).toBeTruthy();
        for (const k of s.kingdomCards) expect(s.supply[k]).toBeTruthy();
    });
});
