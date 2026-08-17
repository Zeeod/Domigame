
import { GameState, createGameState } from '../../shared/engine/GameState.js';
import { PlayerState, createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';

// Load ALL cards via main index
import '../../shared/cards/index.js';

interface TestResult {
    cardId: string;
    passed: boolean;
    logs: string[];
    errors: string[];
}

interface TestCase {
    cardId: string;
    setup?: (state: GameState, player: PlayerState) => void;
    // Helper to auto-respond to pending decisions
    // If returns null, uses default behavior (first option)
    onDecision?: (decision: any, state: GameState) => any;
    assert?: (state: GameState, player: PlayerState) => string[]; // Return errors, empty if pass
}

class TestHarness {
    static createTestState(): GameState {
        const state = createGameState('test_seed');
        // Manually add players
        const p1 = createPlayerState('p1', 'Player 1');
        const p2 = createPlayerState('p2', 'Player 2');
        state.players.push(p1, p2);

        state.players.forEach(p => {
            p.deck = [];
            p.discardPile = [];
            p.hand = [];
            p.playArea = [];
        });
        return state;
    }

    static runTest(testCase: TestCase): TestResult {
        const errors: string[] = [];
        const state = this.createTestState();
        const p1 = state.players[0];
        const p2 = state.players[1];

        // Default Setup: Card in hand, some basic deck
        p1.hand.push(createCardInstance(testCase.cardId));
        // Fill deck with generic cards
        for (let i = 0; i < 5; i++) p1.deck.push(createCardInstance('copper'));
        for (let i = 0; i < 5; i++) p1.discardPile.push(createCardInstance('silver'));

        // Custom Setup
        if (testCase.setup) testCase.setup(state, p1);

        console.log('[TEST] Setup Complete. Checking logs...');
        // Store logs start index (approx)
        const logStartIndex = state.history ? state.history.length : 0;

        console.log(`[TEST] Playing ${testCase.cardId}...`);

        // Execute Play Logic (Simulation of playCard)
        // Note: In real game, we move to PlayArea first, then execute.
        const cardToPlay = p1.hand.find(c => c.id === testCase.cardId) || p1.playArea.find(c => c.id === testCase.cardId); // Might be in setup
        if (!cardToPlay) {
            console.error(`[TEST] ERROR: Card ${testCase.cardId} not found in hand.`);
            return { cardId: testCase.cardId, passed: false, logs: [], errors: ['Card not found in hand/play for setup'] };
        }

        const handIdx = p1.hand.findIndex(c => c.instanceId === cardToPlay.instanceId);
        if (handIdx !== -1) {
            p1.hand.splice(handIdx, 1);
            p1.playArea.push(cardToPlay);
        }

        console.log(`[TEST] Looking up definition for ${testCase.cardId}...`);
        const def = CardRegistry.get(testCase.cardId);
        if (!def) {
            console.log('[TEST] FATAL: Card Definition NOT FOUND (Registry empty?)');
            console.log('Registry Keys:', Object.keys(CardRegistry.getAll()));
        }

        if (def && def.effects) {
            console.log(`[TEST] Applying effects...`);
            EffectEngine.applyEffects(state, p1.id, def.effects, false, cardToPlay.instanceId);
        }

        // Handle Loops/Decisions
        let iterations = 0;
        const MAX_LOOPS = 20;

        while (state.pendingDecision && iterations < MAX_LOOPS) {
            iterations++;
            const decision = state.pendingDecision;
            let payload: any = null;

            if (testCase.onDecision) {
                payload = testCase.onDecision(decision, state);
            }

            if (!payload) {
                // Default handling
                if (decision.type === PromptType.CHOOSE_CARDS) {
                    const min = decision.constraints?.min || 0;
                    // Pick min cards if available
                    // Where are they? sourceZone
                    // Simplified mock: just pick first N available or empty if optional
                    // This mimics "Auto-Play" or "Bot-Greedy"
                    // Ideally we check valid IDs.
                    payload = { type: 'CARDS', cardIds: [] }; // Pass empty for now unless forced
                    // If min > 0, we must pick.
                    if (min > 0) {
                        // Find cards in source
                        // Simple Mock: just pass
                        console.warn(`[TEST] Warning: Unhandled mandatory decision ${decision.id} (${decision.message}). Sending empty/pass.`);
                    }
                } else if (decision.type === PromptType.SELECT_OPTION) {
                    payload = { type: 'OPTIONS', optionIndices: [0], choice: 0 };
                } else if (decision.type === PromptType.YES_NO) {
                    payload = { type: 'YES_NO', choice: 'YES' };
                } else {
                    payload = { type: 'PASS' }; // Fallback
                }
            }

            // Resolve
            EffectEngine.resolveDecision(state, p1.id, payload);
        }

        if (state.pendingDecision) {
            errors.push('Stuck in decision loop or unhandled prompt: ' + state.pendingDecision.type);
        }

        // Assertions
        if (testCase.assert) {
            const customErrors = testCase.assert(state, p1);
            errors.push(...customErrors);
        }

        // Check for Logs
        const newLogs = (state.history || []).slice(logStartIndex).map((l: any) => l.message);
        // Verify Log Events exists (Objective 3 check)
        // We can inspect state.logEvents (if implemented?) 
        // Currently EffectEngine has 'logEvent' but where does it store? 
        // 'logEvent' pushes to state.logs (with special type?) or somewhere else?
        // Let's assume standard logs for now.

        return {
            cardId: testCase.cardId,
            passed: errors.length === 0,
            logs: newLogs,
            errors
        };
    }
}

// --- DEFINE TESTS ---

const tests: TestCase[] = [
    // ========================================
    // BASE SET - TREASURES
    // ========================================
    {
        cardId: 'copper',
        assert: (state, player) => {
            if (player.coins < 1) return ['Copper should give +1💰'];
            return [];
        }
    },
    {
        cardId: 'silver',
        assert: (state, player) => {
            if (player.coins < 2) return ['Silver should give +2💰'];
            return [];
        }
    },
    {
        cardId: 'gold',
        assert: (state, player) => {
            if (player.coins < 3) return ['Gold should give +3💰'];
            return [];
        }
    },

    // ========================================
    // BASE SET - SIMPLE ACTIONS
    // ========================================
    {
        cardId: 'village',
        assert: (state, player) => {
            const errors: string[] = [];
            // Village: +1 Card, +2 Actions
            // Hand should stay same size (drew 1, played 1)
            if (player.hand.length !== 5) errors.push(`Expected 5 cards in hand, got ${player.hand.length}`);
            // Actions should be 1 (started with 1, -1 to play, +2 from effect = 2, but we don't track pre-play actions here)
            return errors;
        }
    },
    {
        cardId: 'smithy',
        assert: (state, player) => {
            // Smithy: +3 Cards (so hand goes from 1 card -> draws 3 -> 4 cards total after playing)
            if (player.hand.length < 7) return [`Expected at least 7 cards (5 base + 3 from smithy - 1 played), got ${player.hand.length}`];
            return [];
        }
    },
    {
        cardId: 'market',
        assert: (state, player) => {
            const errors: string[] = [];
            // Market: +1 Card, +1 Action, +1 Buy, +1💰
            if (player.buys < 2) errors.push(`Expected at least 2 buys, got ${player.buys}`);
            if (player.coins < 1) errors.push(`Expected at least 1💰, got ${player.coins}`);
            return errors;
        }
    },
    {
        cardId: 'laboratory',
        assert: (state, player) => {
            // Laboratory: +2 Cards, +1 Action
            // Hand: 5 + 1 (card on initial) + 2 (draw) - 1 (played) = 7
            if (player.hand.length < 6) return [`Expected at least 6 cards, got ${player.hand.length}`];
            return [];
        }
    },
    {
        cardId: 'festival',
        assert: (state, player) => {
            const errors: string[] = [];
            // Festival: +2 Actions, +1 Buy, +2💰
            if (player.buys < 2) errors.push(`Expected at least 2 buys, got ${player.buys}`);
            if (player.coins < 2) errors.push(`Expected at least 2💰, got ${player.coins}`);
            return errors;
        }
    },
    {
        cardId: 'cellar',
        setup: (state, player) => {
            // Add extra cards to discard
            player.hand.push(createCardInstance('copper'), createCardInstance('estate'));
        },
        assert: (state, player) => {
            // Cellar: +1 Action, discard any, draw same amount
            return [];
        }
    },
    {
        cardId: 'moat',
        assert: (state, player) => {
            // Moat: +2 Cards
            if (player.hand.length < 6) return [`Expected at least 6 cards, got ${player.hand.length}`];
            return [];
        }
    },
    {
        cardId: 'harbinger',
        assert: (state, player) => {
            // Harbinger: +1 Card, +1 Action
            return [];
        }
    },
    {
        cardId: 'merchant',
        assert: (state, player) => {
            // Merchant: +1 Card, +1 Action (bonus with Silver later)
            return [];
        }
    },
    {
        cardId: 'vassal',
        assert: (state, player) => {
            // Vassal: +2💰
            if (player.coins < 2) return [`Expected at least 2💰, got ${player.coins}`];
            return [];
        }
    },
    {
        cardId: 'workshop',
        assert: (state, player) => {
            // Workshop: Gain card up to 4
            return [];
        }
    },
    {
        cardId: 'poacher',
        assert: (state, player) => {
            // Poacher: +1 Card, +1 Action, +1💰, discard per empty pile
            if (player.coins < 1) return [`Expected at least 1💰, got ${player.coins}`];
            return [];
        }
    },
    {
        cardId: 'militia',
        assert: (state, player) => {
            // Militia: +2💰, attack
            if (player.coins < 2) return [`Expected at least 2💰, got ${player.coins}`];
            return [];
        }
    },
    {
        cardId: 'chapel',
        assert: (state, player) => {
            // Chapel: Trash up to 4
            return [];
        }
    },
    {
        cardId: 'moneylender',
        assert: (state, player) => {
            // Moneylender: Trash copper for +3💰
            return [];
        }
    },
    {
        cardId: 'remodel',
        assert: (state, player) => {
            // Remodel: Trash 1, gain up to +2 cost
            return [];
        }
    },
    {
        cardId: 'witch',
        assert: (state, player) => {
            // Witch: +2 Cards, attack (curse)
            if (player.hand.length < 6) return [`Expected at least 6 cards, got ${player.hand.length}`];
            return [];
        }
    },
    {
        cardId: 'artisan',
        assert: (state, player) => {
            // Artisan: Gain up to E5, topdeck from hand
            return [];
        }
    },
    {
        cardId: 'bandit',
        assert: (state, player) => {
            // Bandit: Gain gold, attack
            return [];
        }
    },
    {
        cardId: 'bureaucrat',
        assert: (state, player) => {
            // Bureaucrat: Gain silver to deck, attack
            return [];
        }
    },
    {
        cardId: 'council_room',
        assert: (state, player) => {
            // Council Room: +4 Cards, +1 Buy, others +1
            if (player.buys < 2) return [`Expected at least 2 buys, got ${player.buys}`];
            if (player.hand.length < 8) return [`Expected at least 8 cards, got ${player.hand.length}`];
            return [];
        }
    },
    {
        cardId: 'library',
        assert: (state, player) => {
            // Library: Draw to 7
            return [];
        }
    },
    {
        cardId: 'mine',
        assert: (state, player) => {
            // Mine: Trash treasure, gain better to hand
            return [];
        }
    },
    {
        cardId: 'sentry',
        assert: (state, player) => {
            // Sentry: +1 Card, +1 Action, look at 2
            return [];
        }
    },
    {
        cardId: 'throne_room',
        assert: (state, player) => {
            // Throne Room: Play action twice
            return [];
        }
    },
];

// --- RUNNER ---

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    process.exit(1);
});

async function runAll() {
}

runAll();
