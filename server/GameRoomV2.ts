/**
 * GameRoomV2 - Manages a single game room with the new engine
 * 
 * Owns the canonical GameState
 * Validates all actions
 * Broadcasts serialized state
 */

import { Server, Socket } from 'socket.io';
import {
    GameState,
    createGameState
} from '../shared/engine/GameState.js';
import { produce } from 'immer';
import { GameStateView } from '../shared/engine/GameStateView.js';
import {
    createPlayerState
} from '../shared/engine/PlayerState.js';
import { createCardInstance, createCardInstances } from '../shared/engine/CardInstance.js';
import { ALL_BOONS, ALL_HEXES } from '../shared/cards/nocturne/index.js';
import { CardRegistry } from '../shared/cards/index.js';
import { GameAction } from '../shared/types/GameAction.js';
import { RulesValidator } from '../shared/engine/RulesValidator.js';
import { ActionResolver } from '../shared/engine/ActionResolver.js';
import { StateSerializerV2 } from './StateSerializerV2.js';
import { BotInterface, BotType, createBot } from '../shared/bot/index.js';
import { GameLogger, getLogger } from '../shared/engine/GameLogger.js';
import { GameInvariants } from '../shared/engine/GameInvariants.js';
import { TurnMachine } from '../shared/engine/TurnMachine.js';
import { PhaseEngine } from '../shared/engine/PhaseEngine.js';
import { SupplyGenerator } from '../shared/engine/SupplyGenerator.js';
import { VictoryChecker } from '../shared/engine/VictoryChecker.js';
import { GameLogStore } from '../shared/engine/GameLogStore.js';
import { HISTORICAL_PERSONAS } from '../shared/data/historicalPersonas.js';
import { database } from './Database.js';

// ============================================================================
// Room Types
// ============================================================================

export interface RoomPlayer {
    id: string;
    socketId: string;
    name: string;
    color: string;
    isHost: boolean;
    isReady: boolean;
    isConnected: boolean;
    isBot: boolean;
    botType?: BotType;
    isSpectator?: boolean;
    spectatorFollowId?: string;
    spectatorRevealAll?: boolean;
    hasSurrendered?: boolean;
}

interface RewindRequest {
    requesterId: string;
    targetLogId: string;
    votes: Record<string, boolean>; // playerId -> approved
    startedAt: number;
}

export interface RoomConfig {
    minPlayers: number;
    maxPlayers: number;
    kingdomCards?: string[] | (string | null)[];
    prosperityMode: 'always' | 'never' | 'random';
    sheltersMode: 'always' | 'never' | 'random';
    enabledExpansions?: string[];
    landscapeInstructions?: string[];
    turnTimeoutMs?: number; // 0 for disabled
}

// ============================================================================
// Events
// ============================================================================

export const GameEvents = {
    // Server -> Client
    ROOM_STATE: 'room_state',
    GAME_STATE: 'game_state',
    GAME_STARTED: 'game_started',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',
    ACTION_ERROR: 'action_error',
    ROOM_CLOSED: 'room_closed',
    GAME_FORCE_ENDED: 'game_force_ended',

    // Client -> Server
    JOIN_ROOM: 'join_room',
    LEAVE_ROOM: 'leave_room',
    TOGGLE_READY: 'toggle_ready',
    START_GAME: 'start_game',
    GAME_ACTION: 'game_action',
    ADD_BOT: 'add_bot',
    REMOVE_BOT: 'remove_bot',
    CHANGE_COLOR: 'change_color',
    CHANGE_KINGDOM: 'change_kingdom',
    CHANGE_SETUP: 'change_setup',
    REQUEST_REWIND: 'request_rewind',
    VOTE_REWIND: 'vote_rewind',
    UNDO_ACTION: 'undo_action',
    GET_LOGS: 'get_logs',
    HOST_FORCE_END_GAME: 'host_force_end_game',
    LIST_SAVED_GAMES: 'list_saved_games',
    RESUME_GAME: 'resume_game',
    SAVED_GAMES_LIST: 'saved_games_list',
    SPECTATOR_CONFIG: 'spectator_config',
} as const;

// ============================================================================
// Room Types
// ============================================================================
const DEFAULT_CONFIG: RoomConfig = {
    minPlayers: 2,
    maxPlayers: 5,
    kingdomCards: [
        'village', 'smithy', 'market', 'laboratory', 'festival',
        'witch', 'militia', 'moat', 'cellar', 'workshop'
    ],
    prosperityMode: 'never',
    sheltersMode: 'random',
    landscapeInstructions: ['random:any', 'random:any', 'empty', 'empty'],
    turnTimeoutMs: 60000 // 60s default
};

const COLOR_PALETTE = [
    '#e74c3c', '#2ecc71', '#3498db', '#f1c40f', // Row 1
    '#9b59b6', '#e67e22', '#1abc9c', '#e91e63', // Row 2
    '#badc58', '#7ed6df', '#be2edd', '#6d4c41', // Row 3 (New: Lime, Cyan, Magenta, Brown)
    '#34495e', '#bdc3c7', '#ecf0f1', '#7f8c8d'  // Row 4
];

export class GameRoomV2 {
    public id: string;
    public players: RoomPlayer[] = []; // Legacy wrapper for room logic
    public gameState: GameState;
    public isStarted: boolean = false;
    public config: RoomConfig;
    public kingdomCards: (string | null)[] | null = null; // Current selection in lobby
    public lastAllDisconnectedAt: number | null = null;
    public activeRewindRequest: RewindRequest | null = null;
    public turnEndTime: number | null = null;
    public previousState: GameState | null = null;

    private io: Server;
    private socketToPlayer: Map<string, string> = new Map(); // SocketId -> PlayerId (Token)
    private turnTimer: NodeJS.Timeout | null = null;
    private logger: GameLogger;

    constructor(io: Server, id: string, config: Partial<RoomConfig> = {}) {
        this.io = io;
        this.id = id;

        // If no kingdom cards provided, generate randomized balanced set
        if (!config.kingdomCards) {
            config.kingdomCards = SupplyGenerator.generate({ seed: id });
        }

        this.config = { ...DEFAULT_CONFIG, ...config };

        // Initialize enabledExpansions if not provided
        if (!this.config.enabledExpansions) {
            // Default to ALL expansions enabled
            this.config.enabledExpansions = [
                'base', 'intrigue', 'seaside', 'prosperity', 'dark_ages', 'hinterlands',
                'cornucopia', 'guilds', 'adventures', 'empires', 'alchemy', 'nocturne',
                'renaissance', 'menagerie', 'allies', 'plunder', 'rising_sun', 'promos'
            ];
        }

        this.gameState = createGameState(id);
        this.logger = getLogger(id); // Use structured logger
    }

    resumeGame(stateJson: string, kingdomCards: string[]): boolean {
        try {
            const parsedState = JSON.parse(stateJson) as GameState;
            this.gameState = parsedState;
            this.config.kingdomCards = kingdomCards;
            this.isStarted = true;
            this.logger.info('GAME', `Game ${this.id} resumed from DB state`);

            // Broadcast state to all players currently in the room
            this.onStateChanged();
            return true;
        } catch (e) {
            this.logger.error('GAME', `Failed to parse game state JSON: ${e}`);
            return false;
        }
    }


    /** Active bot instances for this room */
    protected bots: Map<string, BotInterface> = new Map();

