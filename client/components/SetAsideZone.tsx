import React from 'react';
import { SerializedCard } from '../../shared/types';

interface SetAsideZoneProps {
    cards: SerializedCard[];
    onClick: () => void;
    label?: string;
    isActive?: boolean;
}

export const SetAsideZone: React.FC<SetAsideZoneProps> = ({
    cards,
    onClick,
    label = "MISE DE CÔTÉ",
    isActive = false
}) => {
    if (cards.length === 0) return null;

    return (
        <div
            className={`player-set-aside-pill ${isActive ? 'active' : ''}`}
            onClick={onClick}
            title="Voir les cartes mises de côté"
        >
            <div className="pill-content">
                <span className="pill-label">{label}</span>
                <span className="pill-count">{cards.length}</span>
                <span className="pill-icon">📦</span>
            </div>
        </div>
    );
};
