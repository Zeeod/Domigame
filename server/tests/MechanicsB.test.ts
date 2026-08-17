
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { createCardInstances } from '../../shared/engine/CardInstance.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';

describe('Mechanics Phase 1B (Reveal/Search/Conditional)', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test_game');
        const player = createPlayerState('p1', 'Player 1', '#fff');
        state.players.push(player);
        state.currentPlayerIndex = 0;
    });

    describe('Adventurer (Adventurier)', () => {
        it('should reveal cards one by one and log them until 2 treasures found', () => {
            const player = state.players[0];
            // Deck: [Copper, Estate, Silver, Copper] -> Bottom to Top
            // We want [Copper, Silver, Estate, Copper] -> Top to Bottom
            player.deck = [
                ...createCardInstances('copper', 1),
                ...createCardInstances('estate', 1),
                ...createCardInstances('silver', 1),
                ...createCardInstances('copper', 1)
            ];

            player.hand = [];
            state.history = [];

            const effect = { type: 'REVEAL_UNTIL_TREASURES', count: 2 } as const;
            EffectEngine.applyEffects(state, 'p1', [effect]);

            // Treasures found: 2 (Copper, Silver)
            expect(player.hand.length).toBe(2);
            expect(player.hand.map(c => c.id)).toContain('copper');
            expect(player.hand.map(c => c.id)).toContain('silver');
            expect(player.discardPile.length).toBe(1);
            expect(player.discardPile[0].id).toBe('estate');

            // Verify REVEAL logs
            const revealLogs = state.history.filter(l => l.type === 'REVEAL');
            // Adventurer reveals 3 cards in total (Copper, Estate, Silver)
            expect(revealLogs.length).toBe(3);
        });
    });

    describe('Library (Bibliothèque)', () => {
        it('should prompt to skip Action cards when drawing until 7', () => {
            const player = state.players[0];
            player.hand = createCardInstances('copper', 6);
            player.deck = createCardInstances('laboratory', 1); // Action to skip

            const effect = { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 7, maySkipActions: true } as const;
            const result = EffectEngine.applyEffects(state, 'p1', [effect]);

            expect(result.needsChoice).toBe(true);
            expect(state.pendingDecision?.type).toBe(PromptType.YES_NO);
            expect(state.pendingDecision?.message).toContain('mettre de côté');
            expect(player.aside.length).toBe(1);
            expect(player.aside[0].id).toBe('laboratory');
        });

        it('should continue drawing after choosing to skip an Action', () => {
            const player = state.players[0];
            player.hand = createCardInstances('copper', 6);
            player.deck = [
                ...createCardInstances('laboratory', 1), // 1st card (Action) - TOP of deck for shift()
                ...createCardInstances('copper', 1)     // 2nd card (Finish)
            ];

            // 1. Initial Apply
            const effect = { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 7, maySkipActions: true } as const;
            EffectEngine.applyEffects(state, 'p1', [effect]);

            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.playerId).toBe('p1');

            // 2. Resolve Skip Decision (YES)
            const decisionResult = EffectEngine.resolveDecision(state, 'p1', { type: PromptType.YES_NO, choice: 'YES' });

            // Should have re-enqueued DRAW_UNTIL_HAND_SIZE, and since next card is Copper, it should auto-draw it.
            expect(player.hand.length).toBe(7);
            expect(player.discardPile.length).toBe(1); // Skipped Laboratory is discarded after finishing
            expect(player.discardPile[0].id).toBe('laboratory');
        });
    });

    describe('Sentry (Sentinelle)', () => {
        it('should handle full flow with aside zone', () => {
            const player = state.players[0];
            player.deck = [
                ...createCardInstances('silver', 1),
                ...createCardInstances('estate', 1)
            ];
            player.hand = [];
            player.aside = [];

            // 1. Reveal 2 to Limbo/Aside
            EffectEngine.applyEffects(state, 'p1', [{ type: 'REVEAL_CARDS', amount: 2, source: 'deck', destination: 'limbo' } as const]);
            expect(player.aside.length).toBe(2);

            // 2. Trash one from Aside
            const trashEffect = { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', action: 'TRASH', min: 0, max: 2 } as const;
            EffectEngine.applyEffects(state, 'p1', [trashEffect]);

            const trashId = player.aside[0].instanceId;
            EffectEngine.resolveDecision(state, 'p1', { cardInstanceIds: [trashId] });

            expect(state.trash.length).toBe(1);
            expect(player.aside.length).toBe(1);

            // 3. Reorder remaining (Auto-moves since only 1 card)
            const reorderEffect = { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP' } as const;
            const reorderResult = EffectEngine.applyEffects(state, 'p1', [reorderEffect]);

            expect(reorderResult.needsChoice).toBe(false);
            expect(player.deck.length).toBe(1);
            expect(player.aside.length).toBe(0);
        });
    });
});
