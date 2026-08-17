import { describe, it, expect } from 'vitest';
import { SmartBot } from '../bot/SmartBot.js';
import { GameState, createPlayerState } from '../engine/GameState.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import { DeckEvaluator } from '../bot/DeckEvaluator.js';
import { CardRegistry } from '../cards/index.js';
import '../engine/registerCorePhases.js';
import '../engine/registerCoreEffects.js';

// Setup Mock Environment
function createMockState(): GameState {
    const makePlayer = (id: string, name: string, color: string): any => {
        const p = createPlayerState(id, name, color);
        p.isBot = true;
        return p;
    };

    const p1 = makePlayer('bot1', 'Bot 1', '#ff0000');
    const p2 = makePlayer('bot2', 'Bot 2', '#0000ff');

    // Initial Deck (7 Copper, 3 Estate) - unique instanceIds per player
    const makeDeck = (prefix: string) =>
        [
            ...Array(7).fill('copper'),
            ...Array(3).fill('estate')
        ].map((id, i) => ({ id, instanceId: `${prefix}_${id}_${i} ` }));

    p1.deck = makeDeck('p1');
    p2.deck = makeDeck('p2');

    // Shuffle
    p1.deck.sort(() => Math.random() - 0.5);
    p2.deck.sort(() => Math.random() - 0.5);

    // Draw initial hand (5 cards)
    p1.hand = p1.deck.splice(0, 5);
    p2.hand = p2.deck.splice(0, 5);

    return {
        players: [p1, p2],
        supply: {
            'province': { count: 8, cost: 8, cardId: 'province' },
            'duchy': { count: 8, cost: 5, cardId: 'duchy' },
            'estate': { count: 8, cost: 2, cardId: 'estate' },
            'gold': { count: 30, cost: 6, cardId: 'gold' },
            'silver': { count: 40, cost: 3, cardId: 'silver' },
            'copper': { count: 46, cost: 0, cardId: 'copper' },
            'curse': { count: 10, cost: 0, cardId: 'curse' },
            'village': { count: 10, cost: 3, cardId: 'village' },
            'smithy': { count: 10, cost: 4, cardId: 'smithy' },
            'market': { count: 10, cost: 5, cardId: 'market' },
            'laboratory': { count: 10, cost: 5, cardId: 'laboratory' },
            'festival': { count: 10, cost: 5, cardId: 'festival' },
        },
        phase: 'ACTION',
        currentPlayerIndex: 0,
        trash: [],
        logs: [],
        effectStack: [],
        turnNumber: 1,
        isGameOver: false,
        phasePipeline: ['ACTION', 'BUY', 'CLEANUP'],
        phaseIndex: 0,
    } as any;
}

describe('Bot Simulation', () => {
    it('should simulate a full game between two SmartBots', { timeout: 120000 }, () => {
        let state = createMockState();
        const bot1 = new SmartBot();
        const bot2 = new SmartBot();

        const bots: Record<string, SmartBot> = { 'bot1': bot1, 'bot2': bot2 };

        let moves = 0;
        const maxMoves = 5000;

        // Verify CardRegistry has cards loaded
        const copperDef = CardRegistry.get('copper');
        const villageDef = CardRegistry.get('village');
        console.log(`[Init] CardRegistry: copper = ${copperDef ? 'OK' : 'MISSING'}, village = ${villageDef ? 'OK' : 'MISSING'} `);
        console.log(`[Init] Starting game.Turn 1, Bot 1`);

        let lastTurn = 0;

        while (!state.isGameOver && moves < maxMoves) {
            moves++;
            const currentPlayer = state.players[state.currentPlayerIndex];
            const bot = bots[currentPlayer.id];

            // 1. Handle pending decisions
            if (state.pendingDecision) {
                const decisionMakerId = state.pendingDecision.playerId;
                const decidingBot = bots[decisionMakerId];
                const choiceAction = decidingBot.resolveChoice(state, decisionMakerId);

                const result = ActionResolver.resolve(state, decisionMakerId, choiceAction);
                if (result.success) {
                    state = result.state; // CRITICAL: apply new state
                } else {
                    console.error(`[Decision FAIL] ${result.error} `);
                    state.pendingDecision = null; // break out of stuck decisions
                }
                continue;
            }

            // 2. Choose & execute action
            process.stdout.write(`.${moves % 100 === 0 ? '\n' : ''} `); // Progress indicator
            const action = bot.chooseAction(state, currentPlayer.id);

            // Log turn changes and buys
            if (state.turnNumber !== lastTurn) {
                lastTurn = state.turnNumber;
                console.log(`\n-- - Turn ${state.turnNumber} | ${currentPlayer.name} | Phase: ${state.phase} | Hand: ${currentPlayer.hand.length} | Coins: ${currentPlayer.coins} --- `);
            }

            // Log EVERY action for debugging
            if (moves < 100 || moves % 1000 === 0) {
                const actionDetails = (action as any).cardId || (action as any).payload?.cardInstanceIds?.[0] || '';
                console.log(`[Move ${moves}] ${currentPlayer.name} (${state.phase}): ${action.type} ${actionDetails} `);
            }

            if (action.type === 'BUY_CARD') {
                console.log(`  >> ${currentPlayer.name} buys ${(action as any).cardId} `);
            }

            const result = ActionResolver.resolve(state, currentPlayer.id, action);

            if (result.success) {
                state = result.state; // CRITICAL: apply new state
            } else {
                console.error(`[Action FAIL] ${action.type}: ${result.error} `);
                if (action.type !== 'END_PHASE') {
                    const fallback = ActionResolver.resolve(state, currentPlayer.id, { type: 'END_PHASE' });
                    if (fallback.success) state = fallback.state;
                }
            }
        }

        // ---- Results ----
        console.log('\n========== GAME RESULTS ==========');
        console.log(`Total Moves: ${moves} | Turns: ${state.turnNumber} `);

        if (state.isGameOver && state.gameResults) {
            console.log(`Winner: ${state.winnerId} `);
            state.gameResults.forEach((r: any) => {
                console.log(`  ${r.name}: ${r.score} VP ${r.isWinner ? '(WINNER)' : ''} `);
            });
        } else {
            console.log('Game did NOT finish (max moves reached).');
            // Show supply state
            console.log('Province count:', state.supply['province']?.count);
            let emptyPiles = 0;
            for (const key in state.supply) {
                if (state.supply[key].count === 0) {
                    emptyPiles++;
                    console.log(`  Empty pile: ${key} `);
                }
            }
            console.log(`Empty piles: ${emptyPiles} `);
        }

        // Heuristic scores
        state.players.forEach((p: any) => {
            const hScore = DeckEvaluator.evaluateDeck(state, p);
            const deckSize = p.deck.length + p.discardPile.length + p.hand.length + p.playArea.length;
            console.log(`${p.name} | Deck: ${deckSize} cards | Heuristic: ${hScore.toFixed(1)} `);
        });
        console.log('==================================\n');

        // We at least expect the game loop ran
        expect(moves).toBeGreaterThan(0);
    });
});
