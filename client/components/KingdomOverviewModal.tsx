import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicGameState } from '../../shared/types/SerializedState';
import { KingdomHelper, KingdomCardGroup } from '../utils/KingdomHelper';
import { CardFrame } from './CardFrame';
import './KingdomOverviewModal.css';

interface KingdomOverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: PublicGameState;
}

/**
 * KingdomOverviewModal - A full-screen overlay displaying all cards in the current game.
 * Organized by category and sorted by cost then name.
 */
export const KingdomOverviewModal: React.FC<KingdomOverviewModalProps> = ({ isOpen, onClose, gameState }) => {
    // Aggregate cards from game state
    const cardGroups = useMemo(() => KingdomHelper.getAllGameCards(gameState), [gameState]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="kingdom-modal-container">
                    {/* Backdrop */}
                    <motion.div
                        className="kingdom-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Content */}
                    <motion.div
                        className="kingdom-modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="kingdom-modal-header">
                            <div className="header-decoration left" />
                            <h2 className="kingdom-modal-title">RÉSUMÉ DU ROYAUME</h2>
                            <div className="header-decoration right" />
                            <button className="kingdom-modal-close" onClick={onClose} title="Fermer">
                                &times;
                            </button>
                        </div>

                        <div className="kingdom-modal-body custom-scrollbar">
                            {cardGroups.map((group: KingdomCardGroup) => (
                                <div key={group.title} className="kingdom-section">
                                    <div className="section-header">
                                        <h3 className="section-title">{group.title}</h3>
                                        <div className="section-line" />
                                    </div>
                                    <div className="kingdom-card-grid">
                                        {group.cards.map(card => (
                                            <div key={card.id} className="kingdom-card-item">
                                                <CardFrame
                                                    cardId={card.id}
                                                    variant="full"
                                                    showCount={false}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="kingdom-modal-footer">
                            <button className="kingdom-footer-close-btn" onClick={onClose}>
                                RETOUR AU JEU
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
