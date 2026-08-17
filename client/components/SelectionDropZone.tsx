import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFrame } from './CardFrame';
import './SelectionDropZone.css';

interface SelectionDropZoneProps {
    selectedCards: Array<{
        id: string;
        cardId: string;
        source: 'HAND' | 'SUPPLY';
    }>;
    onRemove: (id: string) => void;
    onConfirm: () => void;
    onPass?: () => void;
    isValid: boolean;
    instruction?: string;
    constraints?: {
        min?: number;
        max?: number;
    };
}

export const SelectionDropZone: React.FC<SelectionDropZoneProps> = ({
    selectedCards,
    onRemove,
    constraints
}) => {
    return (
        <div className="selection-drop-zone">
            <div className="drop-zone-overlay" />

            <div className="drop-zone-content">
                <div className="drop-zone-header">
                    {/* Header Removed - Instruction moved to Action Bar */}
                    {constraints && (
                        <div className="drop-count">
                            {selectedCards.length} / {constraints.max || '∞'}
                        </div>
                    )}
                </div>

                <div className="drop-zone-cards">
                    <AnimatePresence>
                        {selectedCards.length === 0 && (
                            <motion.div
                                className="drop-zone-placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <span className="placeholder-icon">👆</span>
                                <span>Cliquez sur vos cartes<br />pour les sélectionner</span>
                            </motion.div>
                        )}
                        {(() => {
                            // Group selected cards by cardId for stacking
                            const groupedSelection: { cardId: string; instances: string[] }[] = [];
                            selectedCards.forEach(c => {
                                const group = groupedSelection.find(g => g.cardId === c.cardId);
                                if (group) group.instances.push(c.id);
                                else groupedSelection.push({ cardId: c.cardId, instances: [c.id] });
                            });

                            return groupedSelection.map((group) => (
                                <motion.div
                                    key={group.cardId}
                                    layoutId={group.cardId} // Animate by card type
                                    className="selected-card-item full-size"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    // Remove one instance on click
                                    onClick={() => onRemove(group.instances[0])}
                                >
                                    <CardFrame
                                        cardId={group.cardId}
                                        variant="full" // Request: Same size as hand
                                        showCost={false}
                                        showCount={group.instances.length > 1}
                                        count={group.instances.length} // Show stack count
                                    />
                                    <div className="remove-overlay">✕</div>
                                </motion.div>
                            ));
                        })()}
                    </AnimatePresence>
                </div>

                {/* Actions Removed - Moved to Action Bar */}
            </div>
        </div>
    );
};
