import { describe, test, expect } from 'vitest';
import { GreedyBot } from './GreedyBot';
import { GameState } from '../engine/GameState';
import { PromptType } from '../engine/prompts/Prompt';

// Mock minimal state
const mockState = (playerId: string, pendingDecision: any, playerOverride: any = {}): GameState => ({
    players: [{
        id: playerId,
        name: 'Bot',
        hand: [],
        deck: [],
        discard: [],
        trash: [],
        mats: {},
        ...playerOverride
    }],
    activePlayerId: playerId,
    public: { supply: {}, trash: [] } as any,
    pendingDecision: { ...pendingDecision, playerId },
    phase: 'ACTION',
    log: []
} as unknown as GameState);

describe('GreedyBot Heuristics', () => {
    const bot = new GreedyBot();
    const playerId = 'bot-1';

    test('Native Village: Should PUSH if mat is empty', () => {
        const decision = {
            id: 'd1',
            type: PromptType.SELECT_OPTION,
            message: 'Village Indigène',
            options: [{ label: 'Mettre la carte...' }, { label: 'Prendre toutes...' }],
            context: { sourceCardId: 'nativeVillage' }
        };
        const state = mockState(playerId, decision);

        const action = bot.chooseAction(state, playerId);
        expect(action).toEqual({
            type: 'CHOOSE',
            choiceId: 'd1',
            payload: { type: 'OPTION', optionIndex: 0 }
        });
    });

    test('Native Village: Should TAKE if mat has 3 cards', () => {
        const decision = {
            id: 'd1',
            type: PromptType.SELECT_OPTION,
            message: 'Village Indigène',
            options: [{ label: 'Mettre la carte...' }, { label: 'Prendre toutes...' }],
            context: { sourceCardId: 'nativeVillage' }
        };
        const state = mockState(playerId, decision, {
            mats: { nativeVillage: [1, 2, 3] } // 3 cards
        });

        const action = bot.chooseAction(state, playerId);
        expect(action).toEqual({
            type: 'CHOOSE',
            choiceId: 'd1',
            payload: { type: 'OPTION', optionIndex: 1 }
        });
    });

    test('Navigator: Should DISCARD if bad cards (Coppers/Curse)', () => {
        const decision = {
            id: 'd2',
            type: PromptType.SELECT_OPTION,
            message: 'Navigateur',
            options: [{ label: 'Défausser' }, { label: 'Remettre' }],
            context: { sourceCardId: 'navigator' }
        };
        const state = mockState(playerId, decision, {
            aside: [{ id: 'copper' }, { id: 'copper' }, { id: 'curse' }, { id: 'copper' }, { id: 'estate' }]
        });

        const action = bot.chooseAction(state, playerId);
        // Average value < 2, no actions -> Discard (Option 0)
        expect(action).toEqual({
            type: 'CHOOSE',
            choiceId: 'd2',
            payload: { type: 'OPTION', optionIndex: 0 }
        });
    });

    test('Lookout: Should TRASH Curse over Copper', () => {
        const decision = {
            id: 'd3',
            type: PromptType.CHOOSE_CARDS,
            message: 'Vigie: ÉCARTER une carte',
            constraints: { sourceZone: 'aside', min: 1, max: 1 },
            context: { sourceCardId: 'lookout' }
        };
        const asideCards = [
            { id: 'silver', instanceId: 's1' },
            { id: 'copper', instanceId: 'c1' },
            { id: 'curse', instanceId: 'bad1' }
        ];
        const state = mockState(playerId, decision, { aside: asideCards });

        const action = bot.chooseAction(state, playerId);
        // Should trash 'curse' (value -1)
        expect(action).toEqual({
            type: 'CHOOSE',
            choiceId: 'd3',
            payload: { type: 'CARDS', cardInstanceIds: ['bad1'] }
        });
    });
});
