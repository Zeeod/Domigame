/**
 * PhaseIndicator - Shows current phase, turn, and resources
 */

import React from 'react';
import './PhaseIndicator.css';

interface PhaseIndicatorProps {
    phase: string;
    turnNumber: number;
    currentPlayerName: string;
    isMyTurn: boolean;
    actions: number;
    buys: number;
    coins: number;
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
    phase,
    turnNumber,
    currentPlayerName,
    isMyTurn,
    actions,
    buys,
    coins
}) => {
    const phaseLabels: Record<string, string> = {
        PREGAME: 'En attente',
        ACTION: 'Phase Action',
        BUY: 'Phase Achat',
        CLEANUP: 'Nettoyage',
        GAME_OVER: 'Partie terminée'
    };

    return (
        <div className={`phase-indicator ${isMyTurn ? 'my-turn' : ''}`}>
            <div className="turn-info">
                <span className="turn-number">Tour {turnNumber}</span>
                <span className="current-player">
                    {isMyTurn ? 'Votre tour' : `Tour de ${currentPlayerName}`}
                </span>
            </div>

            <div className={`phase-badge phase-${phase.toLowerCase()}`}>
                {phaseLabels[phase] ?? phase}
            </div>

            {isMyTurn && (
                <div className="my-resources">
                    <span className="resource actions">{actions} Actions</span>
                    <span className="resource buys">{buys} Achats</span>
                    <span className="resource coins">{coins} 💰</span>
                </div>
            )}
        </div>
    );
};
