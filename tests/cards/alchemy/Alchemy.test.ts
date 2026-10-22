/**
 * Alchemy: behaviour tests following the official card texts (2021 rulebook).
 */
import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, chooseOption, endTurn, buy, act } from '../../helpers/play.js';
import { VictoryChecker } from '../../../shared/engine/VictoryChecker.js';

const ids = (cs: { id: string }[]) => cs.map(c => c.id);
const toBuy = (s: any) => { s.phase = 'BUY'; s.phaseIndex = s.phasePipeline!.indexOf('BUY'); return s; };
const filler = (n = 12) => Array(n).fill('copper');

describe('Alchimie', () => {
    it('Potion : produit une Potion, nécessaire pour acheter les cartes à Potion', () => {
        let s = toBuy(makeGame(['familiar']));
        s.supply.potion = { cardId: 'potion', count: 16, cards: [] } as any;
        player(s).hand = cards('silver', 'copper');
        s = play(s, 'silver'); s = play(s, 'copper');
        expect(() => buy(s, 'familiar')).toThrow();
        player(s).hand = cards('potion');
        s = play(s, 'potion');
        player(s).buys = 2;
        s = buy(s, 'familiar');
        expect(ids(player(s).discardPile)).toEqual(['familiar']);
    });

    it('Alchimiste : +2 Cartes +1 Action ; avec une Potion en jeu, peut revenir sur la pioche', () => {
        let s = makeGame(['alchemist']);
        player(s).hand = cards('alchemist', 'potion');
        player(s).deck = cards(...filler());
        s = play(s, 'alchemist');
        expect(player(s).hand.length).toBe(3);
        expect(player(s).actions).toBe(1);
        s = toBuy(s);
        s = play(s, 'potion');
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('alchemist');
    });

    it('Apothicaire : +1 Carte +1 Action, les Cuivres et Potions des 4 cartes du dessus vont en main', () => {
        let s = makeGame(['apothecary']);
        player(s).hand = cards('apothecary');
        player(s).deck = cards('estate', 'copper', 'potion', 'duchy', 'silver', 'gold');
        s = play(s, 'apothecary');
        if (s.pendingDecision) s = choose(s, { type: 'CARDS', cardInstanceIds: player(s).limbo.map(c => c.instanceId) });
        expect(ids(player(s).hand).sort()).toEqual(['copper', 'estate', 'potion']);
        expect(ids(player(s).deck.slice(0, 2)).sort()).toEqual(['duchy', 'silver']);
        expect(player(s).deck[2].id).toBe('gold');
    });

    it('Apprenti : +1 Carte par 💰 du coût, +2 Cartes s\'il y a une Potion dans le coût', () => {
        let s = makeGame(['apprentice', 'golem']);
        player(s).hand = cards('apprentice', 'golem');
        player(s).deck = cards(...filler());
        s = play(s, 'apprentice');
        s = chooseCards(s, ['golem']);
        expect(player(s).hand.length).toBe(6);
        expect(player(s).actions).toBe(1);

        s = makeGame(['apprentice']);
        player(s).hand = cards('apprentice', 'silver');
        player(s).deck = cards(...filler());
        s = play(s, 'apprentice');
        s = chooseCards(s, ['silver']);
        expect(player(s).hand.length).toBe(3);
    });

    it('Familier : +1 Carte +1 Action, Malédiction aux autres', () => {
        let s = makeGame(['familiar']);
        player(s).hand = cards('familiar');
        player(s).deck = cards(...filler());
        s = play(s, 'familiar');
        expect(player(s).hand.length).toBe(1);
        expect(ids(player(s, 'p2').discardPile)).toEqual(['curse']);
    });

    it('Golem : dévoile jusqu\'à 2 Actions (hors Golem), défausse le reste, joue les Actions', () => {
        let s = makeGame(['golem', 'smithy', 'village']);
        player(s).hand = cards('golem');
        player(s).deck = cards('copper', 'smithy', 'golem', 'estate', 'village', ...filler());
        s = play(s, 'golem');
        for (let i = 0; i < 3 && s.pendingDecision; i++) s = chooseOption(s, 0);
        expect(ids(player(s).playArea).sort()).toEqual(['golem', 'smithy', 'village']);
        expect(ids(player(s).discardPile).sort()).toEqual(['copper', 'estate', 'golem']);
        expect(player(s).hand.length).toBe(4);
    });

    it('Herboriste : +1 Achat +1 💰 ; en fin de tour, un Trésor en jeu peut revenir sur la pioche', () => {
        let s = makeGame(['herbalist']);
        player(s).hand = cards('herbalist');
        player(s).deck = cards(...Array(10).fill('estate'));
        s = play(s, 'herbalist');
        expect(player(s).buys).toBe(2);
        expect(player(s).coins).toBe(1);
        s = toBuy(s);
        player(s).hand = cards('gold');
        s = play(s, 'gold');
        s = endTurn(s);
        expect(ids(player(s).hand)).toContain('gold');
    });

    it('Pierre philosophale : +1 💰 par tranche de 5 cartes dans la pioche et la défausse', () => {
        let s = toBuy(makeGame(['philosophers_stone']));
        player(s).hand = cards('philosophers_stone');
        player(s).deck = cards(...filler(8));
        player(s).discardPile = cards(...filler(7));
        s = play(s, 'philosophers_stone');
        expect(player(s).coins).toBe(3);
    });

    it('Bassin divinatoire : chacun dévoile sa carte du dessus (vous choisissez), puis vous piochez jusqu\'à une non-Action', () => {
        let s = makeGame(['scrying_pool', 'village']);
        player(s).hand = cards('scrying_pool');
        player(s).deck = cards('estate', 'village', 'village', 'silver', ...filler());
        player(s, 'p2').deck = cards('gold', ...filler());
        s = play(s, 'scrying_pool');
        // Each decision is made by the player of Scrying Pool
        let guard = 0;
        while (s.pendingDecision && guard++ < 5) {
            expect(s.pendingDecision.playerId).toBe('p1');
            s = chooseOption(s, 0); // discard
        }
        expect(ids(player(s, 'p2').discardPile)).toEqual(['gold']);
        expect(ids(player(s).discardPile)).toEqual(['estate']);
        expect(ids(player(s).hand)).toEqual(['village', 'village', 'silver']);
        expect(player(s).actions).toBe(1);
    });

    it('Transmutation : écarte une carte ; Action → Duché, Trésor → Transmutation, Victoire → Or', () => {
        const cases: [string, string[]][] = [['smithy', ['duchy']], ['copper', ['transmute']], ['estate', ['gold']], ['curse', []]];
        for (const [trashed, gained] of cases) {
            let s = makeGame(['transmute', 'smithy']);
            player(s).hand = cards('transmute', trashed);
            s = play(s, 'transmute');
            s = chooseCards(s, [trashed]);
            expect(ids(player(s).discardPile)).toEqual(gained);
        }
    });

    it('Université : +2 Actions, peut recevoir une Action coûtant jusqu\'à 5 💰 (sans Potion)', () => {
        let s = makeGame(['university', 'smithy', 'market', 'familiar']);
        player(s).hand = cards('university');
        s = play(s, 'university');
        expect(player(s).actions).toBe(2);
        expect(() => chooseSupply(s, 'familiar')).toThrow();
        expect(() => chooseSupply(s, 'gold')).toThrow();
        s = chooseSupply(s, 'market');
        expect(ids(player(s).discardPile)).toEqual(['market']);
    });

    it('Vignoble : 1 PV par tranche de 3 cartes Action', () => {
        const s = makeGame(['vineyard']);
        const p = player(s);
        p.hand = cards('vineyard', 'smithy', 'smithy', 'village'); p.deck = cards('village', 'village', 'village'); p.discardPile = [];
        p.vpTokens = 0;
        expect(VictoryChecker.scorePlayer(s, p)).toBe(2);
    });
});

