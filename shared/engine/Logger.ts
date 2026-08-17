import { GameState, StateSnapshot, getCurrentPlayer } from './GameState.js';
import { LogEventType, LogEntry } from '../types/Log.js';
import { GameLogStore } from './GameLogStore.js';


export class Logger {
    /**
     * Legacy centralized logging (keeping for compatibility during transition)
     */
    static log(state: GameState, message: string, playerId: string | null = null, privateMessage?: string, privateData?: any) {
        // Fallback to structure log if possible
        this.logEvent(state, {
            actionType: 'TEXT',
            activePlayerId: playerId || state.players[state.currentPlayerIndex]?.id || 'system',
            message,
            privateMessage,
            privateData,
            payload: { text: message }
        });
    }

    /**
     * New Structured Logging (Source of Truth)
     */
    static logEvent(state: GameState, params: {
        actionType: LogEventType;
        activePlayerId?: string;
        sourceCard?: string;
        sourceEffect?: string;
        payload?: any;
        message?: string;
        privateMessage?: string;
        privateData?: any;
    }) {
        const activePlayer = params.activePlayerId
            ? state.players.find(p => p.id === params.activePlayerId)
            : getCurrentPlayer(state);

        const event: LogEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: Date.now(),
            type: params.actionType,
            playerId: activePlayer?.id || 'system',
            cardId: params.sourceCard,
            message: params.message || '',
            payload: params.payload,
            privateData: params.privateData || (params.privateMessage ? {
                message: params.privateMessage,
                forPlayerId: params.activePlayerId || 'system'
            } : undefined)
        };

        // Static store instead of internal state array
        GameLogStore.addLog(state.id, event);

        // Populate state.history for backward compatibility (Tests / Client)
        if (state.history) {
            state.history.push(event);
        }

        // Periodical Snapshot (e.g. every 10 events or on TURN_START)
        const historyCount = GameLogStore.getLogs(state.id).length;
        if (historyCount % 10 === 0 || params.actionType === 'TURN_START') {
            this.createSnapshot(state, event.id);
        }
    }

    /**
     * Create a state snapshot
     */
    private static createSnapshot(state: GameState, logId: string) {
        try {
            // We clone the state for the snapshot but we DON'T need snapshots/history in the clone anyway
            // since they are now external.
            const serializableState = { ...state };

            // Safety: ensure we don't try to stringify things that might have circular refs
            const stateString = JSON.stringify(serializableState);

            const snapshot: StateSnapshot = {
                logId,
                state: stateString,
                timestamp: Date.now()
            };

            GameLogStore.addSnapshot(state.id, snapshot);
        } catch (e) {
            console.warn(`Logger: Failed to create snapshot for log ${logId}. Possibly circular reference.`, e);
        }
    }
}
