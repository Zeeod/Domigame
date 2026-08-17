import React from 'react';
import { CardFrame } from './CardFrame';
import './ZoneContainer.css'; // Reuse basic styles or add new ones

interface TavernMatProps {
    cards: { id: string; instanceId: string; name: string }[];
    onCallCard?: (instanceId: string) => void;
    isMyTurn: boolean;
}

export const TavernMat: React.FC<TavernMatProps> = ({ cards, onCallCard, isMyTurn }) => {
    if (cards.length === 0) return null;

    return (
        <div className="zone-container expansion-mat tavern-mat">
            <div className="zone-header">
                <span className="zone-icon">🍻</span>
                <span className="zone-name">Taverne</span>
                <span className="zone-count">({cards.length})</span>
            </div>
            <div className="zone-content">
                <div className="zone-cards">
                    {cards.map(card => (
                        <div key={card.instanceId} className="zone-card-item mat-card">
                            <CardFrame cardId={card.id} variant="micro" />
                            {isMyTurn && onCallCard && (
                                <button
                                    className="mat-action-btn call-btn"
                                    onClick={() => onCallCard(card.instanceId)}
                                    title="Appeler cette carte"
                                >
                                    Appeler
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
