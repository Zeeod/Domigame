import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CardFrame } from './CardFrame';
import './SelectionTray.css';

interface SelectionTrayProps {
    selectedCards: Array<{
        id: string;
        cardId: string;
        source: 'HAND' | 'SUPPLY';
    }>;
    onRemove: (id: string) => void;
    min?: number;
    max?: number;
    onConfirm?: () => void;
    onCancel?: () => void;
    isValid?: boolean;
    confirmText?: string;
}

export const SelectionTray: React.FC<SelectionTrayProps> = ({
    selectedCards,
    onRemove,
    min = 0,
    max,
    onConfirm,
    onCancel,
    isValid = true,
    confirmText = 'Valider'
}) => {
    if (selectedCards.length === 0 && (!max || max === 0)) return null;

    return (
        <>
            <div className="selection-tray-header">
                <span className="selection-count">
                    SÉLECTION : <strong>{selectedCards.length}</strong>
                    {max ? ` / ${max}` : ''}
                    {min > 0 && ` (Min: ${min})`}
                </span>
                <div className="selection-actions">
                    {onCancel && (
                        <button className="tray-btn btn-reset" onClick={onCancel} title="Tout désélectionner">
                            Réinitialiser
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            className={`tray-btn btn-confirm ${isValid ? 'valid' : ''}`}
                            onClick={onConfirm}
                            disabled={!isValid}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>

            <div className="selection-tray-items">
                <AnimatePresence>
                    {selectedCards.map((card) => (
                        <motion.div
                            key={card.id}
                            layoutId={`tray-${card.id}`}
                            initial={{ scale: 0, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, x: -20 }}
                            className="tray-card-item"
                            onClick={() => onRemove(card.id)}
                        >
                            <div className="tray-card-preview">
                                <CardFrame
                                    cardId={card.cardId}
                                    variant="full"
                                    showCost={false}
                                    showCount={false}
                                />
                                <div className="tray-remove-hint">✕</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty slots placeholders if max is defined and tray not full */}
                {max && max < 10 && Array.from({ length: Math.max(0, max - selectedCards.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="tray-card-placeholder" />
                ))}
            </div>
        </>
    );
};
