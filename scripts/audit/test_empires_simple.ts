/**
 * Test Simple Empires Cards
 * Tests basic functionality of Empire cards without complex mechanics
 */

import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { PlayerState, createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

// Import all cards to ensure they're registered
import '../../shared/cards/index.js';

interface TestResult {
    cardId: string;
    cardName: string;
    passed: boolean;
    errors: string[];
}

class EmpiresCardTester {
    private results: TestResult[] = [];

    createTestState(): GameState {
        const state = createGameState('test-emp-123');
        const p1 = createPlayerState('p1', 'Player 1', '#ff0000');
        const p2 = createPlayerState('p2', 'Player 2', '#0000ff');

        state.players.push(p1, p2);
        state.currentPlayerIndex = 0;

        // Add basic supply
        state.supply = {
            copper: { cardId: 'copper', count: 60, cards: [] },
            silver: { cardId: 'silver', count: 40, cards: [] },
            gold: { cardId: 'gold', count: 30, cards: [] },
            estate: { cardId: 'estate', count: 24, cards: [] },
            duchy: { cardId: 'duchy', count: 12, cards: [] },
            province: { cardId: 'province', count: 12, cards: [] },
            curse: { cardId: 'curse', count: 30, cards: [] },
        };

        return state;
    }

    /**
     * Test Villa (4💰) - Action
     * +2 Actions, +1 Buy, +1💰
     * When you gain this, put it into your hand and return to Action phase
     */
    testVilla(): TestResult {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        try {
            // Add Villa to hand
            const villa = createCardInstance('villa');
            player.hand.push(villa);
            player.actions = 1;
            player.buys = 1;
            player.coins = 0;

            // Play Villa
            const initialActions = player.actions;
            const initialBuys = player.buys;
            const initialCoins = player.coins;

            const cardDef = CardRegistry.get('villa');
            if (!cardDef) {
                errors.push('Villa definition not found');
                return { cardId: 'villa', cardName: 'Villa', passed: false, errors };
            }

            // Move to play area
            player.hand.splice(player.hand.indexOf(villa), 1);
            player.playArea.push(villa);

            // Apply effects
            if (cardDef.effects) {
                EffectEngine.applyEffects(state, player.id, cardDef.effects, false, villa.instanceId);
            }

            // Verify results
            console.log(`      Actions: ${initialActions} + 2 = ${player.actions} (expected ${initialActions + 2})`);
            console.log(`      Buys: ${initialBuys} + 1 = ${player.buys} (expected ${initialBuys + 1})`);
            console.log(`      Coins: ${initialCoins} + 1 = ${player.coins} (expected ${initialCoins + 1})`);

            if (player.actions !== initialActions + 2) {
                errors.push(`Expected +2 Actions (total ${initialActions + 2}), got ${player.actions}`);
            }
            if (player.buys !== initialBuys + 1) {
                errors.push(`Expected +1 Buy (total ${initialBuys + 1}), got ${player.buys}`);
            }
            if (player.coins !== initialCoins + 1) {
                errors.push(`Expected +1💰 (total ${initialCoins + 1}), got ${player.coins}`);
            }

        } catch (e: any) {
            errors.push(`Exception: ${e.message}`);
        }

        return {
            cardId: 'villa',
            cardName: 'Villa',
            passed: errors.length === 0,
            errors
        };
    }

    /**
     * Test Forum (5💰) - Action
     * +3 Cards, +1 Action, Discard 2 cards
     */
    testForum(): TestResult {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        try {
            // Setup: Give player a deck with cards
            for (let i = 0; i < 10; i++) {
                player.deck.push(createCardInstance('copper'));
            }

            const forum = createCardInstance('forum');
            player.hand.push(forum);
            player.actions = 1;

            const initialHandSize = player.hand.length;
            const initialActions = player.actions;

            const cardDef = CardRegistry.get('forum');
            if (!cardDef) {
                errors.push('Forum definition not found');
                return { cardId: 'forum', cardName: 'Forum', passed: false, errors };
            }

            // Move to play area
            player.hand.splice(player.hand.indexOf(forum), 1);
            player.playArea.push(forum);

            // Apply effects
            if (cardDef.effects) {
                const result = EffectEngine.applyEffects(state, player.id, cardDef.effects, false, forum.instanceId);

                // Forum should draw 3 cards and add 1 action
                // Then require discard of 2 cards (which creates a decision)
                if (!result.needsChoice) {
                    // Verify immediate effects
                    const expectedHand = initialHandSize - 1 + 3; // -1 (played) +3 (drawn)
                    if (player.hand.length !== expectedHand) {
                        errors.push(`Expected ${expectedHand} cards in hand, got ${player.hand.length}`);
                    }
                    if (player.actions !== initialActions) {
                        errors.push(`Expected ${initialActions} actions, got ${player.actions}`);
                    }
                }
            }

        } catch (e: any) {
            errors.push(`Exception: ${e.message}`);
        }

        return {
            cardId: 'forum',
            cardName: 'Forum',
            passed: errors.length === 0,
            errors
        };
    }

    /**
     * Test Capital (5💰) - Treasure
     * +6💰, +1 Buy
     * When discarded from play: pay debt, take 6 debt
     */
    testCapital(): TestResult {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        try {
            const capital = createCardInstance('capital');
            player.hand.push(capital);
            player.buys = 1;
            player.coins = 0;
            player.debt = 0;

            const cardDef = CardRegistry.get('capital');
            if (!cardDef) {
                errors.push('Capital definition not found');
                return { cardId: 'capital', cardName: 'Capital', passed: false, errors };
            }

            // Play Capital as treasure
            player.hand.splice(player.hand.indexOf(capital), 1);
            player.playArea.push(capital);

            // Treasures give their value + effects
            if (cardDef.treasureValue) {
                player.coins += cardDef.treasureValue;
            }
            if (cardDef.effects) {
                EffectEngine.applyEffects(state, player.id, cardDef.effects, false, capital.instanceId);
            }

            // Verify treasure effects
            if (player.coins !== 6) {
                errors.push(`Expected 6💰, got ${player.coins}`);
            }
            if (player.buys !== 2) {
                errors.push(`Expected 2 Buys, got ${player.buys}`);
            }

            // Now test onDiscard effect
            if (cardDef.onDiscard) {
                player.playArea.splice(player.playArea.indexOf(capital), 1);
                EffectEngine.applyEffects(state, player.id, cardDef.onDiscard, false, capital.instanceId);

                if (player.debt !== 6) {
                    errors.push(`Expected 6 Debt after discard, got ${player.debt}`);
                }
            }

        } catch (e: any) {
            errors.push(`Exception: ${e.message}`);
        }

        return {
            cardId: 'capital',
            cardName: 'Capital',
            passed: errors.length === 0,
            errors
        };
    }

    /**
     * Run all tests
     */
    runAll() {
        console.log('═'.repeat(70));
        console.log('EMPIRES CARDS - BASIC FUNCTIONALITY TESTS');
        console.log('═'.repeat(70));
        console.log('');

        const tests = [
            () => this.testVilla(),
            () => this.testForum(),
            () => this.testCapital()
        ];

        for (const test of tests) {
            const result = test();
            this.results.push(result);

            if (result.passed) {
                console.log(`✅ ${result.cardName}`);
            } else {
                console.log(`❌ ${result.cardName}`);
                result.errors.forEach(err => console.log(`   ERROR: ${err}`));
            }
        }

        this.printSummary();
    }

    private printSummary() {
        console.log('');
        console.log('═'.repeat(70));
        console.log('SUMMARY');
        console.log('═'.repeat(70));

        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;

        console.log(`Total Tests: ${this.results.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log('');

        if (failed > 0) {
            console.log('Failed Tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  • ${r.cardName}`);
                r.errors.forEach(err => console.log(`    - ${err}`));
            });
            console.log('');
        }

        console.log('═'.repeat(70));

        if (failed > 0) {
            console.error(`\n❌ ${failed} test(s) failed`);
            process.exit(1);
        } else {
            console.log(`\n✅ All ${passed} tests passed!`);
        }
    }
}

// Run tests
const tester = new EmpiresCardTester();
tester.runAll();
