import { CardDefinition } from '../../types/CardDefinition.js';

export const storeroom: CardDefinition = {
    id: 'storeroom',
    name: 'Réserve',
    cost: 3,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Achat. Défaussez n\'importe quel nombre de cartes, puis piochez autant. Puis défaussez n\'importe quel nombre de cartes pour +1💰 chacune.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'DISCARD_THEN_DRAW', min: 0, max: 'hand' } as any,
        { type: 'DISCARD_FOR_COINS', min: 0, max: 'hand' } as any
    ]
};
