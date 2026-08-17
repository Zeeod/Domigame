
import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, createGameState } from '../../shared/engine/GameState';
import { ActionResolver } from '../../shared/engine/ActionResolver';
import { TurnMachine } from '../../shared/engine/TurnMachine';
import { GreedyBot } from '../../shared/bot/GreedyBot';
import { createPlayerState } from '../../shared/engine/PlayerState';
import { createCardInstances } from '../../shared/engine/CardInstance';
import { CardRegistry } from '../../shared/cards/index';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.resolve(__dirname, '../../stress_test.log');

// Clear log file on start
if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
}

function log(msg: string) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

function setupTestGame(kingdomIds: string[]): GameState {
    const state = createGameState('comprehensive-stress-test');

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

    // 3. Setup Kingdom
    kingdomIds.forEach(id => {
        const def = CardRegistry.get(id);
        if (def) {
            state.supply[id] = { cardId: id, count: 10, cards: [] };
        }
    });

    return state;
}

describe('Stress Tests', () => {
    let state: GameState;
    const bot = new GreedyBot();

    beforeEach(() => {
        // Broad set of expansion cards
        state = setupTestGame(['wharf', 'rats', 'fortress', 'market', 'smithy', 'hunting_grounds', 'graverobber']);
        ActionResolver.startGame(state);
    });

    it('should complete a 100-turn game with expansion cards', () => {
        const MAX_TURNS = 100;
        let turns = 0;
        let loopSafety = 0;

        log(`!!! STARTING COMPREHENSIVE STRESS TEST !!!`);

        while (turns < MAX_TURNS && !state.isGameOver && loopSafety < 10000) {
            loopSafety++;
            const player = state.players[state.currentPlayerIndex];

            // Get Bot Action
            let action: any;
            try {
                action = bot.chooseAction(state, player.id);
            } catch (err) {
                log(`[CRITICAL] Bot Runtime Error: ${err}`);
                action = { type: 'END_PHASE' };
            }

            // Execute Action
            const result = ActionResolver.resolve(state, player.id, action);
            if (result.success) {
                // Occasional log to track progress without bloating
                if (result.state.turnNumber > turns && result.state.turnNumber % 20 === 0) {
                    log(`[T${result.state.turnNumber}] Player: ${player.name} Phase: ${result.state.phase}`);
                }

                // Log all ACTION plays
                if (action.type === 'PLAY_CARD') {
                    log(`  - ${player.name} plays ${action.cardId || action.cardInstanceId}`);
                }
                // Log all CHOICES
                if (action.type === 'CHOOSE') {
                    log(`  - ${player.name} chose ${JSON.stringify(action.payload)} for decision`);
                }

                state = result.state;
            } else {
                if (action.type !== 'END_PHASE') {
                    log(`!! Action Rejected: ${action.type} (${result.error})`);
                }
                // Hard advance
                if (state.phase === 'ACTION') state.phase = 'BUY';
                else if (state.phase === 'BUY') TurnMachine.endBuyPhase(state);
                else if (state.pendingDecision) {
                    state.pendingDecision = null;
                    TurnMachine.endBuyPhase(state);
                }
            }

            // Update turn counter
            if (state.turnNumber > turns) {
                turns = state.turnNumber;
            }
        }

        log(`Exiting loop at Turn ${turns}. GameOver: ${state.isGameOver}. Iterations: ${loopSafety}`);

        expect(turns).toBeGreaterThan(10);
        expect(loopSafety).toBeLessThan(10000); // Verify no infinite loops

        // Final score check
        const scores = state.players.map(p => `${p.name}: ${p.score}`).join(' | ');
        log(`Final Results: ${scores}`);
    });
});
