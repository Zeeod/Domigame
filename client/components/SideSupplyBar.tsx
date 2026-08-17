/**
 * SideSupplyBar - Displays non-purchaseable piles (Ruins, Spoils, Madman, Mercenary)
 */

import React from 'react';
import { CardRegistry } from '../../shared/cards/index';
import { useCardInspect } from '../context/CardInspectContext';
import './SideSupplyBar.css';

interface NonSupplyPile {
    cardId: string;
    count: number;
    isMixed?: boolean;
    topCardId?: string;
}

interface SideSupplyBarProps {
    nonSupply: Record<string, NonSupplyPile>;
}

// French names for non-supply piles
const PILE_NAMES: Record<string, string> = {
    ruins: 'Ruines',
    spoils: 'Butins',
    madman: 'Fous',
    mercenary: 'Mercenaires'
};

export const SideSupplyBar: React.FC<SideSupplyBarProps> = ({ nonSupply }) => {
    const { setHovered, clearHovered, setZoomed } = useCardInspect();

    const piles = Object.entries(nonSupply);

    if (piles.length === 0) {
        return null;
    }

    return (
        <div className="side-supply-bar">
            <div className="side-supply-title">Extra</div>
            {piles.map(([pileId, pile]) => {
                // Use topCardId for mixed piles (like Ruins), otherwise use the pile's cardId
                const displayCardId = pile.topCardId || pile.cardId;
                const cardDef = CardRegistry.get(displayCardId);
                const pileName = PILE_NAMES[pileId] || cardDef?.name || pileId;

                return (
                    <div
                        key={pileId}
                        className={`side-supply-pile ${pile.count === 0 ? 'empty' : ''}`}
                        onMouseEnter={(e) => setHovered(displayCardId, e.clientX, e.clientY)}
                        onMouseMove={(e) => setHovered(displayCardId, e.clientX, e.clientY)}
                        onMouseLeave={clearHovered}
                        onClick={() => setZoomed(displayCardId)}
                    >
                        <div className="side-supply-icon">
                            {getPileIcon(pileId)}
                        </div>
                        <div className="side-supply-name">{pileName}</div>
                        <div className="side-supply-count">{pile.count}</div>
                    </div>
                );
            })}
        </div>
    );
};

function getPileIcon(pileId: string): string {
    switch (pileId) {
        case 'ruins': return '🏚️';
        case 'spoils': return '💰';
        case 'madman': return '🤪';
        case 'mercenary': return '⚔️';
        default: return '📦';
    }
}
