import React, { useState, useEffect, useRef } from 'react';
import { Reorder } from 'framer-motion';
import { CardInstance } from '../../shared/engine/CardInstance';
import { CardRegistry } from '../../shared/cards';
import { AnimatedCard } from './AnimatedCard';
import { CardFrame } from './CardFrame';
import { CardType } from '../../shared/types/CardDefinition';
import './UniversalOverlay.css';

export type OverlayMode = 'GRID' | 'REORDER' | 'INSERT' | 'REVEAL';

interface UniversalOverlayProps {
    mode: OverlayMode;
    title: string;
    subtitle?: string;
    cards?: CardInstance[];

    // GRID Mode Props
    selectedIds?: string[];
    onToggleCard?: (instanceId: string, cardId: string) => void;
    filter?: {
        maxCost?: number;
        cardIds?: string[];
        cardTypes?: string[];
    };

    // REORDER Mode Props
    onConfirmOrder?: (orderedIds: string[]) => void;

    // INSERT Mode Props
    cardToInsert?: CardInstance;
    deckCount?: number;
    onConfirmInsert?: (index: number) => void;

    // REVEAL Mode Props
    onAcknowledge?: () => void;
    autoHideDuration?: number; // in ms, e.g. 3000
    highlightedIds?: string[];
}

