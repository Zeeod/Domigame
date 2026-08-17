import { CardDefinition } from '../../types/CardDefinition.js';

export const poorHouse: CardDefinition = {
    id: 'poor_house',
    name: 'Hospice',
    cost: 1,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+4💰. Révélez votre main. -1💰 par Trésor révélé (pas moins de 0💰).',
    effects: [
        { type: 'ADD_MONEY', amount: 4 },
        { type: 'REVEAL_HAND' },
        { type: 'SUBTRACT_MONEY_PER_TREASURE_IN_HAND' } as any
    ]
};
