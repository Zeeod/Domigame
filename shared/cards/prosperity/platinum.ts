import { CardDefinition } from '../../types/CardDefinition';

export const platinum: CardDefinition = {
    id: 'platinum',
    name: 'Platine',
    cost: 9,
    types: ['TREASURE'],
    effects: [
        { type: 'ADD_MONEY', amount: 5 }
    ],
    description: '5 💰',
    image: '/card-images/platinum.jpg', // Placeholder image path
    expansion: 'Prosperity'
};
