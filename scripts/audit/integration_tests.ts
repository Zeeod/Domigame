/**
 * Deep Integration Tests
 * Validates exact card behavior and effect accuracy
 */

import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { PlayerState, createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

interface TestCase {
    name: string;
    category: string;
    run: () => Promise<TestResult>;
}

interface TestResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
}

class DeepIntegrationSuite {
    private results: Map<string, TestResult> = new Map();

    /**
     * Create a clean test state
     */
    private createTestState(): GameState {
        const state = createGameState('integration_test');
        const p1 = createPlayerState('p1', 'Player 1', '#ff0000');
        const p2 = createPlayerState('p2', 'Player 2', '#0000ff');

        state.players.push(p1, p2);
        state.currentPlayerIndex = 0;

        // Standard supply
        state.supply = {
            estate: { cardId: 'estate', count: 8, cards: [] },
            duchy: { cardId: 'duchy', count: 8, cards: [] },
            province: { cardId: 'province', count: 8, cards: [] },
            copper: { cardId: 'copper', count: 46, cards: [] },
            silver: { cardId: 'silver', count: 40, cards: [] },
            gold: { cardId: 'gold', count: 30, cards: [] },
            curse: { cardId: 'curse', count: 10, cards: [] },
        };

        return state;
    }

    /**
     * Play a card and return the state
     */
    private playCard(state: GameState, cardId: string, playerIndex: number = 0): GameState {
        const player = state.players[playerIndex];
        const card = createCardInstance(cardId);

        // Add to hand
        player.hand.push(card);

        // Play it
        const cardIdx = player.hand.findIndex(c => c.instanceId === card.instanceId);
        if (cardIdx !== -1) {
            player.hand.splice(cardIdx, 1);
            player.playArea.push(card);

            const cardDef = CardRegistry.get(cardId);
            if (cardDef?.effects) {
                EffectEngine.applyEffects(state, player.id, cardDef.effects, false, card.instanceId);
            }
        }

        return state;
    }

    // ========================================
    // TREASURE TESTS
    // ========================================

