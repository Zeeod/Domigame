import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DeckStatsPanel.css';

export interface DeckStats {
    score: number;
    wealthDensity: number;
    vpDensity: number;
    cyclingCapacity: number;
}

interface DeckStatsPanelProps {
    stats: DeckStats | null;
    isVisible: boolean;
}

export const DeckStatsPanel: React.FC<DeckStatsPanelProps> = ({ stats, isVisible }) => {
    if (!stats) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="deck-stats-panel"
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                    <div className="stats-header">
                        <h3>ANALYSE DU DECK</h3>
                        <div className="stat-badge total-vp">
                            <span className="icon">🏆</span>
                            <span className="value">{stats.score}</span>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <StatItem
                            label="Densité Richesse"
                            value={stats.wealthDensity}
                            icon="💰"
                            color="#ffd700"
                            description="Or moyen par carte"
                            max={3}
                        />
                        <StatItem
                            label="Densité Victoire"
                            value={stats.vpDensity}
                            icon="🏰"
                            color="#00ff88"
                            description="PV moyen par carte"
                            max={1.5}
                        />
                        <StatItem
                            label="Capacité Cycle"
                            value={stats.cyclingCapacity}
                            icon="🔄"
                            color="#00d4ff"
                            description="Puissance de pioche/action"
                            max={10}
                        />
                    </div>

                    <div className="stats-footer">
                        <p>Visibilité stratégique active</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface StatItemProps {
    label: string;
    value: number;
    icon: string;
    color: string;
    description: string;
    max: number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, color, description, max }) => {
    const percentage = Math.min(100, (value / max) * 100);

    return (
        <div className="stat-item">
            <div className="stat-info">
                <span className="stat-icon" style={{ color }}>{icon}</span>
                <div className="stat-text">
                    <span className="stat-label">{label}</span>
                    <span className="stat-value">{value}</span>
                </div>
            </div>
            <div className="stat-progress-bg">
                <motion.div
                    className="stat-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}66` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
            <span className="stat-desc">{description}</span>
        </div>
    );
};
