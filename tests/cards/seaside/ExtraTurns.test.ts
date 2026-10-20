import { describe, it, expect } from 'vitest';
import { makeGame, cards, player, play, endPhase, buy } from '../../helpers/play.js';

/** End the current player's turn (Action → Buy → Cleanup). */
function endTurn(state: any) {
    const startIdx = state.currentPlayerIndex;
    const startTurn = state.turnNumber;
    for (let i = 0; i < 5 && state.turnNumber === startTurn; i++) {
        state = endPhase(state, state.players[startIdx].id);
    }
    return state;
}

describe('Tours supplémentaires', () => {
    it('Avant-poste : tour supplémentaire avec une main de 3 cartes', () => {
        let state = makeGame(['outpost']);
        player(state).hand = cards('outpost');
        player(state).deck = cards('copper', 'copper', 'copper', 'copper', 'copper', 'copper', 'copper');

        state = play(state, 'outpost');
        state = endTurn(state);

        expect(state.currentPlayerIndex).toBe(0);           // p1 again
        expect(player(state).hand.length).toBe(3);          // only 3 cards
        expect(state.currentExtraTurn?.type).toBe('OUTPOST');
    });

    it('jamais de 3e tour d\'affilée', () => {
        let state = makeGame(['outpost']);
        player(state).hand = cards('outpost');
        player(state).deck = cards('outpost', 'copper', 'copper', 'copper', 'copper', 'copper', 'copper');

        state = play(state, 'outpost');
        state = endTurn(state);                             // extra turn, hand: outpost + 2 coppers
        expect(state.currentPlayerIndex).toBe(0);
        state = play(state, 'outpost');                     // would be a 3rd turn in a row
        expect(state.extraTurns.length).toBe(0);
        state = endTurn(state);
        expect(state.currentPlayerIndex).toBe(1);           // p2 plays next
    });

    it('Mission : pas d\'achat de cartes pendant le tour supplémentaire', () => {
        let state = makeGame([]);
        state.extraTurns = [{ playerId: 'p1', type: 'MISSION' }];
        state = endTurn(state);
        expect(state.currentExtraTurn?.type).toBe('MISSION');
        state.phase = 'BUY';
        player(state).coins = 5;
        expect(() => buy(state, 'silver')).toThrow(/Mission/);
    });

    it('Voyage : au plus 3 cartes jouées depuis la main', () => {
        let state = makeGame(['village']);
        state.extraTurns = [{ playerId: 'p1', type: 'VOYAGE', cardLimit: 3 }];
        state = endTurn(state);
        player(state).hand = cards('village', 'village', 'village', 'village');
        player(state).deck = cards('copper', 'copper', 'copper', 'copper');
        state = play(state, 'village');
        state = play(state, 'village');
        state = play(state, 'village');
        expect(() => play(state, 'village')).toThrow(/3 cartes/);
    });
});
