import React from 'react';
import { CardView } from '../../shared/view/PublicGameView';
import { CardInteraction } from '../types/Interaction';
import { useCardInspect } from '../context/CardInspectContext';
import { CardRegistry } from '../../shared/cards';

interface CardProps {
    card: CardView;
    interaction?: CardInteraction;
    onToggle?: () => void;
}

const TYPE_BORDER_COLORS: Record<string, string> = {
    victory: '#27ae60',
    treasure: '#f1c40f',
    action: '#3498db',
    attack: '#e74c3c',
    reaction: '#9b59b6',
    curse: '#8e44ad',
    unknown: '#7f8c8d'
};

const TYPE_BG_COLORS: Record<string, string> = {
    victory: 'linear-gradient(135deg, #d5f5e3 0%, #abebc6 100%)',
    treasure: 'linear-gradient(135deg, #fef9e7 0%, #f9e79f 100%)',
    action: 'linear-gradient(135deg, #ebf5fb 0%, #aed6f1 100%)',
    attack: 'linear-gradient(135deg, #fdedec 0%, #f5b7b1 100%)',
    reaction: 'linear-gradient(135deg, #f5eef8 0%, #d7bde2 100%)',
    curse: 'linear-gradient(135deg, #f4ecf7 0%, #d2b4de 100%)',
    unknown: 'linear-gradient(135deg, #f2f3f4 0%, #d5d8dc 100%)'
};

export const Card: React.FC<CardProps> = ({ card, interaction, onToggle }) => {
    const { setHovered, clearHovered, setZoomed } = useCardInspect();

    const isSelected = interaction?.selected;
    const isSelectable = interaction?.selectable;
    const isDisabled = interaction?.disabled;

    const primaryType = CardRegistry.getPrimaryType(card.id);
    const borderColor = TYPE_BORDER_COLORS[primaryType] || TYPE_BORDER_COLORS.unknown;
    const bgGradient = TYPE_BG_COLORS[primaryType] || TYPE_BG_COLORS.unknown;

    // Loot specific styling
    const def = CardRegistry.get(card.id);
    const isLoot = def?.types?.includes('LOOT');

    const handleClick = () => {
        if (isSelectable && onToggle) {
            onToggle();
        }
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
        setHovered(card.id, e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setHovered(card.id, e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
        clearHovered();
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setZoomed(card.id);
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            style={{
                width: 100,
                height: 150,
                background: bgGradient,
                borderRadius: 6,
                border: isSelected ? '3px solid #3498db' : `2px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSelectable ? 'pointer' : 'default',
                opacity: isDisabled ? 0.5 : 1,
                transform: isSelected ? 'translateY(-10px)' : 'none',
                transition: 'all 0.2s',
                position: 'relative',
                color: '#2c3e50',
                boxShadow: isLoot ? '0 0 15px rgba(241, 196, 15, 0.6)' : '0 2px 8px rgba(0,0,0,0.15)',
                animation: isLoot ? 'loot-glow 2s infinite alternate' : 'none'
            }}
        >
            <div style={{ textAlign: 'center', padding: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 11 }}>{card.id}</div>
            </div>

            {isSelected && (
                <div style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    width: 20,
                    height: 20,
                    background: '#3498db',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    ✓
                </div>
            )}
        </div>
    );
};
