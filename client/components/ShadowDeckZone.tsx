import React from 'react';
import { CardFrame } from './CardFrame';
import './ZoneContainer.css';

interface ShadowDeckZoneProps {
    cards: { id: string; instanceId: string }[];
    /** Play it now (my Action phase, nothing pending) */
    canPlay: boolean;
    onPlay: (instanceId: string) => void;
    /** A pending choice "play a card from your hand" (Throne Room…) that accepts these cards */
    choosable: string[];
    onChoose: (instanceId: string) => void;
}

/**
 * Rising Sun — Shadow cards in your deck: they can be played as if they were in your hand.
 */
export const ShadowDeckZone: React.FC<ShadowDeckZoneProps> = ({ cards, canPlay, onPlay, choosable, onChoose }) => {
    if (cards.length === 0) return null;

    return (
        <div className="zone-container expansion-mat shadow-deck-mat" title="Les Ombres se jouent depuis votre pioche comme si elles étaient dans votre main">
            <div className="zone-header">
                <span className="zone-icon">🌑</span>
                <span className="zone-name">Ombres dans la pioche</span>
                <span className="zone-count">({cards.length})</span>
            </div>
            <div className="zone-content">
                <div className="zone-cards">
                    {cards.map(card => (
                        <div key={card.instanceId} className="zone-card-item mat-card">
                            <CardFrame cardId={card.id} variant="micro" />
                            {choosable.includes(card.instanceId) ? (
                                <button className="mat-action-btn call-btn" onClick={() => onChoose(card.instanceId)} title="Choisir cette carte">
                                    Choisir
                                </button>
                            ) : canPlay && (
                                <button className="mat-action-btn call-btn" onClick={() => onPlay(card.instanceId)} title="Jouer cette Ombre depuis la pioche">
                                    Jouer
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
