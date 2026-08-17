import React from 'react';
import { CardFrame } from './CardFrame';
import './ZoneContainer.css';

interface ExileMatProps {
    cards: { id: string; instanceId: string; name: string }[];
}

export const ExileMat: React.FC<ExileMatProps> = ({ cards }) => {
    if (cards.length === 0) return null;

    return (
        <div className="zone-container expansion-mat exile-mat">
            <div className="zone-header">
                <span className="zone-icon">⛓️</span>
                <span className="zone-name">Exil</span>
                <span className="zone-count">({cards.length})</span>
            </div>
            <div className="zone-content">
                <div className="zone-cards">
                    {cards.map(card => (
                        <div key={card.instanceId} className="zone-card-item mat-card">
                            <CardFrame cardId={card.id} variant="micro" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
