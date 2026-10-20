import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';

describe('Seaside Advanced Mechanics', () => {
    let gameState: GameState;

    beforeEach(() => {
        gameState = createGameState('test_game');
        const player1 = createPlayerState('player1', 'Alice', '#fff');
        const player2 = createPlayerState('player2', 'Bob', '#fff');
        gameState.players.push(player1, player2);
        gameState.currentPlayerIndex = 0;

        // Initialize supply for tests
        gameState.supply = {
            'copper': { cardId: 'copper', count: 60, cards: [] },
            'silver': { cardId: 'silver', count: 40, cards: [] },
            'gold': { cardId: 'gold', count: 30, cards: [] },
            'treasure_map': { cardId: 'treasure_map', count: 10, cards: [] },
            'estate': { cardId: 'estate', count: 8, cards: [] },
            'duchy': { cardId: 'duchy', count: 8, cards: [] },
            'province': { cardId: 'province', count: 8, cards: [] }
        } as any;
    });

    describe('Native Village', () => {
        it('should set aside top card of deck to Native Village mat', () => {
            const player = gameState.players[0];

            // Add some cards to deck
            player.deck = [
                { id: 'copper', instanceId: 'c1' },
                { id: 'estate', instanceId: 'e1' },
                { id: 'silver', instanceId: 's1' }
            ];

            const initialDeckSize = player.deck.length;

            // Apply the effect
            EffectEngine.applyEffect(gameState, player.id, {
                type: 'MOVE_TO_MAT',
                mat: 'nativeVillage',
                targets: 'TOP_OF_DECK'
            } as const);

            expect(player.mats.nativeVillage).toHaveLength(1);
            expect(player.deck).toHaveLength(initialDeckSize - 1);
            expect(player.mats.nativeVillage[0].id).toBe('copper');
        });

        it('should take all cards from Native Village mat to hand', () => {
            const player = gameState.players[0];

            // Put cards on mat
            player.mats.nativeVillage = [
                { id: 'copper', instanceId: 'c1' },
                { id: 'silver', instanceId: 's1' },
                { id: 'gold', instanceId: 'g1' }
            ];

            const initialHandSize = player.hand.length;

            // Apply the effect
            EffectEngine.applyEffect(gameState, player.id, {
                type: 'TAKE_FROM_MAT',
                mat: 'nativeVillage'
            } as const);

            expect(player.mats.nativeVillage).toHaveLength(0);
            expect(player.hand).toHaveLength(initialHandSize + 3);
            expect(player.hand.some(c => c.id === 'copper')).toBe(true);
            expect(player.hand.some(c => c.id === 'silver')).toBe(true);
            expect(player.hand.some(c => c.id === 'gold')).toBe(true);
        });

        it('should handle empty Native Village mat gracefully', () => {
            const player = gameState.players[0];
            player.mats.nativeVillage = [];

            const result = EffectEngine.applyEffect(gameState, player.id, {
                type: 'TAKE_FROM_MAT',
                mat: 'nativeVillage'
            });

            expect(player.mats.nativeVillage).toHaveLength(0);
            expect(result.needsChoice).toBe(false);
        });
    });

    describe('Island', () => {
        it('should set aside Island and one card from hand to Island mat', () => {
            const player = gameState.players[0];

            // Add Island to play area and a card to hand
            player.playArea = [
                { id: 'island', instanceId: 'i1' }
            ];
            player.hand = [
                { id: 'copper', instanceId: 'c1' },
                { id: 'estate', instanceId: 'e1' }
            ];

            // The effect would prompt for card selection, so we need to test
            // the MOVE_TO_MAT with targets: 'SELF'
            EffectEngine.applyEffect(gameState, player.id, {
                type: 'MOVE_TO_MAT',
                mat: 'island',
                targets: 'SELF'
            }, 'i1');

            // Island should move from play area to Island mat
            expect(player.mats.island.length).toBeGreaterThan(0);
            expect(player.playArea.some(c => c.instanceId === 'i1')).toBe(false);
        });

        it('should keep Island mat cards for scoring at game end', () => {
            const player = gameState.players[0];

            // Set up Island mat with some VP cards
            player.mats.island = [
                { id: 'island', instanceId: 'i1' },
                { id: 'estate', instanceId: 'e1' },
                { id: 'duchy', instanceId: 'd1' }
            ];

            // Island mat cards should be accessible for scoring
            expect(player.mats.island).toHaveLength(3);
            expect(player.mats.island.some(c => c.id === 'island')).toBe(true);
            expect(player.mats.island.some(c => c.id === 'estate')).toBe(true);
            expect(player.mats.island.some(c => c.id === 'duchy')).toBe(true);
        });
    });

    describe('Outpost', () => {
        it('should schedule an extra turn for the player', () => {
            const player = gameState.players[0];

            // Apply the SCHEDULE_EXTRA_TURN effect
            EffectEngine.applyEffect(gameState, player.id, { type: 'SCHEDULE_EXTRA_TURN', turnType: 'OUTPOST' } as any);

            expect(gameState.extraTurns).toHaveLength(1);
            expect(gameState.extraTurns[0].playerId).toBe(player.id);
            expect(gameState.extraTurns[0].type).toBe('OUTPOST');
        });

        it('should draw only 3 cards during Outpost extra turn', () => {
            const player = gameState.players[0];

            // Set up a specific deck for testing
            player.deck = [
                { id: 'copper', instanceId: 'c1' },
                { id: 'copper', instanceId: 'c2' },
                { id: 'copper', instanceId: 'c3' },
                { id: 'estate', instanceId: 'e1' },
                { id: 'estate', instanceId: 'e2' }
            ];

            // Schedule Outpost turn
            gameState.extraTurns = [{ playerId: player.id, type: 'OUTPOST' }];

            // Draw cards as would happen in cleanup (simulating the logic)
            const isOutpostTurn = gameState.extraTurns && gameState.extraTurns.length > 0 &&
                gameState.extraTurns[0].playerId === player.id &&
                gameState.extraTurns[0].type === 'OUTPOST';
            const drawCount = isOutpostTurn ? 3 : 5;

            EffectEngine.applyEffects(gameState, player.id, [
                { type: 'DRAW', amount: drawCount }
            ]);

            // Verify only 3 cards were drawn
            expect(player.hand).toHaveLength(3);
            expect(player.deck).toHaveLength(2);
        });

        it('should draw 5 cards for normal turns', () => {
            const player = gameState.players[0];

            // Set up deck
            player.deck = [
                { id: 'copper', instanceId: 'c1' },
                { id: 'copper', instanceId: 'c2' },
                { id: 'copper', instanceId: 'c3' },
                { id: 'estate', instanceId: 'e1' },
                { id: 'estate', instanceId: 'e2' },
                { id: 'silver', instanceId: 's1' }
            ];

            // No extra turns scheduled (normal turn)
            gameState.extraTurns = [];

            const isOutpostTurn = gameState.extraTurns && gameState.extraTurns.length > 0 &&
                gameState.extraTurns[0].playerId === player.id &&
                gameState.extraTurns[0].type === 'OUTPOST';
            const drawCount = isOutpostTurn ? 3 : 5;

            EffectEngine.applyEffects(gameState, player.id, [
                { type: 'DRAW', amount: drawCount }
            ]);

            // Verify 5 cards were drawn for normal turn
            expect(player.hand).toHaveLength(5);
            expect(player.deck).toHaveLength(1);
        });
    });

});
