/**
 * AppV2 - Main application component (new multiplayer version)
 */

import React, { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby';
import { BoardLayout } from './components/BoardLayout';
import { CardInspectProvider } from './context/CardInspectContext';
import { CardTooltip } from './components/CardTooltip';
import { BigCardView } from './components/BigCardView';
import { RewindVoteOverlay } from './components/RewindVoteOverlay';
import { CardLibrary } from './components/CardLibrary';
import './AppV2.css';

export const AppV2: React.FC = () => {
    const {
        isConnected,
        playerId,
        isHost,
        roomState,
        gameState,
        isGameStarted,
        error,
        clearError,
        joinRoom,
        toggleReady,
        startGame,
        sendAction,
        leaveRoom,
        addBot,
        removeBot,
        changeColor,
        changeKingdom,
        requestRewind,
        voteRewind,
        isReconnecting,
        forceEndGame,
        changeSetup,
        savedGames,
        listSavedGames,
        resumeGame,
        configureSpectator
    } = useSocket();

    const [playerName, setPlayerName] = useState(() => {
        return localStorage.getItem('dominion_player_name_pref') || '';
    });
    const [roomId, setRoomId] = useState('');
    const [showLibrary, setShowLibrary] = useState(false);

    React.useEffect(() => {
        console.log('[DEBUG] AppV2 Mounted/Re-rendered. isGameStarted:', isGameStarted, 'hasRoomState:', !!roomState);
    }, [isGameStarted, !!roomState]);

    console.log('[DEBUG] Rendering AppV2. State:', { isGameStarted, hasRoom: !!roomState });

    // Save name on change
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setPlayerName(name);
        localStorage.setItem('dominion_player_name_pref', name);
    };

    // Handle leave (confirmation moved to button in BoardLayout)
    const handleLeaveGame = () => {
        console.log('[DEBUG] handleLeaveGame called in AppV2 (surrender)');
        leaveRoom('surrender');
    };

    // Unified layout with inspection provider at root
    return (
        <CardInspectProvider>
            <div className="app-container">
                {/* Join screen */}
                {!roomState && (
                    <div className="join-screen">
                        <h1>Dominion</h1>
                        {!isConnected && <p className="connecting">Connexion...</p>}
                        {isConnected && !showLibrary && (
                            <div className="join-form">
                                <input
                                    type="text"
                                    placeholder="Votre nom"
                                    value={playerName}
                                    onChange={handleNameChange}
                                />
                                <input
                                    type="text"
                                    placeholder="ID de la salle (ou vide pour créer)"
                                    value={roomId}
                                    onChange={e => setRoomId(e.target.value)}
                                />
                                <button
                                    onClick={() => {
                                        const finalRoomId = roomId.trim() || Math.random().toString(36).substring(2, 6).toUpperCase();
                                        joinRoom(finalRoomId, playerName || 'Joueur', '#ffd700');
                                    }}
                                    disabled={!playerName}
                                >
                                    Rejoindre / Créer
                                </button>

                                <button
                                    className="secondary-btn"
                                    style={{ marginTop: '1rem', background: '#2c3e50' }}
                                    onClick={() => setShowLibrary(true)}
                                >
                                    Cartes du jeu
                                </button>
                            </div>
                        )}
                        {isConnected && showLibrary && (
                            <CardLibrary onClose={() => setShowLibrary(false)} />
                        )}
                        {error && (
                            <div className="error-message" onClick={clearError}>
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Lobby */}
                {roomState && !isGameStarted && (
                    <Lobby
                        roomState={roomState}
                        playerId={playerId}
                        isHost={isHost}
                        onToggleReady={toggleReady}
                        onStartGame={startGame}
                        onLeave={() => leaveRoom('leave')}
                        onAddBot={addBot}
                        onRemoveBot={removeBot}
                        onChangeColor={changeColor}
                        onSyncKingdom={changeKingdom}
                        onSetupChange={changeSetup}
                        savedGames={savedGames}
                        onListSavedGames={listSavedGames}
                        onResumeGame={resumeGame}
                    />
                )}

                {/* Game board */}
                {roomState && isGameStarted && (
                    <>
                        {!gameState ? (
                            <div className="loading-screen">
                                <div className="loading-spinner"></div>
                                <p>Chargement de la partie...</p>
                            </div>
                        ) : (
                            <BoardLayout
                                gameState={gameState}
                                playerId={playerId}
                                isHost={isHost}
                                onPlayCard={(instanceId) => sendAction({ type: 'PLAY_CARD', cardInstanceId: instanceId })}
                                onBuyCard={(cardId) => sendAction({ type: 'BUY_CARD', cardId })}
                                onEndPhase={() => sendAction({ type: 'END_PHASE' })}
                                onChoose={(choiceId, payload) => sendAction({ type: 'CHOOSE', choiceId, payload })}
                                onToggleReady={() => sendAction({ type: 'TOGGLE_READY' })}
                                onLeaveGame={handleLeaveGame}
                                onForceEndGame={forceEndGame}
                                onAcknowledgeReveal={() => sendAction({ type: 'ACKNOWLEDGE_REVEAL' })}
                                onPlayAllTreasures={() => sendAction({ type: 'PLAY_ALL_TREASURES' })}
                                onRequestRewind={requestRewind}
                                roomState={roomState}
                                onConfigureSpectator={configureSpectator}
                            />
                        )}
                    </>
                )}

                {/* Rewind Voting */}
                {roomState?.activeRewindRequest && (
                    <RewindVoteOverlay
                        request={roomState.activeRewindRequest}
                        players={roomState.players}
                        myPlayerId={playerId || ''}
                        onVote={voteRewind}
                    />
                )}

                {isReconnecting && (
                    <div className="reconnecting-overlay">
                        <div className="spinner"></div>
                        <p>Tentative de reconnexion...</p>
                    </div>
                )}

                {error && (
                    <div className="error-toast" onClick={clearError}>
                        {error}
                    </div>
                )}

                <CardTooltip gameState={gameState} />
                <BigCardView />
            </div>
        </CardInspectProvider>
    );
};
