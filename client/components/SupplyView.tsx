/**
 * SupplyView - Kingdom supply display
 */

import React from 'react';
import { useCardInspect } from '../context/CardInspectContext';
import './SupplyView.css';

interface SupplyPile {
    cardId: string;
    count: number;
}

interface SupplyViewProps {
    supply: Record<string, SupplyPile>;
    supplyByType: { treasures: string[]; victories: string[]; actions: string[] };
    canBuy: boolean;
    coins: number;
    onBuy: (cardId: string) => void;
}

export const SupplyView: React.FC<SupplyViewProps> = ({
    supply,
    supplyByType,
    canBuy,
    coins,
    onBuy
}) => {
    const { setHovered, clearHovered, setZoomed } = useCardInspect();

    const canBuyCard = (cardId: string) => {
        if (!canBuy) return false;
        const pile = supply[cardId];
        if (!pile || pile.count <= 0) return false;
        return coins >= getCardCost(cardId);
    };

    const renderPile = (cardId: string) => {
        const pile = supply[cardId];
        if (!pile) return null;

        const cost = getCardCost(cardId);
        const buyable = canBuyCard(cardId);

        return (
            <div
                key={cardId}
                className={`supply-pile ${getCardTypeClass(cardId)} ${buyable ? 'buyable' : ''} ${pile.count === 0 ? 'empty' : ''}`}
                onClick={() => buyable && onBuy(cardId)}
                onMouseEnter={(e) => setHovered(cardId, e.clientX, e.clientY)}
                onMouseMove={(e) => setHovered(cardId, e.clientX, e.clientY)}
                onMouseLeave={clearHovered}
                onContextMenu={(e) => { e.preventDefault(); setZoomed(cardId); }}
            >
                <div className="pile-cost">{cost}</div>
                <div className="pile-name">{getCardName(cardId)}</div>
                <div className="pile-count">{pile.count}</div>
            </div>
        );
    };

    return (
        <div className="supply-view">
            {/* Basic Supply */}
            <div className="supply-section">
                <h3>Trésors</h3>
                <div className="supply-row">
                    {supplyByType.treasures.map(renderPile)}
                </div>
            </div>

            <div className="supply-section">
                <h3>Victoires</h3>
                <div className="supply-row">
                    {supplyByType.victories.map(renderPile)}
                </div>
            </div>

            {/* Kingdom Cards */}
            <div className="supply-section">
                <h3>Royaume</h3>
                <div className="supply-row kingdom">
                    {supplyByType.actions.map(renderPile)}
                </div>
            </div>
        </div>
    );
};

// Helpers
function getCardTypeClass(cardId: string): string {
    if (['copper', 'silver', 'gold'].includes(cardId)) return 'treasure';
    if (['estate', 'duchy', 'province'].includes(cardId)) return 'victory';
    if (cardId === 'curse') return 'curse';
    return 'action';
}

function getCardName(cardId: string): string {
    const names: Record<string, string> = {
        copper: 'Cuivre', silver: 'Argent', gold: 'Or',
        estate: 'Domaine', duchy: 'Duché', province: 'Province',
        curse: 'Malédiction',
        village: 'Village', smithy: 'Forgeron', market: 'Marché',
        laboratory: 'Laboratoire', festival: 'Festival',
        militia: 'Milice', chapel: 'Chapelle'
    };
    return names[cardId] ?? cardId;
}

function getCardCost(cardId: string): number {
    const costs: Record<string, number> = {
        copper: 0, silver: 3, gold: 6,
        estate: 2, duchy: 5, province: 8,
        curse: 0,
        village: 3, smithy: 4, market: 5,
        laboratory: 5, festival: 5,
        militia: 4, chapel: 2
    };
    return costs[cardId] ?? 0;
}
