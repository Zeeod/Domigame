import { LogEntry } from '../types/Log.js';
import { StateSnapshot } from './GameState.js';

/**
 * GameLogStore - External storage for game events and snapshots.
 * 
 * Separating logs from GameState improves cloning performance and 
 * reduces memory footprint during MCTS simulations.
 */
export class GameLogStore {
    private static logs: Map<string, LogEntry[]> = new Map();
    private static snapshots: Map<string, StateSnapshot[]> = new Map();

    /**
     * Add an entry to the game's log
     */
    static addLog(gameId: string, entry: LogEntry): void {
        let gameLogs = this.logs.get(gameId);
        if (!gameLogs) {
            gameLogs = [];
            this.logs.set(gameId, gameLogs);
        }
        entry.sequenceNumber = gameLogs.length;
        gameLogs.push(entry);
    }

    /**
     * Get all logs for a game
     */
    static getLogs(gameId: string): LogEntry[] {
        return this.logs.get(gameId) || [];
    }

    /**
     * Add a snapshot for a game
     */
    static addSnapshot(gameId: string, snapshot: StateSnapshot): void {
        let gameSnapshots = this.snapshots.get(gameId);
        if (!gameSnapshots) {
            gameSnapshots = [];
            this.snapshots.set(gameId, gameSnapshots);
        }
        gameSnapshots.push(snapshot);

        // Keep last 50 snapshots
        if (gameSnapshots.length > 50) {
            gameSnapshots.shift();
        }
    }

    /**
     * Get all snapshots for a game
     */
    static getSnapshots(gameId: string): StateSnapshot[] {
        return this.snapshots.get(gameId) || [];
    }

    /**
     * Clear all data for a game (e.g. when session ends)
     */
    static clear(gameId: string): void {
        this.logs.delete(gameId);
        this.snapshots.delete(gameId);
    }

    /**
     * Truncate logs to a certain index (for rewind)
     */
    static truncateLogs(gameId: string, index: number): void {
        const gameLogs = this.logs.get(gameId);
        if (gameLogs) {
            this.logs.set(gameId, gameLogs.slice(0, index));
        }
    }

    /**
     * Truncate snapshots to a certain index (for rewind)
     */
    static truncateSnapshots(gameId: string, index: number): void {
        const gameSnapshots = this.snapshots.get(gameId);
        if (gameSnapshots) {
            this.snapshots.set(gameId, gameSnapshots.slice(0, index));
        }
    }

    /**
     * Initialize logs for a new game
     */
    static init(gameId: string): void {
        this.logs.set(gameId, []);
        this.snapshots.set(gameId, []);
    }
}
