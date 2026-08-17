/**
 * Lobby - Pre-game lobby component
 */

import React, { useState, useEffect } from 'react';
import { RoomState } from '../hooks/useSocket';
import './Lobby.css';

import { SavedGameConfig } from '../hooks/useSocket';

interface LobbyProps {
    roomState: RoomState;
    playerId: string | null;
    isHost: boolean;
    onToggleReady: () => void;
    onStartGame: (kingdomCards?: (string | null)[] | null) => void;
    onSyncKingdom: (kingdomCards: (string | null)[] | null) => void;
    onLeave: () => void;
    onAddBot: (botType: 'random' | 'greedy') => void;
    onRemoveBot: (botId: string) => void;
    onChangeColor: (color: string) => void;
    onSetupChange?: (options: {
        prosperityMode?: 'always' | 'never' | 'random',
        sheltersMode?: 'always' | 'never' | 'random',
        enabledExpansions?: string[],
        landscapeInstructions?: string[]
    }) => void;
    savedGames?: SavedGameConfig[];
    onListSavedGames?: () => void;
    onResumeGame?: (gameId: string) => void;
}

const COLOR_PALETTE = [
    '#e74c3c', '#2ecc71', '#3498db', '#f1c40f',
    '#9b59b6', '#e67e22', '#1abc9c', '#e91e63',
    '#badc58', '#7ed6df', '#be2edd', '#6d4c41',
    '#34495e', '#bdc3c7', '#ecf0f1', '#7f8c8d'
];

import { LobbyKingdomSelector } from './LobbyKingdomSelector';

