/**
 * Card Validation Suite - Comprehensive Tests
 * 
 * Tests all cards across all expansions:
 * - Base (2E)
 * - Intrigue (2E)
 * - Seaside (Mixed 1E/2E)
 * - Prosperity (2E)
 * - Dark Ages (1E)
 */

import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState, PlayerState } from '../../shared/engine/PlayerState.js';
import { createCardInstance, CardInstance } from '../../shared/engine/CardInstance.js';
import { CardRegistry } from '../../shared/cards/index.js';

// ============================================================================
// Test Infrastructure
// ============================================================================

interface TestCase {
    cardId: string;
    description: string;
    setup?: (state: GameState) => void;
    assert: (state: GameState, beforeState?: GameState) => void;
    skip?: boolean;
}

interface TestResult {
    cardId: string;
    description: string;
    passed: boolean;
    error?: string;
}

class CardValidator {
    private results: TestResult[] = [];
    private failedCount = 0;
    private passedCount = 0;
    private skippedCount = 0;

    /**
     * Create a basic test state with 2 players
     */
    static createTestState(): GameState {
        const state = createGameState('validation_seed');
        const p1 = createPlayerState('p1', 'Player1', '#e74c3c');
        const p2 = createPlayerState('p2', 'Player2', '#2ecc71');

        p1.deck = [];
        p1.discardPile = [];
        p1.hand = [];
        p1.playArea = [];

        p2.deck = [];
        p2.discardPile = [];
        p2.hand = [];
        p2.playArea = [];

        state.players.push(p1, p2);
        state.currentPlayerIndex = 0;

        // Initialize supply
        state.supply = {
            'copper': { cardId: 'copper', count: 46, cards: [] },
            'silver': { cardId: 'silver', count: 40, cards: [] },
            'gold': { cardId: 'gold', count: 30, cards: [] },
            'estate': { cardId: 'estate', count: 24, cards: [] },
            'duchy': { cardId: 'duchy', count: 12, cards: [] },
            'province': { cardId: 'province', count: 12, cards: [] },
            'curse': { cardId: 'curse', count: 30, cards: [] },
        };

        return state;
    }

    /**
     * Clone state for before/after comparison
     */
    static cloneState(state: GameState): GameState {
        return JSON.parse(JSON.stringify(state));
    }

    /**
     * Play a card from player's hand
     */
    static playCard(state: GameState, cardId: string): void {
        const player = state.players[state.currentPlayerIndex];
        const cardIndex = player.hand.findIndex(c => c.id === cardId);

        if (cardIndex === -1) {
            throw new Error(`Card ${cardId} not found in player's hand`);
        }

        const card = player.hand[cardIndex];
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);

