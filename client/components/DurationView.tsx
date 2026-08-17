import React from 'react';
import { SerializedCard } from '../../shared/types';
import { CardRegistry } from '../../shared/cards';
import { CardFrame } from './CardFrame';
import './DurationView.css';

// Reusing DurationView.css (styles are generic enough: .duration-item, .duration-card-wrapper)

interface DurationListProps {
    cards: SerializedCard[];
    title?: string;
    description?: string;
    emptyMessage?: string;
}

export const DurationList: React.FC<DurationListProps> = ({
    cards,
    title = "EFFETS EN COURS",
    description,
    emptyMessage = "Aucun effet durable actif."
}) => {
    if (cards.length === 0) {
        return (
            <div className="duration-empty">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="duration-view"> {/* Keep class for CSS compat */}
            <div className="duration-header">
                <span className="duration-title">{title}</span>
                {description && <div className="duration-desc-sub">{description}</div>}
                <div className="duration-divider" />
            </div>
            <div className="duration-content">
                <div className="duration-list">
                    {cards.map(card => {
                        const def = CardRegistry.get(card.id);
                        return (
                            <div key={card.instanceId} className="duration-item">
                                <div className="duration-card-row">
                                    <div className="duration-card-wrapper">
                                        <CardFrame cardId={card.id} variant="mini" />
                                        {card.durationTurns !== undefined && card.durationTurns > 0 && (
                                            <div className="duration-turns-badge" title="Tours restants">
                                                {card.durationTurns} ⏳
                                            </div>
                                        )}
                                    </div>
                                    <div className="duration-card-info">
                                        <div className="duration-card-name">{def?.name}</div>
                                        <div className="duration-card-desc">{def?.description}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
