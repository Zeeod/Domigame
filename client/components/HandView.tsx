/**
 * HandView - Player's hand display
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardInspect } from '../context/CardInspectContext';
import { CardRegistry } from '../../shared/cards';
import { CardFrame } from './CardFrame';
import { LandscapeRegistry } from '../../shared/cards/landscapes';
import { LandscapeDefinition } from '../../shared/types/LandscapeDefinition';
import './HandView.css';

interface CardData {
    id: string;
    instanceId: string;
    name: string;
}

interface HandViewProps {
    hand: CardData[];
    playArea: CardData[];
    canPlay: boolean;
    actions: number;
    phase: string;
    landscapes: string[];
    onPlayCard: (cardInstanceId: string, wayId?: string) => void;
}

export const HandView: React.FC<HandViewProps> = ({
    hand,
    playArea,
    canPlay,
    actions,
    phase,
    landscapes,
    onPlayCard
}) => {
    const [waySelectionCardId, setWaySelectionCardId] = React.useState<string | null>(null);

    const availableWays = React.useMemo(() => {
        return (landscapes || [])
            .map(id => LandscapeRegistry.get(id))
            .filter(l => l && l.types.includes('WAY')) as LandscapeDefinition[];
    }, [landscapes]);

    const canPlayCard = (card: CardData) => {
        if (!canPlay) return false;

        const def = CardRegistry.get(card.id);
        if (!def) return false;

        const isAction = def.types.includes('ACTION');
        const isTreasure = def.types.includes('TREASURE');

        if (phase === 'ACTION') {
            if (isAction) {
                return actions > 0;
            }
            return isTreasure; // Most treasures are played in Buy phase, but some can be played via Actions
        }

        if (phase === 'BUY') {
            return isTreasure;
        }

        return false;
    };

    const handleCardClick = (card: CardData) => {
        if (!canPlayCard(card)) return;

        const def = CardRegistry.get(card.id);
        const isAction = def?.types.includes('ACTION');

        if (isAction && availableWays.length > 0 && phase === 'ACTION') {
            setWaySelectionCardId(card.instanceId);
        } else {
            onPlayCard(card.instanceId);
        }
    };

    const { setHovered, clearHovered, setZoomed } = useCardInspect();

    const handleHover = (e: React.MouseEvent, cardId: string) => {
        setHovered(cardId, e.clientX, e.clientY);
    };

    const handleZoom = (e: React.MouseEvent, cardId: string) => {
        e.preventDefault();
        setZoomed(cardId);
    };

    return (
        <div className="hand-view">
            {/* Play Area */}
            {playArea.length > 0 && (
                <div className="play-area">
                    <div className="play-area-label">Zone de jeu</div>
                    <div className="play-area-cards">
                        <AnimatePresence>
                            {playArea.map((card, index) => (
                                <motion.div
                                    key={card.instanceId}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
                                    className="played-card-wrapper"
                                    onMouseEnter={(e: any) => handleHover(e, card.id)}
                                    onMouseMove={(e: any) => handleHover(e, card.id)}
                                    onMouseLeave={clearHovered}
                                    onContextMenu={(e: any) => handleZoom(e, card.id)}
                                >
                                    <CardFrame cardId={card.id} variant="mini" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Hand */}
            <div className="hand-cards">
                <AnimatePresence>
                    {hand.map((card) => (
                        <motion.div
                            key={card.instanceId}
                            layout
                            initial={{ opacity: 0, y: 100, scale: 0.8, rotate: Math.random() * 10 - 5 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, y: -50, scale: 0.8, transition: { duration: 0.2 } }}
                            whileHover={canPlayCard(card) ? { y: -20, scale: 1.1, zIndex: 10, transition: { type: 'spring', stiffness: 400, damping: 25 } } : { y: -5, scale: 1.02 }}
                            whileTap={canPlayCard(card) ? { scale: 0.95 } : {}}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            onClick={() => handleCardClick(card)}
                            onMouseEnter={(e: any) => handleHover(e, card.id)}
                            onMouseMove={(e: any) => handleHover(e, card.id)}
                            onMouseLeave={clearHovered}
                            onContextMenu={(e: any) => handleZoom(e, card.id)}
                            className={canPlayCard(card) ? 'playable-wrapper' : 'disabled-wrapper'}
                            style={{ cursor: canPlayCard(card) ? 'pointer' : 'not-allowed', opacity: canPlayCard(card) ? 1 : 0.6 }}
                        >
                            <CardFrame cardId={card.id} variant="full" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Way Selection Overlay */}
            <AnimatePresence>
                {waySelectionCardId && (
                    <motion.div 
                        className="way-selection-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setWaySelectionCardId(null)}
                    >
                        <motion.div 
                            className="way-selection-content"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>Jouer en tant que...</h3>
                            <div className="way-options">
                                <button 
                                    className="way-option-btn normal"
                                    onClick={() => {
                                        onPlayCard(waySelectionCardId);
                                        setWaySelectionCardId(null);
                                    }}
                                >
                                    Effet normal
                                </button>
                                {availableWays.map(way => (
                                    <button 
                                        key={way.id}
                                        className="way-option-btn way"
                                        onClick={() => {
                                            onPlayCard(waySelectionCardId, way.id);
                                            setWaySelectionCardId(null);
                                        }}
                                    >
                                        {way.name}
                                    </button>
                                ))}
                            </div>
                            <button className="cancel-btn" onClick={() => setWaySelectionCardId(null)}>Annuler</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