    /**
     * Add a bot player to the room
     */
    addBot(botType: BotType = 'greedy'): RoomPlayer | null {
        if (this.players.length >= this.config.maxPlayers) return null;
        if (this.isStarted) return null;

        const bot = createBot(botType);
        const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Pick a unique historical name
        const usedNames = new Set(this.players.map(p => p.name));

        // Safety check in case import fails or is empty
        let personas = HISTORICAL_PERSONAS;
        if (!personas || !Array.isArray(personas) || personas.length === 0) {
            this.logger.warn('ROOM', 'HISTORICAL_PERSONAS not loaded or empty! Using fallback list.');
            personas = [
                { name: "Charlemagne", description: "Empereur d'Occident", era: "Moyen Âge", years: "742-814" },
                { name: "Jeanne d'Arc", description: "Héroïne de France", era: "Moyen Âge", years: "1412-1431" },
                { name: "Louis XIV", description: "Roi Soleil", era: "Temps Modernes", years: "1638-1715" },
                { name: "Napoléon", description: "Empereur des Français", era: "XIXe siècle", years: "1769-1821" },
                { name: "Vercingétorix", description: "Chef Gaulois", era: "Antiquité", years: "v. 80-46 av. J.-C." },
                { name: "Clovis", description: "Roi des Francs", era: "Moyen Âge", years: "v. 466-511" }
            ];
        }

        const availablePersonas = personas.filter(p => !usedNames.has(p.name));

        let botName: string;
        if (availablePersonas.length > 0) {
            const persona = availablePersonas[Math.floor(Math.random() * availablePersonas.length)];
            botName = persona.name;
        } else {
            // Fallback if all names taken or list missing
            botName = `Bot ${Math.floor(Math.random() * 1000)}`;
        }

        const color = this.assignUniqueColor();

        const player: RoomPlayer = {
            id: botId,
            socketId: '', // Bots have no socket
            name: botName,
            color,
            isHost: false,
            isReady: true, // Bots are always ready
            isConnected: true,
            isBot: true,
            botType
        };

        // Random insertion
        const insertIndex = Math.floor(Math.random() * (this.players.length + 1));
        this.players.splice(insertIndex, 0, player);

        this.bots.set(botId, bot);
        this.broadcastRoomState();

        this.logger.info('ROOM', `Bot added: ${player.name} (${botType})`);
        return player;
    }

    /**
     * Remove a bot player from the room
     */
    removeBot(botId: string): boolean {
        if (this.isStarted) return false;

        const botIndex = this.players.findIndex(p => p.id === botId && p.isBot);
        if (botIndex === -1) return false;

        const bot = this.players[botIndex];
        this.players.splice(botIndex, 1);
        this.bots.delete(botId);
        this.broadcastRoomState();
        this.logger.info('ROOM', `Bot removed: ${bot.name}`);
        return true;
    }

    // ========================================================================
    // Player Management
    // ========================================================================

    addPlayer(socket: Socket, name: string, _color: string, playerToken: string): RoomPlayer | null {
        try {
            // 1. Check if this is a reconnection
            const existingRoomPlayer = this.players.find(p => p.id === playerToken);
            if (existingRoomPlayer) {
                return this.reconnectPlayer(socket, playerToken);
            }

            // 2. New Player Logic
            const isSpectator = this.isStarted;
            if (this.players.length >= this.config.maxPlayers && !isSpectator) {
                return null;
            }

            const isHost = this.players.length === 0;
            const player: RoomPlayer = {
                id: playerToken,
                socketId: socket.id,
                name: isSpectator ? `${name} (Spectator)` : name,
                color: this.assignUniqueColor(),
                isHost,
                isReady: isSpectator ? true : false,
                isConnected: true,
                isBot: false,
                isSpectator
            };

            if (isSpectator) {
                this.players.push(player);
            } else {
                const insertIndex = Math.floor(Math.random() * (this.players.length + 1));
                this.players.splice(insertIndex, 0, player);
            }

            this.socketToPlayer.set(socket.id, playerToken);
            socket.join(this.id);

            this.broadcastRoomState();
            console.log('ADD_PLAYER: Post-broadcastRoomState');

            this.io.to(this.id).emit(GameEvents.PLAYER_JOINED, { playerId: playerToken, name: player.name });
            console.log('ADD_PLAYER: Post-PLAYER_JOINED emit');

            if (isSpectator && this.gameState) {
                const serialized = StateSerializerV2.serialize(this.gameState, playerToken, this.turnEndTime);
                socket.emit(GameEvents.GAME_STATE, serialized);
            }

            console.log('ADD_PLAYER: About to call logger.info');
            this.logger.info('ROOM', `Player joined: ${player.name} (${playerToken}) [${isSpectator ? 'SPECTATOR' : 'PLAYER'}]`);
            console.log('ADD_PLAYER: After logger.info');
            return player;
        } catch (err) {
            console.error('FATAL ERROR IN addPlayer:', err);
            throw err;
        }
    }

    removePlayer(socketId: string, reason: 'disconnect' | 'leave' | 'surrender' = 'disconnect'): void {
        const playerId = this.socketToPlayer.get(socketId);
        if (!playerId) return;

        // Remove socket from the room to stop receiving broadcasts
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && (reason === 'leave' || reason === 'surrender')) {
            socket.leave(this.id);
        }

