/**
 * useSocket - React hook for Socket.IO connection
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SerializedState, PublicGameState, PrivatePlayerState } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

export type ProsperitySetupMode = 'always' | 'never' | 'random';

export interface RoomState {
    id: string;
    players: {
        id: string; // This is now the playerToken (persistent)
        name: string;
        color: string;
        isHost: boolean;
        isReady: boolean;
        isConnected: boolean;
        isBot?: boolean;
        botType?: 'random' | 'greedy';
        isSpectator?: boolean;
        spectatorFollowId?: string;
        spectatorRevealAll?: boolean;
    }[];
    isStarted: boolean;
    canStart: boolean;
    kingdomCards?: (string | null)[];
    prosperityMode: ProsperitySetupMode;
    sheltersMode: ProsperitySetupMode;
    enabledExpansions?: string[];
    landscapeInstructions?: string[];
    activeRewindRequest?: {
        requesterId: string;
        targetLogId: string;
        votes: Record<string, boolean>;
    } | null;
}

// GameState is identical to SerializedState received from server
export interface GameState extends SerializedState { }

export interface SavedGameConfig {
    id: string;
    roomId: string;
    playerNames: string[];
    kingdom: (string | null)[];
    turnNumber: number;
    updatedAt: string;
}

export interface UseSocketReturn {
    // Connection
    isConnected: boolean;
    isReconnecting: boolean;
    playerId: string | null;
    isHost: boolean;

    // Room state
    roomState: RoomState | null;
    isInRoom: boolean;

    // Game state
    gameState: GameState | null;
    isGameStarted: boolean;

    // Saved Games
    savedGames: SavedGameConfig[];

    // Error
    error: string | null;
    clearError: () => void;

    // Actions
    joinRoom: (roomId: string, playerName: string, color: string) => void;
    leaveRoom: (reason?: 'disconnect' | 'leave' | 'surrender') => void;
    toggleReady: () => void;
    startGame: (kingdomCards?: (string | null)[] | null) => void;
    sendAction: (action: any) => void;
    addBot: (botType: 'random' | 'greedy') => void;
    removeBot: (botId: string) => void;
    changeColor: (color: string) => void;
    changeKingdom: (cards: (string | null)[] | null) => void;
    changeSetup: (options: {
        prosperityMode?: ProsperitySetupMode,
        sheltersMode?: ProsperitySetupMode,
        enabledExpansions?: string[],
        landscapeInstructions?: string[]
    }) => void;
    requestRewind: (targetLogId: string) => void;
    voteRewind: (approved: boolean) => void;
    forceEndGame: () => void;
    listSavedGames: () => void;
    resumeGame: (gameId: string) => void;
    configureSpectator: (options: { followId?: string, revealAll?: boolean }) => void;
}

// ============================================================================
// Hook
// ============================================================================

const DEFAULT_SERVER_URL = import.meta.env.VITE_SERVER_URL || '';
const DEFAULT_SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io/';

export function useSocket(serverUrl: string = DEFAULT_SERVER_URL): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null);
    const isLeavingRef = useRef(false); // Track when client is leaving to ignore incoming events
    const [isConnected, setIsConnected] = useState(false);
    const [playerId, setPlayerId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dominion_player_token');
        }
        return null;
    });
    const [isHost, setIsHost] = useState(false);
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [savedGames, setSavedGames] = useState<SavedGameConfig[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Connect on mount
    useEffect(() => {
        const socket = io(serverUrl, {
            path: DEFAULT_SOCKET_PATH,
            transports: ['websocket'],
            autoConnect: true
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socket.on('joined', (data: { roomId: string; playerId: string; isHost: boolean }) => {
            console.log('[Socket] Joined room:', data);
            setPlayerId(data.playerId); // This is now the persistent token
            setIsHost(data.isHost);
        });

        // Handle reconnection success specifically if needed, or just rely on 'joined'
        socket.on('reconnect_success', (data: { roomId: string; playerId: string; isHost: boolean }) => {
            console.log('[Socket] Reconnected successfully:', data);
            setPlayerId(data.playerId);
            setIsHost(data.isHost);
        });

        socket.on('join_error', (data: { error: string }) => {
            setError(data.error);
        });

        socket.on('saved_games_list', (data: { games: SavedGameConfig[] }) => {
            setSavedGames(data.games);
        });

        socket.on('room_state', (state: RoomState) => {
            // Ignore room_state events if we're in the process of leaving
            if (isLeavingRef.current) {
                console.log('[Socket] Ignoring room_state - client is leaving');
                return;
            }
            console.log('[Socket] Room state:', state);
            setRoomState(state);
        });

        socket.on('game_state', (state: SerializedState) => {
            // Ignore game_state events if we're in the process of leaving
            if (isLeavingRef.current) {
                console.log('[Socket] Ignoring game_state - client is leaving');
                return;
            }
            // console.log('[Socket] Game state update'); // Too verbose
            setGameState(state);
            if (state.private) {
                console.debug('[Socket] Received PRIVATE game state (hand size:', state.private.hand.length, ')');
            } else {
                console.debug('[Socket] Received PUBLIC ONLY game state');
            }
        });

        socket.on('game_started', () => {
            console.log('[Socket] Game started');
        });

        socket.on('action_error', (data: { error: string }) => {
            console.log('[Socket] Action error:', data.error);
            setError(data.error);
        });

        socket.on('room_closed', (data: { reason: string }) => {
            console.log('[Socket] Room closed:', data.reason);
            setRoomState(null);
            setGameState(null);
            setIsHost(false);
            sessionStorage.removeItem('dominion_current_room');
            setError('L\'hôte a quitté la partie. Retour au lobby.');
        });

        socket.on('game_force_ended', () => {
            console.log('[Socket] Game force ended by host');
            // Force full reset to ensure redirection to main screen
            setRoomState(null);
            setGameState(null);
            setIsHost(false);
            sessionStorage.removeItem('dominion_current_room');
            setError('L\'hôte a mis fin à la partie.');
        });

        return () => {
            socket.disconnect();
        };
    }, [serverUrl]);

    // Auto-clear error after 2 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [error]);



    // Helper to get/create persistent token
    const getOrCreatePlayerToken = useCallback(() => {
        let token = localStorage.getItem('dominion_player_token');
        if (!token) {
            token = `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('dominion_player_token', token);
        }
        return token;
    }, []);

    // Actions
    const joinRoom = useCallback((roomId: string, playerName: string, color: string) => {
        const token = getOrCreatePlayerToken();

        // Clear leaving flag to allow receiving events
        isLeavingRef.current = false;

        // Persist session
        sessionStorage.setItem('dominion_current_room', roomId);
        sessionStorage.setItem('dominion_player_name', playerName);
        sessionStorage.setItem('dominion_player_color', color);

        socketRef.current?.emit('join_room', {
            roomId,
            playerName,
            color,
            playerToken: token // Send persistent token
        });

        // Diagnostic: log join intent
        console.debug(`[Socket] Attempting to join room ${roomId} as ${playerName} (Token: ${token})`);
    }, [getOrCreatePlayerToken]);

    // Auto-rejoin on connect/mount
    useEffect(() => {
        const savedRoomId = sessionStorage.getItem('dominion_current_room');
        const savedName = sessionStorage.getItem('dominion_player_name');
        const savedColor = sessionStorage.getItem('dominion_player_color');

        if (savedRoomId && savedName && isConnected && !roomState) {
            console.log('[Socket] Auto-rejoining room:', savedRoomId);
            joinRoom(savedRoomId, savedName, savedColor || '#fff');
        }
    }, [isConnected, joinRoom, roomState]);

    const leaveRoom = useCallback((reason?: 'disconnect' | 'leave' | 'surrender') => {
        // Set leaving flag BEFORE emitting to prevent race condition
        isLeavingRef.current = true;

        socketRef.current?.emit('leave_room', { reason });

        // Clear session on explicit leave
        if (reason !== 'disconnect') {
            sessionStorage.removeItem('dominion_current_room');
        }

        setRoomState(null);
        setGameState(null);
        setPlayerId(null);
        setIsHost(false);
    }, []);

    const toggleReady = useCallback(() => {
        socketRef.current?.emit('toggle_ready');
    }, []);

    const startGame = useCallback((kingdomCards?: (string | null)[] | null) => {
        console.log('[Socket] Emitting start_game', { kingdomCards });
        socketRef.current?.emit('start_game', { kingdomCards });
    }, []);

    const sendAction = useCallback((action: any) => {
        console.log('[Socket] Sending action:', action?.type, action);

        // DEBUG: Check for circular references before emitting
        try {
            JSON.stringify(action);
        } catch (e) {
            console.error('[Socket] CRITICAL: Attempting to send CIRCULAR action!', e);
            console.error('Payload keys:', Object.keys(action));
            if (action.payload) console.error('Inner payload keys:', Object.keys(action.payload));
            return; // Prevent crash
        }

        socketRef.current?.emit('game_action', action);
    }, []);

    const addBot = useCallback((botType: 'random' | 'greedy') => {
        socketRef.current?.emit('add_bot', { botType });
    }, []);

    const removeBot = useCallback((botId: string) => {
        socketRef.current?.emit('remove_bot', { botId });
    }, []);

    const changeColor = useCallback((color: string) => {
        socketRef.current?.emit('change_color', { color });
    }, []);

    const changeKingdom = useCallback((cards: (string | null)[] | null) => {
        socketRef.current?.emit('change_kingdom', { kingdomCards: cards });
    }, []);

    const changeSetup = useCallback((options: {
        prosperityMode?: ProsperitySetupMode,
        sheltersMode?: ProsperitySetupMode,
        enabledExpansions?: string[],
        landscapeInstructions?: string[]
    }) => {
        socketRef.current?.emit('change_setup', options);
    }, []);

    const requestRewind = useCallback((targetLogId: string) => {
        socketRef.current?.emit('request_rewind', { targetLogId });
    }, []);

    const voteRewind = useCallback((approved: boolean) => {
        socketRef.current?.emit('vote_rewind', { approved });
    }, []);

    const forceEndGame = useCallback(() => {
        socketRef.current?.emit('host_force_end_game');
    }, []);

    const listSavedGames = useCallback(() => {
        const token = localStorage.getItem('dominion_player_token');
        socketRef.current?.emit('list_saved_games', { playerToken: token });
    }, []);

    const resumeGame = useCallback((gameId: string) => {
        socketRef.current?.emit('resume_game', { gameId });
    }, []);

    const configureSpectator = useCallback((options: { followId?: string, revealAll?: boolean }) => {
        socketRef.current?.emit('spectator_config', options);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isConnected,
        isReconnecting: !isConnected && !!sessionStorage.getItem('dominion_current_room'),
        playerId,
        isHost,
        roomState,
        isInRoom: roomState !== null,
        gameState,
        isGameStarted: roomState?.isStarted ?? false,
        savedGames,
        error,
        clearError,
        joinRoom,
        leaveRoom,
        toggleReady,
        startGame,
        sendAction,
        addBot,
        removeBot,
        changeColor,
        changeKingdom,
        changeSetup,
        requestRewind,
        voteRewind,
        forceEndGame,
        listSavedGames,
        resumeGame,
        configureSpectator
    };
}
