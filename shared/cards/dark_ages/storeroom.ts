import { CardDefinition } from '../../types/CardDefinition.js';

export const storeroom: CardDefinition = {
    id: 'storeroom',
    name: 'Réserve',
    cost: 3,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: '+1 Achat. Défaussez n\'importe quel nombre de cartes, puis piochez autant. Puis défaussez n\'importe quel nombre de cartes pour +1💰 chacune.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'DISCARD_THEN_DRAW', min: 0, max: 99, message: 'Réserve : défaussez des cartes pour en piocher autant' },
        { type: 'DISCARD', min: 0, max: 99, message: 'Réserve : défaussez des cartes pour +1 💰 chacune', onSuccess: [{ type: 'ADD_MONEY', amount: { type: 'COUNT_DISCARDED' } }] }
    ] as any
};
