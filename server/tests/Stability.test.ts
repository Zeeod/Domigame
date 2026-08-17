
import { describe, it, expect } from 'vitest';
import { GameState, createGameState } from '../../shared/engine/GameState';
import { ActionResolver } from '../../shared/engine/ActionResolver';
import { TurnMachine } from '../../shared/engine/TurnMachine';
import { GreedyBot } from '../../shared/bot/GreedyBot';


import { createPlayerState } from '../../shared/engine/PlayerState';
import { createCardInstances } from '../../shared/engine/CardInstance';
import { CardRegistry } from '../../shared/cards/index';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.resolve(__dirname, '../../stability_test.log');

// Clear log file on start
if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
}

function log(msg: string) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

function getRandomKingdom(count: number): string[] {
    const allCards = Object.keys(CardRegistry.getAll()).filter(id => {
        const def = CardRegistry.get(id);
        // Exclude specific types if necessary, e.g., only kingdom cards
        return def && !['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse'].includes(id);
    });

    const shuffled = allCards.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function setupRandomGame(gameId: string): GameState {
    const state = createGameState(gameId);

    // 1. Setup Players
    state.players = [
        createPlayerState('bot-1', 'Bot 1', '#ff0000'),
        createPlayerState('bot-2', 'Bot 2', '#00ff00')
    ];
    state.players.forEach(p => {
        p.isBot = true;
        p.hand = [...createCardInstances('copper', 7), ...createCardInstances('estate', 3)];
        p.deck = [];
        p.discardPile = [];
        p.isReady = true;
    });

    // 2. Setup Supply (Basic)
    const numPlayers = state.players.length;
    state.supply = {
        copper: { cardId: 'copper', count: 60 - (numPlayers * 7), cards: [] },
        silver: { cardId: 'silver', count: 40, cards: [] },
        gold: { cardId: 'gold', count: 30, cards: [] },
        estate: { cardId: 'estate', count: 12, cards: [] },
        duchy: { cardId: 'duchy', count: 12, cards: [] },
        province: { cardId: 'province', count: 12, cards: [] },
        curse: { cardId: 'curse', count: 10, cards: [] },
    };

    // 3. Setup Random Kingdom
    const kingdomIds = getRandomKingdom(10);
    log(`[${gameId}] Kingdom: ${kingdomIds.join(', ')}`);

    kingdomIds.forEach(id => {
        state.supply[id] = { cardId: id, count: 10, cards: [] };
    });

    return state;
}

describe('Stability Tests', () => {
    const NUM_GAMES = 5; // Adjust as needed
    const MAX_TURNS = 30; // Prevent infinite loops

    it(`should run ${NUM_GAMES} randomized games without crashing`, () => {
        let successfulGames = 0;

        for (let i = 0; i < NUM_GAMES; i++) {
            const gameId = `stability-game-${i}`;
            log(`\n=== STARTING GAME ${i + 1}/${NUM_GAMES}: ${gameId} ===`);

            try {
                let state = setupRandomGame(gameId);
                ActionResolver.startGame(state);

                const bots = state.players.map(() => new GreedyBot());
                let turns = 0;
                let loopSafety = 0;

                while (!state.isGameOver && turns < MAX_TURNS && loopSafety < 5000) {
                    loopSafety++;
                    const player = state.players[state.currentPlayerIndex];
                    const bot = bots[state.currentPlayerIndex];

                    try {
                        let action = bot.chooseAction(state, player.id);
                        // Fallback if bot returns null/undefined, though SmartBot should handle it
                        if (!action) {
                            action = { type: 'END_PHASE' };
                        }

                        const result = ActionResolver.resolve(state, player.id, action);
                        if (result.success) {
                            state = result.state;
                        } else {
                            // If action failed, force end phase to prevent getting stuck
                            if (state.phase === 'ACTION') {
                                state = ActionResolver.resolve(state, player.id, { type: 'END_PHASE' }).state;
                            } else if (state.phase === 'BUY') {
                                TurnMachine.endBuyPhase(state);
                            } else if (state.pendingDecision) {
                                // If stuck in decision, try to clear it or pick random (SmartBot should have handled this)
                                log(`[${gameId}] Stuck in decision: ${JSON.stringify(state.pendingDecision)}`);
                                // Force validation fail -> might crash but we want to know
                                break;
                            }
                        }
                    } catch (turnError) {
                        log(`[${gameId}] [Turn ${turns}] Error: ${turnError}`);
                        break;
                    }

                    if (state.turnNumber > turns) {
                        turns = state.turnNumber;
                    }
                }

                if (state.isGameOver || turns >= MAX_TURNS) {
                    successfulGames++;
                    log(`[${gameId}] Finished at Turn ${turns}. GameOver: ${state.isGameOver}`);
                } else {
                    log(`[${gameId}] Failed to finish. Loop safety triggered or error.`);
                }

            } catch (gameError) {
                log(`[${gameId}] CRITICAL FAILURE: ${gameError}`);
            }
        }

        console.log(`[Stability] Successful Games: ${successfulGames} / ${NUM_GAMES}`);
        expect(successfulGames).toBe(NUM_GAMES);
    });
});
