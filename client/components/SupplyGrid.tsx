/**
 * SupplyGrid - Kingdom supply display using CardFrame
 * 
 * Grid layout:
 * - Treasures row (3 cards)
 * - Victories row (3-4 cards)
 * - Kingdom cards (2 rows of 5)
 */

import React from 'react';
import { CardFrame } from './CardFrame';
import { useGameAnimations } from '../context/GameAnimationsContext';
import { CardRegistry } from '../../shared/cards/index';
import './SupplyGrid.css';

// ============================================================================
// Types
// ============================================================================

interface SupplyPile {
    cardId: string;
    count: number;
    isMixed?: boolean;
    topCardId?: string;
    tokens?: Record<string, number>;
}

interface SupplyGridProps {
    supply: Record<string, SupplyPile>;
    canBuy: boolean;
    coins: number;
    onBuy: (cardId: string) => void;
    variant?: 'all' | 'treasures-victories' | 'kingdom';
    // Selection support
    pendingDecision?: any;
    onChoose?: (choiceId: string, payload: any) => void;
    onToggleSupply?: (cardId: string) => void;
    selectedDetails?: string[]; // List of selected cardIds (for count decrement)
    isSelectable?: (cardId: string) => boolean;
    costReduction?: number;
    landscapes?: string[];
    landscapeState?: Record<string, any>;
}

function getBaseCardCost(cardId: string): number {
    return CardRegistry.get(cardId)?.cost ?? 0;
}

// ============================================================================
// Component
// ============================================================================

