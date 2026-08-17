import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import './GameOverScreen.css';
import { GameState } from '../hooks/useSocket';
import { ParticleOverlay, ParticleOverlayRef } from './ParticleOverlay';
import { CardRegistry } from '../../shared/cards/index';
import { useSound } from '../hooks/useSound';

interface GameOverScreenProps {
    gameState: GameState;
    onReturnToMenu: () => void;
}

// ============================================================================
// Confetti Canvas
// ============================================================================
const CONFETTI_COLORS = ['#ffd700', '#ff6b6b', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1', '#ff9f43'];

interface ConfettiPiece {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    rot: number;
    rotSpeed: number;
    color: string;
    opacity: number;
}

const ConfettiCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const piecesRef = useRef<ConfettiPiece[]>([]);
    const animRef = useRef<number>(0);

    const initPieces = useCallback(() => {
        const pieces: ConfettiPiece[] = [];
        const count = 120;
        for (let i = 0; i < count; i++) {
            pieces.push({
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * window.innerHeight * 0.5,
                w: 4 + Math.random() * 8,
                h: 6 + Math.random() * 12,
                vx: (Math.random() - 0.5) * 3,
                vy: 1.5 + Math.random() * 3,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                opacity: 0.8 + Math.random() * 0.2
            });
        }
        piecesRef.current = pieces;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        initPieces();

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of piecesRef.current) {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.rotSpeed;
                p.vy += 0.02; // Gravity
                p.vx *= 0.999; // Air resistance

                // Wrap around bottom
                if (p.y > canvas.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                    p.vy = 1.5 + Math.random() * 3;
                    p.opacity = Math.max(0.3, p.opacity - 0.1);
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [initPieces]);

    return (
        <canvas
            ref={canvasRef}
            className="confetti-canvas"
        />
    );
};

// ============================================================================
// Stagger Variants
// ============================================================================
const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.4
        }
    }
};

const rowVariants = {
    hidden: { opacity: 0, x: -40, scale: 0.95 },
    visible: {
        opacity: 1, x: 0, scale: 1,
        transition: { type: 'spring' as const, stiffness: 200, damping: 20 }
    }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 50 },
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring' as const, stiffness: 200, damping: 25, duration: 0.8 }
    }
};

const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
        opacity: 1, y: 0,
        transition: { delay: 0.2, duration: 0.6, ease: 'easeOut' as const }
    }
};

// ============================================================================
// Component
// ============================================================================
export const GameOverScreen: React.FC<GameOverScreenProps> = ({ gameState, onReturnToMenu }) => {
    const { players, gameResults, winnerId } = gameState.public;
    const particleRef = useRef<ParticleOverlayRef>(null);
    const { playSound } = useSound();

    // Victory sound + celebration burst on mount
    useEffect(() => {
        playSound('success', 0.5);

        const timer = setTimeout(() => {
            if (particleRef.current) {
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        particleRef.current?.addParticle('🏆', centerX + (Math.random() - 0.5) * 100, centerY - (Math.random() * 100), '#ffd700', 'vp');
                        particleRef.current?.addParticle('🎊', centerX + (Math.random() - 0.5) * 500, centerY - 100, '#a777e3', 'default');
                        particleRef.current?.addParticle('✨', centerX + (Math.random() - 0.5) * 500, centerY - 100, '#ffffff', 'default');
                    }, i * 120);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Helper to calculate badges
    const getBadges = (playerId: string) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return [];

        const badges: { label: string, icon: string, class: string }[] = [];

        const allCards = [
            ...(player as any).hand || [],
            ...(player as any).deck || [],
            ...player.discardPile,
            ...player.playArea,
            ...(player.mats ? Object.values(player.mats).flat() : [])
        ];

        const treasureCount = allCards.filter(c => CardRegistry.get(c.cardId)?.types.includes('TREASURE')).length;
        const actionCount = allCards.filter(c => CardRegistry.get(c.cardId)?.types.includes('ACTION')).length;
        const totalCount = allCards.length;

        const getPlayerTotal = (p: any) => [...p.hand, ...p.deck, ...p.discardPile, ...p.playArea, ...(p.mats ? Object.values(p.mats).flat() : [])];
        const getPlayerTreasure = (p: any) => getPlayerTotal(p).filter(c => CardRegistry.get(c.cardId)?.types.includes('TREASURE')).length;

        const isMostMagnat = players.every(p => p.id === playerId || treasureCount >= getPlayerTreasure(p));
        const isMostCollector = players.every(p => p.id === playerId || totalCount >= getPlayerTotal(p).length);

        if (isMostMagnat && treasureCount > 5) badges.push({ label: 'Le Magnat', icon: '💰', class: 'gold' });
        if (isMostCollector && totalCount > 30) badges.push({ label: 'Collectionneur', icon: '📚', class: 'blue' });
        if (actionCount > 12) badges.push({ label: 'Stratège', icon: '⚡', class: 'green' });

        return badges;
    };

    const results = gameResults || players.map(p => ({
        playerId: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        isWinner: p.id === winnerId
    }));

    const sortedResults = [...results].sort((a, b) => b.score - a.score);
    const winner = sortedResults.find(r => r.isWinner) || sortedResults[0];

    return (
        <div className="game-over-screen">
            <ConfettiCanvas />
            <ParticleOverlay ref={particleRef} />

            <motion.div
                className="game-over-modal"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="game-over-header"
                    variants={headerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <h1>Fin de la Partie</h1>
                    <div className="winner-announcement" style={{ color: winner?.color }}>
                        🏆 {winner?.name} triomphe ! 🏆
                    </div>
                </motion.div>

                <motion.div
                    className="score-board"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {sortedResults.map((result, index) => {
                        const badges = getBadges(result.playerId);
                        return (
                            <motion.div
                                key={result.playerId}
                                className={`score-row ${result.isWinner ? 'winner-row' : ''}`}
                                variants={rowVariants}
                            >
                                <div className="score-rank">#{index + 1}</div>
                                <div className="score-player">
                                    <div className="player-name-wrapper">
                                        <span className="player-indicator" style={{ backgroundColor: result.color, color: result.color }} />
                                        {result.name}
                                    </div>
                                    {badges.length > 0 && (
                                        <div className="mvp-badges">
                                            {badges.map(b => (
                                                <motion.span
                                                    key={b.label}
                                                    className={`mvp-badge ${b.class}`}
                                                    title={b.label}
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.8 + index * 0.2, type: 'spring' as const, stiffness: 300 }}
                                                >
                                                    {b.icon} {b.label}
                                                </motion.span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <motion.div
                                    className="score-value"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 + index * 0.15, type: 'spring' as const, stiffness: 250 }}
                                >
                                    {result.score}
                                    <span className="score-unit">VP</span>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                <motion.div
                    className="game-over-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                >
                    <motion.button
                        className="btn-premium"
                        onClick={onReturnToMenu}
                        whileHover={{ scale: 1.06, y: -3 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        Continuer
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    );
};
