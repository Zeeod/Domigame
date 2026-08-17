/**
 * SocketHandler - Socket.IO event handlers using new engine
 */

import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager.js';
import { GameEvents } from './GameRoomV2.js';
import { GameAction } from '../shared/types/GameAction.js';
import { database } from './Database.js';

export function setupSocketHandlers(io: Server): void {
    const roomManager = new RoomManager(io);

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        let currentRoomId: string | null = null;

        // ====================================================================
        // Room Events
        // ====================================================================

        socket.on(GameEvents.JOIN_ROOM, (data: { roomId: string; playerName: string; color: string; playerToken?: string }) => {
            // Default to socket.id if no token provided (legacy/bot/test support)
            const { roomId, playerName, color, playerToken } = data;
            const effectiveToken = playerToken || socket.id;

            // Leave current room if in one (handled by cleanup logic mostly, but explicit check good)
            if (currentRoomId) {
                const oldRoom = roomManager.getRoom(currentRoomId);
                if (oldRoom) {
                    // Only remove if switching identity? Logic complex here. 
                    // Simpler: Just try join new room.
                    // oldRoom.removePlayer(socket.id); 
                }
            }

            // Reject empty room IDs
            if (!roomId || roomId.trim() === '') {
                socket.emit('join_error', { error: 'Invalid Room ID' });
                return;
            }

            // Join/create room
            const room = roomManager.getOrCreateRoom(roomId);

            // Pass token as canonical ID, socket as connection channel
            const player = room.addPlayer(socket, playerName, color, effectiveToken);

            if (player) {
                currentRoomId = roomId;

                // Save player profile to DB
                try {
                    database.upsertPlayer(effectiveToken, player.name, player.color);
                } catch (e) {
                    console.error('[DB] Failed to upsert player profile:', e);
                }

                socket.emit('joined', {
                    roomId,
                    playerId: player.id,
                    isHost: player.isHost
                });
                console.log(`[Socket] ${playerName} joined room ${roomId} (ID: ${player.id})`);
            } else {
                socket.emit('join_error', { error: 'Could not join room' });
            }
        });

        socket.on(GameEvents.LEAVE_ROOM, (data?: { reason?: 'disconnect' | 'leave' | 'surrender' }) => {
            if (currentRoomId) {
                const room = roomManager.getRoom(currentRoomId);
                if (room) {
                    room.removePlayer(socket.id, data?.reason || 'leave');
                }
                currentRoomId = null;
            }
        });

        socket.on(GameEvents.TOGGLE_READY, () => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                room.toggleReady(socket.id);
            }
        });

        socket.on(GameEvents.START_GAME, (data: { kingdomCards?: string[] } = {}) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (!room) return;

            const player = room.getPlayerBySocket(socket.id);
            if (!player?.isHost) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Only host can start game' });
                return;
            }

            if (!room.canStart()) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Not all players ready' });
                return;
            }

            console.log(`[Socket] Host ${player.name} starting game with cards:`, data.kingdomCards);
            room.startGame(data.kingdomCards);
        });

        socket.on(GameEvents.CHANGE_COLOR, (data: { color: string }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                room.changePlayerColor(socket.id, data.color);
            }
        });

        socket.on(GameEvents.CHANGE_KINGDOM, (data: { kingdomCards: (string | null)[] }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                room.changeKingdomCards(socket.id, data.kingdomCards);
            }
        });

        socket.on(GameEvents.CHANGE_SETUP, (data: {
            prosperityMode?: 'always' | 'never' | 'random',
            sheltersMode?: 'always' | 'never' | 'random',
            enabledExpansions?: string[],
            landscapeInstructions?: string[]
        }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                room.updateSetup(socket.id, data);
            }
        });

        // ====================================================================
        // Bot Management Events
        // ====================================================================

        socket.on(GameEvents.ADD_BOT, (data: { botType: 'random' | 'greedy' }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (!room) return;

            const player = room.getPlayerBySocket(socket.id);
            if (!player?.isHost) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Only host can add bots' });
                return;
            }

            const bot = room.addBot(data.botType);
            if (!bot) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Cannot add bot (room full or game started)' });
            }
        });

        socket.on(GameEvents.REMOVE_BOT, (data: { botId: string }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (!room) return;

            const player = room.getPlayerBySocket(socket.id);
            if (!player?.isHost) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Only host can remove bots' });
                return;
            }

            const removed = room.removeBot(data.botId);
            if (!removed) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Cannot remove bot (not found or game started)' });
            }
        });

        socket.on(GameEvents.HOST_FORCE_END_GAME, () => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (!room) return;

            const player = room.getPlayerBySocket(socket.id);
            if (!player?.isHost) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Only host can force end game' });
                return;
            }

            console.log(`[Socket] Host ${player.name} is forcing game end`);
            room.forceEndGame();
            roomManager.deleteRoom(currentRoomId);
            console.log(`[Socket] Room ${currentRoomId} deleted by host force quit`);
        });

        // ====================================================================
        // Game Events
        // ====================================================================

        socket.on(GameEvents.GAME_ACTION, (action: GameAction) => {
            if (!currentRoomId) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Not in a room' });
                return;
            }

            const room = roomManager.getRoom(currentRoomId);
            if (!room) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Room not found' });
                return;
            }

            const result = room.handleAction(socket.id, action);
            if (!result.success) {
                socket.emit(GameEvents.ACTION_ERROR, { error: result.error });
            }
        });

        // ====================================================================
        // Rewind Events
        // ====================================================================

        socket.on(GameEvents.REQUEST_REWIND, (data: { targetLogId: string }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (!room) return;

            const result = room.handleRewindRequest(socket.id, data.targetLogId);
            if (!result.success) {
                socket.emit(GameEvents.ACTION_ERROR, { error: result.error });
            }
        });

        socket.on(GameEvents.VOTE_REWIND, (data: { approved: boolean }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                room.handleRewindVote(socket.id, data.approved);
            }
        });

        socket.on(GameEvents.UNDO_ACTION, () => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                const result = room.handleUndo(socket.id);
                if (!result.success) {
                    socket.emit(GameEvents.ACTION_ERROR, { error: result.error });
                }
            }
        });

        socket.on(GameEvents.GET_LOGS, (data: { fromSequence: number }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                room.handleGetLogs(socket.id, data.fromSequence);
            }
        });

        socket.on(GameEvents.SPECTATOR_CONFIG, (data: { followId?: string, revealAll?: boolean }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (room) {
                room.configureSpectator(socket.id, data);
            }
        });

        // ====================================================================
        // Persistence & Profiles
        // ====================================================================

        socket.on(GameEvents.LIST_SAVED_GAMES, (data?: { playerToken?: string }) => {
            try {
                const savedGames = database.listSavedGames(data?.playerToken);
                socket.emit(GameEvents.SAVED_GAMES_LIST, {
                    games: savedGames.map(g => ({
                        id: g.id,
                        roomId: g.roomId,
                        playerNames: JSON.parse(g.playerNames),
                        kingdom: JSON.parse(g.kingdom),
                        turnNumber: g.turnNumber,
                        updatedAt: g.updatedAt,
                    }))
                });
            } catch (e) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Failed to list saved games' });
            }
        });

        socket.on(GameEvents.RESUME_GAME, (data: { gameId: string }) => {
            if (!currentRoomId) return;
            const room = roomManager.getRoom(currentRoomId);
            if (!room) return;

            const player = room.getPlayerBySocket(socket.id);
            if (!player?.isHost) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Only host can resume games' });
                return;
            }

            try {
                const savedGame = database.loadGame(data.gameId);
                if (!savedGame) {
                    socket.emit(GameEvents.ACTION_ERROR, { error: 'Game not found or not resumable' });
                    return;
                }

                // Assume kingdom is safely parseable, use try/catch just in case
                const kingdomCards = JSON.parse(savedGame.kingdom);

                const success = room.resumeGame(savedGame.stateJson, kingdomCards);
                if (success) {
                    // It works! The room is already notifying players via onStateChanged.
                    console.log(`[Socket] Host ${player.name} resumed game ${data.gameId}`);
                } else {
                    socket.emit(GameEvents.ACTION_ERROR, { error: 'Failed to resume game state' });
                }
            } catch (e) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Error loading saved game' });
            }
        });

        socket.on('get_player_profile', (data: { playerToken: string }) => {
            try {
                const profile = database.getPlayerProfile(data.playerToken);
                socket.emit('player_profile', { profile });
            } catch (e) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Failed to get profile' });
            }
        });

        socket.on('get_leaderboard', () => {
            try {
                const leaderboard = database.getLeaderboard(10);
                socket.emit('leaderboard', { players: leaderboard });
            } catch (e) {
                socket.emit(GameEvents.ACTION_ERROR, { error: 'Failed to get leaderboard' });
            }
        });

        // ====================================================================
        // Disconnect
        // ====================================================================

        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);

            if (currentRoomId) {
                const room = roomManager.getRoom(currentRoomId);
                if (room) {
                    room.removePlayer(socket.id);

                    // Cleanup empty rooms
                    if (room.isEmpty()) {
                        roomManager.deleteRoom(currentRoomId);
                        console.log(`[Socket] Deleted empty room ${currentRoomId}`);
                    }
                }
            }
        });
    });

    // Periodic cleanup
    setInterval(() => {
        roomManager.cleanup();
    }, 60000);
}