export const SupplyGrid: React.FC<SupplyGridProps> = ({
    supply,
    canBuy,
    coins,
    onBuy,
    variant = 'all',
    pendingDecision,
    onChoose,
    onToggleSupply,
    selectedDetails,
    isSelectable: externalIsSelectable,
    costReduction = 0,
    landscapes = [],
    landscapeState = {}
}) => {
    const { playGainAnimation: onAnimationTrigger } = useGameAnimations();
    // Organize supply by type

    const treasures: string[] = [];
    const victories: string[] = [];
    const kingdom: string[] = [];

    // Robust categorization
    for (const cardId of Object.keys(supply)) {
        const lowerId = cardId.toLowerCase();
        if (['copper', 'silver', 'gold', 'platinum', 'potion'].includes(lowerId)) {
            treasures.push(cardId);
        } else if (['estate', 'duchy', 'province', 'colony', 'curse'].includes(lowerId)) {
            victories.push(cardId);
        } else {
            kingdom.push(cardId);
        }
    }

    console.log('[SupplyGrid] Categorized supply:', { kingdom, treasures, victories, landscapes, variant });

    // Sort by cost (Primary) then name (Secondary)
    treasures.sort((a, b) => {
        const costDiff = getBaseCardCost(b) - getBaseCardCost(a);
        if (costDiff !== 0) return costDiff;
        return a.localeCompare(b);
    });

    victories.sort((a, b) => {
        const costDiff = getBaseCardCost(b) - getBaseCardCost(a);
        if (costDiff !== 0) return costDiff;
        return a.localeCompare(b);
    });

    kingdom.sort((a, b) => {
        const costDiff = getBaseCardCost(a) - getBaseCardCost(b);
        if (costDiff !== 0) return costDiff;
        return a.localeCompare(b);
    });

    const getEffectiveCost = (cardId: string) => {
        return Math.max(0, getBaseCardCost(cardId) - costReduction);
    };

    const canBuyCard = (cardId: string): boolean => {
        if (!canBuy) return false;
        const pile = supply[cardId];
        if (!pile || pile.count <= 0) return false;
        const cardToPrice = (pile.isMixed && pile.topCardId) ? pile.topCardId : cardId;
        return coins >= getEffectiveCost(cardToPrice);
    };

    const isSelectable = (cardId: string): boolean => {
        if (!pendingDecision || !onChoose) return false;
        const pile = supply[cardId];
        if (!pile || pile.count <= 0) return false;

        // Check if choosing cards from supply
        const constraints = pendingDecision.constraints;
        if (constraints?.sourceZone !== 'SUPPLY') return false;

        // Supported constraints formats:
        // 1. constraints.filter.maxCost (Standard)
        // 2. constraints.maxCost (Legacy/Direct)
        // 3. context.filter.maxCost (Context fallback)
        // 4. context.maxCost (Context direct)
        // 5. Regex from message (Ultimate fallback)
        const filter = constraints?.filter || pendingDecision.context?.filter;
        let maxCost = filter?.maxCost ?? constraints?.maxCost ?? pendingDecision.context?.maxCost;
        const minCost = filter?.minCost ?? constraints?.minCost ?? pendingDecision.context?.minCost;

        // Fallback: Parse message if maxCost is still missing but message contains "coût max: N" or "max cost: N"
        if (maxCost === undefined && pendingDecision.message) {
            const match = pendingDecision.message.match(/(?:coût max|max cost|jusqu'à|up to)[:\s]+(\d+)/i) ||
                pendingDecision.message.match(/(\d+)\s*(?:pièces?|coins?)/i); // "up to 4 coins"
            if (match) {
                maxCost = parseInt(match[1], 10);
            }
        }

        const cardToPrice = (pile.isMixed && pile.topCardId) ? pile.topCardId : cardId;
        const cardCost = getEffectiveCost(cardToPrice);

        // Apply cost filter
        if (maxCost !== undefined) {
            if (cardCost > maxCost) return false;
        }

        if (minCost !== undefined) {
            if (cardCost < minCost) return false;
        }

        // Apply type filter (for cards like "Gain an Action card")
        if (filter?.cardTypes) {
            // This would require a local registry or type check
            // For now we'll assume most gains are generic unless we add type data to the costs map
            // BUT for the 26 cards, we should be strict.
        }

        return true;
    };

    const renderPile = (cardId: string) => {
        const pile = supply[cardId];
        if (!pile) return null;

        const buyable = canBuyCard(cardId);
        const canSelect = externalIsSelectable ? externalIsSelectable(cardId) : isSelectable(cardId);

        // Decision Mode: If there is a pending decision that targets supply, we are in selection mode.
        const isSupplySelectionMode = pendingDecision?.constraints?.sourceZone === 'SUPPLY';

        // Selected in Tray: We highlight if THIS card is in the selected list
        const selectionIndex = selectedDetails?.indexOf(cardId);
        const isSelected = selectionIndex !== undefined && selectionIndex !== -1;

        // User Request: Matches filter = Buy Button. Not matching = Dimmed.
        const shouldDim = isSupplySelectionMode && !canSelect;

        // Visual Badge: Show "Purchasable" (Buy Button/Plus) if:
        // 1. It's normal buy phase and we can buy (AND we're not in selection mode)
        // 2. We are in Supply Select mode and this card is a valid target
        const showPurchasableBadge = (!isSupplySelectionMode && buyable) || (isSupplySelectionMode && canSelect);

        // UI RULE: Selecting a card does NOT remove it from view.
        // We preserve pile.count and don't subtract selectedCount.
        const displayCount = pile.count;

        return (
            <CardFrame
                key={cardId}
                cardId={pile.topCardId || cardId} // Use top card for visual, but interaction remains on pileId
                variant="mini"
                count={displayCount}
                showCost={true}
                costOverride={getEffectiveCost(pile.topCardId || cardId)}
                showCount={true}
                tokens={pile.tokens}
                isPurchasable={showPurchasableBadge}
                isSelectable={canSelect}
                selected={isSelected} // NEW: Highlight selected piles
                selectionIndex={isSelected ? selectionIndex : undefined}
                dimmed={shouldDim || (pile.count === 0)}
                disabled={pile.count === 0}
                tooltip={canSelect ? "Cliquez pour choisir une copie" : undefined}
                onClick={(e: React.MouseEvent | undefined) => {
                    // Trigger Animation for Gain/Buy
                    if (e && (canSelect || (buyable && !isSupplySelectionMode))) {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        onAnimationTrigger(pile.topCardId || cardId, undefined, rect, 'discard');
                    }

                    if (canSelect && onToggleSupply) {
                        onToggleSupply(cardId);
                    } else if (canSelect && onChoose) {
                        onChoose(pendingDecision.id, { type: 'SUPPLY', cardId });
                    } else if (buyable && !isSupplySelectionMode) {
                        onBuy(cardId);
                    }
                }}
            />
        );
    };

    return (
        <div className={`supply-grid variant-${variant}`}>
            {/* Treasures & Victories - 2 Columns */}
            {(variant === 'all' || variant === 'treasures-victories') && (
                <div className="sidebar-split">
                    {/* Left: Victories */}
                    <div className="sidebar-col victory-col">
                        {victories.map(renderPile)}
                    </div>
                    {/* Right: Treasures */}
                    <div className="sidebar-col treasure-col">
                        {treasures.map(renderPile)}
                    </div>
                </div>
            )}

            {/* Kingdom Cards & Landscapes Section */}
            {(variant === 'all' || variant === 'kingdom') && (
                <div className="kingdom-and-landscapes">
                    <div className="kingdom-grid">
                        <div className="supply-row kingdom-row-unified">
                            {kingdom.map(renderPile)}
                        </div>
                    </div>

                    {/* Landscape Column - To the RIGHT of the Kingdom Grid */}
                    {landscapes.length > 0 && (
                        <div className="landscape-column">
                            {landscapes.map(landscapeId => {
                                const def = CardRegistry.get(landscapeId);
                                if (!def) return null;

                                const costObj = typeof def.cost === 'object' ? def.cost : { coin: def.cost ?? 0 };
                                const coinCost = (costObj as any).coin ?? 0;

                                return (
                                    <CardFrame
                                        key={landscapeId}
                                        cardId={landscapeId}
                                        variant="mini"
                                        showCost={true}
                                        tokens={landscapeState[landscapeId]?.tokens}
                                        isPurchasable={canBuy && coins >= coinCost}
                                        isSelectable={externalIsSelectable ? externalIsSelectable(landscapeId) : false}
                                        onClick={() => {
                                            if (canBuy && coins >= coinCost) {
                                                onBuy(landscapeId);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