describe('Fin de partie', () => {
    it('égalité : le joueur qui a eu le moins de tours gagne', () => {
        const s = makeGame([]);
        player(s).hand = cards('province'); player(s).turnsTaken = 5;
        player(s, 'p2').hand = cards('province'); player(s, 'p2').turnsTaken = 4;
        expect(VictoryChecker.ranking(s).winnerIds).toEqual(['p2']);
        player(s).turnsTaken = 4;
        expect(VictoryChecker.ranking(s).winnerIds.sort()).toEqual(['p1', 'p2']);
    });

    it('la partie se termine à la fin du tour où la dernière Province est prise', () => {
        let s = toBuy(makeGame([]));
        s.supply.province.count = 1;
        player(s).hand = cards('gold', 'gold', 'gold');
        s = play(s, 'gold'); s = play(s, 'gold'); s = play(s, 'gold');
        s = buy(s, 'province');
        expect(s.isGameOver).toBe(true);
        expect(s.winnerId).toBe('p1');
    });
});

describe('Possession', () => {
    it('le joueur de gauche joue un tour supplémentaire que vous contrôlez ; vous recevez ses cartes', () => {
        let s = makeGame(['possession', 'chapel']);
        player(s).hand = cards('possession');
        player(s).deck = cards(...filler());
        s = play(s, 'possession');
        s = endTurn(s);
        // Extra turn of p2, controlled by p1
        expect(s.players[s.currentPlayerIndex].id).toBe('p2');
        expect(s.currentExtraTurn?.type).toBe('POSSESSION');
        player(s, 'p2').hand = cards('chapel', 'copper', 'copper', 'silver');
        player(s, 'p2').deck = cards(...filler());
        expect(() => play(s, 'chapel', 'p2')).toThrow();          // p2 cannot act
        const chapel = player(s, 'p2').hand.find(c => c.id === 'chapel')!;
        s = act(s, 'p1', { type: 'PLAY_CARD', cardInstanceId: chapel.instanceId });
        expect(s.pendingDecision?.playerId).toBe('p2');           // the decision is p2's…
        const coppers = player(s, 'p2').hand.filter(c => c.id === 'copper').map(c => c.instanceId);
        expect(() => act(s, 'p2', { type: 'CHOOSE', choiceId: s.pendingDecision!.id, payload: { type: 'CARDS', cardInstanceIds: coppers } })).toThrow();
        s = act(s, 'p1', { type: 'CHOOSE', choiceId: s.pendingDecision!.id, payload: { type: 'CARDS', cardInstanceIds: coppers } }); // …made by p1
        expect(ids(s.trash)).toEqual([]);                          // set aside, not trashed
        if (s.phase === 'ACTION') s = act(s, 'p1', { type: 'END_PHASE' }); // to Buy
        s = act(s, 'p1', { type: 'PLAY_ALL_TREASURES' });
        player(s, 'p2').buys = 2;
        s = act(s, 'p1', { type: 'BUY_CARD', cardId: 'copper' });  // p1 gains it
        expect(ids(player(s).discardPile)).toContain('copper');
        expect(ids(player(s, 'p2').discardPile)).not.toContain('copper');
        s = endTurn(s);
        // p2's own turn follows; the set-aside Coppers are back in p2's cards
        expect(s.players[s.currentPlayerIndex].id).toBe('p2');
        expect(s.currentExtraTurn).toBeFalsy();
        const p2cards = [...player(s, 'p2').hand, ...player(s, 'p2').deck, ...player(s, 'p2').discardPile];
        expect(p2cards.filter(c => c.id === 'copper').length).toBe(14);
        expect(player(s, 'p2').turnsTaken || 0).toBe(0);           // the Possession turn is not theirs
    });
});