export const UniversalOverlay: React.FC<UniversalOverlayProps> = ({
    mode,
    // title, subtitle, // Removed from UI as per user request
    cards = [],
    selectedIds = [],
    onToggleCard,
    filter,
    onConfirmOrder,
    cardToInsert,
    deckCount = 0,
    onConfirmInsert,
    onAcknowledge,
    autoHideDuration,
    highlightedIds = []
}) => {
    // Local State for Reordering
    const [orderedItems, setOrderedItems] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Track auto-hide progress
    const [progress, setProgress] = useState(100);

    // Initialize State based on mode
    useEffect(() => {
        if (mode === 'REORDER') {
            setOrderedItems(cards);
        } else if (mode === 'INSERT') {
            const DECK_CARD_ID = 'back';
            const items = Array.from({ length: deckCount }).map((_, i) => ({
                id: `deck-${i}`,
                isTarget: false,
                displayId: DECK_CARD_ID
            }));
            if (cardToInsert) {
                items.unshift({
                    id: 'selection',
                    isTarget: true,
                    displayId: cardToInsert.id
                });
            }
            setOrderedItems(items);
        }
    }, [mode, cards, cardToInsert, deckCount]);


    useEffect(() => {
        if (mode === 'REVEAL' && autoHideDuration && onAcknowledge) {
            const start = Date.now();
            const interval = setInterval(() => {
                const elapsed = Date.now() - start;
                const remaining = Math.max(0, 100 - (elapsed / autoHideDuration) * 100);
                setProgress(remaining);
                if (remaining === 0) {
                    clearInterval(interval);
                    onAcknowledge();
                }
            }, 50);
            return () => clearInterval(interval);
        }
    }, [mode, autoHideDuration, onAcknowledge]);

    // Container width observer for overlap calculation
    useEffect(() => {
        if (!containerRef.current) return;
        const updateWidth = () => {
            if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
        };
        const observer = new ResizeObserver(updateWidth);
        observer.observe(containerRef.current);
        updateWidth();
        return () => observer.disconnect();
    }, []);

    // GRID Processing
    const groups: { id: string; instances: CardInstance[]; isFiltered: boolean }[] = [];
    if (mode === 'GRID') {
        cards.forEach(card => {
            const def = CardRegistry.get(card.id);
            const isFiltered = !!(filter ? (
                (filter.maxCost !== undefined && (def?.cost || 0) > filter.maxCost) ||
                (filter.cardIds && !filter.cardIds.includes(card.id)) ||
                (filter.cardTypes && !filter.cardTypes.some(t => def?.types.includes(t as CardType)))
            ) : false);

            const existingGroup = groups.find(g => g.id === card.id);
            if (existingGroup) {
                existingGroup.instances.push(card);
            } else {
                groups.push({ id: card.id, instances: [card], isFiltered });
            }
        });
    }

    // Overlap Calculation
    const cardWidth = mode === 'GRID' ? 160 : 140;
    const horizontalPadding = 60;
    const availableWidth = Math.max(0, containerWidth - horizontalPadding);
    const numItems = mode === 'GRID' ? groups.length : orderedItems.length;

    let overlap = 0;
    if (numItems > 1 && mode !== 'GRID') {
        const totalNaturalWidth = numItems * cardWidth;
        if (totalNaturalWidth > availableWidth) {
            overlap = Math.min(cardWidth - 40, (totalNaturalWidth - availableWidth) / (numItems - 1));
        }
    }

    return (
        <div className={`universal-overlay ${mode.toLowerCase()}-mode`} ref={containerRef}>
            {/* Header Removed as per user request (handled by DraggableWindow title) */}

            <div className="overlay-content">
                {mode === 'GRID' ? (
                    <div className="grid-layout">
                        {groups.map((group, idx) => {
                            const selectedCount = group.instances.filter(inst => selectedIds.includes(inst.instanceId)).length;
                            const isPartiallySelected = selectedCount > 0;
                            return (
                                <div
                                    key={group.id}
                                    className={`group-item ${group.isFiltered ? 'dimmed' : ''}`}
                                    onClick={() => !group.isFiltered && onToggleCard?.(group.instances.find(i => !selectedIds.includes(i.instanceId))?.instanceId || group.instances[0].instanceId, group.id)}
                                >
                                    <AnimatedCard
                                        cardId={group.id}
                                        instanceId={group.instances[0].instanceId}
                                        index={idx}
                                        variant="full"
                                        selectionVariant={highlightedIds.includes(group.instances[0].instanceId) ? 'red' : 'blue'}
                                        selected={isPartiallySelected}
                                        selectionMode={!group.isFiltered}
                                        dimmed={group.isFiltered}
                                        showCount={group.instances.length > 1}
                                        count={group.instances.length}
                                    >
                                        {isPartiallySelected && (
                                            <div className="selection-badge">
                                                {selectedCount > 1 ? selectedCount : '✓'}
                                            </div>
                                        )}
                                        {group.instances[0].durationTurns !== undefined && group.instances[0].durationTurns > 0 && (
                                            <div className="duration-turns-badge" style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                right: '-5px',
                                                background: '#ffd700',
                                                color: '#000',
                                                borderRadius: '12px',
                                                padding: '2px 6px',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                                zIndex: 10
                                            }}>
                                                {group.instances[0].durationTurns} ⏳
                                            </div>
                                        )}
                                    </AnimatedCard>
                                </div>
                            );
                        })}
                    </div>
                ) : mode === 'REVEAL' ? (
                    <div className="reveal-content">
                        <div className="card-grid">
                            {cards.map((card, i) => (
                                <AnimatedCard
                                    key={`${card.instanceId}-${i}`}
                                    cardId={card.id}
                                    variant="full"
                                    selected={highlightedIds.includes(card.instanceId)}
                                    selectionVariant="red"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="reorder-layout">
                        <div className="direction-indicators">
                            <span className="indicator deep">{mode === 'INSERT' ? '← DESSUS' : '← BAS (Deep)'}</span>
                            <span className="indicator surface">{mode === 'INSERT' ? 'DESSOUS →' : 'HAUT (Top) →'}</span>
                        </div>
                        <Reorder.Group
                            axis="x"
                            values={orderedItems}
                            onReorder={setOrderedItems}
                            className="reorder-group"
                        >
                            {orderedItems.map((item, index) => {
                                const isTarget = mode === 'INSERT' ? item.isTarget : false;
                                return (
                                    <Reorder.Item
                                        key={item.instanceId || item.id}
                                        value={item}
                                        className="reorder-item"
                                        style={{ marginLeft: index === 0 ? 0 : -overlap, zIndex: index }}
                                        whileDrag={{ scale: 1.1, zIndex: 1000, boxShadow: "0 10px 40px rgba(0,0,0,0.8)", marginLeft: 0, marginRight: 20 }}
                                    >
                                        <div className={`card-wrapper ${isTarget ? 'highlight-target' : ''}`}>
                                            <CardFrame cardId={item.id || item.displayId} variant="full" />
                                            <div className="index-pill">{index + 1}</div>
                                        </div>
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    </div>
                )}
            </div>

            {(mode === 'REORDER' || mode === 'INSERT' || mode === 'REVEAL') && (
                <div className="overlay-footer">
                    {mode === 'REVEAL' && onAcknowledge ? (
                        <button className="confirm-btn-medieval" onClick={onAcknowledge}>
                            OK
                        </button>
                    ) : (
                        <button
                            className="confirm-btn-medieval"
                            onClick={() => {
                                if (mode === 'REORDER') {
                                    const finalOrder = [...orderedItems].reverse().map(c => c.instanceId);
                                    onConfirmOrder?.(finalOrder);
                                } else {
                                    const targetIdx = orderedItems.findIndex(i => i.isTarget);
                                    onConfirmInsert?.(targetIdx);
                                }
                            }}
                        >
                            Valider {mode === 'INSERT' ? 'la Position' : "l'Ordre"}
                        </button>
                    )}
                </div>
            )}

            {mode === 'REVEAL' && autoHideDuration && (
                <div className="reveal-progress-container">
                    <div className="reveal-progress-bar" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
};
