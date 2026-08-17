import { CardDefinition } from '../../types/CardDefinition.js';

export const wineMerchant: CardDefinition = {
    id: 'wine_merchant',
    name: 'Marchand de vin',
    types: ['ACTION', 'RESERVE'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Achat, +4 💰. Mettez cette carte sur votre tapis de Réserve. Réserve: À la fin de votre phase Achat, si vous avez 2 💰 ou plus, appelez cette carte pour la défausser.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 4 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
