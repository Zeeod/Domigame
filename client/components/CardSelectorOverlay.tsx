import React from 'react';

import { CardFrame } from './CardFrame';
import { CardRegistry } from '../../shared/cards';
import './CardSelectorOverlay.css';

interface CardSelectorOverlayProps {
    /** Cards to display for selection */
    cards: Array<{
        id: string; // instanceId or special ID
        cardId: string;
        source?: 'HAND' | 'SUPPLY' | 'DISCARD' | 'TRASH';
    }>;
    /** IDs of currently selected cards */
    selectedIds: string[];
    /** Callback to toggle selection */
    onToggle: (id: string, cardId: string) => void;
    /** Message/Prompt */
    title?: string;
    subtitle?: string;
    /** Optional filter criteria for visual feedback (dimming) */
    filter?: {
        maxCost?: number;
        cardIds?: string[];
        cardTypes?: string[];
    };
}

export const CardSelectorOverlay: React.FC<CardSelectorOverlayProps> = ({
    cards,
    selectedIds,
    onToggle,
    title,
    subtitle,
    filter
}) => {

    // Group identical cards if they come from supply or generic zones
    // For HAND, we usually want to see individual cards, but stacking identicals is cleaner UI
    // Let's stack identicals but keep individual instance tracking

    const cardGroups: Array<{
        cardId: string;
        instances: Array<{ id: string; selected: boolean }>;
        isFiltered: boolean;
    }> = [];

    cards.forEach(card => {
        const def = CardRegistry.get(card.cardId);
        // Check filter
        let isFiltered = false;
        if (filter) {
            if (filter.maxCost !== undefined && (def?.cost ?? 0) > filter.maxCost) isFiltered = true;
            if (filter.cardIds && !filter.cardIds.includes(card.cardId)) isFiltered = true;
            if (filter.cardTypes && def && !filter.cardTypes.some(t => def.types.includes(t as any))) isFiltered = true;
        }

        const group = cardGroups.find(g => g.cardId === card.cardId);
        const isSelected = selectedIds.includes(card.id);

        if (group) {
            group.instances.push({ id: card.id, selected: isSelected });
        } else {
            cardGroups.push({
                cardId: card.cardId,
                instances: [{ id: card.id, selected: isSelected }],
                isFiltered
            });
        }
    });

    return (
        <div className="card-selector-overlay">
            <div className="selector-header">
                {title && <h2 className="selector-title">{title}</h2>}
                {subtitle && <div className="selector-subtitle">{subtitle}</div>}
            </div>

            <div className="selector-grid">
                {cardGroups.map(group => {
                    const totalCount = group.instances.length;
                    const selectedCount = group.instances.filter(i => i.selected).length;

                    // We render one clickable item per group that handles the next available instance selection
                    // Or we render all instances? rendering all might be too busy for hand
                    // Let's render "stacks" like the hand logic.

                    /* UX Decision:
                       If we click the stack:
                       - If not max selected: select next unselected instance
                       - If all selected: deselect last selected instance
                    */

                    const handleStackClick = () => {
                        if (group.isFiltered) return;

                        const unselected = group.instances.find(i => !i.selected);
                        if (unselected) {
                            onToggle(unselected.id, group.cardId);
                        } else {
                            // All selected, deselect one (FIFO or LIFO?) LIFO usually feels natural
                            const lastSelected = [...group.instances].reverse().find(i => i.selected);
                            if (lastSelected) {
                                onToggle(lastSelected.id, group.cardId);
                            }
                        }
                    };

                    return (
                        <div
                            key={group.cardId}
                            className={`overlay-card-wrapper ${selectedCount > 0 ? 'selected' : ''} ${group.isFiltered ? 'dimmed' : ''}`}
                            onClick={handleStackClick}
                        >
                            <CardFrame
                                cardId={group.cardId}
                                variant="full" // Keep full size for readability in overlay
                                showCount={totalCount > 1}
                                count={totalCount}
                                disabled={group.isFiltered}
                                selected={selectedCount > 0}
                            />
                            {selectedCount > 0 && (
                                <div className="selection-badge">
                                    {selectedCount}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
