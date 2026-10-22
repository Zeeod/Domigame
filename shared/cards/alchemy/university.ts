import { CardDefinition } from '../../types/CardDefinition.js';

export const University: CardDefinition = {
    id: 'university',
    name: 'Université',
    types: ['ACTION'],
    cost: 2,
    potionCost: 1,
    expansion: 'alchemy',
    description: '+2 Actions. Vous pouvez recevoir une carte Action coûtant jusqu\'à 5 💰.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'GAIN_CARD', maxCost: 5, cardTypes: ['ACTION'], optional: true, message: 'Université : recevez une carte Action coûtant jusqu\'à 5 💰' }
    ] as any
};
