import { CardDefinition } from '../../types/CardDefinition.js';

export const duke: CardDefinition = {
    id: 'duke',
    name: 'Duc',
    cost: 5,
    types: ['VICTORY'],
    victoryPoints: 0, // Computed at end of game
    dynamicVP: true,
    vpCalculator: (allCards) => allCards.filter(c => c.id === 'duchy').length,
    description: 'Vaut 1 PV pour chaque Duché que vous possédez.',
    image: '/card-images/duke.jpg',
    expansion: 'Intrigue'
};
