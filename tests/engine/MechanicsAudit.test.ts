
import { describe, it, expect } from 'vitest';
import { GameState, createGameState } from '../../shared/engine/GameState';
import { ActionResolver } from '../../shared/engine/ActionResolver';
import { createPlayerState } from '../../shared/engine/PlayerState';
import { createCardInstance } from '../../shared/engine/CardInstance';

function setupGame(cards: string[]): GameState {
    const state = createGameState('test-seed');
    state.players = [
        createPlayerState('p1', 'Player 1', '#ff0000'),
        createPlayerState('p2', 'Player 2', '#00ff00')
    ];
    state.players.forEach(p => {
        p.isReady = true;
        state.supply['copper'] = { cardId: 'copper', count: 60, cards: [] };
        state.supply['estate'] = { cardId: 'estate', count: 12, cards: [] };
        cards.forEach(c => {
            state.supply[c] = { cardId: c, count: 10, cards: [] };
        });
    });
    ActionResolver.startGame(state);
    state.currentPlayerIndex = 0; // Force p1
    return state;
}

describe('Detailed Mechanic Verification', () => {
    it('Rats should gain a Rats and trash a non-Rats card', () => {
        const state = setupGame(['rats', 'smithy']);
        const p1 = state.players[0];
        const rats = createCardInstance('rats');
        const smithy = createCardInstance('smithy');
        p1.hand = [rats, smithy];
        const res = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: rats.instanceId });
        expect(res.success).toBe(true);
        expect(res.state.pendingDecision).toBeDefined();
        const res2 = ActionResolver.resolve(res.state, 'p1', {
            type: 'CHOOSE',
            choiceId: res.state.pendingDecision?.id || 'choice',
            payload: { type: 'CARDS', cardInstanceIds: [smithy.instanceId] }
        });
        expect(res2.success).toBe(true);
        expect(res2.state.trash.some(c => c.id === 'smithy')).toBe(true);
        expect(res2.state.players[0].discardPile.some(c => c.id === 'rats')).toBe(true);
    });

    it('Hovel (Taudi) should be trashable when buying a Victory card', () => {
        const state = setupGame(['hovel', 'estate']);
        const p1 = state.players[0];
        const hovel = createCardInstance('hovel');
        p1.hand = [hovel];
        p1.coins = 2;
        p1.buys = 2;
        state.phase = 'BUY';

        let res = ActionResolver.resolve(state, 'p1', { type: 'BUY_CARD', cardId: 'estate' });

        if (!res.state.pendingDecision) {
            throw new Error(`FAIL: No pending decision!`);
        }

        const decision = res.state.pendingDecision;
        const choices = (decision as any).options;
        if (choices) {
            console.error('Choices provided:', JSON.stringify(choices));
        }

        res = ActionResolver.resolve(res.state, 'p1', {
            type: 'CHOOSE',
            choiceId: res.state.pendingDecision.id,
            payload: { type: 'OPTION', optionIndex: 0 } as any
        });

        if (!res.state.trash.some(c => c.id === 'hovel')) {
            throw new Error(`FAIL: Hovel not in trash! Trash count: ${res.state.trash.length}. Trash content: ${res.state.trash.map(c => c.id).join(',')}`);
        }
        expect(res.state.players[0].hand.length).toBe(0);
    });
});
