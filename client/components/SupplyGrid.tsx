/**
 * SupplyGrid - Kingdom supply display using CardFrame
 * 
 * Grid layout:
 * - Treasures row (3 cards)
 * - Victories row (3-4 cards)
 * - Kingdom cards (2 rows of 5)
 */

import React from 'react';
import { CardFrame, CardStrip } from './CardFrame';
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
    /** Cards set aside for the whole game (Riverboat), shown with the landscapes */
    setAsideForGame?: { cardId: string; label: string; sourceId?: string }[];
    /** Supply piles added on top of the 10 Kingdom piles (Approaching Army, Bane…) */
    extraPiles?: { cardId: string; label: string; sourceId?: string }[];
    /** Players' tokens on each pile (Adventures) */
    pileMarkers?: Record<string, { label: string; color: string; title?: string }[]>;
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
    landscapeState = {},
    setAsideForGame = [],
    extraPiles = [],
    pileMarkers = {}
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

    // The Kingdom shows 10 piles on 2 rows; extra piles go to the strip row under it
    const extraLabel = new Map(extraPiles.map(p => [p.cardId, p.label] as [string, string]));
    const extraSource = new Map(extraPiles.map(p => [p.cardId, p.sourceId] as [string, string | undefined]));
    const extras: string[] = kingdom.filter(id => extraLabel.has(id));
    const mainKingdom = kingdom.filter(id => !extraLabel.has(id));
    if (mainKingdom.length > 10) extras.push(...mainKingdom.splice(10));

    const getEffectiveCost = (cardId: string) => {
        // The server sends what the card on top of each pile costs now (all cost changes included)
        const pile = supply[cardId] || Object.values(supply).find((p: any) => p.topCardId === cardId);
        if (pile && typeof (pile as any).cost === 'number') return (pile as any).cost;
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
        if (String(constraints?.sourceZone || '').toUpperCase() !== 'SUPPLY') return false;

        // The server lists the piles that can be chosen: that list is authoritative
        const allowedIds: string[] | undefined = (constraints?.filter as any)?.cardIds;
        if (allowedIds) return allowedIds.includes(cardId);

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

    const renderStrip = (cardId: string) => {
        const pile = supply[cardId];
        if (!pile) return null;
        const buyable = canBuyCard(cardId);
        const canSelect = externalIsSelectable ? externalIsSelectable(cardId) : isSelectable(cardId);
        const isSupplySelectionMode = String(pendingDecision?.constraints?.sourceZone || '').toUpperCase() === 'SUPPLY';
        const isSelected = (selectedDetails?.indexOf(cardId) ?? -1) !== -1;
        return (
            <CardStrip
                key={'extra_' + cardId}
                cardId={pile.topCardId || cardId}
                label={extraLabel.get(cardId)}
                sourceId={extraSource.get(cardId)}
                count={pile.count}
                costOverride={getEffectiveCost(pile.topCardId || cardId)}
                isPurchasable={(!isSupplySelectionMode && buyable) || (isSupplySelectionMode && canSelect)}
                isSelectable={canSelect}
                selected={isSelected}
                dimmed={(isSupplySelectionMode && !canSelect) || pile.count === 0}
                onClick={(e) => {
                    if (canSelect || (buyable && !isSupplySelectionMode)) {
                        onAnimationTrigger(pile.topCardId || cardId, undefined, (e.currentTarget as HTMLElement).getBoundingClientRect(), 'discard');
                    }
                    if (canSelect && onToggleSupply) onToggleSupply(cardId);
                    else if (canSelect && onChoose) onChoose(pendingDecision.id, { type: 'SUPPLY', cardId });
                    else if (buyable && !isSupplySelectionMode) onBuy(cardId);
                }}
            />
        );
    };

    const renderPile = (cardId: string) => {
        const pile = supply[cardId];
        if (!pile) return null;

        const buyable = canBuyCard(cardId);
        const canSelect = externalIsSelectable ? externalIsSelectable(cardId) : isSelectable(cardId);

        // Decision Mode: If there is a pending decision that targets supply, we are in selection mode.
        const isSupplySelectionMode = String(pendingDecision?.constraints?.sourceZone || '').toUpperCase() === 'SUPPLY';

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
                markers={pileMarkers[cardId]}
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
                            {mainKingdom.map(renderPile)}
                        </div>
                        {/* Extra piles and set-aside cards: name banners only (right-click shows the card) */}
                        {(extras.length > 0 || setAsideForGame.length > 0) && (
                            <div className="supply-row special-strip-row">
                                {extras.map(renderStrip)}
                                {setAsideForGame.map(({ cardId, label, sourceId }) => (
                                    <CardStrip key={'aside_' + cardId + label} cardId={cardId} label={label} sourceId={sourceId} showCost={false} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Landscape Column - To the RIGHT of the Kingdom Grid */}
                    {landscapes.length > 0 && (
                        <div className="landscape-column" style={{ gridTemplateColumns: landscapes.length > 2 ? 'repeat(2, max-content)' : 'max-content' }}>
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
