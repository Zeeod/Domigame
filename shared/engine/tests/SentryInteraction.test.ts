
import { describe, it, expect, beforeAll } from 'vitest';
import { GameState } from '../GameState.js';
import { EffectEngine } from '../EffectEngine.js';
import { registerCoreEffects } from '../registerCoreEffects.js';
import { PromptType } from '../prompts/Prompt.js';

// Mock setup
const createMockState = (): GameState => {
    return {
        players: [{
            id: 'player1',
            name: 'Player 1',
            hand: [],
            deck: [],
            discardPile: [],
            playArea: [],
            aside: [],
            limbo: [], // Important for Sentry
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

describe('Sentry Interaction', () => {
    beforeAll(() => {
        registerCoreEffects();
    });

    it('should trigger SENTRY_INTERACTION prompt', () => {
        const state = createMockState();
        const player = state.players[0];

        // Setup Deck: Top -> Copper, Estate
        player.deck = [
            { id: 'copper', instanceId: 'c1' },
            { id: 'estate', instanceId: 'e1' }
        ] as any[];

        // Register Sentry
        // Assuming CardRegistry is already populated or we can mock it
        // If not, we might need to register it.
        // EffectEngine relies on CardRegistry.

        // Execute Sentry Effect directly or via play
        // Sentry effects: Draw 1, +1 Action, SEQUENCE(Reveal 2, SentryInteraction)

        // Let's test the SENTRY_INTERACTION effect handler directly
        // The handler is registered in EffectEngine.

        // Need to simulate REVEAL first to populate Limbo
        player.limbo = [
            { id: 'copper', instanceId: 'c1' },
            { id: 'estate', instanceId: 'e1' }
        ] as any[];

        const interactionEffect = {
            type: 'SENTRY_INTERACTION',
            amount: 2,
            message: 'Test Sentry'
        };

        // Actually, let's call applyEffect with the SENTRY_INTERACTION type
        // We need to make sure the handler is registered.
        // It is registered in EffectEngine.init() which is called on import or first use.

        EffectEngine.applyEffects(state, 'player1', [interactionEffect] as any, false, 'sentry1');

        expect(state.pendingDecision).toBeDefined();
        expect(state.pendingDecision?.type).toBe(PromptType.SENTRY_INTERACTION);
        expect(state.pendingDecision?.constraints!.sourceZone).toBe('limbo');
        expect(state.pendingDecision?.context.cards).toBeDefined();
        expect(state.pendingDecision?.context.cards.length).toBe(2);

        // Check for duplicates in limbo
        expect(player.limbo.length).toBe(2);

        expect(state.pendingDecision?.context.cards[0].id).toBe('copper');
        expect(state.pendingDecision?.context.cards[1].id).toBe('estate');
    });

    it('should NOT have duplicate cards in limbo after SENTRY_INTERACTION', () => {
        const state = createMockState();
        const player = state.players[0];

        // Setup Deck
        player.deck = [
            { id: 'copper', instanceId: 'c1' },
            { id: 'estate', instanceId: 'e1' }
        ] as any[];

        // Sentry logic: Reveal 2 to Limbo, then Sentry Interaction
        const effects = [
            { type: 'REVEAL_CARDS', amount: 2, source: 'deck', destination: 'limbo' },
            { type: 'SENTRY_INTERACTION', amount: 2, message: 'Test Sentry' }
        ];

        EffectEngine.applyEffects(state, 'player1', effects as any, false, 'sentry1');

        expect(state.pendingDecision).toBeDefined();
        expect(player.limbo.length).toBe(2); // Should be 2, if bug exists it might be 4
        expect(state.pendingDecision?.context.cards.length).toBe(2);
    });

    it('should handle Sentry decision correctly', () => {
        const state = createMockState();
        const player = state.players[0];

        // Setup Limbo with 3 cards for complexity
        player.limbo = [
            { id: 'copper', instanceId: 'c1' },
            { id: 'estate', instanceId: 'e1' },
            { id: 'curse', instanceId: 'cu1' }
        ] as any[];

        // Simulate response
        const payload = {
            trash: ['c1'],
            discard: ['e1'],
            reorder: ['cu1']
        };

        // We need to call resolveDecision or the specific handler
        // Since we can't easily access the private handler from outside in a unit test without 'any' cast
        // We can mimic what resolveDecision does:

        const context = {
            sourceCardInstanceId: 'sentry1'
        };

        // Use 'any' to access private method for testing purpose
        (EffectEngine as any).handleSentryDecision(state, 'player1', payload, context);

        // Verify Trash
        expect(state.trash.length).toBe(1);
        expect(state.trash[0].id).toBe('copper');

        // Verify Discard
        expect(player.discardPile.length).toBe(1);
        expect(player.discardPile[0].id).toBe('estate');

        // Verify Deck (Reorder)
        expect(player.deck.length).toBe(1);
        expect(player.deck[0].id).toBe('curse');
        expect(player.limbo.length).toBe(0);
    });
});
