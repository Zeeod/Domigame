import React, { useState } from 'react';
import { CardRegistry } from '../../shared/cards/index';
import { CardFrame } from './CardFrame';
import './LobbyKingdomSelector.css';

interface LobbyKingdomSelectorProps {
    onSelectionChange: (cards: (string | null)[] | null) => void;
    currentSelection: (string | null)[] | null;
    readOnly?: boolean;
    prosperityMode?: 'always' | 'never' | 'random';
    sheltersMode?: 'always' | 'never' | 'random';
    enabledExpansions?: string[];
    landscapeInstructions?: string[];
    onSetupChange?: (options: {
        prosperityMode?: 'always' | 'never' | 'random',
        sheltersMode?: 'always' | 'never' | 'random',
        enabledExpansions?: string[],
        landscapeInstructions?: string[]
    }) => void;
}

const TOTAL_SLOTS = 10;
const MAX_LANDSCAPES = 4;

const LANDSCAPE_TYPES = [
    { id: 'event', label: 'Événement', icon: '🎪', color: '#e74c3c' },
    { id: 'landmark', label: 'Jalon', icon: '🗼', color: '#2ecc71' },
    { id: 'project', label: 'Projet', icon: '🏗️', color: '#9b59b6' },
    { id: 'way', label: 'Voie', icon: '🛣️', color: '#e67e22' },
    { id: 'trait', label: 'Trait', icon: '💎', color: '#3498db' },
];

const ALL_EXPANSIONS = ['base', 'intrigue', 'seaside', 'prosperity', 'dark_ages', 'hinterlands', 'cornucopia', 'guilds', 'adventures', 'empires', 'alchemy', 'nocturne', 'renaissance', 'menagerie', 'allies', 'plunder', 'rising_sun', 'promos'];

