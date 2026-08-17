import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useCardInspect } from '../context/CardInspectContext';
import { CardFrame } from './CardFrame';
import { CardRegistry } from '../../shared/cards';

const TYPE_LABELS: Record<string, string> = {
    TREASURE: 'Trésor',
    VICTORY: 'Victoire',
    ACTION: 'Action',
    ATTACK: 'Attaque',
    REACTION: 'Réaction',
    CURSE: 'Malédiction',
    DURATION: 'Durée',
    NIGHT: 'Nuit',
    RESERVE: 'Réserve',
    TRAVELLER: 'Voyageur',
    SPIRIT: 'Esprit',
    FATE: 'Destin',
    DOOM: 'Fléau',
    SHADOW: 'Ombre',
    SHELTER: 'Refuge',
    RUINS: 'Ruines',
    KNIGHT: 'Chevalier',
    LOOTER: 'Pillard',
    BOON: 'Aubaine',
    HEX: 'Maléfice',
    HEIRLOOM: 'Héritage',
    PRIZE: 'Prix',
    LOOT: 'Butin',
    CASTLE: 'Château',
    COMMAND: 'Commande',
    OMEN: 'Présage',
    LIAISON: 'Liaison',
};

const TYPE_COLORS: Record<string, string> = {
    VICTORY: '#27ae60',
    TREASURE: '#f1c40f',
    ACTION: '#3498db',
    ATTACK: '#e74c3c',
    REACTION: '#9b59b6',
    CURSE: '#8e44ad',
    DURATION: '#f39c12',
    NIGHT: '#2c3e50',
    RESERVE: '#16a085',
    FATE: '#ffd700',
    DOOM: '#c0392b',
};

const SET_LABELS: Record<string, string> = {
    base: 'Base',
    intrigue: 'Intrigue',
    seaside: 'Rivages',
    alchemy: 'Alchimie',
    prosperity: 'Prospérité',
    cornucopia: 'Abondance',
    hinterlands: 'Arrière-Pays',
    dark_ages: 'Âges Sombres',
    guilds: 'Guildes',
    adventures: 'Aventures',
    empires: 'Empires',
    nocturne: 'Nocturne',
    renaissance: 'Renaissance',
    menagerie: 'Ménagerie',
    allies: 'Alliés',
    plunder: 'Plunder',
    rising_sun: 'Soleil Levant',
    promos: 'Promos',
};

