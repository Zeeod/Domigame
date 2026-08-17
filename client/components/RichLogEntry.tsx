import React from 'react';
import { LogEntry, LogPayload } from '../../shared/types/Log';
import { CardRegistry } from '../../shared/cards';
import { useCardInspect } from '../context/CardInspectContext';

import { motion } from 'framer-motion';

interface RichLogEntryProps {
    entry: LogEntry;
    players: { id: string; name: string; color: string }[];
    isRewindable?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
}

const LOG_ICONS: Record<string, string> = {
    PLAY_CARD: '🃏',
    BUY_CARD: '🪙',
    GAIN_CARD: '📥',
    TRASH_CARD: '🗑️',
    DRAW_CARDS: '🎴',
    DISCARD_CARDS: '♻️',
    ATTACK: '⚔️',
    REACTION: '🛡️',
    PHASE_CHANGE: '',
    TURN_START: '🔄',
    EFFECT_CHOICE: '🎯',
    REVEAL: '👁️',
    GAME_OVER: '🏆',
    TEXT: '',
};

export const RichLogEntry: React.FC<RichLogEntryProps> = ({ entry, players, isRewindable, isSelected, onSelect }) => {
    const { setHovered, clearHovered } = useCardInspect();
    const player = players.find(p => p.id === entry.playerId);
    const color = player?.color || '#ccc';

    const renderPayload = (payload: LogPayload) => {
        if (!payload) return null;

        // Helper to render card link/tooltip
        const renderCard = (cardId: string) => {
            const card = CardRegistry.get(cardId);
            if (!card) return <span>{cardId}</span>;

            const pngPath = `/card-images/${cardId}.png`;
            const jpgPath = `/card-images/${cardId}.jpg`;

            return (
                <span
                    className="log-card-link"
                    onMouseEnter={(e) => setHovered(cardId, e.clientX, e.clientY)}
                    onMouseLeave={clearHovered}
                >
                    <div className="log-card-micro-icon">
                        <img
                            src={pngPath}
                            alt=""
                            onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src.endsWith('.png')) {
                                    target.src = jpgPath;
                                } else {
                                    target.style.display = 'none';
                                }
                            }}
                        />
                    </div>
                    <span className="log-card-name clickable">
                        {card.name}
                    </span>
                </span>
            );
        };

        const renderCards = (cardIds: string[]) => {
            if (!cardIds || cardIds.length === 0) return null;
            return cardIds.map((id, i) => (
                <React.Fragment key={i}>
                    {i > 0 && ', '}
                    {renderCard(id)}
                </React.Fragment>
            ));
        };

        switch (entry.type) {
            case 'PLAY_CARD':
                return (
                    <>
                        joue {payload.cardId && renderCard(payload.cardId)}
                        {payload.wayId && <> en tant que {renderCard(payload.wayId)}</>}
                    </>
                );
            case 'BUY_CARD':
                return <>achète {payload.cardId && renderCard(payload.cardId)}</>;
            case 'GAIN_CARD':
                return (
                    <>
                        gagne {payload.cardId && renderCard(payload.cardId)}
                        {payload.destZone && payload.destZone !== 'discardPile' && ` (${payload.destZone})`}
                        {payload.source && ` depuis ${payload.source}`}
                    </>
                );
            case 'TRASH_CARD':
                return (
                    <>
                        écarte {payload.cardIds ? renderCards(payload.cardIds) : payload.cardId && renderCard(payload.cardId)}
                    </>
                );
            case 'DRAW_CARDS':
                return <>pioche {payload.amount} cartes</>;
            case 'DISCARD_CARDS':
                return (
                    <>
                        défausse {payload.cardIds ? renderCards(payload.cardIds) : `${payload.amount || 0} cartes`}
                    </>
                );
            case 'ATTACK':
                return <>attaque avec {payload.cardId && renderCard(payload.cardId)}</>;
            case 'REACTION':
                return <>révèle {payload.cardId && renderCard(payload.cardId)}</>;
            case 'PHASE_CHANGE':
                return <span className="log-phase-header">--- {payload.text} ---</span>;
            case 'TURN_START':
                return <span className="log-turn-header">Tour {payload.index || '?'} - {player?.name}</span>;
            case 'EFFECT_CHOICE':
                return <>choisit: {payload.text || '...'}</>;
            case 'TEXT':
            default:
                return <span>{payload.text || (entry as any).message || ''}</span>;
        }
    };

    const isHeader = entry.type === 'PHASE_CHANGE' || entry.type === 'TURN_START';
    const icon = LOG_ICONS[entry.type] || '';

    return (
        <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={`journal-entry type-${entry.type} ${isRewindable ? 'rewindable' : ''} ${isSelected ? 'selected' : ''}`}
            style={{
                borderLeftColor: isHeader ? 'transparent' : color,
                borderLeftWidth: isHeader ? 0 : 3,
                paddingLeft: isHeader ? 0 : undefined
            }}
            onClick={isRewindable ? onSelect : undefined}
        >
            <span className="entry-content">
                {icon && <span className="log-icon" aria-hidden="true">{icon}</span>}
                {!isHeader && player && <span className="player-name" style={{ color: color, marginRight: '4px', fontWeight: 'bold' }}>{player.name}</span>}
                {renderPayload(entry.payload || { text: (entry as any).message })}
            </span>
        </motion.div>
    );
};

