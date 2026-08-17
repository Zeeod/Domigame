import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { BoardLayout } from './components/BoardLayout';
import { Lobby } from './components/Lobby';

// Simple Join Screen Component (Internal to keep it self-contained if no external Lobby exists or just for the initial join)
const JoinScreen: React.FC<{ onJoin: (roomId: string, name: string, color: string) => void }> = ({ onJoin }) => {
    const [roomId, setRoomId] = useState('');
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3498db');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomId && name) {
            onJoin(roomId, name, color);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#2c3e50', color: 'white', fontFamily: 'sans-serif'
        }}>
            <h1>Dominion</h1>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
                <input
                    type="text"
                    placeholder="Nom du joueur"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                    required
                />
                <input
                    type="text"
                    placeholder="ID de la salle (ex: 1234)"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
                    required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>Couleur:</label>
                    <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                    />
                </div>
                <button type="submit" style={{
                    padding: '12px', background: '#27ae60', color: 'white', border: 'none',
                    borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                }}>
                    REJOINDRE
                </button>
            </form>
        </div>
    );
};

export default function App() {
    const {
        isConnected,
        playerId,
        isHost,
        roomState,
        gameState,
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
        savedGames,
        listSavedGames,
        resumeGame
    } = useSocket();

    // Error Handling
    useEffect(() => {
        if (error) {
            alert(`Erreur: ${error}`); // Simple alert for now
            clearError();
        }
    }, [error, clearError]);

    // VIEW ROUTING
    // 1. Loading / Reconnecting
    if (!isConnected && !roomState) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
                background: '#2c3e50', color: 'white', fontFamily: 'sans-serif'
            }}>
                <h2>Connexion au serveur...</h2>
            </div>
        );
    }

    // 2. Join Screen (No Room)
    if (!roomState) {
        return <JoinScreen onJoin={joinRoom} />;
    }

    // 3. Lobby (Room joined, Game NOT started)
    if (roomState && !roomState.isStarted) {
        return (
            <Lobby
                roomState={roomState}
                playerId={playerId}
                isHost={isHost}
                onToggleReady={toggleReady}
                onStartGame={startGame}
                onSyncKingdom={changeKingdom}
                onLeave={() => leaveRoom('leave')}
                onAddBot={addBot}
                onRemoveBot={removeBot}
                onChangeColor={changeColor}
                onSetupChange={changeSetup}
                savedGames={savedGames}
                onListSavedGames={listSavedGames}
                onResumeGame={resumeGame}
            />
        );
    }

    // 4. Game Board (Game Started)
    if (roomState?.isStarted && gameState) {
        return (
            <BoardLayout
                gameState={gameState}
                playerId={playerId}
                isHost={isHost}
                onPlayCard={(cardInstanceId) => sendAction({ type: 'PLAY_CARD', cardInstanceId })}
                onBuyCard={(cardId) => sendAction({ type: 'BUY_CARD', cardId })}
                onEndPhase={() => sendAction({ type: 'END_PHASE' })}
                onChoose={(choiceId, payload) => sendAction({ type: 'CHOOSE', choiceId, payload })}
                onToggleReady={toggleReady}
                onLeaveGame={() => leaveRoom('leave')}
                onForceEndGame={() => sendAction({ type: 'FORCE_END_GAME' })}
                onAcknowledgeReveal={() => sendAction({ type: 'ACKNOWLEDGE_REVEAL' })}
                onPlayAllTreasures={() => sendAction({ type: 'PLAY_ALL_TREASURES' })}
                onRequestRewind={requestRewind}
            />
        );
    }

    // 5. Fallback (Game started but state not loaded yet)
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
            background: '#0F1316', color: 'white', fontFamily: 'sans-serif'
        }}>
            <h2>Chargement de la partie...</h2>
        </div>
    );
}
