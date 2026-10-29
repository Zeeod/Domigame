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
import { Logger } from '../shared/engine/Logger.js';
import { HISTORICAL_PERSONAS } from '../shared/data/historicalPersonas.js';
import { applyKingdomRules, applyKingdomSetup } from '../shared/engine/KingdomRules.js';
import { actingPlayerFor } from '../shared/engine/Possession.js';
import { autoPayload, forcedPayload } from '../shared/bot/AutoDecision.js';
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
    /** When the player lost their connection (cleared when they come back) */
    disconnectedAt?: number;
}

interface RewindRequest {
    requesterId: string;
    targetLogId: string;
    /** The log line clicked: the game goes back to just before the move that wrote it */
    targetMessage: string;
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
    /** Delay before a disconnected player's decisions and turns are played automatically (default 30s) */
    disconnectGraceMs?: number;
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
    turnTimeoutMs: 0 // no timer unless the host sets one in the lobby
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

                // The game goes on without them: after a grace period (time to refresh the page) their
                // decisions are answered and their turns passed automatically; at once if they left.
                player.disconnectedAt = Date.now();
                if (this.gameState) {
                    if (reason === 'disconnect') {
                        this.logger.info('GAME', `${player.name} disconnected. Autopilot in ${this.graceMs() / 1000}s if not back.`);
                        setTimeout(() => this.scheduleBotTurnIfNeeded(), this.graceMs() + 50);
                    } else {
                        this.scheduleBotTurnIfNeeded();
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

    private graceMs(): number {
        return this.config.disconnectGraceMs ?? 30000;
    }

    /**
     * A human player whose decisions and turns are played automatically: they left / surrendered,
     * or have been disconnected longer than the grace period. Only while someone is still playing
     * (if every human is gone, the game waits for them).
     */
    private isAutoPiloted(p?: RoomPlayer): boolean {
        if (!p || p.isBot) return false;
        const away = p.hasSurrendered || (!p.isConnected && p.disconnectedAt !== undefined && Date.now() - p.disconnectedAt >= this.graceMs());
        if (!away) return false;
        return this.players.some(x => !x.isBot && !x.isSpectator && x.isConnected && !x.hasSurrendered);
    }

    private autopilotBots = new Map<string, BotInterface>();

    /**
     * Answer the pending decision for `deciderId` (seat `seatId`): the bot's answer if it is valid,
     * otherwise the most neutral one (minimum cards / first option). Returns false if nothing worked.
     */
    private autoAnswerDecision(deciderId: string, seatId: string, bot?: BotInterface): boolean {
        const d = this.gameState?.pendingDecision;
        if (!d) return false;
        const answers: GameAction[] = [];
        try {
            const b = bot ?? this.autopilotBots.get(deciderId) ?? createBot('greedy');
            if (!bot) this.autopilotBots.set(deciderId, b);
            const a = b.resolveChoice ? b.resolveChoice(this.gameState, seatId) : b.chooseAction(this.gameState, seatId);
            if (a) answers.push(a);
        } catch (e) {
            this.logger.error('AUTO_DECISION', `Bot answer failed: ${e}`);
        }
        answers.push({ type: 'CHOOSE', choiceId: d.id, payload: autoPayload(this.gameState, 'first') } as any);
        for (const a of answers) if (this.handleActionByPlayerId(deciderId, a)) return true;
        this.logger.error('AUTO_DECISION', `No valid automatic answer for decision ${d.type}/${(d as any).context?.specialAction ?? '-'}`);
        return false;
    }

    reconnectPlayer(socket: Socket, playerId: string): RoomPlayer | null {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return null;

        player.socketId = socket.id;
        player.isConnected = true;
        player.disconnectedAt = undefined; // back in control (unless they surrendered)
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
            // Answer it for them, whatever its kind (cards, options, Supply…)
            this.autoAnswerDecision(actingPlayerFor(this.gameState, activeId), activeId);
        } else {
            // Force end phase
            this.handleActionByPlayerId(activeId, { type: 'END_PHASE' });
        }
    }

    /**
     * Helper to bypass socketId requirement for internal actions
     */
    private handleActionByPlayerId(playerId: string, action: GameAction): boolean {
        try {
            return this.handleActionByPlayerIdUnsafe(playerId, action);
        } catch (e: any) {
            this.logger.error('AUTO_ACTION_CRASH', `${action?.type}: ${e?.stack || e}`);
            return false;
        }
    }

    private handleActionByPlayerIdUnsafe(playerId: string, action: GameAction): boolean {
        // Same checks as a player's action
        const validation = RulesValidator.validate(this.gameState, playerId, action);
        if (!validation.valid) {
            this.logger.warn('AUTO_ACTION', `Refused ${action.type} for ${playerId}: ${validation.error}`);
            return false;
        }
        const before = this.gameState;
        const logsBefore = GameLogStore.getLogs(before.id).length;
        const result = ActionResolver.resolve(this.gameState, playerId, action);
        if (result.success) {
            this.addCheckpoint(before, logsBefore);
            this.gameState = produce(result.state, draft => {
                // Recalculate scores safely within produce
                const currentScores = VictoryChecker.getCurrentScores(draft as any as GameState);
                draft.players.forEach(p => {
                    const s = currentScores.find(cs => cs.playerId === p.id);
                    if (s) p.score = s.score;
                });
            });

            this.onStateChanged();
            return true;
        }
        this.logger.warn('AUTO_ACTION', `Failed ${action.type} for ${playerId}: ${result.error}`);
        return false;
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
        applyKingdomRules(state);
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
                // Victory Kingdom piles use as many cards as the basic Victory piles
                const count = def?.types.includes('VICTORY') ? victoryCount : 10;
                state.supply[cardId] = { cardId, count, cards: [] };
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
            // Ruins: 10 per player after the first (like Curses)
            if (pileId === 'ruins') count = Math.max(10, (numPlayers - 1) * 10);
            else if (pileId === 'spoils') count = 15;
            else if (pileId === 'madman' || pileId === 'mercenary') count = 10;

            // Target pile (Ruins -> supply, Others -> nonSupply)
            const targetPiles = (pileId === 'ruins') ? state.supply : state.nonSupply;

            if (def?.mixedPile) {
                const baseCards = [...def.mixedPile.cards];
                let finalCardIds: string[] = [];
                if (def.mixedPile.type === 'SHUFFLED') {
                    // e.g. Ruins: 10 copies of each kind shuffled together, then deal `count`
                    for (const id of baseCards) for (let i = 0; i < 10; i++) finalCardIds.push(id);
                    for (let i = finalCardIds.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [finalCardIds[i], finalCardIds[j]] = [finalCardIds[j], finalCardIds[i]];
                    }
                } else {
                    while (finalCardIds.length < count && baseCards.length > 0) {
                        finalCardIds.push(...baseCards);
                    }
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

        // Ferryman, Joust, Baker…
        applyKingdomSetup(state);

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

        // Promo — Black Market: its own deck of one copy each of 25 Kingdom cards not in the Supply
        if (state.supply['black_market']) {
            state.blackMarketDeck = SupplyGenerator.buildBlackMarketDeck(Object.keys(state.supply), 25)
                .map(id => createCardInstance(id));
            state.blackMarketRevealed = [];
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
                message: `${playerState.name} commence avec ${cardsStr}.`,
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
        // One bad action (malformed payload, engine bug) must never take the whole server down
        try {
            return this.handleActionUnsafe(socketId, action);
        } catch (e: any) {
            this.logger.error('ACTION_CRASH', `${action?.type}: ${e?.stack || e}`);
            return { success: false, error: 'Action impossible (erreur interne)' };
        }
    }

    private handleActionUnsafe(socketId: string, action: GameAction): { success: boolean; error?: string } {
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
        const logsBefore = GameLogStore.getLogs(this.gameState.id).length;
        const result = ActionResolver.resolve(this.gameState, playerId, action);
        if (!result.success) {
            this.logger.error('ACTION_FAILED', result.error || 'Unknown resolution error', { playerId: playerId, action });
            return { success: false, error: result.error };
        }

        // Store for Undo, and as a point the players can go back to
        this.previousState = previousState;
        this.addCheckpoint(previousState, logsBefore);



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

        // Broadcast & Timer (onStateChanged also plays for bots and absent players)
        this.broadcastRoomState();
        this.onStateChanged();

        return { success: true };
    }
    // ========================================================================
    // Rewind / Undo
    // ========================================================================

    /**
     * States before each move (shared with later states by Immer, so cheap to keep) and how many
     * log lines existed then. Going back to a log line restores the state before the move that wrote it.
     */
    private checkpoints: { logCount: number; state: GameState }[] = [];
    private static readonly MAX_CHECKPOINTS = 600;

    private addCheckpoint(state: GameState, logCount: number): void {
        if (!state || state.phase === 'PREGAME') return;
        this.checkpoints.push({ logCount, state });
        if (this.checkpoints.length > GameRoomV2.MAX_CHECKPOINTS) this.checkpoints.shift();
    }

    /** Index of the checkpoint to restore to undo the move that wrote this log line (-1: too old or unknown) */
    private checkpointForLog(targetLogId: string): number {
        if (!this.gameState) return -1;
        const logIdx = GameLogStore.getLogs(this.gameState.id).findIndex(l => l.id === targetLogId);
        if (logIdx === -1) return -1;
        for (let i = this.checkpoints.length - 1; i >= 0; i--) {
            if (this.checkpoints[i].logCount <= logIdx) return i;
        }
        return -1;
    }

    /** Players whose agreement is needed: connected humans (bots and absent players agree) */
    private rewindVoters(): RoomPlayer[] {
        return this.players.filter(p => !p.isBot && !p.isSpectator && p.isConnected && !this.isAutoPiloted(p));
    }

    handleRewindRequest(socketId: string, targetLogId: string): { success: boolean; error?: string } {
        const playerId = this.getPlayerIdBySocket(socketId);
        if (!playerId || !this.isStarted || !this.gameState) return { success: false, error: "Retour en arrière impossible." };
        if (this.gameState.isGameOver) return { success: false, error: "La partie est terminée." };
        if (this.activeRewindRequest) return { success: false, error: "Une demande de retour en arrière est déjà en cours." };
        if (this.players.find(p => p.id === playerId)?.isSpectator) return { success: false, error: "Les spectateurs ne peuvent pas revenir en arrière." };

        const target = GameLogStore.getLogs(this.gameState.id).find(l => l.id === targetLogId);
        if (!target) return { success: false, error: "Ligne du journal introuvable." };
        if (this.checkpointForLog(targetLogId) === -1) return { success: false, error: "Ce coup est trop ancien pour revenir avant." };

        this.activeRewindRequest = {
            requesterId: playerId,
            targetLogId,
            targetMessage: target.message || (target.payload as any)?.text || '',
            votes: { [playerId]: true },
            startedAt: Date.now()
        };
        this.logger.info('GAME', `Rewind requested by ${playerId} to before ${targetLogId}`);
        this.checkRewindConsensus();
        return { success: true };
    }

    handleRewindVote(socketId: string, approved: boolean): void {
        const playerId = this.getPlayerIdBySocket(socketId);
        if (!playerId || !this.activeRewindRequest) return;
        this.activeRewindRequest.votes[playerId] = approved;
        this.logger.info('GAME', `Rewind vote from ${playerId}: ${approved}`);
        if (!approved) {
            // Refused, or cancelled by the player who asked
            this.activeRewindRequest = null;
            this.broadcastRoomState();
            return;
        }
        this.checkRewindConsensus();
    }

    private checkRewindConsensus(): void {
        const req = this.activeRewindRequest;
        if (!req) return;
        if (this.rewindVoters().every(p => req.votes[p.id] === true)) {
            this.activeRewindRequest = null;
            this.executeRewind(req.targetLogId, req.requesterId);
        } else {
            this.broadcastRoomState();
        }
    }

    /** Back to just before the move that wrote this log line. */
    private executeRewind(targetLogId: string, requesterId?: string): boolean {
        const cpIdx = this.checkpointForLog(targetLogId);
        if (cpIdx === -1) {
            this.logger.error('GAME', `Rewind failed: no state before ${targetLogId}`);
            this.broadcastRoomState();
            return false;
        }
        const target = GameLogStore.getLogs(this.gameState.id).find(l => l.id === targetLogId);
        const cp = this.checkpoints[cpIdx];
        GameLogStore.truncateLogs(this.gameState.id, cp.logCount);
        this.checkpoints = this.checkpoints.slice(0, cpIdx);
        this.previousState = null;
        this.forcedTried.clear();
        const who = this.players.find(p => p.id === requesterId)?.name;
        const what = target?.message || (target?.payload as any)?.text || '';
        this.gameState = produce(cp.state, draft => {
            Logger.log(draft as any, `⏪ Retour en arrière${who ? ` demandé par ${who}` : ''}, avant : ${what}`, null);
        });
        this.logger.info('GAME', `Rewind executed to before ${targetLogId}`);
        this.onStateChanged();
        return true;
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

        // 1. A pending decision (reaction, discard…) for a bot, or for a player who is away
        if (this.gameState.pendingDecision) {
            const decisionId = this.gameState.pendingDecision.id;
            // The seat the decision is for, and who answers it (Possession: the controller)
            const seatId = this.gameState.pendingDecision.playerId;
            const deciderId = actingPlayerFor(this.gameState, seatId);
            const roomPlayer = this.players.find(p => p.id === deciderId);
            const bot = roomPlayer?.isBot ? this.bots.get(deciderId) : undefined;
            if (!bot && !this.isAutoPiloted(roomPlayer)) {
                this.answerForcedDecision(decisionId, deciderId);
                return; // otherwise wait for the player
            }

            const delay = Math.random() * 400 + 400;
            setTimeout(() => {
                // Re-check: the decision may be answered, or the player back
                if (this.gameState?.pendingDecision?.id !== decisionId) return;
                if (!bot && !this.isAutoPiloted(this.players.find(p => p.id === deciderId))) return;
                if (!this.autoAnswerDecision(deciderId, seatId, bot)) {
                    this.logger.error('BOT_DECISION', `No valid answer for ${roomPlayer?.name}'s decision.`);
                }
            }, delay);
            return;
        }

        // 2. No pending decision: a bot's turn, or the turn of a player who is away (passed)
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        if (!currentPlayer) return;

        const actorId = actingPlayerFor(this.gameState, currentPlayer.id);
        const roomPlayer = this.players.find(p => p.id === actorId);
        const bot = roomPlayer?.isBot ? this.bots.get(actorId) : undefined;
        if (!bot && !this.isAutoPiloted(roomPlayer)) return;

        const turn = this.gameState.turnNumber;
        const delay = Math.random() * 400 + 400; // 0.4 - 0.8 seconds
        setTimeout(() => {
            // Re-check game state in case it changed while waiting
            const currentPlayerAfterDelay = this.gameState.players[this.gameState.currentPlayerIndex];
            if (!currentPlayerAfterDelay || currentPlayerAfterDelay.id !== currentPlayer.id || this.gameState.turnNumber !== turn) return;
            if (this.gameState?.pendingDecision || this.gameState.isGameOver) return; // Wait if a decision popped up

            if (bot) {
                const action = bot.chooseAction(this.gameState, currentPlayer.id);
                if (action && this.handleActionByPlayerId(actorId, action)) return;
                this.logger.error('BOT_ACTION', `Bot ${bot.name} failed to act: ending its phase.`);
            } else if (!this.isAutoPiloted(this.players.find(p => p.id === actorId))) {
                return; // they came back
            }
            // A player who is away passes their turn: phases end one after another
            this.handleActionByPlayerId(actorId, { type: 'END_PHASE' });
        }, delay);
    }

    /** Decisions already tried automatically (a refused answer is not retried) */
    private forcedTried = new Set<string>();

    /**
     * A decision with a single possible answer is answered for the player after a short pause,
     * so they see it happen without having to click.
     */
    private answerForcedDecision(decisionId: string, deciderId: string): void {
        if (this.forcedTried.has(decisionId)) return;
        let payload: any;
        try { payload = forcedPayload(this.gameState); } catch { payload = null; }
        if (!payload) return;
        this.forcedTried.add(decisionId);
        if (this.forcedTried.size > 500) this.forcedTried.clear();
        setTimeout(() => {
            if (this.gameState?.pendingDecision?.id !== decisionId) return; // already answered
            this.handleActionByPlayerId(deciderId, { type: 'CHOOSE', choiceId: decisionId, payload } as any);
        }, this.forcedDecisionDelayMs);
    }

    /** Pause before answering a forced decision (tests set it to 0) */
    forcedDecisionDelayMs = 600;

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
        landscapeInstructions?: string[],
        turnTimeoutMs?: number
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
        if (typeof options.turnTimeoutMs === "number" && Number.isFinite(options.turnTimeoutMs)) {
            // 0 = no timer; otherwise between 30 s and 10 min
            const ms = Math.round(options.turnTimeoutMs);
            this.config.turnTimeoutMs = ms <= 0 ? 0 : Math.min(600000, Math.max(30000, ms));
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
                turnTimeoutMs: this.config.turnTimeoutMs || 0,
                activeRewindRequest: this.activeRewindRequest ? {
                    requesterId: this.activeRewindRequest.requesterId,
                    targetLogId: this.activeRewindRequest.targetLogId,
                    targetLogEntry: { message: this.activeRewindRequest.targetMessage },
                    votes: this.activeRewindRequest.votes,
                    voterIds: this.rewindVoters().map(p => p.id),
                } : null,
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