export const BigCardView: React.FC = () => {
    const { zoomedCardId, clearZoomed } = useCardInspect();
    const containerRef = useRef<HTMLDivElement>(null);

    // Global click listener to close zoom when clicking outside
    useEffect(() => {
        if (!zoomedCardId) return;

        const handleGlobalClick = (e: MouseEvent) => {
            // If click is on the portal background (overlay), close it
            if (e.target instanceof HTMLElement && e.target.classList.contains('big-card-view-portal')) {
                clearZoomed();
                return;
            }
            // Standard outside click logic
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                clearZoomed();
            }
        };

        const handleGlobalEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') clearZoomed();
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            clearZoomed();
        };

        const timeout = setTimeout(() => {
            window.addEventListener('click', handleGlobalClick);
            window.addEventListener('keydown', handleGlobalEsc);
            window.addEventListener('contextmenu', handleContextMenu);
        }, 10);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('keydown', handleGlobalEsc);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [zoomedCardId, clearZoomed]);

    if (!zoomedCardId) return null;

    const cardDef = CardRegistry.get(zoomedCardId);

    const modal = (
        <div
            className="big-card-view-portal active"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20000,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                transition: 'background 0.3s ease',
                pointerEvents: 'auto',
            }}
        >
            <style>
                {`
                @keyframes cardPopIn {
                    from { transform: scale(1.0); opacity: 0; }
                    to { transform: scale(3.0); opacity: 1; }
                }
                @keyframes relatedPopIn {
                    from { transform: scale(0.4); opacity: 0; }
                    to { transform: scale(1.3); opacity: 1; }
                }
                .inspect-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    pointer-events: none;
                }
                .inspect-main-wrapper {
                    position: fixed;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    pointer-events: auto;
                    z-index: 10;
                }
                
                .related-cards-grid {
                    position: fixed;
                    right: 5%;
                    top: 50%;
                    transform: translateY(-50%);
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 80px 100px;
                    align-items: center;
                    justify-items: center;
                    padding: 40px;
                    max-width: 35vw;
                    pointer-events: auto;
                }
                .related-card-item {
                    transform: scale(1.3);
                    cursor: pointer;
                    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.25), filter 0.2s ease;
                    filter: drop-shadow(0 15px 35px rgba(0,0,0,0.6));
                    animation: relatedPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.1) backwards;
                }
                .related-card-item:hover {
                    transform: scale(1.45);
                    filter: drop-shadow(0 20px 50px rgba(0,0,0,0.8)) brightness(1.15);
                    z-index: 100;
                }

                .inspect-expansion-badge {
                    margin-top: 100px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    color: rgba(255,255,255,0.4);
                    font-size: 0.9rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                    cursor: help;
                }
                .inspect-expansion-badge:hover {
                    background: rgba(0,0,0,0.8);
                    border-color: rgba(255,255,255,0.3);
                    color: #fff;
                    transform: translateX(-50%) translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .inspect-expansion-name {
                    max-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    transition: max-width 0.4s ease, opacity 0.3s ease;
                    opacity: 0;
                }
                .inspect-expansion-badge:hover .inspect-expansion-name {
                    max-width: 200px;
                    opacity: 1;
                    margin-left: 5px;
                }

                .inspect-close-hint {
                    position: absolute;
                    bottom: 25px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: rgba(255,255,255,0.4);
                    font-size: 0.85rem;
                    letter-spacing: 4px;
                    font-weight: 800;
                    pointer-events: none;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
                    opacity: 0.7;
                    text-transform: uppercase;
                }
                `}
            </style>

            <div
                ref={containerRef}
                className="inspect-container"
            >
                <div className="inspect-main-wrapper">
                    {/* Main Zoomed Card */}
                    <div
                        style={{
                            transform: 'scale(3.0)',
                            filter: 'drop-shadow(0 50px 100px rgba(0,0,0,1))',
                            animation: 'cardPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
                        }}
                    >
                        <CardFrame
                            cardId={zoomedCardId}
                            variant="full"
                            showCost={true}
                            fitText={true}
                        />
                    </div>

                    {/* Discreet Expansion Badge on main card hover/area */}
                    {cardDef?.set && (
                        <div className="inspect-expansion-badge">
                            <span>📦</span>
                            <span className="inspect-expansion-name">
                                {SET_LABELS[cardDef.set] || cardDef.set}
                            </span>
                        </div>
                    )}
                </div>

                {/* Related Cards Grid */}
                {cardDef && (
                    <div className="related-cards-grid">
                        {CardRegistry.getRelatedCardIds(zoomedCardId).map((relatedId, idx) => (
                            <div
                                key={relatedId}
                                className="related-card-item"
                                style={{ animationDelay: `${0.15 + idx * 0.12}s` }}
                            >
                                <RelatedCardWrapper cardId={relatedId} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Close hint */}
            <div className="inspect-close-hint">
                CLIC DROIT, ÉCHAP OU CLIC EXTÉRIEUR POUR FERMER
            </div>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
};

const RelatedCardWrapper: React.FC<{ cardId: string }> = ({ cardId }) => {
    const { setZoomed } = useCardInspect();

    return (
        <div style={{ position: 'relative' }} onClick={(e) => {
            e.stopPropagation();
            setZoomed(cardId);
        }}>
            <CardFrame
                cardId={cardId}
                variant="full"
                showCost={true}
                fitText={true}
            />
        </div>
    );
};
