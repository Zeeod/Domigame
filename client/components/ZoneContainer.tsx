import React, { useState } from 'react';
import { CardFrame } from './CardFrame';
import './ZoneContainer.css';

interface ZoneContainerProps {
    name: string;
    cards: { id: string; instanceId: string; name: string }[];
    emptyText?: string;
    onCardClick?: (cardId: string) => void;
}

/** French name of a player mat (engine ids). */
const MAT_LABELS: Record<string, string> = {
    nativeVillage: 'Village indigène',
    island: 'Île',
    tavern: 'Taverne',
    exile: 'Exil',
    save: 'Mis de côté (fin du tour)',
    prince: 'Prince',
    archive: 'Archives',
    church: 'Église',
    crypt: 'Crypte',
    encampment: 'Campement',
    ghost: 'Fantôme',
    research: 'Recherche',
    cargo_ship: 'Cargo',
    prepare: 'Préparatifs',
    tireless: 'Infatigable',
    biding_time: 'Attendre son heure',
    rapid_expansion: 'Expansion rapide',
    horse: 'Chevaux',
    possessionTrash: 'Possession (écartées)',
    quartermaster: 'Quartier-maître',
    cage: 'Cage',
    grotto: 'Grotte'
};
export function matLabel(name: string): string {
    if (MAT_LABELS[name]) return MAT_LABELS[name];
    // Per-card mats: cage_<instanceId>, grotto_<instanceId>, quartermaster_<instanceId>
    const prefix = ['cage', 'grotto', 'quartermaster'].find(p => name.startsWith(p + '_'));
    return prefix ? MAT_LABELS[prefix] : name;
}

export const ZoneContainer: React.FC<ZoneContainerProps> = ({ name, cards, emptyText = 'Vide', onCardClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (cards.length === 0) return null;

    return (
        <div className="zone-container">
            <div className="zone-header" onClick={() => setIsOpen(!isOpen)}>
                <span className="zone-name">{matLabel(name)}</span>
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
