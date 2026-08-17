import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhaseNotification } from './PhaseNotification';
import { useSound } from '../hooks/useSound';
import './ActionBar.css';

export interface ActionBarProps {
    // Game State
    phase: string;
    turnNumber: number; // Active player's turn number
    currentPlayerName: string;
    currentPlayerColor: string;
    isMyTurn: boolean;
    isWaiting?: boolean;

    // Resources (of the active player)
    actions: number;
    buys: number;
    coins: number;
    potions?: number;
    tokens?: Record<string, number>;

    // Instructions
    instruction: string;

    // Interaction
    hasPendingDecision: boolean;
    isValid: boolean;
    canPass: boolean;
    confirmText?: string;
    showConfirm?: boolean;

    // Handlers
    onEndPhase: () => void;
    onPlayTreasures?: () => void;
    onPayDebt?: (amount: number) => void;
    onConfirm?: () => void;
    onPass?: () => void;

    // Multi-Option Selection
    options?: { label: string }[];
    selectedOptionIndices?: number[];
    maxOptions?: number;
    onChooseOption?: (index: number) => void;
    onSubmitOptions?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
    phase,
    turnNumber,
    currentPlayerName,
    currentPlayerColor,
    isMyTurn,
    isWaiting = false,
    actions,
    buys,
    coins,
    potions = 0,
    tokens,
    instruction,
    hasPendingDecision,
    isValid,
    canPass,
    confirmText = 'Valider',
    showConfirm = true,
    onEndPhase,
    onPlayTreasures,
    onPayDebt,
    onConfirm,
    onPass,
    options,
    selectedOptionIndices = [],
    maxOptions = 1,
    onChooseOption,
    onSubmitOptions
}) => {
    const { playSound } = useSound();
    const prevCoins = useRef(coins);
    const prevActions = useRef(actions);
    const prevBuys = useRef(buys);

    // Track resource changes for pulse animation
    const coinsChanged = prevCoins.current !== coins;
    const actionsChanged = prevActions.current !== actions;
    const buysChanged = prevBuys.current !== buys;

    useEffect(() => {
        prevCoins.current = coins;
        prevActions.current = actions;
        prevBuys.current = buys;
    });

    const phaseLabels: Record<string, string> = {
        'ACTION': 'Phase Action',
        'BUY': 'Phase Achat',
        'CLEANUP': 'Nettoyage',
        'GAME_OVER': 'Fin de partie'
    };

    // Button animation variants
    const btnVariants = {
        hover: { scale: 1.06, y: -2, transition: { type: 'spring' as const, stiffness: 400, damping: 15 } },
        tap: { scale: 0.94, y: 1, transition: { duration: 0.1 } }
    };

    const btnDisabledVariants = {
        hover: {},
        tap: {}
    };

    return (
        <div className={`action-bar-v3 ${isMyTurn && !isWaiting ? 'active-turn' : ''} ${hasPendingDecision ? 'decision-active' : ''}`}>

            {/* LEFT: Resources */}
            <div className="ab-section resources">
                <div className={`res-group ${actionsChanged ? 'res-pulse' : ''}`} title="Actions restantes">
                    <motion.span
                        key={`a-${actions}`}
                        className="res-value"
                        initial={actionsChanged ? { scale: 1.4, color: '#22c55e' } : false}
                        animate={{ scale: 1, color: '#fff' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >{actions}</motion.span>
                    <span className="res-label">{actions > 1 ? 'actions' : 'action'}</span>
                </div>
                <div className={`res-group ${buysChanged ? 'res-pulse' : ''}`} title="Achats restants">
                    <motion.span
                        key={`b-${buys}`}
                        className="res-value"
                        initial={buysChanged ? { scale: 1.4, color: '#3b82f6' } : false}
                        animate={{ scale: 1, color: '#fff' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >{buys}</motion.span>
                    <span className="res-label">{buys > 1 ? 'achats' : 'achat'}</span>
                </div>
                <div className={`res-group coins ${coinsChanged ? 'res-pulse-gold' : ''}`} title="Pièces disponibles">
                    <motion.span
                        key={`c-${coins}`}
                        className="res-value"
                        initial={coinsChanged ? { scale: 1.5, color: '#fff' } : false}
                        animate={{ scale: 1, color: '#ffd700' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >{coins}</motion.span>
                    <span className="res-label">💰</span>
                </div>
                {potions > 0 && (
                    <div className="res-group potions" title="Potions disponibles">
                        <span className="res-value">{potions}</span>
                        <span className="res-label">⚗️</span>
                    </div>
                )}
                {/* Tokens (Generic) */}
                {tokens && Object.entries(tokens).length > 0 && (
                    <div className="res-group tokens">
                        {Object.entries(tokens).map(([key, val]) => {
                            if (val <= 0) return null;
                            if (key === 'debt') {
                                return (
                                    <div key={key} className="res-group debt" title="Dette à rembourser" style={{ marginRight: '8px' }}>
                                        <div className="debt-hexagon mini">{val}</div>
                                        <span className="res-label">Dette</span>
                                    </div>
                                );
                            }
                            return (
                                <div key={key} className="mini-token" title={key} style={{ marginRight: '5px' }}>
                                    {key.charAt(0).toUpperCase()}: {val}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CENTER: Instructions & Core Buttons */}
            <div className="ab-section center-module">
                <div className="instruction-zone">
                    <span className="instruction-text">{instruction || "Attente..."}</span>
                </div>

                <div className="buttons-zone">
                    {/* Multi-Option Selection Hub */}
                    {hasPendingDecision && options && options.length > 0 ? (
                        <div className="options-hub">
                            <div className="options-grid">
                                {options.map((opt, idx) => {
                                    const isSelected = selectedOptionIndices.includes(idx);
                                    return (
                                        <motion.button
                                            key={idx}
                                            className={`opt-btn ${isSelected ? 'selected' : ''}`}
                                            onClick={() => { playSound('click', 0.3); onChooseOption?.(idx); }}
                                            variants={btnVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            {opt.label}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            {maxOptions > 1 && (
                                <motion.button
                                    className="indicator-btn btn-primary"
                                    onClick={() => { playSound('click', 0.4); onSubmitOptions?.(); }}
                                    disabled={selectedOptionIndices.length < 1}
                                    variants={selectedOptionIndices.length >= 1 ? btnVariants : btnDisabledVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                >
                                    Valider ({selectedOptionIndices.length}/{maxOptions})
                                </motion.button>
                            )}
                        </div>
                    ) : hasPendingDecision ? (
                        <div className="decision-row">
                            {canPass && onPass && (
                                <motion.button className="indicator-btn btn-secondary" onClick={() => { playSound('click', 0.3); onPass(); }} variants={btnVariants} whileHover="hover" whileTap="tap">Passer</motion.button>
                            )}
                            {onConfirm && showConfirm && (
                                <motion.button
                                    className={`indicator-btn btn-primary ${isValid ? 'valid' : ''}`}
                                    onClick={() => { playSound('click', 0.4); onConfirm(); }}
                                    disabled={!isValid}
                                    variants={isValid ? btnVariants : btnDisabledVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                >
                                    {confirmText}
                                </motion.button>
                            )}
                            {!onConfirm && !canPass && (
                                <motion.span
                                    className="decision-wait-text"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >Décision en cours...</motion.span>
                            )}
                        </div>
                    ) : (
                        <div className="standard-row">
                            {isMyTurn && !isWaiting && phase === 'BUY' && (tokens?.debt || 0) > 0 && coins > 0 && onPayDebt && (
                                <motion.button
                                    className="indicator-btn btn-debt-payoff"
                                    onClick={() => { playSound('coins', 0.4); onPayDebt(Math.min(coins, (tokens?.debt || 0))); }}
                                    variants={btnVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                >
                                    💸 REMBOURSER ({Math.min(coins, (tokens?.debt || 0))})
                                </motion.button>
                            )}
                            {isMyTurn && !isWaiting && phase === 'BUY' && onPlayTreasures && (
                                <motion.button className="indicator-btn btn-treasure" onClick={() => { playSound('coins', 0.4); onPlayTreasures(); }} variants={btnVariants} whileHover="hover" whileTap="tap">💰 TOUT JOUER</motion.button>
                            )}
                            {isMyTurn && !isWaiting && onEndPhase && (
                                <motion.button className="indicator-btn btn-phase-end" onClick={() => { playSound('click', 0.4); onEndPhase(); }} variants={btnVariants} whileHover="hover" whileTap="tap">
                                    {phase === 'ACTION' ? '🛒 ACHETER' : 'FIN DU TOUR'}
                                </motion.button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* NOTIFICATION ZONE (New) */}
            <div className="ab-section notification-zone">
                <PhaseNotification
                    phase={phase}
                    isMyTurn={isMyTurn}
                    turnNumber={turnNumber}
                />
            </div>

            {/* RIGHT: Active Player Info & Utils */}
            <div className="ab-section player-info">
                <div className="turn-meta">
                    <span className="turn-count">Tour {turnNumber}</span>
                    <span className="phase-count">{phaseLabels[phase] || phase}</span>
                </div>
                <div className="player-badge" style={{ borderColor: currentPlayerColor }}>
                    <span className="player-indicator-dot" style={{ backgroundColor: currentPlayerColor }} />
                    <span className="player-name">{currentPlayerName}</span>
                </div>
            </div>
        </div>
    );
};
