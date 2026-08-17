import { CardDefinition } from '../../types/CardDefinition.js';

export const monument: CardDefinition = {
    id: 'monument',
    name: 'Monument',
    cost: 4,
    types: ['ACTION'],
    description: '+2 💰; +1 🛡️ (Point de Victoire).',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_VICTORY_TOKENS', amount: 1 }
    ],
    expansion: 'Prosperity',
    set: 'prosperity' // Using 'prosperity' as set key
};
