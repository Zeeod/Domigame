/**
 * CardFrame - Reusable Dominion card component
 * 
 * Structure (Full card):
 * ┌────────────────────────────┐
 * │  CARD NAME (top banner)    │
 * ├────────────────────────────┤
 * │  IMAGE AREA (3:2 ratio)    │
 * ├────────────────────────────┤
 * │  CARD TEXT / DESCRIPTION   │
 * ├────────────────────────────┤
 * │  CARD TYPE (bottom banner) │
 * └────────────────────────────┘
 * 
 * Structure (Mini card):
 * ┌────────────────────────┐
 * │  CARD NAME             │
 * ├────────────────────────┤
 * │  IMAGE (3:2)           │
 * ├────────────────────────┤
 * │  CARD TYPE             │
 * └────────────────────────┘
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCardInspect } from '../context/CardInspectContext';
import { useSound } from '../hooks/useSound';
import { CardRegistry } from '../../shared/cards/index';
import './CardFrame.css';

// ============================================================================
// Types
// ============================================================================

export type CardVariant = 'full' | 'mini' | 'micro';
export type CardType = 'treasure' | 'victory' | 'action' | 'attack' | 'reaction' | 'curse' | 'duration' | 'event' | 'project' | 'landmark' | 'way' | 'trait' | 'prophecy';

export interface CardFrameProps {
    cardId: string;
    instanceId?: string; // For tooltips
    variant?: CardVariant;
    count?: number;           // For supply piles
    selected?: boolean;
    playable?: boolean;
    isPurchasable?: boolean; // New prop for supply cards
    isSelectable?: boolean; // New prop for generic supply selection
    disabled?: boolean;
    dimmed?: boolean; // Visual dimming without disabling (or cleaner separation)
    onClick?: (e?: React.MouseEvent) => void;
    showCost?: boolean;
    showCount?: boolean;
    fitText?: boolean; // New prop for dynamic text fitting
    selectionVariant?: 'blue' | 'red';
    costOverride?: number;
    tooltip?: string;
    children?: React.ReactNode; // For description text (full cards only)
    selectionIndex?: number; // Order in selection tray
    tokens?: Record<string, number>;
}

// ============================================================================
// UI Components
// ============================================================================

const Coin: React.FC<{ value: string | number; size?: 'sm' | 'md' | 'lg' | 'inline' }> = ({ value, size = 'md' }) => (
    <span className={`coin-symbol ${size}`}>
        {value}
    </span>
);

const DebtSymbol: React.FC<{ value: number | string; size?: 'sm' | 'md' | 'lg' | 'inline' }> = ({ value, size = 'md' }) => (
    <span className={`debt-symbol ${size}`}>
        {value}
    </span>
);

const PotionSymbol: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'inline' }> = ({ size = 'md' }) => (
    <span className={`potion-symbol ${size}`} title="Potion" />
);

const SunSymbol: React.FC<{ value?: string | number; size?: 'sm' | 'md' | 'lg' | 'inline' }> = ({ value, size = 'md' }) => (
    <span className={`sun-symbol ${size}`}>
        {value !== undefined && value !== '' && <span className="sun-value">{value}</span>}
        <div className="sun-ring">
            {[...Array(7)].map((_, i) => (
                <div key={i} className="sun-ray" style={{ transform: `rotate(${i * (360 / 7)}deg)` }} />
            ))}
        </div>
    </span>
);

function renderDescription(text: string) {
    if (!text) return null;

    // First, handle line breaks for common patterns (e.g., "+1 Carte ; +1 Action")
    const sections = text.split(/([;.]\s*(?=\+\d))/g);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
            {sections.map((section, sectionIdx) => {
                if (/^[;.]\s*$/.test(section)) return null;

                // Normalize currency/debt/sun references to __MARKER__[val]
                let normalized = section;

                // 1. Coins: Match "+1 Pièce", "2 Pièces", "💰3", "$4", "Bourse 5", "Pièce"
                normalized = normalized.replace(/(\+)?(\d+)?\s*(?:💰|(?:\$|Pièce[s]?|Bourse[s]?)\b)/gi, (_, sign, val) => {
                    return (sign || '') + '__COIN__' + (val || '');
                });
                // Catch cases like 💰3 or $4 (symbol before number) if not already caught
                normalized = normalized.replace(/(?:💰|\$|Bourse)\s*(\d+)/gi, '__COIN__$1');

                // 2. Debts: Match "2 Dettes", "Dette", "Debt"
                normalized = normalized.replace(/(\+)?(\d+)?\s*(?:Dette[s]?|Debt[s]?)\b/gi, (_, sign, val) => {
                    return (sign || '') + '__DEBT__' + (val || '');
                });

                // 3. Suns: Match "Jeton[s] Soleil[s]", "Soleil[s]"
                normalized = normalized.replace(/(?:Jeton[s]?\s+)?Soleil[s]?\b/gi, '__SUN__');

                // 4. Potions: Match "Potion[s]"
                normalized = normalized.replace(/Potion[s]?\b/gi, '__POTION__');

                // Final cleanup for standalone $ and 💰
                normalized = normalized.replace(/\$/g, '__COIN__');
                normalized = normalized.replace(/💰/g, '__COIN__');

                const tokens = normalized.split(/(__COIN__\d*|__DEBT__\d*|__SUN__|__POTION__)/g);

                return (
                    <div key={sectionIdx}>
                        {tokens.map((token, i) => {
                            if (token.startsWith('__COIN__')) {
                                return <Coin key={i} value={token.replace('__COIN__', '')} size="inline" />;
                            }
                            if (token.startsWith('__DEBT__')) {
                                return <DebtSymbol key={i} value={token.replace('__DEBT__', '')} size="inline" />;
                            }
                            if (token === '__SUN__') {
                                return <SunSymbol key={i} size="inline" />;
                            }
                            if (token === '__POTION__') {
                                return <PotionSymbol key={i} size="inline" />;
                            }

                            const parts = token.split(/\b(Carte|Cartes|Action|Actions|Achat|Achats|Point de Victoire|PV)\b/g);
                            return parts.map((subPart, subIdx) => {
                                if (/^(Carte|Cartes|Action|Actions|Achat|Achats|Point de Victoire|PV)$/.test(subPart)) {
                                    return <strong key={subIdx} style={{ fontWeight: 800 }}>{subPart}</strong>;
                                }
                                return subPart;
                            });
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function getFitFontSize(text: string): string {
    const len = text.length;
    // Base scaling logic based on length
    if (len < 30) return '11px';
    if (len < 60) return '10px';
    if (len < 90) return '9px';
    if (len < 120) return '8px';
    if (len < 150) return '7.5px';
    if (len < 200) return '7px';
    return '6.5px';
}

// ============================================================================
// Card Data Helpers (Display only - NOT game logic)
// ============================================================================

const CARD_DATA: Record<string, { name: string; type: CardType; cost: number; text?: string; image?: string }> = {
    // Treasures
    copper: { name: 'Cuivre', type: 'treasure', cost: 0, text: '+1 Pièce' },
    silver: { name: 'Argent', type: 'treasure', cost: 3, text: '+2 Pièces' },
    gold: { name: 'Or', type: 'treasure', cost: 6, text: '+3 Pièces' },
    // Victories
    estate: { name: 'Domaine', type: 'victory', cost: 2, text: '1 PV' },
    duchy: { name: 'Duché', type: 'victory', cost: 5, text: '3 PV' },
    province: { name: 'Province', type: 'victory', cost: 8, text: '6 PV' },
    curse: { name: 'Malédiction', type: 'curse', cost: 0, text: '-1 PV' },
    // Actions (Official 2nd Edition Base Set)
    chapel: { name: 'Chapelle', type: 'action', cost: 2, text: 'Écartez jusqu’à 4 cartes de votre main.' },
    moat: { name: 'Douves', type: 'reaction', cost: 2, text: "+2 Cartes. Lorsqu'un autre joueur joue une carte Attaque, vous pouvez dévoiler cette carte de votre main. Dans ce cas, l'Attaque n'a pas d'effet sur vous.", image: '/card-images/moat.jpg' },
    harbinger: { name: 'Présage', type: 'action', cost: 3, text: '+1 Carte ; +1 Action. Regardez dans votre défausse. Vous pouvez placer une carte de votre défausse sur votre pioche.', image: '/card-images/harbinger.jpg' },
    merchant: { name: 'Marchand', type: 'action', cost: 3, text: '+1 Carte ; +1 Action. La première fois que vous jouez un Argent ce tour-ci, vous gagnez +1 Pièce.' },
    vassal: { name: 'Vassal', type: 'action', cost: 3, text: '+2 Pièces. Défaussez la carte du sommet de votre pioche. Si c\'est une carte Action, vous pouvez la jouer.', image: '/card-images/vassal.jpg' },
    workshop: { name: 'Atelier', type: 'action', cost: 3, text: 'Gagnez une carte coûtant jusqu\'à 4 Pièces.', image: '/card-images/workshop.jpg' },
    woodcutter: { name: 'Bûcheron', type: 'action', cost: 3, text: '+1 Achat, +2 💰', image: '/card-images/woodcutter.jpg' },
    poacher: { name: 'Braconnier', type: 'action', cost: 4, text: '+1 Carte ; +1 Action ; +1 Pièce. Défaussez une carte de votre main par pile de réserve vide.' },
    bureaucrat: { name: 'Bureaucrate', type: 'attack', cost: 4, text: 'Gagnez une carte Argent et placez-la sur votre pioche. Chaque autre joueur dévoile une carte Victoire de sa main et la place sur sa pioche (ou dévoile une main sans carte Victoire).' },
    cellar: { name: 'Cave', type: 'action', cost: 2, text: '+1 Action. Défaussez autant de cartes que vous voulez. +1 Carte par carte défaussée.' },
    smithy: { name: 'Forgeron', type: 'action', cost: 4, text: '+3 Cartes.', image: '/card-images/smithy.jpg' },
    village: { name: 'Village', type: 'action', cost: 3, text: '+1 Carte ; +2 Actions.' },
    remodel: { name: 'Rénovation', type: 'action', cost: 4, text: 'Écartez une carte de votre main. Gagnez une carte coûtant jusqu\'à 2 Pièces de plus que la carte écartée.' },
    bandit: { name: 'Bandit', type: 'attack', cost: 5, text: 'Gagnez un Or. Chaque autre joueur dévoile les deux cartes du sommet de sa pioche, écarte une carte Trésor dévoilée autre qu\'un Cuivre et défausse le reste.' },
    gardens: { name: 'Jardins', type: 'victory', cost: 4, text: 'Vaut 1 Point de Victoire pour chaque tranche de 10 cartes dans votre deck (arrondi à l\'inférieur).', image: '/card-images/gardens.jpg' },
    militia: { name: 'Milice', type: 'attack', cost: 4, text: '+2 Pièces. Chaque autre joueur défausse des cartes de sa main jusqu\'à n\'en avoir plus que 3.', image: '/card-images/militia.jpg' },
    moneylender: { name: 'Prêteur sur gages', type: 'action', cost: 4, text: 'Vous pouvez écarter un Cuivre de votre main. Si vous le faites, +3 Pièces.', image: '/card-images/moneylender.jpg' },
    throne_room: { name: 'Salle du Trône', type: 'action', cost: 4, text: 'Choisissez une carte Action de votre main et jouez-la deux fois.', image: '/card-images/throne_room.jpg' },
    sentry: { name: 'Sentinelle', type: 'action', cost: 5, text: '+1 Carte ; +1 Action. Regardez les 2 cartes du sommet de votre pioche. Écartez et/ou défaussez celles que vous voulez. Replacez les autres sur votre pioche dans l\'ordre de votre choix.' },
    library: { name: 'Bibliothèque', type: 'action', cost: 5, text: 'Piochez jusqu\'à ce que vous ayez 7 cartes en main, en mettant de côté chaque carte Action piochée que vous voulez. Défaussez les cartes mises de côté après avoir fini de piocher.' },
    council_room: { name: 'Conseil', type: 'action', cost: 5, text: '+4 Cartes ; +1 Achat. Chaque autre joueur pioche une carte.', image: '/card-images/council_room.jpg' },
    festival: { name: 'Festival', type: 'action', cost: 5, text: '+2 Actions ; +1 Achat ; +2 Pièces.' },
    laboratory: { name: 'Laboratoire', type: 'action', cost: 5, text: '+2 Cartes ; +1 Action.' },
    market: { name: 'Marché', type: 'action', cost: 5, text: '+1 Carte ; +1 Action ; +1 Achat ; +1 Pièce.', image: '/card-images/market.jpg' },
    mine: { name: 'Mine', type: 'action', cost: 5, text: 'Écartez une carte Trésor de votre main. Gagnez une carte Trésor coûtant jusqu\'à 3 Pièces de plus que la carte écartée. Ajoutez-la à votre main.', image: '/card-images/mine.jpg' },
    witch: { name: 'Sorcière', type: 'attack', cost: 5, text: '+2 Cartes. Chaque autre joueur gagne une carte Malédiction.' },
    artisan: { name: 'Artisan', type: 'action', cost: 6, text: 'Gagnez une carte coûtant jusqu\'à 5 Pièces et ajoutez-la à votre main. Placez une carte de votre main sur votre pioche.' },

    // Special UI cards
    Pioche: { name: '', type: 'reaction' as CardType, cost: 0, text: 'Votre pioche.' },
    Défausse: { name: 'Défausse', type: 'treasure' as CardType, cost: 0, text: 'Votre défausse.' },
};

function getCardData(cardId: string) {
    // Try to get from registry first
    const registryCard = CardRegistry.get(cardId);
    if (registryCard) {
        // Map uppercase types to lowercase frame types
        const types = registryCard.types.map(t => t.toLowerCase() as CardType);

        // Priorities: TREASURE > VICTORY > CURSE > REACTION > DURATION > ATTACK > ACTION
        let type: CardType = 'action';
        if (registryCard.types.includes('TREASURE')) type = 'treasure';
        else if (registryCard.types.includes('VICTORY')) type = 'victory';
        else if (registryCard.types.includes('CURSE')) type = 'curse';
        else if (registryCard.types.includes('REACTION')) type = 'reaction';
        else if (registryCard.types.includes('DURATION')) type = 'duration';
        else if (registryCard.types.includes('ATTACK')) type = 'attack';
        else if (registryCard.types.includes('EVENT')) type = 'event';
        else if (registryCard.types.includes('PROJECT')) type = 'project';
        else if (registryCard.types.includes('LANDMARK')) type = 'landmark';
        else if (registryCard.types.includes('WAY')) type = 'way';
        else if (registryCard.types.includes('TRAIT')) type = 'trait';

        return {
            name: registryCard.name,
            type: type,
            types: types,
            cost: registryCard.cost,
            debtCost: registryCard.debtCost || 0,
            potionCost: (registryCard as any).potionCost || 0,
            text: registryCard.description,
            image: registryCard.image,
            set: registryCard.set ?? (registryCard.expansion ? registryCard.expansion.toLowerCase() : 'base')
        };
    }

    // Fallback to local data for UI-only cards like 'Pioche'
    const fallback = CARD_DATA[cardId] ?? { name: cardId, type: 'action' as CardType, cost: 0, text: '' };
    return {
        ...fallback,
        types: [fallback.type],
        set: 'base'
    };
}

function getExpansionIcon(set: string): string {
    const icons: Record<string, string> = {
        base: '🏰',
        intrigue: '🎭',
        seaside: '🌊',
        prosperity: '💎',
        dark_ages: '⚔️',
        darkages: '⚔️',
        hinterlands: '🏔️',
        cornucopia: '🔨',
        cornucopia_guilds: '🔨',
        guilds: '🔨',
        adventures: '🗺️',
        empires: '🏛️',
        nocturne: '🌙',
        renaissance: '🎨',
        menagerie: '🦁',
        allies: '🤝',
        plunder: '💰',
        rising_sun: '🌅',
        alchemy: '📜'
    };
    const key = set.toLowerCase().replace(/[^a-z_]/g, '');
    return icons[key] || '📜';
}


function getTypeBadge(types: CardType[], variant: 'full' | 'mini' | 'micro'): string {
    const badges: Record<string, string> = {
        treasure: 'Trésor',
        victory: 'Victoire',
        action: 'Action',
        attack: 'Attaque',
        reaction: 'Réaction',
        curse: 'Malédiction',
        duration: 'Durée',
        looter: 'Pillard',
        shelter: 'Abri',
        knight: 'Chevalier',
        ruins: 'Ruine',
        event: 'Événement',
        project: 'Projet',
        landmark: 'Repère',
        way: 'Voie',
        trait: 'Trait',
        prophecy: 'Prophétie',
        night: 'Nuit',
        spirit: 'Esprit',
        reserve: 'Réserve',
        traveller: 'Voyageur'
    };

    if (variant === 'mini') {
        const displayTypes = types.filter(t => t !== 'action');
        // If empty (pure Action), return empty string or maybe nothing.
        // But user said: "Action" -> "" (don't show Action)
        // Note: badges are French translations.
        return displayTypes.map(t => badges[t] || t.charAt(0).toUpperCase() + t.slice(1)).join(' - ');
    }

    // Join all types for Full view
    // Filter out 'action' if other types exist (optional preference? Dominion usually shows "Action - Attack")
    // User requested "Action - Victory", so we keep all.
    // We map keys to French names.
    return types.map(t => badges[t] || t.charAt(0).toUpperCase() + t.slice(1)).join(' - ');
}

// ============================================================================
// Component
// ============================================================================

export const CardFrame: React.FC<CardFrameProps> = ({
    cardId,
    instanceId,
    variant = 'full',
    count,
    tokens,
    selected = false,
    playable = false,
    isPurchasable = false,
    isSelectable = false,
    disabled = false,
    dimmed = false,
    onClick,
    showCost = true,
    showCount = true, // Kept single instance
    fitText = true,
    selectionVariant = 'blue',
    costOverride,
    tooltip,
    children,
    selectionIndex
}) => {
    const { hoveredCardId, setHovered, clearHovered, setZoomed } = useCardInspect();
    const { playSound } = useSound();
    const data = getCardData(cardId);
    const typeBadge = getTypeBadge(data.types || [data.type], variant);

    const isLandscape = ['event', 'project', 'landmark', 'way', 'trait', 'prophecy'].includes(data.type);
    const isProphecy = data.type === 'prophecy';

    // Dynamic Banner Color Logic for Multi-Type Cards
    const supportedStyles = ['treasure', 'victory', 'action', 'attack', 'reaction', 'curse', 'duration', 'event', 'project', 'landmark', 'way', 'trait', 'prophecy'];
    const getStyleType = (t: string) => supportedStyles.includes(t) ? t : 'action';

    const BANNER_COLORS: Record<string, string> = {
        treasure: '#daa520',
        victory: '#2e7d32',
        action: '#e0e0e0',
        attack: '#c62828',
        reaction: '#1565c0',
        curse: '#6a1b9a',
        duration: '#e67e22',
        event: '#95a5a6',    // Grey/Silver for events
        project: '#e74c3c',  // Reddish (or pink) for projects
        landmark: '#2ecc71', // Greenish for landmarks
        way: '#f1c40f',      // Yellow for ways
        trait: '#3498db',    // Blue for traits
        prophecy: '#f39c12', // Orange/Gold for prophecies
    };

    const rawTypes = data.types || [data.type]; // lowercase
    const nonActionTypes = rawTypes.filter(t => t !== 'action');

    // Determine Banner Style
    let bannerStyle = {};

    if (nonActionTypes.length > 1) {
        // Multi-types (diagonally split)
        const topBase = nonActionTypes[0];
        const bottomBase = nonActionTypes[1];
        const c1 = BANNER_COLORS[getStyleType(topBase)];
        const c2 = BANNER_COLORS[getStyleType(bottomBase)];
        bannerStyle = { background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` };
    } else {
        // Single type (standard gradient)
        const type = nonActionTypes.length > 0 ? nonActionTypes[0] : 'action';
        bannerStyle = { background: `var(--card-banner-${getStyleType(type)})` };
    }

    // List of cards that should be "Full Art" (no text box)
    const FULL_ART_CARDS = ['copper', 'silver', 'gold', 'platinum', 'estate', 'duchy', 'province', 'colony', 'curse'];
    const isBasic = FULL_ART_CARDS.includes(cardId);

    // Full Art applies to basic cards in ALL variants, or explicitly full-art cards in 'full' variant
    const isFullArt = isBasic || (variant === 'full' && (rawTypes.includes('event' as any) || rawTypes.includes('landmark' as any) || isProphecy));


    // Image loading state
    const [imageError, setImageError] = useState(false);
    const [extension, setExtension] = useState('jpg');

    useEffect(() => {
        setImageError(false);
        setExtension('jpg');
    }, [cardId]);

    // Fallback logic: if jpg fails, try png
    useEffect(() => {
        if (imageError && extension === 'jpg') {
            setImageError(false);
            setExtension('png');
        }
    }, [imageError, extension]);

    const imagePath = (data as any).image || `card-images/${cardId}.${extension}`;

    // Fix: Clear hover state if this component unmounts while being hovered
    useEffect(() => {
        return () => {
            if (hoveredCardId === cardId) {
                clearHovered();
            }
        };
    }, [cardId, hoveredCardId, clearHovered]);

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (!disabled && !dimmed) {
            playSound('hover', 0.05);
        }
        setHovered(cardId, e.clientX, e.clientY, instanceId);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setHovered(cardId, e.clientX, e.clientY, instanceId);
    };

    const handleMouseLeave = () => {
        clearHovered();
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setZoomed(cardId);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!disabled && onClick) {
            playSound('click', 0.1);
            if (cardId === 'sentinel') { // Assuming cardDef.id refers to cardId
                e.stopPropagation();
            }
            onClick(e);
        }
    };

    const handleHoverStart = () => {
        if (!disabled && onClick) {
            playSound('hover', 0.05);
        }
    };

    const isEmpty = count === 0;
    const showDescription = variant === 'full' && data.text && !isFullArt;

    const hasCount = showCount && count !== undefined;

    // Dynamic text scaling for long names
    const getScaleClass = () => {
        const len = data.name.length;
        if (len > 16) return 'scale-xs';
        if (len > 13) return 'scale-sm';
        return '';
    };
    const scaleClass = getScaleClass();

    // Dynamic scale for long type names
    const getTypeScaleClass = () => {
        const len = typeBadge.length;
        if (len > 25) return 'scale-atomic';
        if (len > 20) return 'scale-nano';
        if (len > 16) return 'scale-micro';
        if (len > 13) return 'scale-tiny';   // Was 14
        if (len > 11) return 'scale-xxs';    // Was 12
        if (len > 9) return 'scale-xs';      // Was 10
        if (len > 7) return 'scale-sm';      // Was 8
        return '';
    };
    const typeScaleClass = getTypeScaleClass();

    const selectionClass = selected ? (selectionVariant === 'red' ? 'selected-red' : 'selected') : '';

    // Check if it's a card back (Deck or generic back)
    const isCardBack = cardId === 'Pioche' || cardId === 'back';
    const isEmptyPile = isEmpty && (cardId === 'Pioche' || cardId === 'Défausse' || cardId.startsWith('pile'));

    // Determine animation styles based on variant and state
    const isInteractive = onClick && !disabled && !dimmed;
    const motionProps: any = isInteractive ? {
        whileHover: { scale: variant === 'mini' ? 1.05 : 1.02, y: variant === 'full' ? -1 : 0 },
        whileTap: { scale: 0.95 },
        transition: { type: 'spring', stiffness: 400, damping: 25 }
    } : {};

    return (
        <motion.div
            className={`card-frame ${variant} type-${data.type} ${isLandscape ? 'landscape' : ''} ${selectionClass} ${playable ? 'playable' : ''} ${isSelectable ? 'selectable' : ''} ${disabled ? 'disabled' : ''} ${dimmed ? 'card-dimmed' : ''} ${isEmpty ? 'empty' : ''} ${hasCount ? 'has-count' : ''} ${showCost ? 'has-cost' : ''} ${isCardBack ? 'card-back-frame' : ''} ${isEmptyPile ? 'empty-pile-outline' : ''} ${isFullArt ? 'is-full-art' : ''}`}
            data-card-id={cardId}
            title={tooltip}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            onHoverStart={handleHoverStart}
            {...motionProps}
        >
            {/* Top Banner OR Corner Badge for Backs */}
            {(!isCardBack && !isEmptyPile) ? (
                // Standard Card Banner
                <div className="card-banner top-banner" style={{ ...bannerStyle, ...(isLandscape ? { width: 'auto', alignSelf: 'center', borderRadius: '0 0 4px 4px', marginTop: 0 } : {}) }}>
                    {showCount && count !== undefined && (
                        <div className={`card-count-badge ${isEmpty ? 'empty' : ''}`}>
                            {count}
                        </div>
                    )}
                    <span className={`card-name ${scaleClass}`}>{data.name}</span>
                </div>
            ) : (
                // Card Back / Empty Pile: Just the count badge in corner (if not empty)
                showCount && count !== undefined && !isEmptyPile && (
                    <div className="card-count-badge" style={{ zIndex: 200 }}>
                        {count}
                    </div>
                )
            )}

            {/* Landscape: Type Badge (Top Right) */}
            {isLandscape && (
                <div className="landscape-type-badge" style={bannerStyle}>
                    {typeBadge}
                </div>
            )}

            {/* Image Area - MODIFIED for Mini/Micro adaptability */}
            {(variant !== 'mini' && variant !== 'micro' || isBasic || !isBasic) && (
                <div className={`card-image-area ${isCardBack ? 'is-card-back' : ''} ${isFullArt ? 'is-full-art' : ''} ${variant === 'mini' || variant === 'micro' ? 'mini-adaptive' : ''}`}>
                    {/* Empty Pile State */}
                    {isEmptyPile ? (
                        <div className="empty-pile-text">
                            {cardId === 'Pioche' ? 'Pioche' : (data.name || cardId)}
                        </div>
                    ) : (
                        <>
                            <>
                                {/* Image or Placeholder - Only show if NOT a card back */}
                                {!isCardBack ? (
                                    <div className="card-illustration-container" style={{ position: 'relative', height: '100%', width: '100%' }}>
                                        {!imageError ? (
                                            <img
                                                draggable={false}
                                                src={imagePath}
                                                alt={data.name}
                                                className="card-illustration"
                                                onError={() => setImageError(true)}
                                                style={(variant === 'mini' || variant === 'micro') ? { objectFit: 'cover', height: '100%' } : undefined}
                                            />
                                        ) : (
                                            <div className="card-image-placeholder">
                                                <span className="placeholder-icon">
                                                    {data.type === 'action' && '⚡'}
                                                    {data.type === 'treasure' && '💰'}
                                                    {data.type === 'victory' && '🏰'}
                                                    {data.type === 'reaction' && '🛡️'}
                                                    {data.type === 'duration' && '⏳'}
                                                    {data.type === 'attack' && '⚔️'}
                                                    {data.type === 'curse' && '💀'}
                                                    {isProphecy && '☀️'}
                                                    {['event', 'project', 'landmark', 'way'].includes(data.type) && '📜'}
                                                </span>
                                                <span className="placeholder-text">{data.name}</span>
                                            </div>
                                        )}

                                        {/* Sun Token Overlay for Prophecies */}
                                        {isProphecy && tokens && tokens['sun'] !== undefined && tokens['sun'] > 0 && (
                                            <div className="prophecy-sun-overlay">
                                                <SunSymbol value={tokens['sun']} size="lg" />
                                            </div>
                                        )}

                                        {/* VP Token Badge on Supply Piles (e.g. Farmer's Market) */}
                                        {!isProphecy && tokens && (tokens['vp'] ?? 0) > 0 && (
                                            <div className="pile-vp-token-badge" title={`${tokens['vp']} jeton(s) PV sur cette pile`}>
                                                🏅{tokens['vp']}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="card-back-pattern" />
                                )}
                            </>
                        </>
                    )}
                </div>
            )}

            {/* Description Text (full cards only) - Hide for backs */}
            {showDescription && !isCardBack && !isEmptyPile && (
                <div
                    className={`card-description ${fitText ? 'fit-text' : ''}`}
                    style={fitText ? { fontSize: getFitFontSize(children?.toString() || data.text || '') } : undefined}
                >
                    {children ?? renderDescription(data.text || '')}
                </div>
            )}

            {/* Bottom Banner - Hide for backs and Landscape cards */}
            {!isCardBack && !isEmptyPile && !isLandscape && (
                <div className={`card-banner bottom-banner ${variant === 'full' && data.set ? 'has-expansion-icon' : ''}`} style={bannerStyle}>
                    <span
                        className={`card-type ${typeScaleClass}`}
                        style={{
                            fontSize: typeBadge.length > 20 ? '7px' : (typeBadge.length > 15 ? '8.5px' : undefined)
                        }}
                    >
                        {typeBadge}
                    </span>
                    {/* Expansion Icon */}
                    {variant === 'full' && data.set && (
                        <span className="expansion-icon" title={data.set}>
                            {getExpansionIcon(data.set)}
                        </span>
                    )}
                    {(isPurchasable || isSelectable) && (
                        <div className={`purchasable-badge ${isSelectable ? 'selectable-pulse' : ''}`} title={isSelectable ? "Choisir" : "Acheter"}>+</div>
                    )}
                </div>
            )}

            {showCost && !isCardBack && !isEmptyPile && (
                <div className="card-cost-container">
                    {data.cost > 0 || ((data as any).debtCost || 0) === 0 ? (
                        <div className="card-cost-coin">
                            <Coin value={costOverride !== undefined ? costOverride : data.cost} size={(variant === 'mini' || variant === 'micro') ? 'md' : 'lg'} />
                        </div>
                    ) : null}
                    {data.potionCost > 0 && (
                        <div className="card-cost-potion">
                            <PotionSymbol size={(variant === 'mini' || variant === 'micro') ? 'md' : 'lg'} />
                        </div>
                    )}
                    {((data as any).debtCost || 0) > 0 && (
                        <div className="card-cost-debt">
                            <DebtSymbol value={(data as any).debtCost} size={(variant === 'mini' || variant === 'micro') ? 'md' : 'lg'} />
                        </div>
                    )}
                </div>
            )}


            {/* Selection Indicator */}
            {selected && (
                <div className="selection-indicator">✓</div>
            )}

            {/* Selection Index Badge */}
            {selectionIndex !== undefined && (
                <div className="card-selection-index">{selectionIndex}</div>
            )}
        </motion.div>
    );
};
