/**
 * GameLogger - Structured logging for observability
 * 
 * Provides consistent logging format for debugging and production monitoring.
 */

import { GameState } from './GameState.js';
import { GameAction } from '../types/GameAction.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface GameLogEvent {
    timestamp: number;
    gameId: string;
    level: LogLevel;
    category: string;
    message: string;
    data?: Record<string, unknown>;
}

// Global log level (can be set via environment)
let currentLogLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';

const LOG_LEVELS: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

export class GameLogger {
    private gameId: string;
    private events: GameLogEvent[] = [];
    private maxEvents: number = 1000;

    constructor(gameId: string) {
        this.gameId = gameId;
    }

    static setLogLevel(level: LogLevel): void {
        currentLogLevel = level;
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
    }

    private log(level: LogLevel, category: string, message: string, data?: Record<string, unknown>): void {
        if (!this.shouldLog(level)) return;

        const event: GameLogEvent = {
            timestamp: Date.now(),
            gameId: this.gameId,
            level,
            category,
            message,
            data
        };

        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Console output
        const prefix = `[${level}][${this.gameId}][${category}]`;
        switch (level) {
            case 'DEBUG':
                console.debug(prefix, message, data || '');
                break;
            case 'INFO':
                console.info(prefix, message, data || '');
                break;
            case 'WARN':
                console.warn(prefix, message, data || '');
                break;
            case 'ERROR':
                console.error(prefix, message, data || '');
                break;
        }
    }

    // Convenience methods
    debug(category: string, message: string, data?: Record<string, unknown>): void {
        this.log('DEBUG', category, message, data);
    }

    info(category: string, message: string, data?: Record<string, unknown>): void {
        this.log('INFO', category, message, data);
    }

    warn(category: string, message: string, data?: Record<string, unknown>): void {
        this.log('WARN', category, message, data);
    }

    error(category: string, message: string, data?: Record<string, unknown>): void {
        this.log('ERROR', category, message, data);
    }

    // Game-specific logging
    logAction(playerId: string, action: GameAction): void {
        this.info('ACTION', `Player ${playerId} performed ${action.type}`, { action });
    }

    logTurnStart(state: GameState): void {
        const player = state.players[state.currentPlayerIndex];
        this.info('TURN', `Turn ${state.turnNumber} started - ${player?.name}`, {
            phase: state.phase,
            playerIndex: state.currentPlayerIndex
        });
    }

    logPhaseChange(from: string, to: string): void {
        this.debug('PHASE', `Phase changed: ${from} -> ${to}`);
    }

    logGameEnd(winnerId: string | null): void {
        this.info('GAME', `Game ended - Winner: ${winnerId || 'None'}`);
    }

    // Export for debugging
    exportEvents(): GameLogEvent[] {
        return [...this.events];
    }

    exportAsJSON(): string {
        return JSON.stringify(this.events, null, 2);
    }
}

// Global registry of loggers by game ID
const loggers = new Map<string, GameLogger>();

export function getLogger(gameId: string): GameLogger {
    if (!loggers.has(gameId)) {
        loggers.set(gameId, new GameLogger(gameId));
    }
    return loggers.get(gameId)!;
}

export function clearLogger(gameId: string): void {
    loggers.delete(gameId);
}
