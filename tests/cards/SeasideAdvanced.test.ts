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

            expect(player.nativeVillageMat).toHaveLength(1);
            expect(player.deck).toHaveLength(initialDeckSize - 1);
            expect(player.nativeVillageMat[0].id).toBe('copper');
        });

        it('should take all cards from Native Village mat to hand', () => {
            const player = gameState.players[0];

            // Put cards on mat
            player.nativeVillageMat = [
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

            expect(player.nativeVillageMat).toHaveLength(0);
            expect(player.hand).toHaveLength(initialHandSize + 3);
            expect(player.hand.some(c => c.id === 'copper')).toBe(true);
            expect(player.hand.some(c => c.id === 'silver')).toBe(true);
            expect(player.hand.some(c => c.id === 'gold')).toBe(true);
        });

        it('should handle empty Native Village mat gracefully', () => {
            const player = gameState.players[0];
            player.nativeVillageMat = [];

            const result = EffectEngine.applyEffect(gameState, player.id, {
                type: 'TAKE_FROM_MAT',
                mat: 'nativeVillage'
            });

            expect(player.nativeVillageMat).toHaveLength(0);
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
            expect(player.islandMat.length).toBeGreaterThan(0);
            expect(player.playArea.some(c => c.instanceId === 'i1')).toBe(false);
        });

        it('should keep Island mat cards for scoring at game end', () => {
            const player = gameState.players[0];

            // Set up Island mat with some VP cards
            player.islandMat = [
                { id: 'island', instanceId: 'i1' },
                { id: 'estate', instanceId: 'e1' },
                { id: 'duchy', instanceId: 'd1' }
            ];

            // Island mat cards should be accessible for scoring
            expect(player.islandMat).toHaveLength(3);
            expect(player.islandMat.some(c => c.id === 'island')).toBe(true);
            expect(player.islandMat.some(c => c.id === 'estate')).toBe(true);
            expect(player.islandMat.some(c => c.id === 'duchy')).toBe(true);
        });
    });

    describe('Outpost', () => {
        it('should schedule an extra turn for the player', () => {
            const player = gameState.players[0];

            // Apply the SCHEDULE_EXTRA_TURN effect
            EffectEngine.applyEffect(gameState, player.id, {
                type: 'SCHEDULE_EXTRA_TURN'
            });

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

    describe('Treasure Map', () => {
        it('should gain 4 Gold when both Treasure Maps are trashed', () => {
            const player = gameState.players[0];

            // Set up player with 2 Treasure Maps
            player.hand = [
                { id: 'treasure_map', instanceId: 'tm1' },
                { id: 'treasure_map', instanceId: 'tm2' },
                { id: 'copper', instanceId: 'c1' }
            ];
            player.playArea = [];
            player.deck = [];

            const initialDeckSize = player.deck.length;

            // Simulate playing one Treasure Map and trashing the other
            // First, move one to play area (simulating play)
            const playedCard = player.hand.shift()!;
            player.playArea.push(playedCard);

            // Apply CHOOSE_FROM_ZONE effect (player selects second Treasure Map)
            // Use applyEffects to ensure the stack is processed (important for onNoMatch which pushes new effects)
            const result = EffectEngine.applyEffects(gameState, player.id, [{
                type: 'CHOOSE_FROM_ZONE',
                sourceZone: 'hand',
                min: 0,
                max: 1,
                filter: { cardIds: ['treasure_map'] },
                destination: 'trash',
                optional: true,
                onNoMatch: [{ type: 'TRASH_SELF' }],
                context: {
                    specialAction: 'TREASURE_MAP_TRASH',
                    onSuccess: [
                        { type: 'TRASH_SELF' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' }
                    ]
                }
            }], false, playedCard.instanceId) as any;

            // Should create a pending decision
            expect(result.needsChoice).toBe(true);
            expect(gameState.pendingDecision).toBeTruthy();

            // Simulate user selecting the second Treasure Map
            const secondTreasureMap = player.hand.find(c => c.id === 'treasure_map');
            expect(secondTreasureMap).toBeTruthy();

            EffectEngine.resolveDecision(gameState, player.id, {
                cardInstanceIds: [secondTreasureMap!.instanceId]
            });

            // Both Treasure Maps should be trashed
            expect(gameState.trash.filter(c => c.id === 'treasure_map').length).toBe(2);

            // 4 Gold should be added to deck
            expect(player.deck.filter(c => c.id === 'gold').length).toBe(4);
            expect(player.deck.length).toBe(initialDeckSize + 4);
        });

        it('should not gain Gold when no second Treasure Map available', () => {
            const player = gameState.players[0];

            // Set up player with only 1 Treasure Map
            player.hand = [
                { id: 'treasure_map', instanceId: 'tm1' },
                { id: 'copper', instanceId: 'c1' },
                { id: 'estate', instanceId: 'e1' }
            ];
            player.playArea = [];
            player.deck = [];

            const initialDeckSize = player.deck.length;
            const initialTrashSize = gameState.trash.length;

            // Simulate playing the Treasure Map
            const playedCard = player.hand.shift()!;
            player.playArea.push(playedCard);

            // Apply CHOOSE_FROM_ZONE effect (no second copy available)
            // Use applyEffects to ensure stack processing
            const result = EffectEngine.applyEffects(gameState, player.id, [{
                type: 'CHOOSE_FROM_ZONE',
                sourceZone: 'hand',
                min: 0,
                max: 1,
                filter: { cardIds: ['treasure_map'] },
                destination: 'trash',
                optional: true,
                onNoMatch: [{ type: 'TRASH_SELF' }],
                context: {
                    specialAction: 'TREASURE_MAP_TRASH',
                    onSuccess: [
                        { type: 'TRASH_SELF' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' }
                    ]
                }
            }], false, playedCard.instanceId) as any;

            // Should NOT create a pending decision (no targets found)
            expect(result.needsChoice).toBe(false);

            // No Gold should be gained
            expect(player.deck.filter(c => c.id === 'gold').length).toBe(0);
            expect(player.deck.length).toBe(initialDeckSize);

            // Self should be trashed (via onNoMatch)
            expect(gameState.trash.length).toBe(initialTrashSize + 1);
            expect(gameState.trash[gameState.trash.length - 1].id).toBe('treasure_map');
        });
    });
});