        const cardDef = CardRegistry.get(cardId);
        if (cardDef && cardDef.effects) {
            EffectEngine.applyEffects(state, player.id, cardDef.effects, false, card.instanceId);
        }
    }

    /**
     * Run a single test case
     */
    async runTest(test: TestCase): Promise<void> {
        if (test.skip) {
            console.log(`[SKIP] ${test.cardId} - ${test.description}`);
            this.skippedCount++;
            return;
        }

        try {
            const state = CardValidator.createTestState();
            const beforeState = test.setup ? CardValidator.cloneState(state) : undefined;

            // Setup
            if (test.setup) {
                test.setup(state);
            }

            // Assert
            test.assert(state, beforeState);

            this.results.push({
                cardId: test.cardId,
                description: test.description,
                passed: true
            });
            this.passedCount++;
            console.log(`[PASS] ${test.cardId} - ${test.description}`);
        } catch (error: any) {
            this.results.push({
                cardId: test.cardId,
                description: test.description,
                passed: false,
                error: error.message
            });
            this.failedCount++;
            console.error(`[FAIL] ${test.cardId} - ${test.description}`);
            console.error(`       Error: ${error.message}`);
        }
    }

    /**
     * Run all tests
     */
    async runAll(tests: TestCase[]): Promise<void> {
        console.log('='.repeat(70));
        console.log('Card Validation Suite - Starting');
        console.log('='.repeat(70));

        for (const test of tests) {
            await this.runTest(test);
        }

        this.printSummary();
    }

    /**
     * Print summary
     */
    printSummary(): void {
        console.log('\n' + '='.repeat(70));
        console.log('Validation Summary');
        console.log('='.repeat(70));
        console.log(`Total Tests: ${this.results.length + this.skippedCount}`);
        console.log(`✅ Passed: ${this.passedCount}`);
        console.log(`❌ Failed: ${this.failedCount}`);
        console.log(`⏭️  Skipped: ${this.skippedCount}`);

        if (this.failedCount > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  - ${r.cardId}: ${r.description}`);
                console.log(`    Error: ${r.error}`);
            });
        }

        console.log('='.repeat(70));

        if (this.failedCount > 0) {
            process.exit(1);
        }
    }
}

// ============================================================================
// BASE SET TESTS (2E)
// ============================================================================

const baseTests: TestCase[] = [
    // Treasures
    {
        cardId: 'copper',
        description: 'Copper gives +1💰',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('copper'));
            p1.coins = 0;
        },
        assert: (state) => {
            CardValidator.playCard(state, 'copper');
            if (state.players[0].coins !== 1) {
                throw new Error(`Expected 1💰, got ${state.players[0].coins}`);
            }
        }
    },
    {
        cardId: 'silver',
        description: 'Silver gives +2💰',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('silver'));
            p1.coins = 0;
        },
        assert: (state) => {
            CardValidator.playCard(state, 'silver');
            if (state.players[0].coins !== 2) {
                throw new Error(`Expected 2💰, got ${state.players[0].coins}`);
            }
        }
    },
    {
        cardId: 'gold',
        description: 'Gold gives +3💰',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('gold'));
            p1.coins = 0;
        },
        assert: (state) => {
            CardValidator.playCard(state, 'gold');
            if (state.players[0].coins !== 3) {
                throw new Error(`Expected 3💰, got ${state.players[0].coins}`);
            }
        }
    },

    // Simple Actions
    {
        cardId: 'village',
        description: 'Village gives +1 Card, +2 Actions',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('village'));
            p1.deck.push(createCardInstance('copper'));
            p1.actions = 1;
        },
        assert: (state) => {
            const before = { handSize: state.players[0].hand.length, actions: state.players[0].actions };
            CardValidator.playCard(state, 'village');
            const after = { handSize: state.players[0].hand.length, actions: state.players[0].actions };

            if (after.handSize !== before.handSize) {
                throw new Error(`Expected hand size ${before.handSize}, got ${after.handSize}`);
            }
            if (after.actions !== before.actions + 1) {
                throw new Error(`Expected ${before.actions + 1} actions, got ${after.actions}`);
            }
        }
    },
    {
        cardId: 'smithy',
        description: 'Smithy gives +3 Cards',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('smithy'));
            p1.deck.push(createCardInstance('copper'), createCardInstance('copper'), createCardInstance('copper'));
        },
        assert: (state) => {
            const before = state.players[0].hand.length;
            CardValidator.playCard(state, 'smithy');
            const after = state.players[0].hand.length;

            if (after !== before + 2) { // +3 cards - 1 (played smithy) = +2 net
                throw new Error(`Expected ${before + 2} cards in hand, got ${after}`);
            }
        }
    },
    {
        cardId: 'market',
        description: 'Market gives +1 Card, +1 Action, +1 Buy, +1💰',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('market'));
            p1.deck.push(createCardInstance('copper'));
            p1.actions = 1;
            p1.buys = 1;
            p1.coins = 0;
        },
        assert: (state) => {
            const before = {
                handSize: state.players[0].hand.length,
                actions: state.players[0].actions,
                buys: state.players[0].buys,
                coins: state.players[0].coins
            };

            CardValidator.playCard(state, 'market');

            const after = {
                handSize: state.players[0].hand.length,
                actions: state.players[0].actions,
                buys: state.players[0].buys,
                coins: state.players[0].coins
            };

            if (after.handSize !== before.handSize) {
                throw new Error(`Hand size: expected ${before.handSize}, got ${after.handSize}`);
            }
            if (after.actions !== before.actions) {
                throw new Error(`Actions: expected ${before.actions}, got ${after.actions}`);
            }
            if (after.buys !== before.buys + 1) {
                throw new Error(`Buys: expected ${before.buys + 1}, got ${after.buys}`);
            }
            if (after.coins !== 1) {
                throw new Error(`Coins: expected 1, got ${after.coins}`);
            }
        }
    },
    {
        cardId: 'laboratory',
        description: 'Laboratory gives +2 Cards, +1 Action',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('laboratory'));
            p1.deck.push(createCardInstance('copper'), createCardInstance('copper'));
            p1.actions = 1;
        },
        assert: (state) => {
            const before = { handSize: state.players[0].hand.length, actions: state.players[0].actions };
            CardValidator.playCard(state, 'laboratory');
            const after = { handSize: state.players[0].hand.length, actions: state.players[0].actions };

            if (after.handSize !== before.handSize + 1) { // +2 -1 = +1
                throw new Error(`Expected ${before.handSize + 1} cards, got ${after.handSize}`);
            }
            if (after.actions !== before.actions) {
                throw new Error(`Expected ${before.actions} actions, got ${after.actions}`);
            }
        }
    },
    {
        cardId: 'festival',
        description: 'Festival gives +2 Actions, +1 Buy, +2💰',
        setup: (state) => {
            const p1 = state.players[0];
            p1.hand.push(createCardInstance('festival'));
            p1.actions = 1;
            p1.buys = 1;
            p1.coins = 0;
        },
        assert: (state) => {
            const before = { actions: state.players[0].actions, buys: state.players[0].buys };
            CardValidator.playCard(state, 'festival');
            const after = { actions: state.players[0].actions, buys: state.players[0].buys, coins: state.players[0].coins };

            if (after.actions !== before.actions + 1) {
                throw new Error(`Expected ${before.actions + 1} actions, got ${after.actions}`);
            }
            if (after.buys !== before.buys + 1) {
                throw new Error(`Expected ${before.buys + 1} buys, got ${after.buys}`);
            }
            if (after.coins !== 2) {
                throw new Error(`Expected 2💰, got ${after.coins}`);
            }
        }
    },
];

// ============================================================================
// RUN ALL TESTS
// ============================================================================

const validator = new CardValidator();

const allTests = [
    ...baseTests,
    // TODO: Add intrigue, seaside, prosperity, dark ages tests
];

validator.runAll(allTests).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
