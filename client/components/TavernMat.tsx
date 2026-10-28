import React from 'react';
import { CardFrame } from './CardFrame';
import { CardRegistry } from '../../shared/cards/index';
import './ZoneContainer.css'; // Reuse basic styles or add new ones

interface TavernMatProps {
    cards: { id: string; instanceId: string; name: string }[];
    /** Names of the Reserve cards the game currently offers to call ("Appeler X ?") */
    callableNames: string[];
    onCallCard?: (instanceId: string) => void;
}

/** Adventures — the Tavern mat. A Reserve card is called when the game asks (start of turn, after a gain…). */
export const TavernMat: React.FC<TavernMatProps> = ({ cards, callableNames, onCallCard }) => {
    if (cards.length === 0) return null;
    let offered = false; // one button for the copy being offered

    return (
        <div className="zone-container expansion-mat tavern-mat">
            <div className="zone-header">
                <span className="zone-icon">🍻</span>
                <span className="zone-name">Taverne</span>
                <span className="zone-count">({cards.length})</span>
            </div>
            <div className="zone-content">
                <div className="zone-cards">
                    {cards.map(card => {
                        const callable = !offered && callableNames.includes(CardRegistry.get(card.id)?.name || card.id);
                        if (callable) offered = true;
                        return (
                            <div key={card.instanceId} className="zone-card-item mat-card">
                                <CardFrame cardId={card.id} variant="micro" />
                                {callable && onCallCard && (
                                    <button
                                        className="mat-action-btn call-btn"
                                        onClick={() => onCallCard(card.instanceId)}
                                        title="Appeler cette carte"
                                    >
                                        Appeler
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
