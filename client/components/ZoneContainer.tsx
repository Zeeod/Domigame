import React, { useState } from 'react';
import { CardFrame } from './CardFrame';
import './ZoneContainer.css';

interface ZoneContainerProps {
    name: string;
    cards: { id: string; instanceId: string; name: string }[];
    emptyText?: string;
    onCardClick?: (cardId: string) => void;
}

export const ZoneContainer: React.FC<ZoneContainerProps> = ({ name, cards, emptyText = 'Vide', onCardClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (cards.length === 0) return null;

    return (
        <div className="zone-container">
            <div className="zone-header" onClick={() => setIsOpen(!isOpen)}>
                <span className="zone-name">{name}</span>
                <span className="zone-count">({cards.length})</span>
                <span className={`zone-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </div>
            {isOpen && (
                <div className="zone-content">
                    {cards.length === 0 ? (
                        <div className="zone-empty">{emptyText}</div>
                    ) : (
                        <div className="zone-cards">
                            {cards.map(card => (
                                <div key={card.instanceId} className="zone-card-item" onClick={() => onCardClick?.(card.instanceId)}>
                                    <CardFrame cardId={card.id} variant="micro" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
