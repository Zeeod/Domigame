
import { GameRoomV2 } from '../GameRoomV2';
import { performance } from 'perf_hooks';

// Mock Socket.IO Server
class MockIO {
    to(room: string) { return this; }
    emit(event: string, data: any) { }
    in(room: string) { return this; }
    on(event: string, cb: any) { }
    sockets = {
        adapter: {
            rooms: new Map()
        }
    };
}

class StressGameRoom extends GameRoomV2 {
    // Override to make bot turns immediate (synchronous-like but safe)
    protected override scheduleBotTurnIfNeeded(): void {
        if (!this.gameState || this.isGameOver(this.gameState.phase)) {
            // Already handled in base usually, but safety check
            return;
        }

        // Use setImmediate to allow event loop to handle I/O if needed
        // but effectively running as fast as possible
        setImmediate(() => {
            if (!this.gameState || !this.isStarted) return;

            // Check for pending decision
            if (this.gameState.pendingDecision) {
                const deciderId = this.gameState.pendingDecision.playerId;
                const bot = this.bots.get(deciderId);
                if (bot) {
                    try {
                        const action = bot.chooseAction(this.gameState, deciderId);
                        this.processBotAction(deciderId, action);
                    } catch (e) {
                        console.error(`Bot Error (Decision) in Room ${this.id}:`, e);
                        this.forceEndGame();
                    }
                }
                return;
            }

            // Check for turn
            // Need to handle PREGAME/GAME_OVER check safely
            if (this.gameState.phase === 'PREGAME' || this.gameState.phase === 'GAME_OVER') return;

            const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
            if (currentPlayer) {
                const bot = this.bots.get(currentPlayer.id);
                if (bot) {
                    try {
                        const action = bot.chooseAction(this.gameState, currentPlayer.id);
                        this.processBotAction(currentPlayer.id, action);
                    } catch (e) {
                        console.error(`Bot Error (Action) in Room ${this.id}:`, e);
                        this.forceEndGame();
                    }
                }
            }
        });
    }

    // Helper to check game over since phase property access might differ
    private isGameOver(phase: string): boolean {
        return phase === 'GAME_OVER';
    }

    // Disable broadcasts to improve performance
    override broadcastGameState = () => { };
    override broadcastRoomState = () => { };
}

interface GameResult {
    id: string;
    durationMs: number;
    turns: number;
    winner: string | null;
    players: { name: string; score: number }[];
    error?: string;
}

const TOTAL_GAMES = 50;
const CONCURRENCY = 5;

async function runSingleGame(index: number): Promise<GameResult> {
    const start = performance.now();
    const gameId = `stress_test_${index}_${Date.now()}`;
    const io = new MockIO() as any;

    // Create Room with random kingdom implied
    const room = new StressGameRoom(io, gameId, {});

    // Add Bots
    room.addBot('greedy');
    room.addBot('greedy'); // Greedy vs Greedy

    // Start
    room.startGame(null);

    return new Promise<GameResult>((resolve) => {
        let isResolved = false;

        // Watchdog
        const timeout = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                clearInterval(poller);
                // room.forceEndGame();
                resolve({
                    id: gameId,
                    durationMs: performance.now() - start,
                    turns: room.gameState?.turnNumber || 0,
                    winner: null,
                    players: [],
                    error: 'TIMEOUT (30s)'
                });
            }
        }, 30000);

        // Poll for completion
        const poller = setInterval(() => {
            if (room.gameState?.isGameOver) {
                isResolved = true;
                clearInterval(poller);
                clearTimeout(timeout);

                resolve({
                    id: gameId,
                    durationMs: performance.now() - start,
                    turns: room.gameState.turnNumber,
                    winner: room.gameState.winnerId,
                    players: room.gameState.players.map(p => ({
                        name: p.name,
                        score: p.score ?? 0
                    }))
                });
            }
        }, 50); // fast check
    });
}

async function runStressTest() {
    console.log(`Starting Stress Test: ${TOTAL_GAMES} games, ${CONCURRENCY} concurrent.`);

    const results: GameResult[] = [];
    const queue = Array.from({ length: TOTAL_GAMES }, (_, i) => i);
    let active = 0;

    const next = async () => {
        if (queue.length === 0) return;

        active++;
        const i = queue.shift()!;
        if (i % 10 === 0) console.log(`Starting game ${i}...`);

        try {
            const res = await runSingleGame(i);
            results.push(res);
            // console.log(`Game ${i} finished: ${res.turns} turns, ${Math.round(res.durationMs)}ms. Winner: ${res.winner}`);
        } catch (e) {
            console.error(`Game ${i} failed:`, e);
        } finally {
            active--;
            if (queue.length > 0) {
                await next();
            }
        }
    };

    const workers = Array.from({ length: CONCURRENCY }).map(() => next());
    await Promise.all(workers);

    // Report
    const success = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    const totalTime = results.reduce((sum, r) => sum + r.durationMs, 0);
    const totalTurns = results.reduce((sum, r) => sum + r.turns, 0);

    console.log('\n--- STRESS TEST REPORT ---');
    console.log(`Total Games: ${results.length}`);
    console.log(`Successful: ${success.length}`);
    console.log(`Failed/Timeout: ${failed.length}`);
    if (success.length > 0) {
        console.log(`Avg Duration: ${Math.round(totalTime / results.length)}ms`);
        console.log(`Avg Turns: ${(totalTurns / results.length).toFixed(1)}`);
    } else {
        console.log(`No games finished successfully.`);
    }

    if (failed.length > 0) {
        console.log('Failures:', failed.map(r => r.error));
    }
}

// Run
runStressTest().catch(console.error);
