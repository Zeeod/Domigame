import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, choose, chooseCards, chooseSupply, endPhase } from '../../helpers/play.js';

function endTurn(state: any) {
    const startTurn = state.turnNumber;
    const pid = state.players[state.currentPlayerIndex].id;
    for (let i = 0; i < 5 && state.turnNumber === startTurn; i++) state = endPhase(state, pid);
    return state;
}

describe('Marché Noir (Black Market)', () => {
    it('+2 coins, reveal 3, buy one affordable card, the rest go under the Black Market deck', () => {
        let state = makeGame(['black_market']);
        state.blackMarketDeck = cards('village', 'smithy', 'gold', 'market');
        player(state).hand = cards('black_market');
        player(state).coins = 2; // 2 + 2 = 4 → can afford Village (3) and Smithy (4), not Gold

        state = play(state, 'black_market');
        expect(player(state).coins).toBe(4);
        const d = state.pendingDecision as any;
        expect(d.context.cards.length).toBe(3);
        expect(d.context.buyable.length).toBe(2);

        const smithy = d.context.cards.find((c: any) => c.id === 'smithy');
        state = choose(state, { type: 'CARDS', cardInstanceIds: [smithy.instanceId] });

        const p = player(state);
        expect(p.coins).toBe(0);
        expect(p.discardPile.map(c => c.id)).toContain('smithy');
        expect(state.blackMarketRevealed!.length).toBe(0);
        expect(state.blackMarketDeck!.map(c => c.id)).toEqual(['market', 'village', 'gold']);
    });

    it('lets you play Treasures before buying (2nd edition)', () => {
        let state = makeGame(['black_market']);
        state.blackMarketDeck = cards('gold', 'village', 'smithy');
        player(state).hand = cards('black_market', 'silver', 'silver', 'estate');
        state = play(state, 'black_market');
        let d = state.pendingDecision as any;
        expect(d.context.specialAction).toBe('BLACK_MARKET_TREASURES');
        expect(d.message).toContain('Or');
        state = choose(state, { type: 'CARDS', cardInstanceIds: d.context.candidates });
        expect(player(state).coins).toBe(6);
        d = state.pendingDecision as any;
        expect(d.context.specialAction).toBe('BLACK_MARKET');
        const gold = d.context.cards.find((c: any) => c.id === 'gold');
        state = choose(state, { type: 'CARDS', cardInstanceIds: [gold.instanceId] });
        expect(player(state).discardPile.map(c => c.id)).toContain('gold');
        expect(player(state).coins).toBe(0);
    });
});

describe('Délégué (Envoy)', () => {
    it('reveal 5; the player to the left picks one to discard; the rest go to hand', () => {
        let state = makeGame(['envoy']);
        player(state).hand = cards('envoy');
        player(state).deck = cards('gold', 'silver', 'copper', 'copper', 'estate', 'province');

        state = play(state, 'envoy');
        expect(state.pendingDecision?.playerId).toBe('p2');
        const gold = (state.pendingDecision as any).context.cards.find((c: any) => c.id === 'gold');
        state = choose(state, { type: 'CARDS', cardInstanceIds: [gold.instanceId] }, 'p2');

        const p = player(state);
        expect(p.discardPile.map(c => c.id)).toEqual(['gold']);
        expect(p.hand.map(c => c.id).sort()).toEqual(['copper', 'copper', 'estate', 'silver']);
        expect(p.deck.map(c => c.id)).toEqual(['province']);
    });
});

describe('Capitaine (Captain)', () => {
    it('plays an Action from the Supply (leaving it there), now and next turn', () => {
        let state = makeGame(['captain', 'village', 'smithy']);
        player(state).hand = cards('captain');
        player(state).deck = cards('copper', 'copper', 'copper', 'copper', 'copper', 'copper', 'copper', 'copper');

        state = play(state, 'captain');
        state = chooseSupply(state, 'village');
        expect(player(state).actions).toBe(2);        // 1 - 1 + 2 (Village)
        expect(player(state).hand.length).toBe(1);    // Village's +1 Card
        expect(state.supply['village'].count).toBe(10); // left in the Supply

        state = endTurn(state);                        // p2
        state = endTurn(state);                        // back to p1: Captain plays again
        expect(state.currentPlayerIndex).toBe(0);
        expect(state.pendingDecision?.playerId).toBe('p1');
        state = chooseSupply(state, 'smithy');
        expect(player(state).hand.length).toBe(8);    // 5 + 3
    });
});

describe('Prince', () => {
    it('sets aside an Action costing up to 4 and plays it at the start of each turn', () => {
        let state = makeGame(['prince', 'village']);
        player(state).hand = cards('prince', 'village', 'copper');
        player(state).deck = cards(...Array(20).fill('copper'));

        state = play(state, 'prince');
        state = chooseCards(state, ['village']);
        const p = player(state);
        expect(p.mats.prince.map(c => c.id).sort()).toEqual(['prince', 'village']);
        expect(p.playArea.length).toBe(0);

        state = endTurn(state);   // p2
        state = endTurn(state);   // p1: Village is played automatically
        let p1 = player(state);
        expect(p1.playArea.map(c => c.id)).toEqual(['village']);
        expect(p1.actions).toBe(3);   // 1 + 2

        state = endTurn(state);   // Village goes back to the Prince mat, not the discard
        p1 = player(state);
        expect(p1.mats.prince.map(c => c.id).sort()).toEqual(['prince', 'village']);
        expect(p1.discardPile.some(c => c.id === 'village')).toBe(false);
    });
});
