import { CardDefinition } from '../../types/CardDefinition.js';

export const fairgrounds: CardDefinition = {
    id: 'fairgrounds',
    name: 'Foire',
    types: ['VICTORY'],
    cost: 6,
    expansion: 'cornucopia',
    description: 'Vaut 2 PV par 5 noms de cartes différents dans votre deck (arrondi à l\'inférieur).',
    victoryPoints: 0, // Dynamic: 2 per 5 unique card names
    effects: [],
    dynamicVP: true,
    vpCalculator: (allCards) => 2 * Math.floor(new Set(allCards.map((c: any) => c.id)).size / 5)
};
