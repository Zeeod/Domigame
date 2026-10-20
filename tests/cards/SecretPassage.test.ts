import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { GameState } from '../../shared/engine/GameState.js';
import { createCardInstances } from '../../shared/engine/CardInstance.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';
import { RulesValidator } from '../../shared/engine/RulesValidator.js';

describe('Secret Passage', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test_game');
        const player = createPlayerState('p1', 'Player 1', '#fff');
        state.players.push(player);
        state.currentPlayerIndex = 0;

        // Mock supply
        state.supply['secret_passage'] = { cardId: 'secret_passage', count: 10, cards: [] };
        state.supply['copper'] = { cardId: 'copper', count: 60, cards: [] };
        state.supply['estate'] = { cardId: 'estate', count: 24, cards: [] };
    });

    it('should prompt for deck insertion after picking a card', () => {
        const player = state.players[0];
        const silver = createCardInstances('silver', 1)[0];
        player.hand = [silver];
        player.deck = createCardInstances('copper', 3);

        // Simulate Secret Passage effects (picking a card)
        state.pendingDecision = {
            id: 'pick_choice',
            playerId: player.id,
            type: PromptType.CHOOSE_CARDS,
            constraints: { sourceZone: 'hand', min: 1, max: 1 },
            message: 'Pick a card',
            context: { specialAction: 'SECRET_PASSAGE_PICK' }
        };

        // Resolve the first pick choice
        const payload = { type: 'CARDS', cardInstanceIds: [silver.instanceId] };

        // Validate with RulesValidator first
        const validation = RulesValidator.validate(state, player.id, {
            type: 'CHOOSE',
            choiceId: 'pick_choice',
            payload: payload as any
        });
        expect(validation.valid).toBe(true);

        const result = EffectEngine.resolveDecision(state, player.id, payload);

        expect(result.needsChoice).toBe(true);
        expect(state.pendingDecision?.type).toBe(PromptType.DECK_INSERTION);
        expect(state.pendingDecision?.context.cardToMove.instanceId).toBe(silver.instanceId);
        expect(player.hand.length).toBe(0);
        expect(player.deck.length).toBe(3);
    });

    it('should correctly insert card into deck at specified index', () => {
        const player = state.players[0];
        const silver = createCardInstances('silver', 1)[0];
        player.deck = createCardInstances('copper', 3); // C1, C2, C3
        const c1 = player.deck[0].instanceId;
        const c2 = player.deck[1].instanceId;
        const c3 = player.deck[2].instanceId;

        state.pendingDecision = {
            id: 'insert_choice',
            playerId: player.id,
            type: PromptType.DECK_INSERTION,
            constraints: { sourceZone: 'hand', min: 1, max: 1 },
            message: 'Insert card',
            context: {
                specialAction: 'SECRET_PASSAGE_INSERT',
                cardToMove: silver,
                deckCount: 3
            }
        };

        // We want to insert AT INDEX 1 (between C1 and C2)
        const payload = { type: 'CARDS', index: 1 };

        // Validate with RulesValidator
        const validation = RulesValidator.validate(state, player.id, {
            type: 'CHOOSE',
            choiceId: 'insert_choice',
            payload: payload as any
        });
        expect(validation.valid).toBe(true);

        EffectEngine.resolveDecision(state, player.id, payload);

        expect(player.deck.length).toBe(4);
        expect(player.deck[0].instanceId).toBe(c1);
        expect(player.deck[1].instanceId).toBe(silver.instanceId);
        expect(player.deck[2].instanceId).toBe(c2);
        expect(player.deck[3].instanceId).toBe(c3);
    });
});
