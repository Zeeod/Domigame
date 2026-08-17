import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PhaseNotification.css';

interface PhaseNotificationProps {
    phase: string;
    isMyTurn: boolean;
    turnNumber: number;
}

const PHASE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    'ACTION': { label: 'ACTION', icon: '⚡', color: '#3498db' },
    'BUY': { label: 'ACHAT', icon: '💰', color: '#f1c40f' },
    'CLEANUP': { label: 'NETTOYAGE', icon: '♻️', color: '#95a5a6' },
    'START': { label: 'DÉB.', icon: '🏁', color: '#2ecc71' },
};

export const PhaseNotification: React.FC<PhaseNotificationProps> = ({ phase, isMyTurn, turnNumber }) => {
    const [displayPhase, setDisplayPhase] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (phase === 'START' || phase === 'GAME_OVER' || phase === 'PREGAME') return;

        setDisplayPhase(phase);
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [phase, isMyTurn, turnNumber]);

    const config = PHASE_CONFIG[displayPhase || ''] || { label: displayPhase, icon: '✨', color: '#fff' };

    return (
        <div className="phase-notification-v3">
            <AnimatePresence mode="wait">
                {isVisible && (
                    <motion.div
                        key={displayPhase}
                        className="p-notif-pill"
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{ '--phase-color': config.color } as any}
                    >
                        <span className="p-notif-icon">{config.icon}</span>
                        <span className="p-notif-label">{config.label}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