    private async testCopper(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.coins = 0;
        this.playCard(state, 'copper');

        if (player.coins !== 1) {
            errors.push(`Expected 1💰, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testSilver(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.coins = 0;
        this.playCard(state, 'silver');

        if (player.coins !== 2) {
            errors.push(`Expected 2💰, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testGold(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.coins = 0;
        this.playCard(state, 'gold');

        if (player.coins !== 3) {
            errors.push(`Expected 3💰, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    // ========================================
    // SIMPLE ACTION TESTS
    // ========================================

    private async testVillage(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        // Setup: Empty hand, 5 cards in deck
        player.hand = [];
        player.deck = [
            createCardInstance('copper'),
            createCardInstance('copper'),
            createCardInstance('copper'),
            createCardInstance('copper'),
            createCardInstance('copper'),
        ];
        player.actions = 1;

        const beforeHandSize = player.hand.length;
        const beforeActions = player.actions;

        this.playCard(state, 'village');

        // Village: +1 Card, +2 Actions
        const afterHandSize = player.hand.length;
        const afterActions = player.actions;

        if (afterHandSize !== beforeHandSize + 1) {
            errors.push(`Expected ${beforeHandSize + 1} cards in hand, got ${afterHandSize}`);
        }

        // Actions: Started with 1, gained +2 from Village = 3 total (engine doesn't auto-decrement)
        const expectedActions = beforeActions + 2;
        if (afterActions !== expectedActions) {
            errors.push(`Expected ${expectedActions} actions, got ${afterActions}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testSmithy(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        // Setup
        player.hand = [];
        player.deck = Array(10).fill(null).map(() => createCardInstance('copper'));

        const beforeHandSize = player.hand.length;
        const beforeDeckSize = player.deck.length;

        this.playCard(state, 'smithy');

        // Smithy: +3 Cards
        const afterHandSize = player.hand.length;
        const afterDeckSize = player.deck.length;

        if (afterHandSize !== beforeHandSize + 3) {
            errors.push(`Expected ${beforeHandSize + 3} cards in hand, got ${afterHandSize}`);
        }

        if (afterDeckSize !== beforeDeckSize - 3) {
            errors.push(`Expected ${beforeDeckSize - 3} cards in deck, got ${afterDeckSize}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testMarket(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        // Setup
        player.hand = [];
        player.deck = Array(5).fill(null).map(() => createCardInstance('copper'));
        player.actions = 1;
        player.buys = 1;
        player.coins = 0;

        const beforeHandSize = player.hand.length;
        const beforeActions = player.actions;
        const beforeBuys = player.buys;
        const beforeCoins = player.coins;

        this.playCard(state, 'market');

        // Market: +1 Card, +1 Action, +1 Buy, +1💰
        if (player.hand.length !== beforeHandSize + 1) {
            errors.push(`Hand: expected ${beforeHandSize + 1}, got ${player.hand.length}`);
        }
        // Actions: 1 + 1 = 2 (engine adds directly)
        if (player.actions !== beforeActions + 1) {
            errors.push(`Actions: expected ${beforeActions + 1}, got ${player.actions}`);
        }
        if (player.buys !== beforeBuys + 1) {
            errors.push(`Buys: expected ${beforeBuys + 1}, got ${player.buys}`);
        }
        if (player.coins !== 1) {
            errors.push(`Coins: expected 1, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testLaboratory(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.hand = [];
        player.deck = Array(5).fill(null).map(() => createCardInstance('copper'));
        player.actions = 1;

        const beforeHandSize = player.hand.length;
        const beforeActions = player.actions;

        this.playCard(state, 'laboratory');

        // Laboratory: +2 Cards, +1 Action
        if (player.hand.length !== beforeHandSize + 2) {
            errors.push(`Hand: expected ${beforeHandSize + 2}, got ${player.hand.length}`);
        }
        // Actions: 1 + 1 = 2
        if (player.actions !== beforeActions + 1) {
            errors.push(`Actions: expected ${beforeActions + 1}, got ${player.actions}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testFestival(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.actions = 1;
        player.buys = 1;
        player.coins = 0;

        const beforeActions = player.actions;
        const beforeBuys = player.buys;

        this.playCard(state, 'festival');

        // Festival: +2 Actions, +1 Buy, +2💰
        // Actions: 1 + 2 = 3
        if (player.actions !== beforeActions + 2) {
            errors.push(`Actions: expected ${beforeActions + 2}, got ${player.actions}`);
        }
        if (player.buys !== beforeBuys + 1) {
            errors.push(`Buys: expected ${beforeBuys + 1}, got ${player.buys}`);
        }
        if (player.coins !== 2) {
            errors.push(`Coins: expected 2, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testMoat(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.hand = [];
        player.deck = Array(5).fill(null).map(() => createCardInstance('copper'));

        const beforeHandSize = player.hand.length;

        this.playCard(state, 'moat');

        // Moat: +2 Cards
        if (player.hand.length !== beforeHandSize + 2) {
            errors.push(`Expected ${beforeHandSize + 2} cards, got ${player.hand.length}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testVassal(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.coins = 0;

        this.playCard(state, 'vassal');

        // Vassal: +2💰
        if (player.coins !== 2) {
            errors.push(`Expected 2💰, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testPoacher(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.hand = [];
        player.deck = Array(5).fill(null).map(() => createCardInstance('copper'));
        player.actions = 1;
        player.coins = 0;

        const beforeHandSize = player.hand.length;
        const beforeActions = player.actions;

        this.playCard(state, 'poacher');

        // Poacher: +1 Card, +1 Action, +1💰
        if (player.hand.length !== beforeHandSize + 1) {
            errors.push(`Hand: expected ${beforeHandSize + 1}, got ${player.hand.length}`);
        }
        // Actions: 1 + 1 = 2
        if (player.actions !== beforeActions + 1) {
            errors.push(`Actions: expected ${beforeActions + 1}, got ${player.actions}`);
        }
        if (player.coins !== 1) {
            errors.push(`Coins: expected 1, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testMilitia(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.coins = 0;

        this.playCard(state, 'militia');

        // Militia: +2💰 (attack tested separately)
        if (player.coins !== 2) {
            errors.push(`Expected 2💰, got ${player.coins}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    private async testCouncilRoom(): Promise<TestResult> {
        const errors: string[] = [];
        const state = this.createTestState();
        const player = state.players[0];

        player.hand = [];
        player.deck = Array(10).fill(null).map(() => createCardInstance('copper'));
        player.buys = 1;

        const beforeHandSize = player.hand.length;
        const beforeBuys = player.buys;

        this.playCard(state, 'council_room');

        // Council Room: +4 Cards, +1 Buy
        if (player.hand.length !== beforeHandSize + 4) {
            errors.push(`Hand: expected ${beforeHandSize + 4}, got ${player.hand.length}`);
        }
        if (player.buys !== beforeBuys + 1) {
            errors.push(`Buys: expected ${beforeBuys + 1}, got ${player.buys}`);
        }

        return { passed: errors.length === 0, errors, warnings: [] };
    }

    // ========================================
    // TEST RUNNER
    // ========================================

    async runAll() {
        console.log('═'.repeat(70));
        console.log('DEEP INTEGRATION TESTS - EFFECT ACCURACY');
        console.log('═'.repeat(70));
        console.log('');

        const tests: TestCase[] = [
            // Treasures
            { name: 'Copper (+1💰)', category: 'Treasures', run: () => this.testCopper() },
            { name: 'Silver (+2💰)', category: 'Treasures', run: () => this.testSilver() },
            { name: 'Gold (+3💰)', category: 'Treasures', run: () => this.testGold() },

            // Card Draw
            { name: 'Village (+1 Card, +2 Actions)', category: 'Card Draw', run: () => this.testVillage() },
            { name: 'Smithy (+3 Cards)', category: 'Card Draw', run: () => this.testSmithy() },
            { name: 'Laboratory (+2 Cards, +1 Action)', category: 'Card Draw', run: () => this.testLaboratory() },
            { name: 'Moat (+2 Cards)', category: 'Card Draw', run: () => this.testMoat() },
            { name: 'Council Room (+4 Cards, +1 Buy)', category: 'Card Draw', run: () => this.testCouncilRoom() },

            // Economy
            { name: 'Market (+1 Card, +1 Action, +1 Buy, +1💰)', category: 'Economy', run: () => this.testMarket() },
            { name: 'Festival (+2 Actions, +1 Buy, +2💰)', category: 'Economy', run: () => this.testFestival() },
            { name: 'Vassal (+2💰)', category: 'Economy', run: () => this.testVassal() },
            { name: 'Poacher (+1 Card, +1 Action, +1💰)', category: 'Economy', run: () => this.testPoacher() },
            { name: 'Militia (+2💰)', category: 'Attacks', run: () => this.testMilitia() },
        ];

        let currentCategory = '';
        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            if (test.category !== currentCategory) {
                console.log(`\n${test.category}:`);
                currentCategory = test.category;
            }

            const result = await test.run();
            this.results.set(test.name, result);

            if (result.passed) {
                console.log(`  ✅ ${test.name}`);
                passed++;
            } else {
                console.log(`  ❌ ${test.name}`);
                result.errors.forEach(err => console.log(`     ERROR: ${err}`));
                failed++;
            }
        }

        console.log('');
        console.log('═'.repeat(70));
        console.log('SUMMARY');
        console.log('═'.repeat(70));
        console.log(`Total: ${tests.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log('═'.repeat(70));

        if (failed > 0) {
            console.error('\n❌ Some tests failed');
            process.exit(1);
        } else {
            console.log('\n✅ All integration tests passed!');
        }
    }
}

// Run tests
const suite = new DeepIntegrationSuite();
suite.runAll().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
