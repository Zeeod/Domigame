import React from 'react';
import ReactDOM from 'react-dom';
import { useCardInspect } from '../context/CardInspectContext';
import { CardRegistry } from '../../shared/cards';

const TYPE_COLORS: Record<string, string> = {
    victory: '#27ae60',
    treasure: '#f1c40f',
    action: '#3498db',
    attack: '#e74c3c',
    reaction: '#9b59b6',
    curse: '#8e44ad',
    unknown: '#7f8c8d'
};

const TYPE_BG_COLORS: Record<string, string> = {
    victory: 'rgba(39, 174, 96, 0.15)',
    treasure: 'rgba(241, 196, 15, 0.15)',
    action: 'rgba(52, 152, 219, 0.15)',
    attack: 'rgba(231, 76, 60, 0.15)',
    reaction: 'rgba(155, 89, 182, 0.15)',
    curse: 'rgba(142, 68, 173, 0.15)',
    unknown: 'rgba(127, 140, 141, 0.15)'
};

import { getCardDynamicStatus } from '../utils/CardStatusHelper';
import { GameState } from '../hooks/useSocket';

export const CardTooltip: React.FC<{ gameState?: GameState | null }> = ({ gameState }) => {
    const { hoveredCardId, hoveredInstanceId, hoveredPosition } = useCardInspect();

    if (!hoveredCardId || !hoveredPosition) return null;

    const card = CardRegistry.get(hoveredCardId);
    if (!card) return null;

    const primaryType = CardRegistry.getPrimaryType(hoveredCardId);
    const borderColor = TYPE_COLORS[primaryType] || TYPE_COLORS.unknown;
    const bgColor = TYPE_BG_COLORS[primaryType] || TYPE_BG_COLORS.unknown;

    // Position calculation - avoid screen edges
    const tooltipWidth = 220;
    const tooltipHeight = 180;
    const margin = 15;

    let x = hoveredPosition.x + margin;
    let y = hoveredPosition.y + margin;

    // Adjust for right edge
    if (x + tooltipWidth > window.innerWidth - margin) {
        x = hoveredPosition.x - tooltipWidth - margin;
    }
    // Adjust for bottom edge
    if (y + tooltipHeight > window.innerHeight - margin) {
        y = hoveredPosition.y - tooltipHeight - margin;
    }

    // Dynamic Status Calculation
    let statusText: string | null = null;
    if (gameState && hoveredInstanceId) {
        // Find instance in game state
        let instance: any = null;

        // Search Helper
        const searchZones = [
            ...gameState.public.players.flatMap(p => [
                ...(p.playArea || []),
                ...(gameState.private?.hand || []), // Only my hand is visible fully, but we might verify instanceId match
                ...(p.aside || [])
            ]),
            ...(gameState.public.trash || [])
        ];

        // Also check my private hand if available
        if (gameState.private?.hand) {
            searchZones.push(...gameState.private.hand);
        }

        instance = searchZones.find((c: any) => c.instanceId === hoveredInstanceId);

        if (instance) {
            statusText = getCardDynamicStatus(instance, gameState);
        }
    }

    const tooltip = (
        <div
            style={{
                position: 'fixed',
                left: x,
                top: y,
                width: tooltipWidth,
                minHeight: tooltipHeight,
                background: '#1a1a2e',
                border: `3px solid ${borderColor}`,
                borderRadius: 8,
                padding: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 10000,
                pointerEvents: 'none',
                color: '#ecf0f1'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: `1px solid ${borderColor}`
            }}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>{card.name}</span>
                <span style={{
                    background: '#f1c40f',
                    color: '#000',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontWeight: 'bold',
                    fontSize: 12
                }}>
                    {card.cost}💰
                </span>
            </div>

            {/* Types */}
            <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 10,
                flexWrap: 'wrap'
            }}>
                {card.types.map(type => (
                    <span key={type} style={{
                        background: bgColor,
                        color: borderColor,
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                    }}>
                        {type}
                    </span>
                ))}
            </div>

            {/* Dynamic Status Badge */}
            {statusText && (
                <div style={{
                    marginBottom: 10,
                    padding: '4px 8px',
                    background: 'rgba(231, 76, 60, 0.2)',
                    border: '1px solid #e74c3c',
                    borderRadius: 4,
                    color: '#ff7675',
                    fontWeight: 'bold',
                    fontSize: 11,
                    textAlign: 'center'
                }}>
                    {statusText}
                </div>
            )}

            {/* Description */}
            <div style={{
                fontSize: 12,
                lineHeight: 1.4,
                color: '#bdc3c7'
            }}>
                {card.description}
            </div>
        </div>
    );

    return ReactDOM.createPortal(tooltip, document.body);
};
