import { io, Socket } from 'socket.io-client';
import { Intent, SerializedState } from '../../shared/types';

export interface ServerToClientEvents {
    'roomCreated': (data: { roomId: string, roomName: string }) => void;
    'roomJoined': (data: { roomId: string, roomName: string }) => void;
    'stateUpdate': (state: SerializedState) => void;
    'errorMessage': (msg: string) => void;
    'rejoinFailed': (data: { reason: string }) => void;
    'roomClosed': (data: { reason: string }) => void;
    'logMessage': (data: { text: string, playerId: string | null, replaceLast?: boolean }) => void;
    'gameStartSequence': () => void;
    'revealCards': (data: { playerName: string, cardIds: string[] }) => void;
}

export interface ClientToServerEvents {
    'createRoom': (data: { playerName: string, sessionId?: string }) => void;
    'joinRoom': (data: { roomId: string, playerName: string, sessionId?: string }) => void;
    'rejoinRoom': (data: { sessionId: string }) => void;
    'startGame': () => void;
    'addBot': () => void;
    'intent': (intent: Intent) => void;
}

export interface NetworkCallbacks {
    onRoomCreated: (roomId: string, roomName: string) => void;
    onRoomJoined: (roomId: string, roomName: string) => void;
    onStateUpdate: (state: SerializedState) => void;
    onError: (msg: string) => void;
    onRejoinFailed?: (reason: string) => void;
    onReconnecting?: (attempt: number, maxAttempts: number) => void;
    onReconnected?: () => void;
    onDisconnected?: () => void;
    onRoomClosed?: (reason: string) => void;
    onLogMessage?: (text: string, playerId: string | null, replaceLast?: boolean) => void;
    onGameStartSequence?: () => void;
    onRevealCards?: (playerName: string, cardIds: string[]) => void;
}

const SESSION_KEY = 'dominion_session';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface SessionData {
    sessionId: string;
    roomId: string;
    playerName: string;
    timestamp: number; // For expiration check
}

export class NetworkManager {
    public socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    private roomId: string | null = null;
    private callbacks: NetworkCallbacks;
    private sessionId: string;
    private reconnectAttempts: number = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private isReconnecting: boolean = false;

    constructor(callbacks: NetworkCallbacks) {
        console.log('[NETWORK] Connecting to 127.0.0.1:3005');
        this.socket = io('http://127.0.0.1:3005', {
            reconnection: false, // We handle reconnection ourselves
            timeout: 10000
        });
        this.callbacks = callbacks;
        this.sessionId = this.getOrCreateSessionId();
        this.setupListeners();
    }

