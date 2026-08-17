import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { CardFrame } from './CardFrame';
import { CardRegistry } from '../../shared/cards/index.js';
import { DecisionRequest } from '../../shared/engine/prompts/Prompt';
import { CardInstance } from '../../shared/engine/CardInstance';

interface SelectionOverlayProps {
    decision: DecisionRequest;
    playerHand: CardInstance[];
    playerDiscard: CardInstance[];
    revealedCards: CardInstance[];
    onConfirm: (selectedIds: string[]) => void;
    onCancel?: () => void;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
    decision,
    playerHand,
    playerDiscard,
    revealedCards,
    onConfirm,
    onCancel
}) => {
    const { message, constraints } = decision;
    const { min, max, sourceZone, filter, actionType = 'GENERIC' } = constraints;

    // 1. Source Resolution: Where do we pull cards from?
    const cardPool = useMemo(() => {
        const zone = (sourceZone || 'hand').toLowerCase();
        switch (zone) {
            case 'hand': return playerHand;
            case 'limbo':
            case 'revealed': return revealedCards;
            case 'discardpile':
            case 'discard': return playerDiscard;
            default: return playerHand;
        }
    }, [sourceZone, playerHand, playerDiscard, revealedCards]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // For REORDER mode
    const [reorderList, setReorderList] = useState<CardInstance[]>(cardPool);

    // Sync reorder list if card pool changes
    useEffect(() => {
        setReorderList(cardPool);
    }, [cardPool]);

    // Theme Configuration
    const THEMES = {
        TRASH: {
            color: '#e74c3c',
            label: 'Écarter',
            icon: '🗑️',
            glow: 'rgba(231, 76, 60, 0.4)'
        },
        DISCARD: {
            color: '#f39c12',
            label: 'Défausser',
            icon: '📥',
            glow: 'rgba(243, 156, 18, 0.4)'
        },
        GAIN: {
            color: '#2ecc71',
            label: 'Recevoir',
            icon: '✨',
            glow: 'rgba(46, 204, 113, 0.4)'
        },
        TOPDECK: {
            color: '#3498db',
            label: 'Placer sur la pioche',
            icon: '🔝',
            glow: 'rgba(52, 152, 219, 0.4)'
        },
        GENERIC: {
            color: '#95a5a6',
            label: 'Confirmer',
            icon: '✅',
            glow: 'rgba(149, 165, 166, 0.4)'
        }
    };

    const currentTheme = THEMES[actionType as keyof typeof THEMES] || THEMES.GENERIC;

    const isSelectable = (card: CardInstance) => {
        if (!filter) return true;
        const def = CardRegistry.get(card.id);
        if (!def) return true;

        if (filter.cardIds && !filter.cardIds.includes(card.id)) return false;
        if (filter.cardTypes && !filter.cardTypes.some(t => def.types.includes(t as any))) return false;
        if (filter.maxCost !== undefined && (def.cost || 0) > filter.maxCost) return false;
        return true;
    };

    const toggleSelection = (id: string) => {
        const card = cardPool.find(c => c.instanceId === id);
        if (card && !isSelectable(card)) return;

        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(sid => sid !== id);
            } else {
                if (prev.length < max) {
                    return [...prev, id];
                }
                if (max === 1) {
                    return [id];
                }
                return prev;
            }
        });
    };

    const handleConfirm = () => {
        if (decision.type === 'REORDER') {
            onConfirm(reorderList.map(c => c.instanceId));
        } else {
            onConfirm(selectedIds);
        }
    };

    const isReady = decision.type === 'REORDER' || (selectedIds.length >= min && selectedIds.length <= max);

    // --- REORDER Mode Renderer ---
    if (decision.type === 'REORDER') {
        return (
            <div className="selection-overlay-backdrop universal-selector reorder-mode">
                <div className="selection-container">
                    <div className="selection-header">
                        <h2>{message}</h2>
                        <p className="hint-text">Glissez pour réordonner (Haut = Sommet de pioche)</p>
                    </div>

                    <Reorder.Group axis="y" values={reorderList} onReorder={setReorderList} className="reorder-list-universal">
                        <AnimatePresence>
                            {reorderList.map((card, idx) => (
                                <Reorder.Item
                                    key={card.instanceId}
                                    value={card}
                                    className="reorder-item-universal"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <div className="reorder-card-row" style={{ borderLeft: `4px solid ${currentTheme.color}` }}>
                                        <span className="order-badge">{idx === 0 ? 'TOP' : idx + 1}</span>
                                        <span className="card-name-large">{CardRegistry.get(card.id)?.name}</span>
                                        <span className="drag-handle">☰</span>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>
                    </Reorder.Group>

                    <div className="selection-actions">
                        <button className="confirm-btn-universal primary" onClick={handleConfirm}>
                            {currentTheme.icon} Confirmer l'ordre
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- GRID Mode Renderer ---
    return (
        <div className="selection-overlay-backdrop universal-selector grid-mode" style={{ '--theme-color': currentTheme.color } as any}>
            <div className="selection-container">
                <div className="selection-header">
                    <h2>{message}</h2>
                    <div className="selection-stats">
                        <span className="count-tag">
                            {selectedIds.length} / {max === Infinity ? '∞' : max}
                        </span>
                        {min > 0 && <span className="min-tag">Min required: {min}</span>}
                    </div>
                </div>

                <div className="selection-grid">
                    {cardPool.map(card => {
                        const selected = selectedIds.includes(card.instanceId);
                        const selectable = isSelectable(card);

                        return (
                            <motion.div
                                key={card.instanceId}
                                className={`selection-card-wrapper ${selected ? 'selected' : ''} ${selectable ? 'selectable' : 'filtered'}`}
                                onClick={() => selectable && toggleSelection(card.instanceId)}
                                whileHover={selectable ? { y: -8, scale: 1.02 } : {}}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <div className="card-outer-frame" style={{
                                    borderColor: selected ? currentTheme.color : 'transparent',
                                    boxShadow: selected ? `0 0 20px ${currentTheme.glow}` : 'none'
                                }}>
                                    <CardFrame
                                        cardId={card.id}
                                        variant="full"
                                        selected={selected}
                                        disabled={!selectable}
                                    />
                                    {selected && (
                                        <div className="selection-check" style={{ backgroundColor: currentTheme.color }}>
                                            {currentTheme.icon}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="selection-actions">
                    {onCancel && (
                        <button className="confirm-btn-universal secondary" onClick={onCancel}>
                            Annuler
                        </button>
                    )}
                    <button
                        className="confirm-btn-universal primary"
                        onClick={handleConfirm}
                        disabled={!isReady}
                        style={{ backgroundColor: isReady ? currentTheme.color : '#444' }}
                    >
                        {currentTheme.icon} {currentTheme.label} {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};
