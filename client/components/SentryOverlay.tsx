import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardInstance } from '../../shared/engine/CardInstance';
import { AnimatedCard } from './AnimatedCard';
import './SentryOverlay.css';

interface SentryOverlayProps {
    cards: CardInstance[];
    onComplete: (actions: { trash: string[], discard: string[], reorder: string[] }) => void;
}

export const SentryOverlay: React.FC<SentryOverlayProps> = ({ cards, onComplete }) => {
    const [phase, setPhase] = useState<'PROCESS' | 'REORDER'>('PROCESS');
    const [revealed, setRevealed] = useState<CardInstance[]>(cards);
    const [trashed, setTrashed] = useState<CardInstance[]>([]);
    const [discarded, setDiscarded] = useState<CardInstance[]>([]);
    const [reorderList, setReorderList] = useState<CardInstance[]>([]);

    const trashRef = useRef<HTMLDivElement>(null);
    const discardRef = useRef<HTMLDivElement>(null);
    const centerRef = useRef<HTMLDivElement>(null);

    const handleDragEnd = (card: CardInstance, info: { point: { x: number, y: number } }, currentZone: 'CENTER' | 'TRASH' | 'DISCARD') => {
        const trashRect = trashRef.current?.getBoundingClientRect();
        const discardRect = discardRef.current?.getBoundingClientRect();
        const centerRect = centerRef.current?.getBoundingClientRect();

        const { x, y } = info.point;

        // Determine target zone based on coordinates
        if (trashRect && x >= trashRect.left && x <= trashRect.right && y >= trashRect.top && y <= trashRect.bottom) {
            if (currentZone !== 'TRASH') assignToZone(card, 'TRASH');
        } else if (discardRect && x >= discardRect.left && x <= discardRect.right && y >= discardRect.top && y <= discardRect.bottom) {
            if (currentZone !== 'DISCARD') assignToZone(card, 'DISCARD');
        } else if (centerRect && x >= centerRect.left && x <= centerRect.right && y >= centerRect.top && y <= centerRect.bottom) {
            if (currentZone !== 'CENTER') assignToZone(card, 'CENTER');
        }
    };

    const assignToZone = (card: CardInstance, target: 'TRASH' | 'DISCARD' | 'CENTER') => {
        const instanceId = card.instanceId;

        // Remove from current source
        setTrashed(prev => prev.filter(c => c.instanceId !== instanceId));
        setDiscarded(prev => prev.filter(c => c.instanceId !== instanceId));
        setRevealed(prev => prev.filter(c => c.instanceId !== instanceId));

        // Add to target
        if (target === 'TRASH') {
            setTrashed(prev => [...prev, card]);
        } else if (target === 'DISCARD') {
            setDiscarded(prev => [...prev, card]);
        } else if (target === 'CENTER') {
            setRevealed(prev => [...prev, card]);
        }
    };

    const handleTrashAll = () => {
        const remaining = [...revealed, ...discarded];
        setTrashed(prev => [...prev, ...remaining]);
        setRevealed([]);
        setDiscarded([]);
    };

    const handleDiscardAll = () => {
        const remaining = [...revealed, ...trashed];
        setDiscarded(prev => [...prev, ...remaining]);
        setRevealed([]);
        setTrashed([]);
    };

    const handleValidateProcess = () => {
        if (revealed.length > 1) {
            setReorderList([...revealed]);
            setPhase('REORDER');
        } else {
            onComplete({
                trash: trashed.map(c => c.instanceId),
                discard: discarded.map(c => c.instanceId),
                reorder: revealed.map(c => c.instanceId)
            });
        }
    };

    const handleConfirmReorder = () => {
        onComplete({
            trash: trashed.map(c => c.instanceId),
            discard: discarded.map(c => c.instanceId),
            reorder: reorderList.map(c => c.instanceId)
        });
    };

    const moveCard = (index: number, direction: 'UP' | 'DOWN') => {
        const newList = [...reorderList];
        const newIndex = direction === 'UP' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newList.length) return;

        const temp = newList[index];
        newList[index] = newList[newIndex];
        newList[newIndex] = temp;
        setReorderList(newList);
    };

    return (
        <div className="sentry-overlay-window">
            <div className="sentry-header">
                <h2 className="zone-title">Sentry : {phase === 'PROCESS' ? 'Écartez ou défaussez' : 'Réordonnez'}</h2>
                <div className="sentry-subtitle">
                    {phase === 'PROCESS'
                        ? "Glissez les cartes ou utilisez les boutons rapides."
                        : "Le haut de la liste sera le sommet de votre pioche."}
                </div>
            </div>

            {phase === 'PROCESS' ? (
                <div className="sentry-content">
                    <div className="sentry-layout">
                        {/* LEFT: TRASH */}
                        <div ref={trashRef} className="sentry-side-zone trash-zone">
                            <h3 className="zone-label">Écarter</h3>
                            <div className="zone-stack">
                                <AnimatePresence>
                                    {trashed.map((card, idx) => (
                                        <motion.div
                                            key={card.instanceId}
                                            drag
                                            dragSnapToOrigin
                                            onDragEnd={(_, info) => handleDragEnd(card, info, 'TRASH')}
                                            className="stacked-card-wrapper"
                                            style={{ zIndex: idx + 1 }}
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                        >
                                            <AnimatedCard cardId={card.id} instanceId={card.instanceId} variant="full" disableLayout />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {trashed.length === 0 && <div className="zone-placeholder">🗑️</div>}
                            </div>
                        </div>

                        {/* CENTER: REVEALED */}
                        <div ref={centerRef} className="sentry-center-area">
                            <div className="revealed-cards-container">
                                <AnimatePresence>
                                    {revealed.map((card) => (
                                        <motion.div
                                            key={card.instanceId}
                                            drag
                                            dragSnapToOrigin
                                            onDragEnd={(_, info) => handleDragEnd(card, info, 'CENTER')}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            whileDrag={{ scale: 1.05, zIndex: 100 }}
                                            className="draggable-card"
                                        >
                                            <div className="card-with-actions">
                                                <AnimatedCard
                                                    cardId={card.id}
                                                    instanceId={card.instanceId}
                                                    variant="full"
                                                    disableLayout
                                                />
                                                <div className="quick-actions-bar">
                                                    <button className="mini-action-btn trash" onClick={() => assignToZone(card, 'TRASH')}>🗑️</button>
                                                    <button className="mini-action-btn discard" onClick={() => assignToZone(card, 'DISCARD')}>📥</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {revealed.length === 0 && <div className="all-assigned-msg">Toutes les cartes sont assignées</div>}
                            </div>

                            <div className="sentry-bulk-actions">
                                <button className="bulk-btn trash-all" onClick={handleTrashAll} disabled={revealed.length === 0 && discarded.length === 0}>
                                    Tout écarter (Trash All)
                                </button>
                                <button className="bulk-btn discard-all" onClick={handleDiscardAll} disabled={revealed.length === 0 && trashed.length === 0}>
                                    Tout défausser (Discard All)
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: DISCARD */}
                        <div ref={discardRef} className="sentry-side-zone discard-zone">
                            <h3 className="zone-label">Défausser</h3>
                            <div className="zone-stack">
                                <AnimatePresence>
                                    {discarded.map((card, idx) => (
                                        <motion.div
                                            key={card.instanceId}
                                            drag
                                            dragSnapToOrigin
                                            onDragEnd={(_, info) => handleDragEnd(card, info, 'DISCARD')}
                                            className="stacked-card-wrapper"
                                            style={{ zIndex: idx + 1 }}
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                        >
                                            <AnimatedCard cardId={card.id} instanceId={card.instanceId} variant="full" disableLayout />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {discarded.length === 0 && <div className="zone-placeholder">📥</div>}
                            </div>
                        </div>
                    </div>

                    <div className="sentry-footer">
                        <button className="confirm-btn-medieval" onClick={handleValidateProcess}>
                            {revealed.length > 1 ? "Suivant (Réordonner)" : "Valider les choix"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="sentry-content reorder-phase">
                    <div className="reorder-stack">
                        {reorderList.map((card, index) => (
                            <motion.div
                                key={card.instanceId}
                                layout
                                className="reorder-item"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <span className="order-number">{index === 0 ? "SOMMET" : `#${index + 1}`}</span>
                                <div className="reorder-card-preview">
                                    <AnimatedCard cardId={card.id} instanceId={card.instanceId} variant="mini" />
                                </div>
                                <div className="reorder-controls">
                                    <button onClick={() => moveCard(index, 'UP')} disabled={index === 0}>▲</button>
                                    <button onClick={() => moveCard(index, 'DOWN')} disabled={index === reorderList.length - 1}>▼</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="sentry-footer">
                        <button className="confirm-btn-medieval secondary" onClick={() => setPhase('PROCESS')}>
                            Retour
                        </button>
                        <button className="confirm-btn-medieval" onClick={handleConfirmReorder}>
                            Confirmer l'ordre
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
