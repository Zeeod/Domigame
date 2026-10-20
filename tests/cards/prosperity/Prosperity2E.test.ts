import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, chooseCards, choose, chooseOption, chooseSupply, endPhase, buy } from '../../helpers/play.js';

describe('Enclume (Anvil)', () => {
    it('is a Treasure: +1 coin, may discard a Treasure to gain a card costing up to 4', () => {
        let state = makeGame(['anvil', 'smithy']);
        state.phase = 'BUY';
        player(state).hand = cards('anvil', 'silver');

        state = play(state, 'anvil');
        expect(player(state).coins).toBe(1);

        // Discard the Silver
        state = chooseCards(state, ['silver']);
        expect(player(state).discardPile.map(c => c.id)).toContain('silver');

        // Then choose a card costing up to 4 from the supply
        expect(state.pendingDecision).toBeTruthy();
        state = chooseSupply(state, 'smithy');
        expect(player(state).discardPile.map(c => c.id)).toContain('smithy');
    });

    it('discarding nothing gains nothing', () => {
        let state = makeGame(['anvil']);
        state.phase = 'BUY';
        player(state).hand = cards('anvil', 'silver');

        state = play(state, 'anvil');
        state = choose(state, { type: 'CARDS', cardInstanceIds: [] });
        expect(state.pendingDecision).toBeFalsy();
        expect(player(state).discardPile.length).toBe(0);
        expect(player(state).hand.map(c => c.id)).toEqual(['silver']);
    });
});

describe('Greffier (Clerk)', () => {
    it('+2 coins; other players with 5+ cards in hand put one onto their deck', () => {
        let state = makeGame(['clerk'], 3);
        player(state).hand = cards('clerk');
        player(state, 'p2').hand = cards('copper', 'copper', 'estate', 'estate', 'silver');
        player(state, 'p3').hand = cards('copper', 'copper', 'copper', 'estate'); // only 4 cards

        state = play(state, 'clerk');
        expect(player(state).coins).toBe(2);

        // p2 must topdeck a card; p3 is not affected
        expect(state.pendingDecision?.playerId).toBe('p2');
        state = chooseCards(state, ['estate']);
        expect(player(state, 'p2').hand.length).toBe(4);
        expect(player(state, 'p2').deck[0].id).toBe('estate');
        expect(state.pendingDecision).toBeFalsy();
        expect(player(state, 'p3').hand.length).toBe(4);
    });

    it('can be played from hand at the start of your turn', () => {
        let state = makeGame(['clerk']);
        player(state).hand = cards('copper');
        // p2 holds a Clerk (hands are drawn at the end of the previous turn)
        player(state, 'p2').hand = cards('clerk', 'copper', 'copper', 'copper', 'copper');

        // End p1's turn: p2's turn starts
        for (let i = 0; i < 4 && state.currentPlayerIndex === 0; i++) state = endPhase(state);
        expect(state.currentPlayerIndex).toBe(1);

        // p2 is asked whether to play Clerk
        expect(state.pendingDecision?.playerId).toBe('p2');
        state = choose(state, { type: 'OPTION', optionIndex: 0 }, 'p2');
        expect(player(state, 'p2').playArea.map(c => c.id)).toContain('clerk');
        expect(player(state, 'p2').coins).toBe(2);
    });
});

describe('Diadème (Tiara)', () => {
    it('+1 Buy and may play a Treasure from hand twice', () => {
        let state = makeGame(['tiara']);
        state.phase = 'BUY';
        player(state).hand = cards('tiara', 'gold');
        const buys = player(state).buys;

        state = play(state, 'tiara');
        expect(player(state).buys).toBe(buys + 1);
        state = chooseCards(state, ['gold']);
        expect(player(state).coins).toBe(6);
        expect(player(state).playArea.map(c => c.id).sort()).toEqual(['gold', 'tiara']);
    });

    it('this turn, a gained card may be put onto the deck', () => {
        let state = makeGame(['tiara']);
        state.phase = 'BUY';
        player(state).hand = cards('tiara', 'silver');
        player(state).buys = 1;

        state = play(state, 'tiara');
        state = chooseCards(state, ['silver']);   // play Silver twice → 4 coins
        expect(player(state).coins).toBe(4);

        state = buy(state, 'silver');
        expect(state.pendingDecision?.type).toBe('SELECT_OPTION');
        state = chooseOption(state, 0);            // put it onto the deck
        const p = player(state);
        expect(p.deck[0]?.id).toBe('silver');                       // on top of the deck
        expect(p.discardPile.some(c => c.id === 'silver')).toBe(false);
    });
});

describe('Cohue (Rabble)', () => {
    it('+3 Cards; others reveal 3, discard Actions and Treasures, put the rest back', () => {
        let state = makeGame(['rabble']);
        player(state).hand = cards('rabble');
        player(state).deck = cards('copper', 'copper', 'copper');
        player(state, 'p2').deck = cards('copper', 'estate', 'market', 'gold');

        state = play(state, 'rabble');
        expect(player(state).hand.length).toBe(3);
        expect(player(state, 'p2').discardPile.map(c => c.id).sort()).toEqual(['copper', 'market']);
        expect(player(state, 'p2').deck.map(c => c.id)).toEqual(['estate', 'gold']);
    });
});