        if (this.isStarted) {
            // Mark as disconnected, don't remove hard
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                // RACE CONDITION FIX: Only mark as disconnected if this is their CURRENT socket.
                // If they have already reconnected (new socketId), ignore this disconnect for state purposes.
                if (player.socketId !== socketId) {
                    this.logger.info('ROOM', `Ignored disconnect for ${player.name} (Socket mismatch: old=${socketId}, new=${player.socketId})`);

                    // cleanup old mapping just in case
                    this.socketToPlayer.delete(socketId);
                    return;
                }

                player.isConnected = false;
                if (reason === 'surrender' || reason === 'leave') {
                    player.hasSurrendered = true;
                }
                this.logger.info('ROOM', `Player ${reason}: ${player.name}`);

                // CLOSED ROOM IF HOST LEAVES
                if (player.isHost && reason !== 'disconnect') {
                    this.logger.info('ROOM', `Host left the room. Closing room ${this.id}...`);
                    this.io.to(this.id).emit(GameEvents.ROOM_CLOSED, { reason: 'host_left' });
                    // Mark as empty for manager cleanup
                    this.players = [];
                    return;
                }

                // If active player left/surrendered, we must advance the game
                if (this.gameState) {
                    const activePlayerId = this.gameState.players[this.gameState.currentPlayerIndex]?.id;
                    if (activePlayerId === playerId) {
                        if (reason === 'disconnect') {
                            this.logger.info('GAME', `Active player disconnected. Waiting 5s for reconnect before ending turn...`);
                            // Grace period for refresh
                            setTimeout(() => {
                                // Check if still disconnected (and still active player)
                                const p = this.players.find(x => x.id === playerId);
                                const currentActive = this.gameState?.players[this.gameState?.currentPlayerIndex]?.id;

                                if (p && !p.isConnected && currentActive === playerId) {
                                    this.logger.info('GAME', `Active player disconnect timeout. Ending turn.`);
                                    this.handleDisconnectTurn();
                                } else {
                                    this.logger.info('GAME', `Active player reconnected or turn changed. Aborting disconnect turn skip.`);
                                }
                            }, 30000); // 30 seconds for active player
                        } else {
                            // Immediate skip for explicit leave/surrender
                            this.logger.info('GAME', `Active player surrendered/left. Ending turn.`);
                            this.handleDisconnectTurn();
                        }
                    }
                }
            }
        } else {
            // Pre-game: Handle graceful refresh vs explicit leave
            const player = this.players.find(p => p.id === playerId);

            if (reason === 'leave' || reason === 'surrender') {
                // Explicit leave: Remove immediately
                this.players = this.players.filter(p => p.id !== playerId);
                this.socketToPlayer.delete(socketId);

                // Reassign host if needed
                if (this.players.length > 0 && !this.players.some(p => p.isHost)) {
                    this.players[0].isHost = true;
                }
                this.logger.info('ROOM', `Player left (pre-game): ${playerId}`);
            } else {
                // Disconnect (Refresh?): Mark disconnected, wait briefly before removing
                if (player) player.isConnected = false;

                this.logger.info('ROOM', `Player disconnected (pre-game, waiting): ${playerId}`);

                setTimeout(() => {
                    const p = this.players.find(p => p.id === playerId);
                    // If still disconnected after 10s, remove
                    if (p && !p.isConnected) {
                        if (p.isHost) {
                            this.logger.info('ROOM', `Host timeout. Closing room ${this.id}...`);
                            this.io.to(this.id).emit(GameEvents.ROOM_CLOSED, { reason: 'host_timeout' });
                            this.players = [];
                            return;
                        }

                        this.players = this.players.filter(x => x.id !== playerId);
                        this.socketToPlayer.delete(socketId); // Might be stale, but ok

                        // Reassign host
                        if (this.players.length > 0 && !this.players.some(x => x.isHost)) {
                            this.players[0].isHost = true;
                        }

                        this.broadcastRoomState();
                        this.io.to(this.id).emit(GameEvents.PLAYER_LEFT, { playerId });
                        this.logger.info('ROOM', `Player removed after timeout: ${playerId}`);
                    }
                }, 60000); // 60 seconds grace period for refresh

                // Return early so we don't broadcast PLAYER_LEFT yet
                // But we DO want to broadcast room state to show "Offline"? 
                // Currently UI doesn't show offline in lobby.
                // Let's broadcast state so isConnected=false updates UI (maybe gray out?)
            }
        }

        this.broadcastRoomState();
        if (reason === 'leave' || reason === 'surrender') {
            this.io.to(this.id).emit(GameEvents.PLAYER_LEFT, { playerId });
        }

        // Track abandonment
        const hasConnectedHuman = this.players.some(p => p.isConnected && !p.isBot);
        if (!hasConnectedHuman && !this.lastAllDisconnectedAt) {
            this.lastAllDisconnectedAt = Date.now();
            this.logger.info('ROOM', `Room ${this.id} marked as potentially abandoned (no connected humans)`);
        } else if (hasConnectedHuman) {
            this.lastAllDisconnectedAt = null;
        }
    }

    /**
     * Handle turn skipping for disconnected/surrendered players
     */
    private handleDisconnectTurn() {
        if (!this.gameState || this.gameState.isGameOver) return;

        let attempts = 0;
        const maxAttempts = this.gameState.players.length * 2; // Prevent infinite loop

        while (attempts < maxAttempts) {
            // Check if current player is connected
            const currentPlayerId = this.gameState.players[this.gameState.currentPlayerIndex].id;
            const roomPlayer = this.players.find(p => p.id === currentPlayerId);

            console.log(`[handleDisconnectTurn] Checking player ${roomPlayer?.name ?? currentPlayerId}. isConnected: ${roomPlayer?.isConnected}, hasSurrendered: ${roomPlayer?.hasSurrendered}, isBot: ${roomPlayer?.isBot}`);

            // If player is connected and HAS NOT surrendered, it's their turn. Stop skipping.
            if (roomPlayer && roomPlayer.isConnected && !roomPlayer.hasSurrendered) {
                break;
            }

            this.logger.info('GAME', `FORCED Turn Skip: Player ${roomPlayer?.name ?? currentPlayerId} is disconnected or surrendered.`);

            // Force Phase change to BUY then end it to move to CLEANUP -> NEXT TURN
            // This is safer than just jumping to next player manually.
            if (this.gameState.phase === 'ACTION') {
                this.gameState.phase = 'BUY';
                this.logger.info('GAME', 'Skipping ACTION phase for disconnected player.');
            }

            if (this.gameState.phase === 'BUY') {
                this.logger.info('GAME', 'Ending BUY phase for disconnected player.');
                TurnMachine.endBuyPhase(this.gameState);
            } else if (this.gameState.phase === 'NIGHT') {
                // Safety for expansions
                PhaseEngine.advancePhase(this.gameState);
            }

            attempts++;
        }

        if (attempts >= maxAttempts) {
            this.broadcastGameState();
        }
    }

    reconnectPlayer(socket: Socket, playerId: string): RoomPlayer | null {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return null;

        player.socketId = socket.id;
        player.isConnected = true;
        this.socketToPlayer.set(socket.id, playerId);
        socket.join(this.id);

        this.lastAllDisconnectedAt = null; // Resume activity

        this.broadcastRoomState();

        // Send current game state to reconnected player
        if (this.gameState) {
            const serialized = StateSerializerV2.serialize(this.gameState, playerId, this.turnEndTime);
            socket.emit(GameEvents.GAME_STATE, serialized);
        }

        this.logger.info('ROOM', `Player reconnected: ${player.name}`);
        return player;
    }

    private resetTurnTimer(): void {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }

        if (!this.gameState || this.gameState.isGameOver || this.gameState.phase === 'PREGAME') {
            this.turnEndTime = null;
            return;
        }

        const timeout = this.config.turnTimeoutMs || 0;
        if (timeout <= 0) {
            this.turnEndTime = null;
            return;
        }

        // Determine if timer should run (only for active HUMAN players)
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        const deciderId = this.gameState.pendingDecision?.playerId;
        const activeId = deciderId || currentPlayer.id;

        const roomPlayer = this.players.find(p => p.id === activeId);

        if (roomPlayer && !roomPlayer.isBot && roomPlayer.isConnected) {
            this.turnEndTime = Date.now() + timeout;
            this.turnTimer = setTimeout(() => this.handleTurnTimeout(), timeout);
        } else {
            this.turnEndTime = null;
        }
    }

    private handleTurnTimeout(): void {
        if (!this.gameState || this.gameState.isGameOver) return;

        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        const deciderId = this.gameState.pendingDecision?.playerId;
        const activeId = deciderId || currentPlayer.id;

        this.logger.info('GAME', `Turn Timeout for player ${activeId}. Forcing end of phase/choice.`);

        if (this.gameState.pendingDecision) {
            // Force skip decision if optional, or pick first option
            const action = this.gameState.pendingDecision.optional
                ? { type: 'CHOOSE', choiceId: this.gameState.pendingDecision.id, payload: { type: 'PASS' } }
                : { type: 'CHOOSE', choiceId: this.gameState.pendingDecision.id, payload: { type: 'OPTION', optionIndex: 0 } } as any;

            this.handleActionByPlayerId(activeId, action);
        } else {
            // Force end phase
            this.handleActionByPlayerId(activeId, { type: 'END_PHASE' });
        }
    }

    /**
     * Helper to bypass socketId requirement for internal actions
     */
    private handleActionByPlayerId(playerId: string, action: GameAction): void {
        const result = ActionResolver.resolve(this.gameState, playerId, action);
        if (result.success) {
            this.gameState = produce(result.state, draft => {
                // Recalculate scores safely within produce
                const currentScores = VictoryChecker.getCurrentScores(draft as any as GameState);
                draft.players.forEach(p => {
                    const s = currentScores.find(cs => cs.playerId === p.id);
                    if (s) p.score = s.score;
                });
            });

            this.onStateChanged();
        }
    }

    private actionsSinceLastSave: number = 0;
    private lastSaveTime: number = 0;

    private onStateChanged(): void {
        this.resetTurnTimer();
        this.broadcastRoomState();
        this.broadcastGameState();
        this.scheduleBotTurnIfNeeded();
        this.autoSaveIfNeeded();
    }

    private autoSaveIfNeeded(): void {
        if (!this.gameState || !this.isStarted) return;
        this.actionsSinceLastSave++;
        const now = Date.now();
        const timeSinceLastSave = now - this.lastSaveTime;

        // Save every 5 actions or every 10 seconds, whichever comes first
        if (this.actionsSinceLastSave >= 5 || timeSinceLastSave >= 10000) {
            this.saveGameToDb();
        }
    }

    private saveGameToDb(): void {
        if (!this.gameState) return;
        try {
            const kingdom = (this.config.kingdomCards || []).filter((c): c is string => c !== null);
            const playerNames = this.players.filter(p => !p.isSpectator).map(p => p.name);
            const turnNumber = this.gameState.turnNumber || 0;
            database.saveGame(
                this.gameState.id,
                this.id,
                JSON.stringify(this.gameState),
                kingdom,
                playerNames,
                turnNumber
            );
            this.actionsSinceLastSave = 0;
            this.lastSaveTime = Date.now();
        } catch (e) {
            this.logger.warn('DB', `Failed to save game: ${e}`);
        }
    }

    private recordGameResults(): void {
        if (!this.gameState) return;
        try {
            const scores = VictoryChecker.getCurrentScores(this.gameState)
                .sort((a, b) => b.score - a.score);
            const kingdom = (this.config.kingdomCards || []).filter((c): c is string => c !== null);
            scores.forEach((s, i) => {
                const roomPlayer = this.players.find(p => p.id === s.playerId);
                database.recordGameResult(
                    this.gameState!.id,
                    s.playerId,
                    roomPlayer?.name || s.playerId,
                    s.score,
                    i + 1,
                    kingdom
                );
            });
            database.markGameCompleted(this.gameState.id);
        } catch (e) {
            this.logger.warn('DB', `Failed to record game results: ${e}`);
        }
    }

    getPlayerBySocket(socketId: string): RoomPlayer | null {
        const playerId = this.getPlayerIdBySocket(socketId);
        return this.players.find(p => p.id === playerId) ?? null;
    }

    configureSpectator(socketId: string, options: { followId?: string, revealAll?: boolean }): void {
        const player = this.getPlayerBySocket(socketId);
        if (!player || !player.isSpectator) return;

        if (options.followId !== undefined) {
            player.spectatorFollowId = options.followId;
        }
        if (options.revealAll !== undefined) {
            player.spectatorRevealAll = options.revealAll;
        }

        this.logger.info('ROOM', `Spectator ${player.name} config updated: Follow=${player.spectatorFollowId}, RevealAll=${player.spectatorRevealAll}`);

        // Re-broadcast state only to this spectator so they see the new perspective immediately
        if (this.gameState) {
            this.broadcastGameState(); // Actually simpler to just broadcast to all, or we could optimize
        }
    }

    private getPlayerIdBySocket(socketId: string): string | undefined {
        return this.socketToPlayer.get(socketId);
    }

    // ========================================================================
    // Game Lifecycle
    // ========================================================================

    toggleReady(socketId: string): void {
        const player = this.getPlayerBySocket(socketId);
        if (!player) return; // Allow toggling ready even if started? No, implies start check.

        // If game IS started, maybe ready toggling is disabled or used for re-sync?
        // Assuming PREGAME only.
        if (this.isStarted && this.gameState.phase !== 'PREGAME') return;

        player.isReady = !player.isReady;
        this.broadcastRoomState();

        // Check if all ready -> Actually start the game logic (Shuffle & Draw)
        // Only if currently in PREGAME (which meant "Waiting for Ready" in this new flow)
        if (this.isStarted && this.gameState.phase === 'PREGAME' && this.canStartGameLogic()) {
            this.initializeRealGameStart();
        }
    }

    private canStartGameLogic(): boolean {
        return this.players.every(p => p.isBot || p.isReady);
    }

    private initializeRealGameStart(): void {
        this.logger.info('GAME', 'All players ready. Initializing standardized game start.');

        // Delegate initialization to the Engine (centralized logic)
        ActionResolver.startGame(this.gameState);

        this.onStateChanged();
    }



    changePlayerColor(socketId: string, color: string): void {
        const player = this.getPlayerBySocket(socketId);
        if (!player) return;

        // Check for conflicts
        const conflictingPlayer = this.players.find(p => p.id !== player.id && p.color === color);

        if (conflictingPlayer) {
            if (conflictingPlayer.isBot) {
                // If it's a bot, move the bot to a new color
                const newBotColor = this.assignUniqueColor([player.id, conflictingPlayer.id]);
                if (newBotColor) {
                    conflictingPlayer.color = newBotColor;
                    this.logger.info('ROOM', `Bot ${conflictingPlayer.name} moved to color ${newBotColor} due to conflict`);
                } else {
                    this.logger.warn('ROOM', `Cannot swap bot color: no colors available`);
                    return;
                }
            } else {
                // If it's a human, deny the change (first come, first served)
                this.logger.warn('ROOM', `Player ${player.name} tried to take occupied color ${color}`);
                return;
            }
        }

        player.color = color;
        this.broadcastRoomState();
        this.logger.info('ROOM', `Player ${player.name} changed color to ${color}`);
    }

    /**
     * Assigns a random available color from the palette.
     * @param exclusionIds Optional IDs of players whose colors should not be considered available (typically the player switching to this color)
     */
    private assignUniqueColor(exclusionIds: string[] = []): string {
        const usedColors = new Set(this.players.filter(p => !exclusionIds.includes(p.id)).map(p => p.color));
        const availableColors = COLOR_PALETTE.filter(c => !usedColors.has(c));

        if (availableColors.length === 0) {
            // Fallback: Pick a random color if somehow all 16 are taken (unlikely with max 5 players)
            return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
        }

        return availableColors[Math.floor(Math.random() * availableColors.length)];
    }

    canStart(): boolean {
        return (
            this.players.length >= this.config.minPlayers &&
            this.players.every(p => p.isHost || p.isReady)
        );
    }

    public startGame(kingdomCards?: (string | null)[] | null): void {
        let finalSelection = kingdomCards || this.kingdomCards;

        this.logger.info('GAME', 'Starting game initialization...');

        if (this.isStarted) {
            this.logger.warn('GAME_START_FAILED', 'Game already started');
            return;
        }

        // Apply custom kingdom if provided (even if partial)
        if (finalSelection && Array.isArray(finalSelection)) {
            // Filter out nulls and empty strings to get the "forced" cards
            const forcedCards = finalSelection.filter((id): id is string => !!id && id !== '');

            if (forcedCards.length === 10) {
                this.config.kingdomCards = forcedCards;
                this.logger.info('GAME_CONFIG', 'Applying full custom kingdom cards', { kingdomCards: forcedCards });
            } else {
                // Partial selection: use generator to fill the rest
                const completedKingdom = SupplyGenerator.generate({
                    forceCards: forcedCards,
                    count: 10,
                    prosperityMode: this.config.prosperityMode,
                    enabledExpansions: this.config.enabledExpansions
                });
                this.config.kingdomCards = completedKingdom;
                this.logger.info('GAME_CONFIG', 'Completed partial kingdom cards randomly', {
                    original: forcedCards,
                    final: completedKingdom
                });
            }
        } else if (finalSelection) {
            this.logger.warn('GAME_CONFIG_INVALID', 'Invalid custom kingdom cards format, using default/random', { kingdomCards: finalSelection });
        } else {
            // Random Mode (No manual selection): Regenerate based on CURRENT configuration
            // This ensures we respect the latest enabledExpansions/prosperityMode
            this.config.kingdomCards = SupplyGenerator.generate({
                count: 10,
                prosperityMode: this.config.prosperityMode,
                enabledExpansions: this.config.enabledExpansions
            });
            this.logger.info('GAME_CONFIG', 'Generated fresh random kingdom based on current filters');
        }

        this.logger.info('GAME', `Attempting to start game. Players: ${this.players.length}, Ready: ${this.players.filter(p => p.isReady).length}, Min: ${this.config.minPlayers}`);

        if (!this.canStart()) {
            this.logger.warn('GAME', 'Start failed: canStart() returned false');
            return;
        }

        this.isStarted = true;
        this.gameState = this.createInitialGameState();

        // Calculate initial scores (Estates) using produce to avoid mutating frozen state
        const initialScores = VictoryChecker.getCurrentScores(this.gameState);
        this.gameState = produce(this.gameState, draft => {
            draft.players.forEach(p => {
                const s = initialScores.find(cs => cs.playerId === p.id);
                if (s) p.score = s.score;
            });
        });

        // Delegate initialization to the Engine (centralized logic)
        ActionResolver.startGame(this.gameState);

        this.onStateChanged();

        this.logger.info('GAME', 'Game started');

        // Check if first player is a bot
        this.scheduleBotTurnIfNeeded();


    }

    public createInitialGameState(overrideKingdom?: string[]): GameState {
        const state = createGameState(`game_${this.id}_${Date.now()}`);

        const kingdomCardIds = overrideKingdom || (this.config.kingdomCards ?? []).filter((id): id is string => id !== null);
        state.kingdomCards = kingdomCardIds;
        const useShelters = SupplyGenerator.shouldUseShelters(kingdomCardIds, this.config.sheltersMode);
        const heirlooms = SupplyGenerator.getRequiredHeirlooms(kingdomCardIds);

        state.players = this.players.map(p => {
            const playerState = createPlayerState(p.id, p.name, p.color);
            playerState.isHost = p.isHost;
            playerState.isBot = p.isBot;
            playerState.isReady = p.isBot ? true : false;

            let startingHand: any[] = [];
            if (useShelters) {
                startingHand = [
                    ...createCardInstances('copper', 7),
                    createCardInstance('hovel'),
                    createCardInstance('necropolis'),
                    createCardInstance('overgrown_estate')
                ];
            } else {
                startingHand = [
                    ...createCardInstances('copper', 7),
                    ...createCardInstances('estate', 3)
                ];
            }

            // Apply Heirlooms: replace one copper per heirloom
            for (const heirloomId of heirlooms) {
                const copperIdx = startingHand.findIndex(c => c.id === 'copper');
                if (copperIdx !== -1) {
                    startingHand.splice(copperIdx, 1);
                    startingHand.push(createCardInstance(heirloomId));
                    this.logger.info('GAME', `Replaced starting Copper with Heirloom: ${heirloomId} for player ${p.name}`);
                }
            }

            playerState.hand = startingHand;
            playerState.deck = [];
            playerState.discardPile = [];

            return playerState;
        });

        const numPlayers = this.players.length;
        const victoryCount = numPlayers <= 2 ? 8 : (numPlayers >= 5 ? 15 : 12);
        const curseCount = (numPlayers - 1) * 10;

        state.supply = {
            copper: { cardId: 'copper', count: 60 - (numPlayers * 7), cards: [] },
            silver: { cardId: 'silver', count: 40, cards: [] },
            gold: { cardId: 'gold', count: 30, cards: [] },
            estate: { cardId: 'estate', count: victoryCount, cards: [] },
            duchy: { cardId: 'duchy', count: victoryCount, cards: [] },
            province: { cardId: 'province', count: victoryCount, cards: [] },
            curse: { cardId: 'curse', count: curseCount, cards: [] },
        };

        // Young Witch: Add Bane card to supply
        if (kingdomCardIds.includes('young_witch')) {
            const baneId = SupplyGenerator.pickBaneCard(kingdomCardIds, { seed: this.id });
            if (baneId) {
                this.logger.info('GAME', `Young Witch setup: Bane card is ${baneId}`);
                state.supply[baneId] = { cardId: baneId, count: 10, cards: [] };
                // Store in landscapeState for effect reference if needed, or just let card logic handle it
                state.landscapeState['young_witch_bane'] = { state: { baneId }, tokens: {} };
            }
        }

        for (const cardId of kingdomCardIds) {
            if (!cardId) continue;
            const def = CardRegistry.get(cardId);
            if (def?.mixedPile) {
                const baseCards = [...def.mixedPile.cards];
                state.supply[cardId] = {
                    cardId,
                    count: baseCards.length,
                    isMixed: true,
                    cards: baseCards.map(id => createCardInstance(id))
                };

                if (def.mixedPile.type === 'SHUFFLED' && state.supply[cardId].cards) {
                    const stack = state.supply[cardId].cards!;
                    for (let i = stack.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [stack[i], stack[j]] = [stack[j], stack[i]];
                    }
                }
            } else {
                state.supply[cardId] = { cardId, count: 10, cards: [] };
            }
        }

        // Initialize Nocturne Boons and Hexes
        // Check if there are any cards requiring Boons or Hexes
        let needsBoons = kingdomCardIds.some(id => {
            const def = CardRegistry.get(id);
            if (!def) return false;
            // E.g. Druid, Pixie, Idol, etc. (Check effects for RECEIVE_BOON, or 'FATE' type)
            return def.types.includes('FATE') || def.effects?.some(e => e.type === 'RECEIVE_BOON') || def.nightEffects?.some(e => e.type === 'RECEIVE_BOON');
        });

        let needsHexes = kingdomCardIds.some(id => {
            const def = CardRegistry.get(id);
            if (!def) return false;
            return def.types.includes('DOOM') || def.effects?.some(e => e.type === 'RECEIVE_HEX') || def.nightEffects?.some(e => e.type === 'RECEIVE_HEX');
        });

        if (needsBoons) {
            state.boonDeck = [...ALL_BOONS].map(b => b.id);
            // Shuffle
            for (let i = state.boonDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [state.boonDeck[i], state.boonDeck[j]] = [state.boonDeck[j], state.boonDeck[i]];
            }
        }

        if (needsHexes) {
            state.hexDeck = [...ALL_HEXES].map(h => h.id);
            // Shuffle
            for (let i = state.hexDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [state.hexDeck[i], state.hexDeck[j]] = [state.hexDeck[j], state.hexDeck[i]];
            }
        }

        // Druid Setup: Set aside 3 Boons
        if (kingdomCardIds.includes('druid') && needsBoons) {
            const setAsideBoons = state.boonDeck.splice(0, 3);
            this.logger.info('GAME', `Druid setup: Set aside boons are ${setAsideBoons.join(', ')}`);
            state.landscapeState['druid_boons'] = { state: { boons: setAsideBoons }, tokens: {} };
        }

        // Initialize nonSupply for extra piles (Spoils, Madman, Mercenary)
        // NOTE: Ruins are now in SUPPLY as they count for game end
        state.nonSupply = {};
        const extraPiles = SupplyGenerator.getRequiredExtraPiles(kingdomCardIds);

        // Calculate Landscapes (Events, Landmarks)
        state.landscapes = SupplyGenerator.getLandscapes({
            enabledExpansions: this.config.enabledExpansions,
            landscapeInstructions: this.config.landscapeInstructions,
            kingdomCardIds: kingdomCardIds,
            seed: this.id // Use room ID as seed base
        });
        console.log(`[GameRoom] Selected Landscapes: ${state.landscapes.join(', ')}`);

        for (const pileId of extraPiles) {
            if (!pileId) continue;
            const def = CardRegistry.get(pileId);
            let count = 10;
            if (pileId === 'ruins') count = numPlayers * 10;
            else if (pileId === 'spoils') count = 15;
            else if (pileId === 'madman' || pileId === 'mercenary') count = 10;

            // Target pile (Ruins -> supply, Others -> nonSupply)
            const targetPiles = (pileId === 'ruins') ? state.supply : state.nonSupply;

            if (def?.mixedPile) {
                const baseCards = [...def.mixedPile.cards];
                const finalCardIds: string[] = [];
                while (finalCardIds.length < count && baseCards.length > 0) {
                    finalCardIds.push(...baseCards);
                }
                const truncatedIds = finalCardIds.slice(0, count);

                targetPiles[pileId] = {
                    cardId: pileId,
                    count: truncatedIds.length,
                    isMixed: true,
                    cards: truncatedIds.map(id => createCardInstance(id))
                };

                if (def.mixedPile.type === 'SHUFFLED' && targetPiles[pileId].cards) {
                    const stack = targetPiles[pileId].cards!;
                    for (let i = stack.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [stack[i], stack[j]] = [stack[j], stack[i]];
                    }
                }
            } else {
                targetPiles[pileId] = { cardId: pileId, count, cards: [] };
            }
        }

        // Add Platinum and Colony if needed
        const addPC = SupplyGenerator.shouldAddProsperity(kingdomCardIds, this.config.prosperityMode, this.id);

        if (addPC) {
            state.supply['platinum'] = { cardId: 'platinum', count: 12, cards: [] };
            state.supply['colony'] = { cardId: 'colony', count: victoryCount, cards: [] };
        }

        // Alchemy: Potion
        if (SupplyGenerator.needsPotion(kingdomCardIds)) {
            state.supply['potion'] = { cardId: 'potion', count: 16, cards: [] };
        }

        // PREGAME: Waiting for "I am Ready"
        state.phase = 'PREGAME';
        state.turnNumber = 0;
        // Initialize external logs
        GameLogStore.init(state.id);


        for (const playerState of state.players) {
            const roomPlayer = this.players.find(p => p.id === playerState.id);
            if (roomPlayer?.isSpectator) continue;

            // Calculate actual hand composition
            const counts: Record<string, number> = {};
            for (const card of playerState.hand) {
                counts[card.id] = (counts[card.id] || 0) + 1;
            }

            // Sort logic: Copper/Money first, then Heirlooms/Shelters, then Victory
            const sortedIds = Object.keys(counts).sort((a, b) => {
                const priority = (id: string) => {
                    if (id === 'copper') return 1;
                    if (id === 'silver') return 2;
                    if (id === 'gold') return 3;
                    if (id === 'potion') return 4;
                    // Heirlooms (usually Treasures/Actions)
                    if (id === 'estate') return 90;
                    if (id === 'hovel') return 91;
                    if (id === 'necropolis') return 92;
                    if (id === 'overgrown_estate') return 93;
                    return 50; // Everything else (Heirlooms etc)
                };
                return priority(a) - priority(b);
            });

            const parts = sortedIds.map(id => {
                const count = counts[id];
                const def = CardRegistry.get(id);
                const name = def?.name ?? id;
                // Basic French pluralization: add 's' if not ending in s/x/z
                const suffix = (count > 1 && !/[sxz]$/i.test(name)) ? 's' : '';
                return `${count} ${name}${suffix}`;
            });

            let cardsStr = "";
            if (parts.length === 0) cardsStr = "aucune carte";
            else if (parts.length === 1) cardsStr = parts[0];
            else {
                const last = parts.pop();
                cardsStr = `${parts.join(', ')} et ${last}`;
            }

            GameLogStore.addLog(state.id, {
                id: `log_init_pregame_${playerState.id}`,
                timestamp: Date.now(),
                type: 'TEXT',
                message: `${playerState.name} commence avec ${cardsStr} en main.`,
                playerId: playerState.id
            });
        }

        // Plunder: Assign Traits to piles
        SupplyGenerator.assignTraits(state, { seed: this.id });

        return state;
    }

    // ========================================================================
    // Action Processing
    // ========================================================================

    /**
     * Handle a game action from a client
     */
    handleAction(socketId: string, action: GameAction): { success: boolean; error?: string } {
        const playerId = this.getPlayerIdBySocket(socketId);
        if (!playerId) {
            return { success: false, error: 'Player not found in room' };
        }

        if (!this.gameState) {
            return { success: false, error: 'Game not started' };
        }

        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player state not found' };
        }


        // Handle UI-only actions (Selection updates)
        if (action.type === 'UPDATE_SELECTION') {
            player.currentSelection = action.selectedIds || [];
            this.broadcastGameState(); // Broadcast to sync selection
            return { success: true };
        }

        const validation = RulesValidator.validate(this.gameState, playerId, action);
        if (!validation.valid) {
            this.logger.warn('ACTION_INVALID', validation.error || 'Unknown validation error', { playerId: playerId, action });
            return { success: false, error: validation.error };
        }

        // Check invariants before action state change (dev only)
        GameInvariants.check(this.gameState, 'Pre-Action');

        // Resolve
        const previousState = this.gameState;
        const result = ActionResolver.resolve(this.gameState, playerId, action);
        if (!result.success) {
            this.logger.error('ACTION_FAILED', result.error || 'Unknown resolution error', { playerId: playerId, action });
            return { success: false, error: result.error };
        }

        // Store for Undo
        this.previousState = previousState;



        // Update state
        this.gameState = result.state;

        // Recalculate scores using produce to avoid mutating frozen state
        const currentScores = VictoryChecker.getCurrentScores(this.gameState);
        this.gameState = produce(this.gameState, draft => {
            draft.players.forEach(p => {
                const s = currentScores.find(cs => cs.playerId === p.id);
                if (s) p.score = s.score;
            });
        });

        // Check invariants after action state change (dev only)
        GameInvariants.check(this.gameState, 'Post-Action');

        this.handleDisconnectTurn();

        // Broadcast & Timer
        this.broadcastRoomState();
        this.onStateChanged();

        return { success: true };
    }
    // ========================================================================
    // Rewind / Undo
    // ========================================================================

    handleRewindRequest(socketId: string, targetLogId: string): { success: boolean; error?: string } {
        const playerId = this.getPlayerIdBySocket(socketId);
        if (!playerId || !this.isStarted) return { success: false, error: 'Cannot rewind' };

        // 1. Validate target
        const logs = GameLogStore.getLogs(this.gameState.id);
        const logIdx = logs.findIndex(l => l.id === targetLogId);

        if (logIdx === -1) return { success: false, error: 'Checkpoint invalid' };

        // 2. Initialize request
        this.activeRewindRequest = {
            requesterId: playerId,
            targetLogId,
            votes: {},
            startedAt: Date.now()
        };

        // 3. Auto-approve for requester and bots
        this.players.forEach(p => {
            if (p.id === playerId || p.isBot) {
                this.activeRewindRequest!.votes[p.id] = true;
            }
        });

        this.logger.info('GAME', `Rewind requested by ${playerId} to ${targetLogId}`);
        this.broadcastRoomState();

        // 4. Check if already satisfied (e.g. solo game)
        this.checkRewindConsensus();

        return { success: true };
    }

    handleRewindVote(socketId: string, approved: boolean): void {
        const playerId = this.getPlayerIdBySocket(socketId);
        if (!playerId || !this.activeRewindRequest) return;

        this.activeRewindRequest.votes[playerId] = approved;
        this.logger.info('GAME', `Rewind vote from ${playerId}: ${approved}`);

        if (!approved) {
            this.activeRewindRequest = null;
            this.broadcastRoomState();
            return;
        }

        this.checkRewindConsensus();
    }

    private checkRewindConsensus(): void {
        if (!this.activeRewindRequest) return;

        const humanPlayers = this.players.filter(p => !p.isBot && !p.isSpectator);
        const allApproved = humanPlayers.every(p => this.activeRewindRequest!.votes[p.id] === true);

        if (allApproved) {
            this.executeRewind(this.activeRewindRequest.targetLogId);
            this.activeRewindRequest = null;
        } else {
            this.broadcastRoomState();
        }
    }

    private executeRewind(targetLogId: string): void {
        const logs = GameLogStore.getLogs(this.gameState.id);
        const logIdx = logs.findIndex(l => l.id === targetLogId);
        if (logIdx === -1) return;

        // 1. Find nearest snapshot before or at log
        const snapshots = GameLogStore.getSnapshots(this.gameState.id);
        const snapshot = snapshots.find(s => s.logId === targetLogId);

        if (snapshot) {
            const restoredState = JSON.parse(snapshot.state) as GameState;

            // Truncate external logs up to that point
            GameLogStore.truncateLogs(this.gameState.id, logIdx + 1);

            // Truncate snapshots up to that point
            const snapshotIdx = snapshots.findIndex(s => s.logId === targetLogId);
            GameLogStore.truncateSnapshots(this.gameState.id, snapshotIdx + 1);

            this.gameState = restoredState;
            this.logger.info('GAME', `Rewind executed to ${targetLogId} (Restored from snapshot)`);
        } else {
            // If no exact snapshot, we would need to find latest snapshot BEFORE log and replay.
            // But for this first version, let's assume logs with snapshots are the only rewindable points.
            this.logger.error('GAME', `Rewind failed: No snapshot for ${targetLogId}`);
            return;
        }

        this.onStateChanged();
        this.broadcastRoomState();
    }

    handleUndo(socketId: string): { success: boolean; error?: string } {
        const playerId = this.getPlayerIdBySocket(socketId);
        if (!playerId || !this.previousState || !this.isStarted) {
            return { success: false, error: 'Cannot undo' };
        }

        // Basic security: only current player can undo? 
        // Or any player if it was their action?
        // Standard professional flow: current player can undo their own misclick.
        const currentActiveId = this.gameState.pendingDecision?.playerId || this.gameState.players[this.gameState.currentPlayerIndex].id;

        if (currentActiveId !== playerId) {
            // Check if they were the PREVIOUS active player (maybe they ended turn and want to undo)
            const prevActiveId = this.previousState.pendingDecision?.playerId || this.previousState.players[this.previousState.currentPlayerIndex].id;
            if (prevActiveId !== playerId) {
                return { success: false, error: "Only the active player can undo their action." };
            }
        }

        this.logger.info('GAME', `Undo executed by ${playerId}`);
        this.gameState = this.previousState;
        this.previousState = null; // Single-use undo for now

        this.onStateChanged();
        this.broadcastRoomState();

        return { success: true };
    }

    handleGetLogs(socketId: string, fromSequence: number): void {
        if (!this.gameState) return;
        const logs = GameLogStore.getLogs(this.gameState.id);

        // Filter logs starting from sequence
        const missingLogs = logs.filter(l => (l.sequenceNumber ?? -1) >= fromSequence);

        // Send directly to the requesting socket
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.emit('logs_update', { logs: missingLogs });
        }
    }

    protected processBotAction(botId: string, action: GameAction): void {
        if (!this.gameState) return;

        this.logger.logAction(botId, action);

        const validation = RulesValidator.validate(this.gameState, botId, action);
        if (!validation.valid) {
            this.logger.warn('BOT_INVALID_ACTION', validation.error || 'Unknown bot validation error', { botId, action });
            return;
        }

        const result = ActionResolver.resolve(this.gameState, botId, action);
        if (result.success) {
            this.gameState = result.state;

            // Recalculate scores using produce to avoid mutating frozen state
            const currentScores = VictoryChecker.getCurrentScores(this.gameState);
            this.gameState = produce(this.gameState, draft => {
                draft.players.forEach(p => {
                    const s = currentScores.find(cs => cs.playerId === p.id);
                    if (s) p.score = s.score;
                });
            });

            this.onStateChanged();
        } else {
            this.logger.error('BOT_ACTION_FAILED', result.error || 'Unknown bot resolution error', { botId, action });
        }
    }

    /**
     * Schedule bot turn with delay for realism
     */
    protected scheduleBotTurnIfNeeded(): void {
        if (!this.gameState || this.gameState.isGameOver) return;

        // 1. Check for pending decisions (reactions, discards, etc.)
        if (this.gameState.pendingDecision) {
            const decisionId = this.gameState.pendingDecision.id;
            const deciderId = this.gameState.pendingDecision.playerId;
            const roomPlayer = this.players.find(p => p.id === deciderId);

            if (roomPlayer?.isBot) {
                const bot = this.bots.get(deciderId);
                if (bot) {
                    // Reduced delay for pro feel (400-800ms)
                    const delay = Math.random() * 400 + 400;
                    setTimeout(() => {
                        // Re-check game state in case it changed while waiting
                        if (this.gameState?.pendingDecision?.id !== decisionId) return;

                        const action = bot.resolveChoice
                            ? bot.resolveChoice(this.gameState, deciderId)
                            : bot.chooseAction(this.gameState, deciderId);

                        if (action) {
                            this.handleActionByPlayerId(deciderId, action);
                        } else {
                            this.logger.error('BOT_DECISION', `Bot ${bot.name} failed to resolve choice.`);
                            // Force end phase if bot fails to decide
                            this.handleActionByPlayerId(deciderId, { type: 'END_PHASE' });
                        }
                    }, delay);
                }
            }
            // If pending decision is for a human, do nothing here, wait for their input
            return;
        }

        // 2. If no pending decision, check if it's a bot's turn to play
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        if (!currentPlayer) return;

        const roomPlayer = this.players.find(p => p.id === currentPlayer.id);

        // console.log(`[scheduleBotTurnIfNeeded] Player: ${currentPlayer.name} (id: ${currentPlayer.id}), isBot: ${roomPlayer?.isBot}, isConnected: ${roomPlayer?.isConnected}`);

        if (!roomPlayer || !roomPlayer.isBot) return;

        const bot = this.bots.get(currentPlayer.id);
        if (!bot) return;

        const delay = Math.random() * 400 + 400; // 0.4 - 0.8 seconds
        setTimeout(() => {
            // Re-check game state in case it changed while waiting
            const currentPlayerAfterDelay = this.gameState.players[this.gameState.currentPlayerIndex];
            if (!currentPlayerAfterDelay || currentPlayerAfterDelay.id !== currentPlayer.id) return;
            if (this.gameState?.pendingDecision) return; // Wait if a decision popped up

            const action = bot.chooseAction(this.gameState, currentPlayer.id);
            if (action) {
                this.handleActionByPlayerId(currentPlayer.id, action);
            } else {
                this.logger.error('BOT_ACTION', `Bot ${bot.name} failed to resolve action.`);
                // Force end phase if bot fails to act
                this.handleActionByPlayerId(currentPlayer.id, { type: 'END_PHASE' });
            }
        }, delay);
    }

    changeKingdomCards(socketId: string, cards: (string | null)[] | null): void {
        const player = this.getPlayerBySocket(socketId);
        if (!player || !player.isHost || this.isStarted) return;

        if (cards === null) {
            // Server-side randomization for the "Remplir" button
            // We fill the gaps in the CURRENT selection while preserving manual positions
            const currentSelection = this.kingdomCards || Array(10).fill(null);
            const forcedCards = currentSelection.filter((id): id is string => !!id && id !== '');

            // Generate a full potential kingdom using the forced cards
            const generated = SupplyGenerator.generate({
                forceCards: forcedCards,
                count: 10,
                enabledExpansions: this.config.enabledExpansions
            });

            // Map the generated cards back into the EMPTY slots
            const freshCards = generated.filter(id => !forcedCards.includes(id));
            let freshIdx = 0;

            const newSelection = currentSelection.map(slot => {
                if (!slot || slot === '') {
                    return freshCards[freshIdx++] || null;
                }
                return slot;
            });

            this.kingdomCards = newSelection;
            this.logger.info('ROOM', `Host requested random kingdom fill`, {
                original: forcedCards,
                final: this.kingdomCards
            });
        } else {
            this.kingdomCards = cards;
            this.logger.info('ROOM', `Host updated kingdom selection`, { kingdomCards: cards });
        }

        this.broadcastRoomState();
    }

    updateSetup(socketId: string, options: {
        prosperityMode?: 'always' | 'never' | 'random',
        sheltersMode?: 'always' | 'never' | 'random',
        enabledExpansions?: string[],
        landscapeInstructions?: string[]
    }): void {
        const player = this.getPlayerBySocket(socketId);
        if (!player || !player.isHost) return;

        if (options.prosperityMode) this.config.prosperityMode = options.prosperityMode;
        if (options.sheltersMode) this.config.sheltersMode = options.sheltersMode;
        if (options.enabledExpansions) this.config.enabledExpansions = options.enabledExpansions;
        // Allow empty array to mean "no instructions" or "clear instructions"
        if (options.landscapeInstructions !== undefined) {
            this.config.landscapeInstructions = options.landscapeInstructions;
        }

        this.broadcastRoomState();
        this.logger.info('ROOM', `Host updated setup: Prosperity=${this.config.prosperityMode}, Shelters=${this.config.sheltersMode}, Lands=${this.config.landscapeInstructions?.length}`);
    }

    // ========================================================================
    // Broadcasting
    // ========================================================================

    broadcastRoomState = (): void => {
        try {
            if (!this.io) return;

            const roomState = {
                id: this.id,
                players: this.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    color: p.color,
                    isHost: p.isHost,
                    isReady: p.isReady,
                    isConnected: p.isConnected,
                    isBot: p.isBot,
                    isSpectator: p.isSpectator
                })),
                isStarted: this.isStarted,
                canStart: this.canStart(),
                kingdomCards: this.kingdomCards || undefined,
                prosperityMode: this.config.prosperityMode,
                sheltersMode: this.config.sheltersMode,
                enabledExpansions: this.config.enabledExpansions,
                landscapeInstructions: this.config.landscapeInstructions,
            };

            this.io.to(this.id).emit(GameEvents.ROOM_STATE, roomState);
        } catch (err: any) {
            console.error('ERROR in broadcastRoomState:', err.message);
        }
    }

    broadcastGameState(): void {
        if (!this.gameState) return;

        // Send personalized state to each player
        for (const player of this.players) {
            if (!player.isConnected) continue;

            try {
                // Determine whose perspective this player should see
                let targetSerializeId = player.id;
                if (player.isSpectator && player.spectatorFollowId) {
                    targetSerializeId = player.spectatorFollowId;
                }

                // Apply Fog of War view before serialization
                const playerView = GameStateView.createPlayerView(this.gameState, targetSerializeId);

                // Defensive coding: catch serialization errors preventing server crash
                const serialized = StateSerializerV2.serialize(playerView, targetSerializeId);

                // If spectator has "Reveal All" enabled, inject all hands into the payload
                if (player.isSpectator && player.spectatorRevealAll) {
                    // We must serialize the raw unmasked GameState cards, not the playerView (which has masked hands)
                    serialized.spectatorData = this.gameState.players.map(enginePlayer => ({
                        playerId: enginePlayer.id,
                        // @ts-ignore - access private method for serialization
                        hand: enginePlayer.hand.map(c => StateSerializerV2['serializeCard'](c)),
                        // @ts-ignore
                        limbo: enginePlayer.limbo.map(c => StateSerializerV2['serializeCard'](c))
                    }));
                }

                this.io.to(player.socketId).emit(GameEvents.GAME_STATE, serialized);
            } catch (err: any) {
                this.logger.error('SERIALIZATION_CRASH', `Failed to serialize/send state for ${player.name}`, err);
                console.error('CRITICAL SERIALIZATION ERROR:', err);
            }
        }
    }

    // State Management

    isEmpty(): boolean {
        // Room is truly empty if no players are registered (pre-game leave or explicit abandonment)
        return this.players.length === 0;
    }

    isAbandoned(timeoutMs: number): boolean {
        if (this.players.length === 0) return true;
        if (!this.lastAllDisconnectedAt) return false;
        return (Date.now() - this.lastAllDisconnectedAt) > timeoutMs;
    }

    forceEndGame(): void {
        this.logger.info('GAME', 'HOST FORCE ENDED GAME');
        if (this.gameState) {
            this.recordGameResults();
        }
        this.isStarted = false;
        // Broadcast to all
        this.io.to(this.id).emit(GameEvents.GAME_FORCE_ENDED);
    }
}