export const LobbyKingdomSelector: React.FC<LobbyKingdomSelectorProps> = ({
    onSelectionChange,
    currentSelection,
    readOnly = false,
    prosperityMode = 'never',
    sheltersMode = 'random',
    enabledExpansions = ALL_EXPANSIONS,
    landscapeInstructions = [],
    onSetupChange
}) => {
    // --- State ---
    const [activeSlot, setActiveSlot] = useState<number | null>(null); // Index of kingdom slot being edited
    const [pickerType, setPickerType] = useState<string | null>(null); // Type of landscape being added ('event', 'landmark'...)
    const [activeLandscapeIndex, setActiveLandscapeIndex] = useState<number | null>(null);

    // Picker State
    const [search, setSearch] = useState('');
    const [expansionFilter, setExpansionFilter] = useState<string | null>(null);
    const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

    // --- Derived State ---
    const slots = currentSelection || Array(TOTAL_SLOTS).fill(null);
    const renderSlots = [...slots];
    while (renderSlots.length < TOTAL_SLOTS) renderSlots.push(null);

    // --- Helpers ---
    const getCard = (id: string) => CardRegistry.get(id);

    const getDisplayName = (setKey: string) => {
        const key = setKey.toLowerCase().replace(/\s+/g, '_');
        const names: Record<string, string> = {
            'base': 'Base', 'intrigue': 'Intrigue', 'seaside': 'Rivage', 'prosperity': 'Prospérité',
            'dark_ages': 'Âges Sombres', 'hinterlands': 'Arrière-Pays', 'cornucopia': 'Abondance',
            'guilds': 'Guildes', 'adventures': 'Aventures', 'empires': 'Empires', 'alchemy': 'Alchimie',
            'nocturne': 'Nocturne', 'renaissance': 'Renaissance', 'menagerie': 'Ménagerie',
            'allies': 'Alliés', 'plunder': 'Pillage', 'rising_sun': 'Soleil Levant', 'promos': 'Promos'
        };
        return names[key] || setKey.charAt(0).toUpperCase() + setKey.slice(1);
    };

    const getExpansionIcon = (setKey: string) => {
        const key = setKey.toLowerCase().replace(/\s+/g, '_');
        const icons: Record<string, string> = {
            'base': '🏰', 'intrigue': '🎭', 'seaside': '🌊', 'prosperity': '💎',
            'dark_ages': '⚔️', 'hinterlands': '🏔️', 'cornucopia': '🌽', 'guilds': '🔨',
            'adventures': '🗺️', 'empires': '🏛️', 'alchemy': '⚗️', 'nocturne': '🌑',
            'renaissance': '🎨', 'menagerie': '🐴', 'allies': '🤝', 'plunder': '🏴‍☠️',
            'rising_sun': '🌅', 'promos': '🃏'
        };
        return icons[key] || '🎲';
    };

    // --- Actions ---

    const handleSlotClick = (index: number) => {
        if (readOnly) return;
        setActiveSlot(index);
        setPickerType(null); // Clear landscape picker
        setSearch('');
    };

    const handleLandscapeAddClick = (index: number, type: string) => {
        if (readOnly) return;
        setPickerType(type); // 'any' or specific if needed
        setActiveLandscapeIndex(index);
        setActiveSlot(null); // Clear kingdom picker
        setSearch('');
    };

    const handleCardSelect = (cardId: string | null) => {
        if (!cardId) return;

        // Handle Kingdom Slot Selection
        if (activeSlot !== null) {
            const newSlots = [...renderSlots];
            newSlots[activeSlot] = cardId;
            onSelectionChange(newSlots);
            setActiveSlot(null);
        }
        // Handle Landscape Selection
        else if (pickerType) {
            const next = [...landscapeInstructions];
            // Ensure array is long enough (up to index 3)
            while (next.length <= (activeLandscapeIndex ?? 0)) next.push('empty');

            if (activeLandscapeIndex !== null) {
                next[activeLandscapeIndex] = cardId;
            }
            onSetupChange?.({ landscapeInstructions: next });
            setPickerType(null);
            setActiveLandscapeIndex(null);
        }
    };

    const handleLandscapeRemoveClick = (index: number) => {
        if (readOnly) return;
        const newInstructions = [...landscapeInstructions];
        newInstructions[index] = 'empty';
        onSetupChange?.({ landscapeInstructions: newInstructions });
    };


    const handleToggleLandscapeType = (index: number, typeId: string) => {
        if (readOnly) return;
        const current = landscapeInstructions[index];
        if (current === 'empty') return;

        let types: string[] = [];
        if (current === 'random:any') {
            types = LANDSCAPE_TYPES.map(t => t.id);
        } else if (current.startsWith('random:')) {
            types = current.split(':')[1].split(',');
        } else {
            // If it was a specific card, switch to random with only this type.
            types = [typeId];
        }

        const newTypes = types.includes(typeId)
            ? types.filter(t => t !== typeId)
            : [...types, typeId];

        let val = 'empty';
        if (newTypes.length === LANDSCAPE_TYPES.length) val = 'random:any';
        else if (newTypes.length > 0) val = `random:${newTypes.join(',')}`;

        const next = [...landscapeInstructions];
        next[index] = val;
        onSetupChange?.({ landscapeInstructions: next });
    };


    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (readOnly) return;
        setDragSourceIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (readOnly || dragSourceIndex === null || dragSourceIndex === targetIndex) return;

        const newSlots = [...renderSlots];
        const sourceCard = newSlots[dragSourceIndex];
        const targetCard = newSlots[targetIndex];

        newSlots[targetIndex] = sourceCard;
        newSlots[dragSourceIndex] = targetCard;

        onSelectionChange(newSlots);
        setDragSourceIndex(null);
    };

    // --- Filtering for Picker ---
    const getFilteredCards = () => {
        let pool = CardRegistry.getKingdomCandidates();

        if (pickerType) {
            pool = Object.keys(CardRegistry.getAll());
        }

        return pool
            .map(id => CardRegistry.get(id))
            .filter(c => {
                if (!c) return false;

                if (pickerType) {
                    if (pickerType === 'any') {
                        if (!c.types.some(t => ['EVENT', 'LANDMARK', 'PROJECT', 'WAY', 'TRAIT'].includes(t))) return false;
                    } else {
                        if (!c.types.includes(pickerType.toUpperCase() as any)) return false;
                    }
                } else {
                    if (c.types.includes('EVENT') || c.types.includes('LANDMARK') || c.types.includes('PROJECT') || c.types.includes('WAY') || c.types.includes('TRAIT')) return false;
                }

                const cardSet = c.set || c.expansion || 'base';
                const cardSetKey = cardSet.toLowerCase().replace(/\s+/g, '_');

                if (expansionFilter) {
                    if (cardSetKey !== expansionFilter) return false;
                }

                const searchLower = search.toLowerCase();
                if (!c.name.toLowerCase().includes(searchLower)) return false;

                return true;
            })
            .sort((a, b) => a!.cost - b!.cost || a!.name.localeCompare(b!.name));
    };

    const filteredCards = (activeSlot !== null || pickerType) ? getFilteredCards() : [];

    return (
        <div className="kingdom-selector-container">
            {/* Main Area: Grid + Sidebar */}
            <div className="kingdom-main-area">

                {/* Combined Grid Section */}
                <div className="combined-cards-area">
                    {/* Left: Kingdom Grid */}
                    <div className="kingdom-column">
                        <div className="section-header">
                            <h4>Royaume <span className="count-badge">{renderSlots.filter(c => c).length}/10</span></h4>
                        </div>
                        <div className="kingdom-grid">
                            {renderSlots.map((cardId, index) => {
                                const isRandom = cardId?.startsWith('random:');
                                const card = cardId && !isRandom ? getCard(cardId) : null;

                                return (
                                    <div
                                        key={index}
                                        className={`card-slot kingdom-slot ${cardId ? 'filled' : 'empty'} ${activeSlot === index ? 'editing' : ''} ${readOnly ? 'read-only' : ''}`}
                                        onClick={() => handleSlotClick(index)}
                                        draggable={!readOnly && !!cardId}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        title={card ? card.name : (isRandom ? 'Aléatoire' : 'Vide')}
                                    >
                                        {cardId ? (
                                            isRandom ? (
                                                <div className="slot-random-content">
                                                    <span className="slot-icon">🎲</span>
                                                    <span className="slot-sub">{cardId.split(':')[1] || 'Tout'}</span>
                                                    {!readOnly && (
                                                        <button
                                                            className="remove-btn"
                                                            onClick={(e) => { e.stopPropagation(); const n = [...renderSlots]; n[index] = null; onSelectionChange(n); }}
                                                        >×</button>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <CardFrame cardId={cardId} variant="mini" showCost={true} fitText={true} />
                                                    {!readOnly && (
                                                        <button
                                                            className="remove-btn"
                                                            onClick={(e) => { e.stopPropagation(); const n = [...renderSlots]; n[index] = null; onSelectionChange(n); }}
                                                        >×</button>
                                                    )}
                                                </>
                                            )
                                        ) : (
                                            <div className="slot-placeholder">
                                                <span className="plus-icon">+</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Landscape Column (Dynamic) */}
                    <div className="landscape-column">
                        <div className="section-header">
                            <h4>Spécial <span className="count-badge">{landscapeInstructions.filter(i => i !== 'empty').length}/{MAX_LANDSCAPES}</span></h4>
                        </div>

                        <div className="landscape-list redesign">
                            {/* Always show 4 slots (2x2 grid) */}
                            {(() => {
                                const items = [...landscapeInstructions];
                                while (items.length < MAX_LANDSCAPES) items.push('empty');

                                return items.map((inst, index) => {
                                    const isRandom = inst.startsWith('random');
                                    const activeTypes = isRandom
                                        ? (inst === 'random:any' ? LANDSCAPE_TYPES.map(t => t.id) : inst.split(':')[1].split(','))
                                        : [];

                                    if (inst === 'empty') {
                                        return (
                                            <div
                                                key={index}
                                                className={`landscape-slot-container empty ${activeLandscapeIndex === index ? 'editing' : ''}`}
                                                onClick={() => handleLandscapeAddClick(index, 'any')}
                                            >
                                                <div className="card-slot landscape small slot-placeholder">
                                                    <span className="plus-icon">+</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={index} className="landscape-slot-container">
                                            <div className="landscape-slot-controls">
                                                <div /> {/* Spacer */}
                                                {!readOnly && (
                                                    <button
                                                        className="slot-control-btn remove-slot-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleLandscapeRemoveClick(index); }}
                                                        title="Réinitialiser"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>

                                            <div className="landscape-slot">
                                                <div className={`card-slot landscape small ${activeLandscapeIndex === index ? 'editing' : ''}`}>
                                                    {isRandom ? (
                                                        <div className="landscape-types-grid">
                                                            {LANDSCAPE_TYPES.map(type => (
                                                                <div
                                                                    key={type.id}
                                                                    className={`landscape-type-line ${activeTypes.includes(type.id) ? 'active' : ''}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleLandscapeType(index, type.id);
                                                                    }}
                                                                >
                                                                    <span className="type-icon">{type.icon}</span>
                                                                    <span className="type-label">{type.label}</span>
                                                                </div>
                                                            ))}
                                                            {!readOnly && (
                                                                <div
                                                                    className="landscape-type-line personalize-line"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleLandscapeAddClick(index, 'any');
                                                                    }}
                                                                    title="Personnaliser"
                                                                >
                                                                    <span className="type-icon">✏️</span>
                                                                    <span className="type-label">Personnaliser...</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <CardFrame
                                                            cardId={inst}
                                                            variant="mini"
                                                            showCost={true}
                                                            onClick={() => !readOnly && handleLandscapeAddClick(index, 'any')}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expansion Toggles Bar */}
            <div className="expansions-bar">
                <div className="expansions-scroll">
                    <button
                        className={`exp-toggle all ${enabledExpansions?.length === ALL_EXPANSIONS.length ? 'active' : ''}`}
                        onClick={() => {
                            if (readOnly) return;
                            // Toggle logic: If all selected -> Select None. Else -> Select All.
                            const allSelected = enabledExpansions?.length === ALL_EXPANSIONS.length;
                            onSetupChange?.({ enabledExpansions: allSelected ? [] : ALL_EXPANSIONS });
                        }}
                    >
                        TOUT
                    </button>
                    {ALL_EXPANSIONS.map(exp => (
                        <button
                            key={exp}
                            className={`exp-toggle ${enabledExpansions?.includes(exp) ? 'active' : ''}`}
                            onClick={() => {
                                if (readOnly) return;
                                const current = enabledExpansions || [];
                                const next = current.includes(exp)
                                    ? current.filter(e => e !== exp)
                                    : [...current, exp];
                                onSetupChange?.({ enabledExpansions: next });
                            }}
                            title={getDisplayName(exp)}
                        >
                            {getExpansionIcon(exp)} {getDisplayName(exp)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Controls: Prosperity/Shelters */}
            <div className="bottom-controls">
                {/* Prosperity Selector */}
                <div className="mode-selector-group">
                    <label>Prospérité</label>
                    <div className="mode-options">
                        <div
                            className={`mode-option standard ${prosperityMode === 'never' ? 'active' : ''} ${readOnly ? 'read-only' : ''}`}
                            onClick={() => !readOnly && onSetupChange?.({ prosperityMode: 'never' })}
                            title="Standard: Province & Or"
                        >
                            <div className="mode-visual">
                                <CardFrame cardId="province" variant="micro" />
                                <CardFrame cardId="gold" variant="micro" />
                            </div>
                            <div className="mode-label">Standard</div>
                        </div>

                        <div
                            className={`mode-option special ${prosperityMode === 'always' ? 'active' : ''} ${readOnly ? 'read-only' : ''}`}
                            onClick={() => !readOnly && onSetupChange?.({ prosperityMode: 'always' })}
                            title="Prospérité: Colonie & Platine"
                        >
                            <div className="mode-visual">
                                <CardFrame cardId="colony" variant="micro" />
                                <CardFrame cardId="platinum" variant="micro" />
                            </div>
                            <div className="mode-label">Prospérité</div>
                        </div>

                        <div
                            className={`mode-option random ${prosperityMode === 'random' ? 'active' : ''} ${readOnly ? 'read-only' : ''}`}
                            onClick={() => !readOnly && onSetupChange?.({ prosperityMode: 'random' })}
                            title="Aléatoire"
                        >
                            <div className="mode-visual dice">🎲</div>
                            <div className="mode-label">Aléatoire</div>
                        </div>
                    </div>
                </div>

                {/* Shelters Selector */}
                <div className="mode-selector-group">
                    <label>Refuges</label>
                    <div className="mode-options">
                        <div
                            className={`mode-option standard ${sheltersMode === 'never' ? 'active' : ''} ${readOnly ? 'read-only' : ''}`}
                            onClick={() => !readOnly && onSetupChange?.({ sheltersMode: 'never' })}
                            title="Standard: Domaines"
                        >
                            <div className="mode-visual">
                                <CardFrame cardId="estate" variant="micro" />
                            </div>
                            <div className="mode-label">Standard</div>
                        </div>

                        <div
                            className={`mode-option special ${sheltersMode === 'always' ? 'active' : ''} ${readOnly ? 'read-only' : ''}`}
                            onClick={() => !readOnly && onSetupChange?.({ sheltersMode: 'always' })}
                            title="Refuges: Cabane, Nécropole, Domaine Luxuriant"
                        >
                            <div className="mode-visual">
                                <CardFrame cardId="hovel" variant="micro" />
                                <CardFrame cardId="necropolis" variant="micro" />
                            </div>
                            <div className="mode-label">Refuges</div>
                        </div>

                        <div
                            className={`mode-option random ${sheltersMode === 'random' ? 'active' : ''} ${readOnly ? 'read-only' : ''}`}
                            onClick={() => !readOnly && onSetupChange?.({ sheltersMode: 'random' })}
                            title="Aléatoire"
                        >
                            <div className="mode-visual dice">🎲</div>
                            <div className="mode-label">Aléatoire</div>
                        </div>
                    </div>
                </div>

                <div className="fill-random-container">
                    <button
                        className="fill-random-btn"
                        onClick={() => !readOnly && onSelectionChange(null)}
                        title="Remplir les emplacements vides avec des cartes aléatoires"
                        disabled={readOnly}
                    >
                        🎲 Remplir
                    </button>
                </div>
            </div>


            {/* Modal Picker */}
            {
                (activeSlot !== null || pickerType) && (
                    <div className="picker-overlay" onClick={() => { setActiveSlot(null); setPickerType(null); }}>
                        <div className="picker-modal" onClick={e => e.stopPropagation()}>
                            <div className="picker-header">
                                <h3>
                                    {(!pickerType || pickerType === 'any') ? 'Choisir Spécial' : `Choisir ${LANDSCAPE_TYPES.find(t => t.id === pickerType)?.label}`}
                                </h3>
                                <button className="close-btn" onClick={() => { setActiveSlot(null); setPickerType(null); }}>✕</button>
                            </div>

                            <div className="picker-controls">
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                                {pickerType && (
                                    <select
                                        value={pickerType}
                                        onChange={e => setPickerType(e.target.value)}
                                    >
                                        <option value="any">Tous les types</option>
                                        {LANDSCAPE_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    value={expansionFilter || ''}
                                    onChange={e => setExpansionFilter(e.target.value || null)}
                                >
                                    <option value="">Toutes les extensions</option>

                                    {ALL_EXPANSIONS.map(exp => (
                                        <option key={exp} value={exp}>{getDisplayName(exp)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="picker-results">
                                {/* Landscape Random Options (only if picking landscape) */}
                                {pickerType && (
                                    <div className="picker-random-types-grid">
                                        {pickerType === 'any' ? (
                                            <>
                                                {LANDSCAPE_TYPES.map(type => (
                                                    <div
                                                        key={type.id}
                                                        className="picker-card-option random-choice"
                                                        style={{ background: `linear-gradient(135deg, ${type.color}88, ${type.color}44)` }}
                                                        onClick={() => handleCardSelect(`random:${type.id}`)}
                                                    >
                                                        <div className="card-placeholder-visual">{type.icon}</div>
                                                        <div className="card-name-visual">{type.label} Aléatoire</div>
                                                    </div>
                                                ))}
                                                <div
                                                    className="picker-card-option random-choice"
                                                    onClick={() => handleCardSelect(`random:any`)}
                                                >
                                                    <div className="card-placeholder-visual">🎲</div>
                                                    <div className="card-name-visual">Tout Aléatoire</div>
                                                </div>
                                            </>
                                        ) : (
                                            // Specific Type Selected -> Show Random [Type]
                                            (() => {
                                                const type = LANDSCAPE_TYPES.find(t => t.id === pickerType)!;
                                                return (
                                                    <div
                                                        className="picker-card-option random-choice"
                                                        style={{ background: `linear-gradient(135deg, ${type.color}88, ${type.color}44)` }}
                                                        onClick={() => handleCardSelect(`random:${type.id}`)}
                                                    >
                                                        <div className="card-placeholder-visual">{type.icon}</div>
                                                        <div className="card-name-visual">{type.label} Aléatoire</div>
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>
                                )}

                                {/* Kingdom Random Option (only if NOT picking landscape or specific type) */}
                                {!pickerType && (
                                    <div
                                        className="picker-card-option random-choice"
                                        onClick={() => handleCardSelect(`random:${expansionFilter || 'any'}`)}
                                    >
                                        <div className="card-placeholder-visual">🎲</div>
                                        <div className="card-name-visual">Aléatoire</div>
                                    </div>
                                )}

                                {filteredCards.map(card => card && (
                                    <div
                                        key={card.id}
                                        className="picker-card-option"
                                        onClick={() => handleCardSelect(card.id)}
                                    >
                                        <CardFrame cardId={card.id} variant="mini" showCost={true} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
