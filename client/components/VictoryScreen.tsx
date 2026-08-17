/**
 * VictoryScreen - Game end display with scores
 */

import React from 'react';
import './VictoryScreen.css';

export interface PlayerScore {
    playerId: string;
    name: string;
    color: string;
    score: number;
    isWinner: boolean;
}

interface VictoryScreenProps {
    scores: PlayerScore[];
    winnerId: string | null;
    onPlayAgain: () => void;
    onReturnToLobby: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
    scores,
    winnerId,
    onPlayAgain,
    onReturnToLobby
}) => {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const winner = sortedScores.find(s => s.playerId === winnerId) || sortedScores[0];

    return (
        <div className="victory-overlay">
            <div className="victory-modal">
                <div className="victory-header">
                    <div className="victory-crown">👑</div>
                    <h1 className="victory-title">Partie Terminée!</h1>
                </div>

                <div className="winner-section">
                    <div
                        className="winner-name"
                        style={{ color: winner?.color }}
                    >
                        {winner?.name} remporte la victoire!
                    </div>
                    <div className="winner-score">{winner?.score} points</div>
                </div>

                <div className="scores-section">
                    <h2>Résultats</h2>
                    <div className="scores-list">
                        {sortedScores.map((player, index) => (
                            <div
                                key={player.playerId}
                                className={`score-row ${player.isWinner ? 'winner' : ''}`}
                            >
                                <span className="score-rank">{index + 1}.</span>
                                <span
                                    className="score-name"
                                    style={{ color: player.color }}
                                >
                                    {player.name}
                                </span>
                                <span className="score-points">{player.score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="victory-actions">
                    <button
                        className="btn btn-primary"
                        onClick={onPlayAgain}
                    >
                        🔄 Rejouer
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onReturnToLobby}
                    >
                        🏠 Retour au Lobby
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VictoryScreen;
