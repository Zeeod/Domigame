/**
 * Nocturne: behaviour tests (Kingdom cards, Boons, Hexes, States, Spirits, Heirlooms).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, buy, endTurn, untilTurnOf, act } from '../../helpers/play.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';
import { getMat } from '../../../shared/engine/Mats.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const toNight = (s: any) => {
    if (!s.phasePipeline.includes('NIGHT')) s.phasePipeline.splice(s.phasePipeline.indexOf('CLEANUP'), 0, 'NIGHT');
    s.phase = 'NIGHT'; s.phaseIndex = s.phasePipeline.indexOf('NIGHT'); return s;
};
const filler = (n = 12) => Array(n).fill('copper');
const pass = (s: any) => choose(s, { type: 'CARDS', cardInstanceIds: [] });
/** Put a given Boon / Hex on top of its deck. */
const nextBoon = (s: any, id: string) => { s.boonDeck = [id, ...s.boonDeck.filter((b: string) => b !== id)]; return s; };
const nextHex = (s: any, id: string) => { s.hexDeck = [id, ...s.hexDeck.filter((b: string) => b !== id)]; return s; };

describe('Nocturne — Faveurs et Maléfices', () => {
    it('Barde : +2 💰 et une Faveur (Don de la montagne : un Argent)', () => {
        let s = nextBoon(makeGame(['bard']), 'the_mountains_gift');
        player(s).hand = cards('bard');
        s = play(s, 'bard');
        expect(player(s).coins).toBe(2);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
        expect(s.boonDiscard).toContain('the_mountains_gift');
    });

    it('Faveurs gardées jusqu\'à l\'Ajustement (Don des champs : +1 Action +1 💰)', () => {
        let s = nextBoon(makeGame(['bard']), 'the_fields_gift');
        player(s).hand = cards('bard');
        player(s).deck = cards(...filler());
        s = play(s, 'bard');
        expect(player(s).actions).toBe(1);
        expect(s.boonDiscard).not.toContain('the_fields_gift');
        s = toBuy(s); s = endTurn(s);
        expect(s.boonDiscard).toContain('the_fields_gift');
    });

    it('Village maudit : pioche jusqu\'à 6 ; reçu → un Maléfice (Peste : Malédiction en main)', () => {
        let s = nextHex(toBuy(makeGame(['cursed_village'])), 'plague');
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'cursed_village');
        expect(ids(player(s).hand)).toContain('curse');
    });

    it('Rôdeur : +1 Achat, les autres reçoivent le même Maléfice ; reçu → un Or', () => {
        let s = nextHex(makeGame(['skulk']), 'greed');
        player(s).hand = cards('skulk');
        s = play(s, 'skulk');
        expect(player(s).buys).toBe(2);
        expect(player(s, 'p2').deck[0]?.id).toBe('copper');
        expect(s.hexDiscard).toEqual(['greed']);
    });

    it('Misère puis Misère : Misérable puis Doublement misérable (-4 PV)', () => {
        let s = nextHex(makeGame(['skulk']), 'misery');
        player(s).hand = cards('skulk');
        s = play(s, 'skulk');
        s.hexDeck = ['misery', ...s.hexDeck.filter((h: string) => h !== 'misery')];
        s.hexDiscard = [];
        player(s).hand = cards('skulk'); player(s).actions = 1;
        s.phase = 'ACTION'; s.phaseIndex = s.phasePipeline!.indexOf('ACTION');
        s = play(s, 'skulk');
        const p2 = player(s, 'p2');
        p2.hand = []; p2.deck = []; p2.discardPile = []; p2.vpTokens = 0;
        expect(VictoryChecker.scorePlayer(s, p2)).toBe(-4);
    });

    it('Illusion : Trompé, plus d\'achat d\'Action ce tour-ci', () => {
        let s = nextHex(makeGame(['skulk', 'smithy']), 'delusion');
        player(s).hand = cards('skulk');
        player(s).deck = cards(...filler());
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'skulk');
        s = toBuy(s); s = endTurn(s);       // p2's turn
        s = endPhase2(s);
        player(s, 'p2').coins = 5; player(s, 'p2').buys = 2;
        expect(() => buy(s, 'smithy', 'p2')).toThrow();
        s = buy(s, 'silver', 'p2');
    });

    it('Druide : reçoit une des 3 Faveurs mises de côté', () => {
        let s = makeGame(['druid']);
        const boons = (s.landscapeState as any).druid_boons.state.boons;
        expect(boons.length).toBe(3);
        player(s).hand = cards('druid');
        s = play(s, 'druid');
        expect(player(s).buys).toBe(2);
        s = chooseOption(s, 0);
        expect((s.landscapeState as any).druid_boons.state.boons).toEqual(boons);
    });

    it('Fou : prend Perdu dans les bois et reçoit 3 Faveurs', () => {
        let s = makeGame(['fool']);
        s.boonDeck = ['the_mountains_gift', 'the_seas_gift', 'the_fields_gift', ...s.boonDeck.filter((b: string) => !['the_mountains_gift', 'the_seas_gift', 'the_fields_gift'].includes(b))];
        player(s).hand = cards('fool');
        player(s).deck = cards(...filler());
        s = play(s, 'fool');
        for (let i = 0; i < 3 && s.pendingDecision; i++) s = chooseOption(s, 0);
        expect((player(s) as any).states).toContain('lost_in_the_woods');
        expect(ids(player(s).discardPile)).toContain('silver');
    });

    it('Lutin : défausse la Faveur du dessus ; s\'écarte pour la recevoir deux fois', () => {
        let s = nextBoon(makeGame(['pixie']), 'the_mountains_gift');
        player(s).hand = cards('pixie');
        player(s).deck = cards(...filler());
        s = play(s, 'pixie');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['silver', 'silver']);
        expect(ids(s.trash)).toEqual(['pixie']);
    });

    it('Bosquet sacré : +1 Achat +3 💰, les autres peuvent recevoir la Faveur', () => {
        let s = nextBoon(makeGame(['sacred_grove']), 'the_mountains_gift');
        player(s).hand = cards('sacred_grove');
        s = play(s, 'sacred_grove');
        expect(player(s).coins).toBe(3);
        expect(s.pendingDecision?.playerId).toBe('p2');
        s = chooseOption(s, 0);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['silver']);
    });

    it('Traqueur : +1 💰, une Faveur, les cartes reçues peuvent aller sur la pioche', () => {
        let s = nextBoon(makeGame(['tracker']), 'the_mountains_gift');
        player(s).hand = cards('tracker');
        s = play(s, 'tracker');
        s = chooseOption(s, 0);                          // the Silver onto the deck
        expect(player(s).deck[0].id).toBe('silver');
    });

    it('Idole : impaire → Faveur ; paire → Malédiction aux autres', () => {
        let s = nextBoon(toBuy(makeGame(['idol'])), 'the_seas_gift');
        player(s).hand = cards('idol', 'idol');
        player(s).deck = cards(...filler());
        s = play(s, 'idol');
        s = play(s, 'idol');
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        expect(player(s).coins).toBe(4);
    });
});

