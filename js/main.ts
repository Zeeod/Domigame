import { UIManager } from './ui/UIManager';
import { GameView } from './GameView';
import { NetworkManager } from './network/NetworkManager';
import { SerializedState } from '../shared/types';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[MAIN] DOMContentLoaded triggered');
    const ui = new UIManager();
    const gameView = new GameView();
    let network: NetworkManager | null = null;

    function initNetwork() {
        console.log('[MAIN] Initializing network...');
        if (network) return;

        network = new NetworkManager({
            onRoomCreated: (roomId, roomName) => {
                ui.showLobby(roomName, roomId);
            },
            onRoomJoined: (roomId, roomName) => {
                ui.showLobby(roomName, roomId);
            },
            onStateUpdate: (state: SerializedState) => {
                console.log('[MAIN] Received stateUpdate:', state);
                updateGameState(state);
            },
            onError: (msg: string) => {
                ui.showError(msg);
            },
            onRoomClosed: (reason: string) => {
                console.log('[MAIN] Room closed handled:', reason);
                ui.resetToMainMenu(reason);
            },
            onLogMessage: (text: string, playerId: string | null, replaceLast?: boolean) => {
                // Find player to apply correct color
                let playerObj: any = null;
                if (playerId) {
                    const localId = network?.socket.id;
                    const p = gameView.players.find((pl: any) => pl.id === playerId || pl.socketId === playerId);
                    if (p) {
                        playerObj = {
                            name: p.name,
                            color: p.color,
                            isLocal: (p.id === localId || p.socketId === localId)
                        };
                    }
                }
                ui.log(text, playerObj, replaceLast);
            },
            onGameStartSequence: () => {
                console.log('[MAIN] Starting game start animation');
                ui.animateGameStart();
            },
            onRevealCards: (playerName: string, cardIds: string[]) => {
                console.log('[MAIN] Reveal cards:', playerName, cardIds);
                ui.handleRevealFromServer(playerName, cardIds);
            }
        });

        ui.setupStartMenu({
            onCreateRoom: (playerName) => network?.createRoom(playerName),
            onJoinRoom: (roomId, playerName) => network?.joinRoom(roomId, playerName),
            onStartGame: () => network?.startGame(),
            onAddBot: () => network?.addBot(),
            onToggleReady: () => network?.sendIntent('TOGGLE_READY'),
            onLeaveLobby: () => window.location.reload(),
            onKickPlayer: (pid) => network?.sendIntent('KICK_PLAYER', { playerId: pid })
        });

        ui.setIntentCallback((type, payload) => network?.sendIntent(type, payload));
        console.log('[MAIN] Network initialized and UI callbacks set');
    }

    // Initialize network immediately so buttons are wired
    initNetwork();

    function updateGameState(state: SerializedState) {
        const myId = network?.socket.id || '';

        // Debug logging
        console.log('[MAIN] === State Update Debug ===');
        console.log('[MAIN] My socket ID:', myId);
        console.log('[MAIN] Players in state:', state.public.players.map(p => ({ id: p.id, name: p.name })));
        console.log('[MAIN] Phase:', state.public.phase);
        console.log('[MAIN] Private hand count:', state.private?.hand?.length || 0);

        // Update GameView - the single source of truth
        gameView.setMySocketId(myId);
        gameView.updateFromServer(state);

        // Check if we found ourselves
        const foundMe = gameView.myPublicInfo;
        console.log('[MAIN] Found my player:', foundMe ? foundMe.name : 'NOT FOUND');

        // Handle lobby state
        if (state.public.phase === 'lobby') {
            console.log('[MAIN] Lobby state detected, players:', state.public.players);
            ui.updateLobbyPlayers(state.public.players, gameView.isHost, myId);
            return;
        }

        // Handle game state - render using GameView
        console.log('[MAIN] Game state received, phase:', state.public.phase);

        // Update body phase class for CSS targeting
        document.body.className = document.body.className.replace(/phase-\w+/g, '');
        document.body.classList.add(`phase-${state.public.phase.toLowerCase()}`);

        // Show game container if not visible
        const gameContainer = document.getElementById('game-container');
        if (gameContainer?.style.display === 'none' || !gameContainer?.style.display) {
            console.log('[MAIN] Showing game container');
            ui.showGameContainer(gameView.isHost);
        }

        // Render the UI with the GameView
        ui.render(gameView);
        console.log('[MAIN] UI rendered successfully');
    }
});