    /**
     * Generate or retrieve existing session ID
     */
    private getOrCreateSessionId(): string {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            try {
                const data: SessionData = JSON.parse(saved);
                // Check if session has expired
                if (Date.now() - data.timestamp < SESSION_EXPIRY_MS) {
                    return data.sessionId;
                } else {
                    console.log('[NETWORK] Session expired, creating new one');
                    localStorage.removeItem(SESSION_KEY);
                }
            } catch {
                // Invalid data, create new
            }
        }
        return crypto.randomUUID();
    }

    /**
     * Save session to localStorage with timestamp
     */
    private saveSession(roomId: string, playerName: string) {
        const data: SessionData = {
            sessionId: this.sessionId,
            roomId,
            playerName,
            timestamp: Date.now()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    }

    /**
     * Update session timestamp to keep it alive
     */
    private refreshSessionTimestamp() {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            try {
                const data: SessionData = JSON.parse(saved);
                data.timestamp = Date.now();
                localStorage.setItem(SESSION_KEY, JSON.stringify(data));
            } catch {
                // Ignore
            }
        }
    }

    /**
     * Clear session from localStorage
     */
    public clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    /**
     * Get saved session data if exists and not expired
     */
    public getSavedSession(): SessionData | null {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            try {
                const data: SessionData = JSON.parse(saved);
                // Check expiration
                if (Date.now() - data.timestamp < SESSION_EXPIRY_MS) {
                    return data;
                } else {
                    console.log('[NETWORK] Saved session expired');
                    localStorage.removeItem(SESSION_KEY);
                }
            } catch {
                return null;
            }
        }
        return null;
    }

    /**
     * Check if there's an active session to rejoin
     */
    public hasActiveSession(): boolean {
        return this.getSavedSession() !== null;
    }

    private setupListeners() {
        this.socket.on('connect', () => {
            console.log('[NETWORK] Connected:', this.socket.id);

            // If we were reconnecting, notify success
            if (this.isReconnecting) {
                this.isReconnecting = false;
                this.reconnectAttempts = 0;
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
                if (this.callbacks.onReconnected) {
                    this.callbacks.onReconnected();
                }
            }

            // Auto-attempt rejoin if we have a valid saved session
            const saved = this.getSavedSession();
            if (saved && saved.sessionId) {
                console.log('[NETWORK] Attempting to rejoin with session:', saved.sessionId);
                this.rejoinRoom(saved.sessionId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('[NETWORK] Disconnected');
            if (this.callbacks.onDisconnected) {
                this.callbacks.onDisconnected();
            }
            // Start reconnection attempts
            this.startReconnection();
        });

        this.socket.on('roomCreated', (data) => {
            this.roomId = data.roomId;
            this.callbacks.onRoomCreated(data.roomId, data.roomName);
        });

        this.socket.on('roomJoined', (data) => {
            this.roomId = data.roomId;
            this.refreshSessionTimestamp(); // Keep session alive on rejoin
            this.callbacks.onRoomJoined(data.roomId, data.roomName);
        });

        this.socket.on('stateUpdate', (state) => {
            this.refreshSessionTimestamp(); // Keep session alive on activity
            this.callbacks.onStateUpdate(state);
        });

        this.socket.on('errorMessage', (msg) => {
            this.callbacks.onError(msg);
        });

        this.socket.on('rejoinFailed', (data) => {
            console.log('[NETWORK] Rejoin failed:', data.reason);
            this.clearSession();
            if (this.callbacks.onRejoinFailed) {
                this.callbacks.onRejoinFailed(data.reason);
            }
        });

        this.socket.on('roomClosed', (data) => {
            console.log('[NETWORK] Room closed:', data.reason);
            this.clearSession();
            if (this.callbacks.onRoomClosed) {
                this.callbacks.onRoomClosed(data.reason);
            }
        });

        this.socket.on('logMessage', (data) => {
            console.log('[NETWORK] Log message:', data.text);
            if (this.callbacks.onLogMessage) {
                this.callbacks.onLogMessage(data.text, data.playerId);
            }
        });

        this.socket.on('gameStartSequence', () => {
            console.log('[NETWORK] Received gameStartSequence');
            if (this.callbacks.onGameStartSequence) {
                this.callbacks.onGameStartSequence();
            }
        });

        this.socket.on('revealCards', (data) => {
            console.log('[NETWORK] Received revealCards:', data.playerName, data.cardIds);
            if (this.callbacks.onRevealCards) {
                this.callbacks.onRevealCards(data.playerName, data.cardIds);
            }
        });
    }

    /**
     * Start automatic reconnection with exponential backoff
     */
    private startReconnection() {
        if (this.isReconnecting) return;

        // Only try to reconnect if we have an active session
        const session = this.getSavedSession();
        if (!session) {
            console.log('[NETWORK] No session to reconnect, skipping auto-reconnect');
            return;
        }

        this.isReconnecting = true;
        this.attemptReconnect();
    }

    /**
     * Attempt a single reconnection with backoff
     */
    private attemptReconnect() {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('[NETWORK] Max reconnection attempts reached');
            this.isReconnecting = false;
            if (this.callbacks.onRejoinFailed) {
                this.callbacks.onRejoinFailed('Connection lost - unable to reconnect');
            }
            return;
        }

        this.reconnectAttempts++;
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[NETWORK] Reconnection attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

        if (this.callbacks.onReconnecting) {
            this.callbacks.onReconnecting(this.reconnectAttempts, MAX_RECONNECT_ATTEMPTS);
        }

        this.reconnectTimer = setTimeout(() => {
            if (this.socket.connected) {
                console.log('[NETWORK] Already connected, skipping reconnect');
                return;
            }

            console.log('[NETWORK] Attempting socket reconnect...');
            this.socket.connect();

            // If still not connected after timeout, try again
            setTimeout(() => {
                if (!this.socket.connected && this.isReconnecting) {
                    this.attemptReconnect();
                }
            }, 3000);
        }, delay);
    }

    /**
     * Manually trigger reconnection attempt
     */
    public manualReconnect() {
        this.reconnectAttempts = 0;
        this.startReconnection();
    }

    public createRoom(playerName: string) {
        this.socket.emit('createRoom', { playerName, sessionId: this.sessionId });
        // Save session after room is created (in callback)
        const originalCallback = this.callbacks.onRoomCreated;
        this.callbacks.onRoomCreated = (roomId, roomName) => {
            this.saveSession(roomId, playerName);
            originalCallback(roomId, roomName);
            this.callbacks.onRoomCreated = originalCallback;
        };
    }

    public joinRoom(roomId: string, playerName: string) {
        this.socket.emit('joinRoom', { roomId, playerName, sessionId: this.sessionId });
        // Save session after join
        const originalCallback = this.callbacks.onRoomJoined;
        this.callbacks.onRoomJoined = (rId, roomName) => {
            this.saveSession(rId, playerName);
            originalCallback(rId, roomName);
            this.callbacks.onRoomJoined = originalCallback;
        };
    }

    public rejoinRoom(sessionId: string) {
        this.socket.emit('rejoinRoom', { sessionId });
    }

    public startGame() {
        this.socket.emit('startGame');
    }

    public addBot() {
        this.socket.emit('addBot');
    }

    public sendIntent(type: string, payload: any = {}) {
        this.socket.emit('intent', { type, payload });
    }

    public getRoomId() {
        return this.roomId;
    }

    public getSessionId() {
        return this.sessionId;
    }

    public isConnected(): boolean {
        return this.socket.connected;
    }
}
