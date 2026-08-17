import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { createCardInstances } from '../../shared/engine/CardInstance.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';

describe('Seaside Mechanics', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test_game');
        const player = createPlayerState('p1', 'Player 1', '#fff');
        state.players.push(player);
        state.currentPlayerIndex = 0;
    });

    describe('Lookout (Guetteur)', () => {
        it('should trash one, discard one, and topdeck one from top 3', () => {
            const player = state.players[0];
            // Deck: Top -> Bottom: Silver, Copper, Estate
            player.deck = [
                ...createCardInstances('silver', 1),   // index 0
                ...createCardInstances('copper', 1),   // index 1
                ...createCardInstances('estate', 1)    // index 2
            ];

            const effect = [
                { type: 'MOVE_CARDS', source: 'deck', destination: 'aside', count: 3 },
                { type: 'SELECT_AND_APPLY', sourceZone: 'aside', min: 1, max: 1, action: 'TRASH', message: 'Trash 1' },
                { type: 'SELECT_AND_APPLY', sourceZone: 'aside', min: 1, max: 1, action: 'DISCARD', message: 'Discard 1' },
                { type: 'MOVE_CARDS', source: 'aside', destination: 'deck', count: 1 }
            ];

            // 1. Initial Apply -> Should prompt for Trash
            let res = EffectEngine.applyEffects(state, 'p1', effect as any);
            expect(res.needsChoice).toBe(true);
            expect(state.pendingDecision?.context.action).toBe('TRASH');
            expect(player.aside.length).toBe(3);

            // 2. Trash Estate (the 3rd card)
            const estateId = player.aside.find(c => c.id === 'estate')!.instanceId;
            res = EffectEngine.resolveDecision(state, 'p1', { type: 'CHOOSE_CARDS', cardIds: [estateId] });

            // 3. Should prompt for Discard
            expect(res.needsChoice).toBe(true);
            expect(state.pendingDecision?.context.action).toBe('DISCARD');
            expect(player.aside.length).toBe(2);
            expect(state.trash.length).toBe(1);
            expect(state.trash[0].id).toBe('estate');

            // 4. Discard Copper
            const copperId = player.aside.find(c => c.id === 'copper')!.instanceId;
            res = EffectEngine.resolveDecision(state, 'p1', { type: 'CHOOSE_CARDS', cardIds: [copperId] });

            // 5. Should finish (topdeck Silver)
            expect(res.needsChoice).toBe(false);
            expect(player.aside.length).toBe(0);
            expect(player.discardPile.length).toBe(1);
            expect(player.discardPile[0].id).toBe('copper');
            expect(player.deck.length).toBe(1);
            expect(player.deck[0].id).toBe('silver');
        });
    });

    describe('Sea Chart (Carte Marine)', () => {
        it('should add to hand if copy in play', () => {
            const player = state.players[0];
            player.playArea = createCardInstances('sea_chart', 1);
            player.deck = createCardInstances('sea_chart', 1);

            const effect = [
                { type: 'REVEAL_CARDS', source: 'deck', amount: 1, destination: 'limbo' },
                { type: 'SEA_CHART_CHECK' }
            ];

            EffectEngine.applyEffects(state, 'p1', effect as any);

            expect(player.hand.length).toBe(1);
            expect(player.hand[0].id).toBe('sea_chart');
            expect(player.deck.length).toBe(0);
            expect(player.aside.length).toBe(0);
        });

        it('should stay on deck if no copy in play', () => {
            const player = state.players[0];
            player.playArea = createCardInstances('sea_chart', 1);
            player.deck = createCardInstances('copper', 1);

            const effect = [
                { type: 'REVEAL_CARDS', source: 'deck', amount: 1, destination: 'limbo' },
                { type: 'SEA_CHART_CHECK' }
            ];

            EffectEngine.applyEffects(state, 'p1', effect as any);

            expect(player.hand.length).toBe(0);
            expect(player.deck.length).toBe(1);
            expect(player.deck[0].id).toBe('copper');
            expect(player.aside.length).toBe(0);
        });
    });
});
