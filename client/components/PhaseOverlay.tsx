import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PhaseOverlay.css';

interface PhaseOverlayProps {
    phase: string;
    isMyTurn: boolean;
    turnNumber: number;
}

const PHASE_CONFIG: Record<string, { label: string; sub: string; icon: string; color: string }> = {
    'ACTION': { label: 'PHASE ACTION', sub: 'Jouez vos cartes Action', icon: '⚡', color: '#3498db' },
    'BUY': { label: 'PHASE ACHAT', sub: 'Acquérez de nouvelles cartes', icon: '💰', color: '#f1c40f' },
    'CLEANUP': { label: 'NETTOYAGE', sub: 'Préparation du prochain tour', icon: '♻️', color: '#95a5a6' },
    'START': { label: 'DÉMARRAGE', sub: 'Initialisation de la partie', icon: '🏁', color: '#2ecc71' },
};

export const PhaseOverlay: React.FC<PhaseOverlayProps> = ({ phase, isMyTurn, turnNumber }) => {
    const [displayPhase, setDisplayPhase] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger on phase change or turn change
        if (phase === 'START' || phase === 'GAME_OVER') return;

        setDisplayPhase(phase);
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 1800);

        return () => clearTimeout(timer);
    }, [phase, isMyTurn, turnNumber]);

    const config = PHASE_CONFIG[displayPhase || ''] || { label: displayPhase, sub: '', icon: '✨', color: '#fff' };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="phase-overlay-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="phase-overlay-content"
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 100 }}
                        style={{ '--phase-color': config.color } as any}
                    >
                        <div className="phase-icon-bg">{config.icon}</div>
                        <div className="phase-info">
                            <motion.h1
                                initial={{ letterSpacing: '10px', opacity: 0 }}
                                animate={{ letterSpacing: '4px', opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                            >
                                {config.label}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.7 }}
                                transition={{ delay: 0.3 }}
                            >
                                {isMyTurn ? config.sub : 'Attente de l\'adversaire...'}
                            </motion.p>
                        </div>
                        {isMyTurn && (
                            <div className="phase-indicator-bar" />
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
