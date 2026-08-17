import React from 'react';
import { SerializedCard } from '../../shared/types';


interface PlayerDurationZoneProps {
    cards: SerializedCard[];
    onClick: () => void;
    label?: string;
    isActive?: boolean; // If overlay is open
}

export const PlayerDurationZone: React.FC<PlayerDurationZoneProps> = ({
    cards,
    onClick,
    label = "DURÉE",
    isActive = false
}) => {
    if (cards.length === 0) return null;

    return (
        <div
            className={`player-duration-pill ${isActive ? 'active' : ''}`}
            onClick={onClick}
            title="Voir les effets durables actifs"
        >
            <div className="pill-content">
                <span className="pill-label">{label}</span>
                <span className="pill-count">{cards.length}</span>
                <span className="pill-icon">⏳</span>
            </div>
            {/* Optional: Preview the top card? Or just the pill as requested */}
            {/* The user asked for "Like a small rectangle" */}
        </div>
    );
};
