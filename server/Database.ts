/**
 * Database - SQLite persistence layer using better-sqlite3
 * 
 * Provides:
 * - Game save/resume (auto-save during play, resume from lobby)
 * - Player profiles & statistics (win rates, games played)
 * - Game results history
 */

import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'dominion.db');

// ============================================================================
// Types
// ============================================================================

export interface SavedGame {
    id: string;
    roomId: string;
    stateJson: string;
    kingdom: string;       // JSON array of kingdom card IDs
    status: 'in_progress' | 'completed' | 'abandoned';
    playerNames: string;   // JSON array of player names for display
    turnNumber: number;
    createdAt: string;
    updatedAt: string;
}

export interface GameResult {
    gameId: string;
    playerToken: string;
    playerName: string;
    vp: number;
    rank: number;
    kingdomCards: string;
}

export interface PlayerProfile {
    playerToken: string;
    playerName: string;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    totalVP: number;
    avgVP: number;
    favoriteCard: string | null;
    lastPlayed: string | null;
}

// ============================================================================
// Database Singleton
// ============================================================================

class DatabaseManager {
    private db: BetterSqlite3.Database | null = null;

    private getDb(): BetterSqlite3.Database {
        if (!this.db) {
            // Ensure data directory exists
            const dataDir = path.dirname(DB_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new BetterSqlite3(DB_PATH);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
            this.initSchema();
            console.log('[DB] SQLite database initialized at', DB_PATH);
        }
        return this.db;
    }

    private initSchema(): void {
        const db = this.db!;

        db.exec(`
            CREATE TABLE IF NOT EXISTS players (
                token TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#3498db',
                created_at TEXT DEFAULT (datetime('now')),
                last_seen TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS saved_games (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                state_json TEXT NOT NULL,
                kingdom TEXT NOT NULL DEFAULT '[]',
                player_names TEXT NOT NULL DEFAULT '[]',
                turn_number INTEGER DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'in_progress',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS game_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT NOT NULL,
                player_token TEXT NOT NULL,
                player_name TEXT NOT NULL,
                vp INTEGER NOT NULL DEFAULT 0,
                rank INTEGER NOT NULL DEFAULT 0,
                kingdom_cards TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now')),
                UNIQUE(game_id, player_token)
            );

            CREATE INDEX IF NOT EXISTS idx_saved_games_status ON saved_games(status);
            CREATE INDEX IF NOT EXISTS idx_game_results_player ON game_results(player_token);
        `);
    }

    // ========================================================================
    // Game Save/Resume
    // ========================================================================

    saveGame(gameId: string, roomId: string, stateJson: string, kingdom: string[], playerNames: string[], turnNumber: number): void {
        const db = this.getDb();
        const stmt = db.prepare(`
            INSERT INTO saved_games (id, room_id, state_json, kingdom, player_names, turn_number, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'in_progress', datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                state_json = excluded.state_json,
                turn_number = excluded.turn_number,
                updated_at = datetime('now')
        `);
        stmt.run(gameId, roomId, stateJson, JSON.stringify(kingdom), JSON.stringify(playerNames), turnNumber);
    }

    loadGame(gameId: string): SavedGame | null {
        const db = this.getDb();
        const stmt = db.prepare('SELECT * FROM saved_games WHERE id = ? AND status = ?');
        const row = stmt.get(gameId, 'in_progress') as any;
        if (!row) return null;
        return {
            id: row.id,
            roomId: row.room_id,
            stateJson: row.state_json,
            kingdom: row.kingdom,
            playerNames: row.player_names,
            turnNumber: row.turn_number,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    markGameCompleted(gameId: string): void {
        const db = this.getDb();
        const stmt = db.prepare("UPDATE saved_games SET status = 'completed', updated_at = datetime('now') WHERE id = ?");
        stmt.run(gameId);
    }

    markGameAbandoned(gameId: string): void {
        const db = this.getDb();
        const stmt = db.prepare("UPDATE saved_games SET status = 'abandoned', updated_at = datetime('now') WHERE id = ?");
        stmt.run(gameId);
    }

    listSavedGames(playerToken?: string): SavedGame[] {
        const db = this.getDb();
        // Return all in-progress games (optionally filtered by player)
        let rows: any[];
        if (playerToken) {
            const stmt = db.prepare(`
                SELECT * FROM saved_games 
                WHERE status = 'in_progress' 
                AND player_names LIKE ?
                ORDER BY updated_at DESC
                LIMIT 20
            `);
            rows = stmt.all(`%${playerToken}%`);
        } else {
            const stmt = db.prepare(`
                SELECT * FROM saved_games 
                WHERE status = 'in_progress' 
                ORDER BY updated_at DESC
                LIMIT 20
            `);
            rows = stmt.all();
        }
        return rows.map((row: any) => ({
            id: row.id,
            roomId: row.room_id,
            stateJson: row.state_json,
            kingdom: row.kingdom,
            playerNames: row.player_names,
            turnNumber: row.turn_number,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }

    deleteSavedGame(gameId: string): void {
        const db = this.getDb();
        const stmt = db.prepare('DELETE FROM saved_games WHERE id = ?');
        stmt.run(gameId);
    }

    // ========================================================================
    // Game Results
    // ========================================================================

    recordGameResult(gameId: string, playerToken: string, playerName: string, vp: number, rank: number, kingdomCards: string[]): void {
        const db = this.getDb();
        const stmt = db.prepare(`
            INSERT INTO game_results (game_id, player_token, player_name, vp, rank, kingdom_cards)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(game_id, player_token) DO UPDATE SET
                vp = excluded.vp,
                rank = excluded.rank
        `);
        stmt.run(gameId, playerToken, playerName, vp, rank, JSON.stringify(kingdomCards));
    }

    // ========================================================================
    // Player Profiles
    // ========================================================================

    upsertPlayer(token: string, name: string, color: string): void {
        const db = this.getDb();
        const stmt = db.prepare(`
            INSERT INTO players (token, name, color, last_seen)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(token) DO UPDATE SET
                name = excluded.name,
                color = excluded.color,
                last_seen = datetime('now')
        `);
        stmt.run(token, name, color);
    }

    getPlayerProfile(playerToken: string): PlayerProfile | null {
        const db = this.getDb();

        // Get basic info
        const playerStmt = db.prepare('SELECT * FROM players WHERE token = ?');
        const player = playerStmt.get(playerToken) as any;

        // Get stats
        const statsStmt = db.prepare(`
            SELECT 
                COUNT(*) as games_played,
                SUM(CASE WHEN rank = 1 THEN 1 ELSE 0 END) as games_won,
                COALESCE(SUM(vp), 0) as total_vp,
                COALESCE(AVG(vp), 0) as avg_vp,
                MAX(created_at) as last_played
            FROM game_results
            WHERE player_token = ?
        `);
        const stats = statsStmt.get(playerToken) as any;

        if (!player && (!stats || stats.games_played === 0)) return null;

        return {
            playerToken,
            playerName: player?.name || playerToken,
            gamesPlayed: stats?.games_played || 0,
            gamesWon: stats?.games_won || 0,
            winRate: stats?.games_played > 0 ? Math.round((stats.games_won / stats.games_played) * 100) : 0,
            totalVP: stats?.total_vp || 0,
            avgVP: Math.round(stats?.avg_vp || 0),
            favoriteCard: null, // TODO: compute from kingdom_cards frequency
            lastPlayed: stats?.last_played || null,
        };
    }

    getLeaderboard(limit: number = 10): PlayerProfile[] {
        const db = this.getDb();
        const stmt = db.prepare(`
            SELECT 
                gr.player_token,
                gr.player_name,
                COUNT(*) as games_played,
                SUM(CASE WHEN gr.rank = 1 THEN 1 ELSE 0 END) as games_won,
                COALESCE(SUM(gr.vp), 0) as total_vp,
                COALESCE(AVG(gr.vp), 0) as avg_vp,
                MAX(gr.created_at) as last_played
            FROM game_results gr
            GROUP BY gr.player_token
            HAVING games_played >= 1
            ORDER BY games_won DESC, avg_vp DESC
            LIMIT ?
        `);
        const rows = stmt.all(limit) as any[];
        return rows.map(row => ({
            playerToken: row.player_token,
            playerName: row.player_name,
            gamesPlayed: row.games_played,
            gamesWon: row.games_won,
            winRate: row.games_played > 0 ? Math.round((row.games_won / row.games_played) * 100) : 0,
            totalVP: row.total_vp,
            avgVP: Math.round(row.avg_vp),
            favoriteCard: null,
            lastPlayed: row.last_played,
        }));
    }

    // ========================================================================
    // Cleanup
    // ========================================================================

    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('[DB] Database connection closed');
        }
    }
}

// Export singleton instance
export const database = new DatabaseManager();