/** End p2's Action phase so they are in their Buy phase. */
function endPhase2(s: any) {
    while (s.phase !== 'BUY') s = act(s, 'p2', { type: 'END_PHASE' });
    return s;
}

describe('Nocturne — cartes', () => {
    it('Cimetière : 2 PV ; reçu → écarte jusqu\'à 4 cartes ; Héritage Miroir hanté', () => {
        let s = toBuy(makeGame(['cemetery']));
        player(s).hand = cards('estate', 'curse');
        player(s).coins = 4; player(s).buys = 2;
        s = buy(s, 'cemetery');
        s = chooseCards(s, ['estate', 'curse']);
        expect(ids(s.trash).sort()).toEqual(['curse', 'estate']);
    });

    it('Changelin : s\'écarte et reçoit une copie d\'une carte en jeu', () => {
        let s = toNight(makeGame(['changeling', 'smithy']));
        player(s).playArea = cards('smithy');
        player(s).hand = cards('changeling');
        s = play(s, 'changeling');
        s = chooseOption(s, 0);
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
        expect(ids(s.trash)).toEqual(['changeling']);
    });

    it('Cordonnier : au prochain tour, une carte jusqu\'à 4 en main', () => {
        let s = toNight(makeGame(['cobbler', 'smithy']));
        player(s).hand = cards('cobbler');
        player(s).deck = cards(...filler(20));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'cobbler');
        s = untilTurnOf(s, 'p1');
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).hand)).toContain('smithy');
    });

    it('Conclave : +2 💰, joue une Action non présente en jeu et +1 Action', () => {
        let s = makeGame(['conclave', 'smithy']);
        player(s).hand = cards('conclave', 'smithy');
        player(s).deck = cards(...filler());
        s = play(s, 'conclave');
        s = chooseCards(s, ['smithy']);
        expect(player(s).actions).toBe(1);
        expect(player(s).hand.length).toBe(3);
    });

    it('Crypte : des Trésors mis de côté reviennent un par tour', () => {
        let s = toNight(makeGame(['crypt']));
        player(s).playArea = cards('gold', 'silver');
        player(s).hand = cards('crypt');
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler(30));
        s = play(s, 'crypt');
        s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).playArea.filter(c => c.id !== 'crypt').map(c => c.instanceId) });
        expect(getMat(player(s), 'crypt').length).toBe(2);
        s = untilTurnOf(s, 'p1');
        s = chooseOption(s, 0);
        expect(getMat(player(s), 'crypt').length).toBe(1);
    });

    it('Antre du vice / Ville fantôme / Gardien / Veilleur de nuit : reçus en main', () => {
        let s = toBuy(makeGame(['den_of_sin']));
        player(s).coins = 5; player(s).buys = 2;
        s = buy(s, 'den_of_sin');
        expect(ids(player(s).hand)).toEqual(['den_of_sin']);
    });

    it('Atelier du diable : 0 carte reçue → un Or ; 2+ → un Diablotin', () => {
        let s = toNight(makeGame(['devils_workshop']));
        player(s).hand = cards('devils_workshop');
        player(s).deck = cards(...filler(20));
        s = play(s, 'devils_workshop');
        expect(ids(player(s).discardPile)).toContain('gold');
    });

    it('Exorciste : écarte une carte, reçoit un Esprit moins cher', () => {
        let s = toNight(makeGame(['exorcist']));
        player(s).hand = cards('exorcist', 'silver');
        player(s).deck = cards(...filler(20));
        s = play(s, 'exorcist');
        s = chooseCards(s, ['silver']);
        s = chooseOption(s, s.pendingDecision!.options!.findIndex((o: any) => o.label === 'Diablotin'));
        expect(ids(player(s).discardPile)).toContain('imp');
    });

    it('Chien fidèle : défaussé hors Ajustement, revient en main en fin de tour', () => {
        let s = makeGame(['faithful_hound', 'oasis']);
        player(s).hand = cards('oasis', 'faithful_hound');
        player(s).deck = cards(...filler(20));
        s = play(s, 'oasis');
        s = chooseCards(s, ['faithful_hound']);
        s = chooseOption(s, 0);
        s = toBuy(s);
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('faithful_hound');
    });

    it('Farfadet : un Or, puis un Maléfice (ou un Vœu avec 7 cartes en jeu)', () => {
        let s = nextHex(makeGame(['leprechaun']), 'greed');
        player(s).hand = cards('leprechaun');
        s = play(s, 'leprechaun');
        expect(ids(player(s).discardPile)).toEqual(['gold']);
        expect(player(s).deck[0]?.id).toBe('copper');
    });

    it('Monastère : une carte écartée par carte reçue ce tour', () => {
        let s = toNight(makeGame(['monastery']));
        player(s).gainedThisTurn = ['silver'];
        player(s).hand = cards('monastery', 'estate');
        s = play(s, 'monastery');
        s = chooseOption(s, 0);
        expect(ids(s.trash)).toEqual(['estate']);
    });

    it('Nécromancien : joue une Action du rebut (les 3 Zombies y sont dès le départ)', () => {
        let s = makeGame(['necromancer']);
        expect(ids(s.trash).sort()).toEqual(['zombie_apprentice', 'zombie_mason', 'zombie_spy']);
        player(s).hand = cards('necromancer');
        player(s).deck = cards(...filler());
        s = play(s, 'necromancer');
        s = chooseOption(s, s.pendingDecision!.options!.findIndex((o: any) => o.label === 'Espion zombie'));
        s = chooseOption(s, 1);
        expect(player(s).hand.length).toBe(1);
        expect(s.trash.length).toBe(3);
    });

    it('Pooka : écarte un Trésor pour +4 Cartes', () => {
        let s = makeGame(['pooka']);
        player(s).hand = cards('pooka', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'pooka');
        s = chooseCards(s, ['copper']);
        expect(player(s).hand.length).toBe(4);
    });

    it('Pillard : les autres (5+ cartes) défaussent une copie ; +3 💰 au prochain tour', () => {
        let s = toNight(makeGame(['raider']));
        player(s).playArea = cards('silver');
        player(s).hand = cards('raider');
        player(s, 'p2').hand = cards('silver', 'copper', 'copper', 'copper', 'copper');
        s = play(s, 'raider');
        s = chooseCards(s, ['silver']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['silver']);
    });

    it('Grotte secrète : défausser 3 cartes pour +3 💰 au prochain tour', () => {
        let s = makeGame(['secret_cave']);
        player(s).hand = cards('secret_cave', 'estate', 'estate', 'estate');
        player(s).deck = cards(...filler(30));
        player(s, 'p2').deck = cards(...filler());
        s = play(s, 'secret_cave');
        s = chooseOption(s, 0);
        s = chooseCards(s, ['estate', 'estate', 'estate']);
        s = untilTurnOf(s, 'p1');
        expect(player(s).coins).toBe(3);
    });

    it('Berger : +2 Cartes par carte Victoire défaussée', () => {
        let s = makeGame(['shepherd']);
        player(s).hand = cards('shepherd', 'estate', 'duchy');
        player(s).deck = cards(...filler());
        s = play(s, 'shepherd');
        s = chooseCards(s, ['estate', 'duchy']);
        expect(player(s).hand.length).toBe(4);
    });

    it('Tourmenteur : seul en jeu → un Diablotin', () => {
        let s = makeGame(['tormentor']);
        player(s).hand = cards('tormentor');
        s = play(s, 'tormentor');
        expect(player(s).coins).toBe(2);
        expect(ids(player(s).discardPile)).toEqual(['imp']);
    });

    it('Héros tragique : 8 cartes en main → s\'écarte et reçoit un Trésor', () => {
        let s = makeGame(['tragic_hero']);
        player(s).hand = cards('tragic_hero', 'copper', 'copper', 'copper', 'copper', 'copper');
        player(s).deck = cards(...filler());
        s = play(s, 'tragic_hero');
        s = chooseSupply(s, 'gold');
        expect(ids(s.trash)).toEqual(['tragic_hero']);
    });

    it('Vampire : Maléfice aux autres, une carte jusqu\'à 5, échangé contre une Chauve-souris', () => {
        let s = nextHex(toNight(makeGame(['vampire', 'smithy'])), 'greed');
        player(s).hand = cards('vampire');
        player(s).deck = cards(...filler(20));
        s = play(s, 'vampire');
        expect(() => chooseSupply(s, 'vampire')).toThrow();
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile).sort()).toEqual(['bat', 'smithy']);
        expect(s.supply.vampire.count).toBe(11);
    });

    it('Loup-garou : +3 Cartes en phase Action', () => {
        let s = makeGame(['werewolf']);
        player(s).hand = cards('werewolf');
        player(s).deck = cards(...filler());
        s = play(s, 'werewolf');
        expect(player(s).hand.length).toBe(3);
    });

    it('Vœu : retourne sur sa pile, une carte jusqu\'à 6 en main', () => {
        let s = makeGame(['leprechaun']);
        s.nonSupply.wish.count = 11;
        player(s).hand = cards('wish');
        s = play(s, 'wish');
        s = chooseSupply(s, 'gold');
        expect(ids(player(s).hand)).toEqual(['gold']);
        expect(s.nonSupply.wish.count).toBe(12);
    });

    it('Héritages : Pièce porte-bonheur (+1 💰 et un Argent), Or maudit (3 💰 et une Malédiction)', () => {
        let s = toBuy(makeGame(['fool']));
        player(s).hand = cards('lucky_coin', 'cursed_gold');
        s = play(s, 'lucky_coin'); s = play(s, 'cursed_gold');
        expect(player(s).coins).toBe(4);
        expect(ids(player(s).discardPile).sort()).toEqual(['curse', 'silver']);
    });
});
