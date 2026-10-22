/**
 * Base set (2nd edition): one behaviour test per Kingdom card, following the official text.
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, endPhase } from '../../helpers/play.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const sorted = (cs: { id: string }[]) => ids(cs).sort();

describe('Jeu de base — 2e édition', () => {
    it('Artisan : recevez en main une carte jusqu\'à 5, puis mettez une carte de votre main sur la pioche', () => {
        let s = makeGame(['artisan', 'laboratory']);
        player(s).hand = cards('artisan', 'copper');
        s = play(s, 'artisan');
        s = chooseSupply(s, 'laboratory');
        expect(ids(player(s).hand)).toContain('laboratory');
        s = chooseCards(s, ['copper']);
        expect(player(s).deck[0].id).toBe('copper');
        expect(sorted(player(s).hand)).toEqual(['laboratory']);
    });

    it('Bandit : recevez un Or ; les autres écartent un Trésor autre que Cuivre parmi 2 cartes', () => {
        let s = makeGame(['bandit']);
        player(s).hand = cards('bandit');
        player(s, 'p2').deck = cards('silver', 'copper', 'estate');
        s = play(s, 'bandit');
        expect(ids(player(s).discardPile)).toContain('gold');
        // p2 has a single valid choice (Silver)
        if (s.pendingDecision) s = chooseCards(s, ['silver'], 'limbo');
        expect(ids(s.trash)).toEqual(['silver']);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['copper']);
        expect(ids(player(s, 'p2').deck)).toEqual(['estate']);
    });

    it('Bureaucrate : un Argent sur votre pioche ; les autres remettent une Victoire sur leur pioche', () => {
        let s = makeGame(['bureaucrat']);
        player(s).hand = cards('bureaucrat');
        player(s, 'p2').hand = cards('copper', 'estate', 'copper');
        s = play(s, 'bureaucrat');
        expect(player(s).deck[0].id).toBe('silver');
        s = chooseCards(s, ['estate']);
        expect(player(s, 'p2').deck[0].id).toBe('estate');
        expect(sorted(player(s, 'p2').hand)).toEqual(['copper', 'copper']);
    });

    it('Cave : +1 Action, défaussez puis piochez autant', () => {
        let s = makeGame(['cellar']);
        player(s).hand = cards('cellar', 'estate', 'estate', 'copper');
        player(s).deck = cards('silver', 'gold', 'copper');
        s = play(s, 'cellar');
        expect(player(s).actions).toBe(1);
        s = chooseCards(s, ['estate', 'estate']);
        expect(sorted(player(s).hand)).toEqual(['copper', 'gold', 'silver']);
    });

    it('Chapelle : écartez jusqu\'à 4 cartes', () => {
        let s = makeGame(['chapel']);
        player(s).hand = cards('chapel', 'copper', 'copper', 'estate', 'estate', 'silver');
        s = play(s, 'chapel');
        s = chooseCards(s, ['copper', 'copper', 'estate', 'estate']);
        expect(sorted(s.trash)).toEqual(['copper', 'copper', 'estate', 'estate']);
        expect(ids(player(s).hand)).toEqual(['silver']);
    });

    it('Salle du Conseil : +4 Cartes, +1 Achat, chaque autre joueur pioche une carte', () => {
        let s = makeGame(['council_room']);
        player(s).hand = cards('council_room');
        player(s).deck = cards('copper', 'copper', 'copper', 'copper', 'copper');
        player(s, 'p2').deck = cards('silver');
        const h2 = player(s, 'p2').hand.length;
        s = play(s, 'council_room');
        expect(player(s).hand.length).toBe(4);
        expect(player(s).buys).toBe(2);
        expect(player(s, 'p2').hand.length).toBe(h2 + 1);
    });

    it('Festival : +2 Actions, +1 Achat, +2 💰', () => {
        let s = makeGame(['festival']);
        player(s).hand = cards('festival');
        s = play(s, 'festival');
        expect(player(s).actions).toBe(2);
        expect(player(s).buys).toBe(2);
        expect(player(s).coins).toBe(2);
    });

    it('Présage : +1 Carte +1 Action, une carte de la défausse sur la pioche', () => {
        let s = makeGame(['harbinger']);
        player(s).hand = cards('harbinger');
        player(s).deck = cards('copper');
        player(s).discardPile = cards('gold', 'estate');
        s = play(s, 'harbinger');
        expect(player(s).actions).toBe(1);
        s = chooseCards(s, ['gold'], 'discardPile');
        expect(player(s).deck[0].id).toBe('gold');
    });

    it('Laboratoire : +2 Cartes +1 Action', () => {
        let s = makeGame(['laboratory']);
        player(s).hand = cards('laboratory');
        player(s).deck = cards('copper', 'copper', 'copper');
        s = play(s, 'laboratory');
        expect(player(s).hand.length).toBe(2);
        expect(player(s).actions).toBe(1);
    });

    it('Bibliothèque : piochez jusqu\'à 7 cartes, en pouvant mettre de côté les Actions', () => {
        let s = makeGame(['library']);
        player(s).hand = cards('library', 'copper', 'copper', 'copper', 'copper');
        player(s).deck = cards('village', 'silver', 'gold', 'copper');
        s = play(s, 'library');                          // hand 4, draws Village → may set aside
        s = choose(s, { type: 'OPTION', choice: 'YES' });
        expect(player(s).hand.length).toBe(7);
        expect(ids(player(s).discardPile)).toContain('village');
        expect(ids(player(s).hand)).not.toContain('village');
    });

    it('Marché : +1 Carte +1 Action +1 Achat +1 💰', () => {
        let s = makeGame(['market']);
        player(s).hand = cards('market');
        player(s).deck = cards('copper');
        s = play(s, 'market');
        expect(player(s).hand.length).toBe(1);
        expect(player(s).actions).toBe(1);
        expect(player(s).buys).toBe(2);
        expect(player(s).coins).toBe(1);
    });

    it('Milice : +2 💰, les autres défaussent jusqu\'à 3 cartes', () => {
        let s = makeGame(['militia']);
        player(s).hand = cards('militia');
        player(s, 'p2').hand = cards('copper', 'copper', 'estate', 'estate', 'silver');
        s = play(s, 'militia');
        expect(player(s).coins).toBe(2);
        s = chooseCards(s, ['estate', 'estate']);
        expect(sorted(player(s, 'p2').hand)).toEqual(['copper', 'copper', 'silver']);
    });

    it('Mine : écartez un Trésor, recevez en main un Trésor coûtant jusqu\'à 3 de plus', () => {
        let s = makeGame(['mine']);
        player(s).hand = cards('mine', 'silver');
        s = play(s, 'mine');
        s = chooseCards(s, ['silver']);
        s = chooseSupply(s, 'gold');
        expect(ids(s.trash)).toEqual(['silver']);
        expect(ids(player(s).hand)).toEqual(['gold']);
    });

    it('Douves : +2 Cartes, et protège d\'une Attaque', () => {
        let s = makeGame(['moat', 'militia']);
        player(s).hand = cards('moat');
        player(s).deck = cards('copper', 'copper');
        s = play(s, 'moat');
        expect(player(s).hand.length).toBe(2);
    });

    it('Prêteur sur gages : écartez un Cuivre pour +3 💰', () => {
        let s = makeGame(['moneylender']);
        player(s).hand = cards('moneylender', 'copper', 'estate');
        s = play(s, 'moneylender');
        s = chooseCards(s, ['copper']);
        expect(player(s).coins).toBe(3);
        expect(ids(s.trash)).toEqual(['copper']);
    });

    it('Braconnier : +1 Carte +1 Action +1 💰, défaussez une carte par pile vide', () => {
        let s = makeGame(['poacher', 'village']);
        s.supply['village'].count = 0;
        player(s).hand = cards('poacher', 'estate', 'copper');
        player(s).deck = cards('copper');
        s = play(s, 'poacher');
        expect(player(s).coins).toBe(1);
        expect(s.pendingDecision).toBeTruthy();
        s = chooseCards(s, ['estate']);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
    });

    it('Rénovation : écartez une carte, recevez-en une coûtant jusqu\'à 2 de plus', () => {
        let s = makeGame(['remodel']);
        player(s).hand = cards('remodel', 'estate');
        s = play(s, 'remodel');
        s = chooseCards(s, ['estate']);
        s = chooseSupply(s, 'silver');
        expect(ids(s.trash)).toEqual(['estate']);
        expect(ids(player(s).discardPile)).toEqual(['silver']);
    });

    it('Sentinelle : +1 Carte +1 Action, regardez 2 cartes : écartez/défaussez/replacez', () => {
        let s = makeGame(['sentry']);
        player(s).hand = cards('sentry');
        player(s).deck = cards('copper', 'estate', 'curse', 'gold');
        s = play(s, 'sentry');
        expect(player(s).actions).toBe(1);
        const d: any = s.pendingDecision;
        const byId = (id: string) => d.context.cards.find((c: any) => c.id === id).instanceId;
        s = choose(s, { type: 'SENTRY', trash: [byId('curse')], discard: [byId('estate')], reorder: [] });
        expect(ids(s.trash)).toEqual(['curse']);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
        expect(ids(player(s).deck)).toEqual(['gold']);
    });

    it('Forgeron : +3 Cartes', () => {
        let s = makeGame(['smithy']);
        player(s).hand = cards('smithy');
        player(s).deck = cards('copper', 'copper', 'copper', 'copper');
        s = play(s, 'smithy');
        expect(player(s).hand.length).toBe(3);
    });

    it('Salle du Trône : jouez une Action deux fois', () => {
        let s = makeGame(['throne_room', 'smithy']);
        player(s).hand = cards('throne_room', 'smithy');
        player(s).deck = cards('copper', 'copper', 'copper', 'copper', 'copper', 'copper', 'copper');
        s = play(s, 'throne_room');
        s = chooseCards(s, ['smithy']);
        expect(player(s).hand.length).toBe(6);
    });

    it('Vassal : +2 💰, défaussez la carte du dessus et jouez-la si c\'est une Action', () => {
        let s = makeGame(['vassal']);
        player(s).hand = cards('vassal');
        player(s).deck = cards('estate');
        s = play(s, 'vassal');
        expect(player(s).coins).toBe(2);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
    });

    it('Village : +1 Carte +2 Actions', () => {
        let s = makeGame(['village']);
        player(s).hand = cards('village');
        player(s).deck = cards('copper');
        s = play(s, 'village');
        expect(player(s).hand.length).toBe(1);
        expect(player(s).actions).toBe(2);
    });

    it('Sorcière : +2 Cartes, chaque autre joueur reçoit une Malédiction', () => {
        let s = makeGame(['witch'], 3);
        player(s).hand = cards('witch');
        player(s).deck = cards('copper', 'copper');
        s = play(s, 'witch');
        expect(player(s).hand.length).toBe(2);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
        expect(ids(player(s, 'p3').discardPile)).toEqual(['curse']);
        expect(s.supply['curse'].count).toBe(8);
    });

    it('Atelier : recevez une carte coûtant jusqu\'à 4', () => {
        let s = makeGame(['workshop', 'smithy']);
        player(s).hand = cards('workshop');
        s = play(s, 'workshop');
        s = chooseSupply(s, 'smithy');
        expect(ids(player(s).discardPile)).toEqual(['smithy']);
    });

    it('Atelier : refuse une carte trop chère', () => {
        let s = makeGame(['workshop']);
        player(s).hand = cards('workshop');
        s = play(s, 'workshop');
        expect(() => chooseSupply(s, 'gold')).toThrow(/trop élevé/);
    });

    it('Jardins : 1 PV par tranche de 10 cartes', async () => {
        const { CardRegistry } = await import('../../../shared/cards/index.js');
        const g: any = CardRegistry.get('gardens');
        expect(g.vpCalculator(Array(39).fill({ id: 'copper' }))).toBe(3);
        expect(g.vpCalculator(Array(40).fill({ id: 'copper' }))).toBe(4);
    });

    it('fin de tour complète sans erreur après une Sorcière', () => {
        let s = makeGame(['witch']);
        player(s).hand = cards('witch', 'copper', 'copper');
        player(s).deck = cards(...Array(10).fill('copper'));
        s = play(s, 'witch');
        for (let i = 0; i < 4 && s.currentPlayerIndex === 0; i++) s = endPhase(s);
        expect(s.currentPlayerIndex).toBe(1);
        expect(player(s).hand.length).toBe(5);
    });
});
