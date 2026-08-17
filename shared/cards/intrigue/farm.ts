import { CardDefinition } from '../../types/CardDefinition.js';

export const farm: CardDefinition = {
    id: 'farm',
    name: 'Ferme',
    cost: 6,
    types: ['TREASURE', 'VICTORY'],
    victoryPoints: 2,
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    description: '2 PV. 2 💰. (Une carte Trésor et Victoire.)',
    image: '/card-images/farm.jpg',
    expansion: 'Intrigue'
};
