
import { describe, it, expect } from 'vitest';
import { GameState } from '../GameState.js';
import { EffectEngine } from '../EffectEngine.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';

// Mock setup
const createMockState = (): GameState => {
    return {
        players: [{
            id: 'player1',
            name: 'Player 1',
            hand: [
                { id: 'copper', instanceId: 'c1' },
                { id: 'estate', instanceId: 'e1' }
            ],
            deck: [],
            discardPile: [],
            playArea: [],
            aside: [],
            limbo: [],
            actions: 1,
            buys: 1,
            gold: 0,
            vp: 0
        }],
        supply: {},
        trash: [],
        logs: [],
        turnNumber: 1,
        activePlayerId: 'player1',
        phase: 'ACTION',
        effectStack: [],
        pendingDecision: null
    } as any;
};

describe('Cellar Interaction', () => {
    it('should include hand cards in DISCARD_THEN_DRAW prompt context', () => {
        const state = createMockState();
        const player = state.players[0];

        const cellarEffect = {
            type: 'DISCARD_THEN_DRAW',
            message: 'Cellar test'
        };

        TrashEffectHandler.handleDiscardThenDraw(state, player, cellarEffect);

        expect(state.pendingDecision).toBeDefined();
        expect(state.pendingDecision?.context.specialAction).toBe('DISCARD_THEN_DRAW');
        expect(state.pendingDecision?.context.cards).toBeDefined();
        expect(state.pendingDecision?.context.cards.length).toBe(2);
        expect(state.pendingDecision?.context.cards[0].id).toBe('copper');
        expect(state.pendingDecision?.context.cards[1].id).toBe('estate');
    });
});