export const Lobby: React.FC<LobbyProps> = ({
    roomState,
    playerId,
    isHost,
    onToggleReady,
    onStartGame,
    onSyncKingdom,
    onLeave,
    onAddBot,
    onRemoveBot,
    onChangeColor,
    onSetupChange,
    savedGames = [],
    onListSavedGames,
    onResumeGame
}) => {
    console.debug('[Lobby] Render. isHost:', isHost, 'playerId:', playerId, 'roomStarted:', roomState.isStarted, 'players:', roomState.players.length);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isHost && onListSavedGames) {
            onListSavedGames();
        }
    }, [isHost, onListSavedGames]);

    const handleCopyRoomCode = () => {
        navigator.clipboard.writeText(roomState.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const myPlayer = roomState.players.find(p => p.id === playerId);
    const isReady = myPlayer?.isReady ?? false;
    const canAddBot = isHost && !roomState.isStarted && roomState.players.length < 5;

    // Source of truth for kingdom cards is now roomState (broadcast from server)
    // Local override ONLY for the host while editing to ensure responsiveness? 
    // Actually, socket is fast enough, let's try direct sync first.
    const kingdomCardsToDisplay = roomState.kingdomCards || null;

    const isRandomMode = kingdomCardsToDisplay === null;
    const validCardCount = kingdomCardsToDisplay ? kingdomCardsToDisplay.filter(c => c && c.length > 0).length : 0;
    const isCustomValid = !isRandomMode && validCardCount === 10;

    const isStartDisabled = !roomState.canStart;

    const handleKingdomSelectionChange = (cards: (string | null)[] | null) => {
        // Only host can change, and we sync to server immediately
        if (isHost) {
            console.log('[Lobby] Syncing Kingdom to server:', cards);
            onSyncKingdom(cards);
        } else {
            console.warn('[Lobby] Ignored kingdom change (not host)');
        }
    };

    const handleStartClick = () => {
        // Start game with current selection (already synced or null)
        onStartGame(kingdomCardsToDisplay);
    };

    return (
        <div className="lobby">
            {/* Header removed as requested */}

            <div className={`lobby-content-wrapper`}>

                {/* Left Column: Kingdom Selection (Everyone sees it, only Host edits) */}
                <div className="lobby-left-col">
                    <LobbyKingdomSelector
                        onSelectionChange={handleKingdomSelectionChange}
                        currentSelection={kingdomCardsToDisplay}
                        readOnly={!isHost}
                        prosperityMode={roomState.prosperityMode}
                        sheltersMode={roomState.sheltersMode}
                        enabledExpansions={roomState.enabledExpansions}
                        landscapeInstructions={roomState.landscapeInstructions}
                        onSetupChange={onSetupChange}
                    />

                </div>

                {/* Right Column: Players & Controls */}
                <div className="lobby-main">

                    {/* 1. Room Code & Bot Button - Top of Right Column */}
                    <div className="lobby-controls-row">
                        <div className="room-code-inline" onClick={handleCopyRoomCode} title="Cliquer pour copier le code">
                            <div className="room-code-box-small clickable">
                                <span className="room-id-text">{roomState.id}</span>
                                <span className={`copy-status-small ${copied ? 'visible' : ''}`}>Copié !</span>
                            </div>
                        </div>

                        {canAddBot && (
                            <button
                                className="add-bot-button"
                                onClick={() => {
                                    console.log('[Lobby] Add Bot clicked. Defaulting to Greedy.');
                                    onAddBot('greedy');
                                }}
                            >
                                Ajouter un Bot
                            </button>
                        )}
                    </div>

                    {/* 2. Players List */}
                    <div className="players-list">
                        <h2>Joueurs ({roomState.players.length}/5)</h2>
                        {roomState.players.map(player => (
                            <div
                                key={player.id}
                                className={`player-row ${player.id === playerId ? 'is-me' : ''} ${player.isBot ? 'is-bot' : ''}`}
                                style={{ borderLeftColor: player.color }}
                            >
                                {/* Color Picker / Indicator */}
                                <div className="player-color-container">
                                    <div
                                        className={`player-color-circle ${player.id === playerId ? 'clickable' : ''}`}
                                        style={{ backgroundColor: player.color }}
                                        onClick={() => player.id === playerId && setShowColorPicker(!showColorPicker)}
                                        title={player.id === playerId ? "Changer de couleur" : "Couleur du joueur"}
                                    />

                                    {player.id === playerId && showColorPicker && (
                                        <div className="color-picker-popover">
                                            {COLOR_PALETTE.map(color => (
                                                <div
                                                    key={color}
                                                    className="color-option"
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => {
                                                        onChangeColor(color);
                                                        setShowColorPicker(false);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <span className="player-name" style={{ color: player.color }}>
                                    {player.name}
                                    {player.isHost && <span className="host-badge">👑</span>}
                                    {player.isBot && <span className="bot-badge">🤖</span>}
                                </span>
                                <div className="player-actions">
                                    <span className={`ready-status ${player.isReady || player.isHost ? 'ready' : 'not-ready'}`}>
                                        {(player.isReady || player.isHost) ? '✓ Prêt' : 'En attente'}
                                    </span>
                                    {isHost && player.isBot && (
                                        <button
                                            className="remove-bot-btn"
                                            onClick={() => onRemoveBot(player.id)}
                                            title="Retirer le bot"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {roomState.players.length < 2 && (
                            <div className="waiting-message">
                                En attente d'autres joueurs...
                            </div>
                        )}
                    </div>

                    {/* Parties Sauvegardées (Host Only) */}
                    {isHost && savedGames.length > 0 && (
                        <div className="saved-games-list" style={{
                            marginTop: '20px',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#f39c12' }}>💾 Parties Sauvegardées</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                {savedGames.map(game => (
                                    <div key={game.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '6px'
                                    }}>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>Tour {game.turnNumber} • {game.playerNames.join(' vs ')}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '4px' }}>
                                                Sauvegardé le {new Date(game.updatedAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onResumeGame?.(game.id)}
                                            style={{
                                                background: '#2980b9', color: 'white', border: 'none',
                                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                                fontWeight: 'bold', fontSize: '0.85rem'
                                            }}
                                        >
                                            Reprendre
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Action Buttons - Below Player List */}
                    <div className="lobby-primary-actions">
                        {!isHost && (
                            <button
                                className={`ready-button ${isReady ? 'is-ready' : ''}`}
                                onClick={onToggleReady}
                            >
                                {isReady ? 'Annuler' : 'Je suis prêt'}
                            </button>
                        )}

                        {isHost && (
                            <button
                                className="start-button"
                                onClick={handleStartClick}
                                disabled={isStartDisabled}
                            >
                                Lancer la partie
                            </button>
                        )}
                        {!roomState.canStart && roomState.players.length >= 2 && (
                            <p className="waiting-ready">
                                Tous les joueurs doivent être prêts
                            </p>
                        )}
                    </div>

                    {/* 4. Valid Selection Indicator */}
                    {isHost && !isRandomMode && (
                        <div style={{
                            marginTop: '15px',
                            textAlign: 'center',
                            padding: '10px',
                            background: isCustomValid ? 'rgba(46, 204, 113, 0.2)' : 'rgba(52, 152, 219, 0.2)',
                            borderRadius: '4px',
                            color: isCustomValid ? '#2ecc71' : '#3498db'
                        }}>
                            {isCustomValid
                                ? "✅ Sélection complète (10/10)"
                                : `🎲 Auto-complétion active (${validCardCount}/10)`}
                        </div>
                    )}

                    {!isHost && !isRandomMode && (
                        <div style={{
                            marginTop: '15px',
                            textAlign: 'center',
                            padding: '10px',
                            background: 'rgba(255, 215, 0, 0.1)',
                            borderRadius: '4px',
                            color: '#ffd700',
                            fontSize: '0.9rem'
                        }}>
                            L'hôte configure le Royaume...
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Quit Button - Bottom Right */}
            <div className="lobby-secondary-actions">
                <button
                    className="leave-button"
                    onClick={onLeave}
                >
                    Quitter
                </button>
            </div>
        </div>
    );
};
