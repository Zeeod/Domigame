import React from 'react';
import { GameState, RoomState } from '../hooks/useSocket';
import './SpectatorBar.css';

interface SpectatorBarProps {
    gameState: GameState;
    roomState: RoomState;
    currentFollowId?: string;
    isRevealAll: boolean;
    onConfigure: (options: { followId?: string, revealAll?: boolean }) => void;
}

export const SpectatorBar: React.FC<SpectatorBarProps> = ({
    gameState,
    roomState,
    currentFollowId,
    isRevealAll,
    onConfigure
}) => {
    // Determine the actual player being followed (if not explicitly set in UI, the server defaults to player 1's view usually for spectators)
    const activePlayerId = currentFollowId || gameState.public.players[0]?.id;

    return (
        <div className="spectator-bar">
            <div className="spectator-badge">
                👁️ Mode Spectateur
            </div>

            <div className="spectator-controls">
                <span className="control-label">Suivre:</span>
                <div className="player-pills">
                    {gameState.public.players.map(p => {
                        // Find the player's color from roomState
                        const roomP = roomState.players.find(rp => rp.id === p.id);
                        const isFollowing = p.id === activePlayerId && !isRevealAll;
                        return (
                            <button
                                key={p.id}
                                className={`player-pill ${isFollowing ? 'active' : ''}`}
                                style={{
                                    borderColor: roomP?.color || '#fff',
                                    backgroundColor: isFollowing ? (roomP?.color || '#3498db') : 'transparent',
                                    color: isFollowing ? '#fff' : '#ccc'
                                }}
                                onClick={() => onConfigure({ followId: p.id, revealAll: false })}
                            >
                                {p.name}
                            </button>
                        );
                    })}
                </div>

                <div className="divider"></div>

                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={isRevealAll}
                        onChange={(e) => onConfigure({ revealAll: e.target.checked })}
                    />
                    Révéler toutes les mains
                </label>
            </div>
        </div>
    );
};
