/**
 * Comprehensive Card Validation
 * Tests all implemented cards for basic functionality
 */

import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { PlayerState, createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';

// Import all cards
import '../../shared/cards/index.js';

interface ValidationResult {
    cardId: string;
    cardName: string;
    expansion: string;
    passed: boolean;
    errors: string[];
    warnings: string[];
}

class CardValidationSuite {
    private results: ValidationResult[] = [];

    /**
     * Get all cards from registry
     */
    getAllCards() {
        const allCards = CardRegistry.getAll();
        return Object.entries(allCards).map(([id, def]) => ({
            id,
            definition: def
        }));
    }

    /**
     * Validate a single card
     */
    validateCard(cardId: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // 1. Check card definition exists
            const cardDef = CardRegistry.get(cardId);
            if (!cardDef) {
                errors.push('Card definition not found in registry');
                return {
                    cardId,
                    cardName: cardId,
                    expansion: 'unknown',
                    passed: false,
                    errors,
                    warnings
                };
            }

            // 2. Check basic properties
            if (!cardDef.name) errors.push('Missing name');
            if (!cardDef.types || cardDef.types.length === 0) errors.push('Missing types');
            if (cardDef.cost === undefined) warnings.push('Missing cost');

            // 3. Check card can be instantiated
            try {
                const instance = createCardInstance(cardId);
                if (!instance.id) errors.push('Card instance missing id');
                if (!instance.instanceId) errors.push('Card instance missing instanceId');
            } catch (e: any) {
                errors.push(`Failed to create instance: ${e.message}`);
            }

            // 4. Check card can be played (basic test)
            try {
                const state = this.createTestState();
                const player = state.players[0];

                // Add card to hand
                const card = createCardInstance(cardId);
                player.hand.push(card);

                // Try to play it (if it's an action or treasure)
                if (cardDef.types.includes('ACTION') || cardDef.types.includes('TREASURE')) {
                    player.actions = 10; // Give plenty of actions
                    player.buys = 5;

                    // Move to play area
                    const cardIndex = player.hand.findIndex(c => c.instanceId === card.instanceId);
                    if (cardIndex !== -1) {
                        player.hand.splice(cardIndex, 1);
                        player.playArea.push(card);

                        // Apply effects
                        if (cardDef.effects && cardDef.effects.length > 0) {
                            EffectEngine.applyEffects(state, player.id, cardDef.effects, false, card.instanceId);
                        }
                    }
                }
            } catch (e: any) {
                errors.push(`Failed to play card: ${e.message}`);
            }

            // 5. Check expansion/set metadata
            const expansion = cardDef.expansion || cardDef.set || 'unknown';
            if (!cardDef.expansion && !cardDef.set) {
                warnings.push('Missing expansion/set metadata');
            }

            return {
                cardId,
                cardName: cardDef.name || cardId,
                expansion,
                passed: errors.length === 0,
                errors,
                warnings
            };

        } catch (e: any) {
            errors.push(`Unexpected error: ${e.message}`);
            return {
                cardId,
                cardName: cardId,
                expansion: 'unknown',
                passed: false,
                errors,
                warnings
            };
        }
    }

    /**
     * Create a minimal test state
     */
    private createTestState(): GameState {
        const state = createGameState('test123');
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
     * Run all validations
     */
    runAll() {
        console.log('═'.repeat(70));
        console.log('DOMINION - COMPREHENSIVE CARD VALIDATION');
        console.log('═'.repeat(70));
        console.log('');

        const cards = this.getAllCards();
        console.log(`Total cards to validate: ${cards.length}`);
        console.log('');

        // Validate each card
        for (const { id } of cards) {
            const result = this.validateCard(id);
            this.results.push(result);

            if (result.passed) {
                console.log(`✅ ${result.cardName.padEnd(25)} (${result.expansion})`);
            } else {
                console.log(`❌ ${result.cardName.padEnd(25)} (${result.expansion})`);
                result.errors.forEach(err => console.log(`   ERROR: ${err}`));
            }

            if (result.warnings.length > 0) {
                result.warnings.forEach(warn => console.log(`   WARN: ${warn}`));
            }
        }

        this.printSummary();
    }

    /**
     * Print summary
     */
    private printSummary() {
        console.log('');
        console.log('═'.repeat(70));
        console.log('VALIDATION SUMMARY');
        console.log('═'.repeat(70));

        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => r.passed === false).length;
        const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);

        console.log(`Total Cards: ${this.results.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${totalWarnings}`);
        console.log('');

        // Group by expansion
        const byExpansion = new Map<string, ValidationResult[]>();
        for (const result of this.results) {
            const exp = result.expansion;
            if (!byExpansion.has(exp)) {
                byExpansion.set(exp, []);
            }
            byExpansion.get(exp)!.push(result);
        }

        console.log('By Expansion:');
        for (const [expansion, cards] of Array.from(byExpansion.entries()).sort()) {
            const expPassed = cards.filter(c => c.passed).length;
            const expTotal = cards.length;
            const status = expPassed === expTotal ? '✅' : '⚠️';
            console.log(`  ${status} ${expansion.padEnd(15)}: ${expPassed}/${expTotal} passed`);
        }

        console.log('');

        if (failed > 0) {
            console.log('Failed Cards:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  • ${r.cardName} (${r.cardId})`);
                r.errors.forEach(err => console.log(`    - ${err}`));
            });
            console.log('');
        }

        console.log('═'.repeat(70));

        if (failed > 0) {
            console.error(`\n❌ Validation failed: ${failed} card(s) have errors`);
            process.exit(1);
        } else {
            console.log(`\n✅ All ${passed} cards validated successfully!`);
        }
    }
}

// Run validation
const suite = new CardValidationSuite();
suite.runAll();
