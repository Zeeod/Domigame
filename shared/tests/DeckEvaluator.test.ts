
import { describe, it, expect, beforeAll } from 'vitest';
import { DeckEvaluator } from '../bot/DeckEvaluator.js';
import { GameState, PlayerState } from '../engine/GameState.js';
import { CardRegistry } from '../cards/index.js';

describe('DeckEvaluator', () => {
    // Helper to create state
    const createMockState = (turnNumber: number, provincesLeft: number = 8): GameState => {
        return {
            turnNumber,
            supply: {
                province: { count: provincesLeft, cardId: 'province', cards: [] }
            },
            players: [],
        } as any;
    };

    const createPlayer = (cards: string[]): PlayerState => {
        return {
            id: 'p1',
            hand: cards.map(id => ({ id, instanceId: id + '_1' })),
            deck: [],
            discardPile: [],
            playArea: [],
        } as any;
    };

    beforeAll(() => {
        // Mock Cards for testing
        CardRegistry.register({ id: 'copper', name: 'Cuivre', types: ['TREASURE'], cost: 0, treasureValue: 1, value: 1 } as any);
        CardRegistry.register({ id: 'silver', name: 'Argent', types: ['TREASURE'], cost: 3, treasureValue: 2, value: 2 } as any);
        CardRegistry.register({ id: 'gold', name: 'Or', types: ['TREASURE'], cost: 6, treasureValue: 3, value: 3 } as any);
        CardRegistry.register({ id: 'estate', name: 'Domaine', types: ['VICTORY'], cost: 2, victoryPoints: 1 } as any);
        CardRegistry.register({ id: 'duchy', name: 'Duché', types: ['VICTORY'], cost: 5, victoryPoints: 3 } as any);
        CardRegistry.register({ id: 'province', name: 'Province', types: ['VICTORY'], cost: 8, victoryPoints: 6 } as any);

        CardRegistry.register({
            id: 'smithy',
            name: 'Forgeron',
            types: ['ACTION'],
            cost: 4,
            effects: [{ type: 'DRAW', amount: 3 }]
        } as any);

        CardRegistry.register({
            id: 'laboratory',
            name: 'Laboratoire',
            types: ['ACTION'],
            cost: 5,
            effects: [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 1 }]
        } as any);

        CardRegistry.register({
            id: 'village',
            name: 'Village',
            types: ['ACTION'],
            cost: 3,
            effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }]
        } as any);
    });

    it('should identify Game Stages correctly', () => {
        // Early Game
        const earlyState = createMockState(1, 12);
        expect(DeckEvaluator.getGameStage(earlyState)).toBe('EARLY');

        // Mid Game
        const midState = createMockState(10, 8);
        expect(DeckEvaluator.getGameStage(midState)).toBe('MID');

        // Late Game (Low Provinces)
        const lateStateProvince = createMockState(15, 3);
        expect(DeckEvaluator.getGameStage(lateStateProvince)).toBe('LATE');
    });

    it('should evaluate stronger economy higher', () => {
        const state = createMockState(5);

        const weakPlayer = createPlayer(['copper', 'copper', 'estate']);
        const strongPlayer = createPlayer(['gold', 'silver', 'estate']);

        const weakScore = DeckEvaluator.evaluateDeck(state, weakPlayer);
        const strongScore = DeckEvaluator.evaluateDeck(state, strongPlayer);

        expect(strongScore).toBeGreaterThan(weakScore);
    });

    it('should evaluate cycling decks higher', () => {
        const state = createMockState(10);

        // Terminal heavy (Smithy, Smithy) vs Cycling (Lab, Lab)
        // Smithy has collision penalty? 
        // Note: Laboratory is +2 Cards, +1 Action. (Net +0 Action, +2 Cards).
        // Smithy is +3 Cards, +0 Action. (Net -1 Action, +3 Cards).

        const terminalPlayer = createPlayer(['smithy', 'smithy', 'copper']);
        const cyclingPlayer = createPlayer(['laboratory', 'laboratory', 'copper']);

        const terminalScore = DeckEvaluator.evaluateDeck(state, terminalPlayer);
        const cyclingScore = DeckEvaluator.evaluateDeck(state, cyclingPlayer);

        // Lab player should score higher due to cycling bonus and no collision penalty
        expect(cyclingScore).toBeGreaterThan(terminalScore);
    });

    it('should value VP more in Late Game', () => {
        const midState = createMockState(10, 8); // MID
        const lateState = createMockState(20, 2); // LATE

        const vpPlayer = createPlayer(['province', 'province', 'gold']);

        const midScore = DeckEvaluator.evaluateDeck(midState, vpPlayer);
        const lateScore = DeckEvaluator.evaluateDeck(lateState, vpPlayer);

        // Same deck should score higher in Late Game because VP weight increases
        expect(lateScore).toBeGreaterThan(midScore);
    });
});
