import React, { useState, useMemo } from 'react';
import { CardRegistry } from '../../shared/cards/index';
import { CardFrame } from './CardFrame';
import './CardLibrary.css';

interface CardLibraryProps {
    onClose: () => void;
}

export const CardLibrary: React.FC<CardLibraryProps> = ({ onClose }) => {
    const [selectedSet, setSelectedSet] = useState<string>('base');
    const [search, setSearch] = useState('');

    const getSetKey = (c: any) => {
        const raw = c.set || (c.expansion ? c.expansion.toLowerCase() : 'base');
        return raw.toLowerCase().replace(/\s+/g, '_');
    };

    const getDisplayName = (setKey: string) => {
        const key = setKey.toLowerCase().replace(/\s+/g, '_');
        switch (key) {
            case 'base': return 'Base';
            case 'intrigue': return 'Intrigue';
            case 'seaside': return 'Rivage';
            case 'prosperity': return 'Prospérité';
            case 'dark_ages': return 'Âges Sombres';
            case 'hinterlands': return 'Arrière-Pays';
            case 'cornucopia': return 'Abondance';
            case 'guilds': return 'Guildes';
            case 'adventures': return 'Aventures';
            case 'empires': return 'Empires';
            case 'alchemy': return 'Alchimie';
            case 'nocturne': return 'Nocturne';
            case 'renaissance': return 'Renaissance';
            case 'menagerie': return 'Ménagerie';
            case 'allies': return 'Alliés';
            case 'plunder': return 'Pillage';
            case 'rising_sun': return 'Soleil levant';
            case 'promos': return 'Promos';
            default: return setKey.charAt(0).toUpperCase() + setKey.slice(1);
        }
    };

    // Categorization Logic
    const getCardCategory = (card: any, setKey: string) => {
        // 1. Base Cards (specific IDs)
        const BASE_IDS = ['copper', 'silver', 'gold', 'platinum', 'potion', 'curse', 'estate', 'duchy', 'province', 'colony'];
        if (BASE_IDS.includes(card.id)) return 'base';

        // 2. Specific Types (Dark Ages & others)
        if (card.types.includes('KNIGHT')) return 'knights';
        if (card.types.includes('RUINS')) return 'ruins';
        if (card.types.includes('SHELTER')) return 'shelters';
        if (card.types.includes('EVENT')) return 'events';
        if (card.types.includes('LANDMARK')) return 'landmarks';
        if (card.types.includes('PROJECT')) return 'projects';
        if (card.types.includes('WAY')) return 'ways';
        if (card.types.includes('ALLY')) return 'allies';
        if (card.types.includes('BOON')) return 'boons';
        if (card.types.includes('HEX')) return 'hexes';
        if (card.types.includes('STATE')) return 'states';
        if (card.types.includes('ARTIFACT')) return 'artifacts';
        if (card.types.includes('HEIRLOOM')) return 'heirlooms';

        // 3. Empires, Allies & Promos specific sections
        if (setKey === 'empires' || setKey === 'allies' || setKey === 'promos') {
            if (card.isPile) return 'kingdom';
            if (card.types.includes('CASTLE')) return 'castles';
            if (card.isSubCard) return 'split_piles';
        }

        // 4. Non-Supply (Travellers upgrades, Spirits, Zombies, Prizes, etc.)
        if (card.isNonSupply) return 'special';
        if (card.isSubCard) return 'special'; // Simplified to avoid recursion

        // 5. Kingdom Cards (Default)
        return 'kingdom';
    };

    const getCategoryDisplayName = (catKey: string) => {
        switch (catKey) {
            case 'base': return 'Cartes de Base';
            case 'kingdom': return 'Cartes Royaume';
            case 'knights': return 'Chevaliers';
            case 'ruins': return 'Ruines';
            case 'shelters': return 'Abris';
            case 'events': return 'Événements';
            case 'landmarks': return 'Repères';
            case 'projects': return 'Projets';
            case 'ways': return 'Voies';
            case 'allies': return 'Alliés';
            case 'boons': return 'Bienfaits';
            case 'hexes': return 'Méchancetés';
            case 'states': return 'États';
            case 'artifacts': return 'Artefacts';
            case 'heirlooms': return 'Héritages';
            case 'castles': return 'Châteaux';
            case 'split_piles': return 'Piles mixtes';
            case 'special': return 'Cartes Spéciales / Non-Supply';
            default: return 'Divers';
        }
    };

    // Calculate available expansions and mapped cards
    const { expansions, categorizedCards } = useMemo(() => {
        const allCards = CardRegistry.getAll();
        const cardsList = Object.values(allCards);

        // Define standard order
        const expansions = ['base', 'intrigue', 'seaside', 'prosperity', 'dark_ages', 'hinterlands', 'cornucopia', 'guilds', 'adventures', 'empires', 'alchemy', 'nocturne', 'renaissance', 'menagerie', 'allies', 'plunder', 'rising_sun', 'promos'];

        // Filter cards
        const searchLower = search.toLowerCase();
        const filtered = cardsList.filter(c => {
            if (c.id === 'back' || c.id === 'Pioche') return false;

            const setKey = getSetKey(c);
            const setMatch = setKey === selectedSet;
            const nameMatch = (c.name || '').toLowerCase().includes(searchLower);
            const textMatch = (c.description || '').toLowerCase().includes(searchLower);

            return setMatch && (nameMatch || textMatch);
        });

        // Group by category
        const groups: Record<string, any[]> = {};
        const priorityOrder = ['base', 'kingdom', 'split_piles', 'castles', 'events', 'landmarks', 'projects', 'ways', 'knights', 'ruins', 'shelters', 'heirlooms', 'boons', 'hexes', 'states', 'artifacts', 'allies', 'special'];

        filtered.forEach(c => {
            const cat = getCardCategory(c, selectedSet);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(c);
        });

        // Sort by cost then name
        Object.values(groups).forEach(group => {
            group.sort((a, b) => {
                if (a.cost !== b.cost) return a.cost - b.cost;
                return (a.name || '').localeCompare(b.name || '');
            });
        });

        // Sort categories by priority
        const sortedCategories = Object.keys(groups).sort((a, b) => {
            const idxA = priorityOrder.indexOf(a);
            const idxB = priorityOrder.indexOf(b);
            // If both regular, use priority. If one unknown, put at end.
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        return { expansions, categorizedCards: sortedCategories.map(cat => ({ key: cat, title: getCategoryDisplayName(cat), cards: groups[cat] })) };
    }, [selectedSet, search]);

    return (
        <div className="card-library-overlay">
            <div className="library-sidebar">
                <div className="library-header">
                    <h2>Cartes du Jeu</h2>
                    <button className="close-btn" onClick={onClose}>Fermer</button>
                </div>

                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="expansion-list">
                    {expansions.map(exp => (
                        <button
                            key={exp}
                            className={`expansion-item ${selectedSet === exp ? 'active' : ''}`}
                            onClick={() => setSelectedSet(exp)}
                        >
                            {getDisplayName(exp)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="library-content">
                <div className="library-content-header">
                    <h3>{getDisplayName(selectedSet)} ({categorizedCards.reduce((acc, cat) => acc + cat.cards.length, 0)} cartes)</h3>
                </div>

                <div className="library-scroll-area">
                    {categorizedCards.map(category => (
                        <div key={category.key} className="library-category">
                            <h4 className="category-header">{category.title}</h4>
                            <div className="library-grid">
                                {category.cards.map((card: any) => (
                                    <div key={card.id} className="library-card-wrapper">
                                        <CardFrame
                                            cardId={card.id}
                                            variant="full"
                                            showCost={true}
                                            fitText={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {categorizedCards.length === 0 && (
                        <div className="no-cards-message">
                            Aucune carte trouvée pour cette recherche.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
