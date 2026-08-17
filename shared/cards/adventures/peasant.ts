import { CardDefinition } from '../../types/CardDefinition.js';

export const peasant: CardDefinition = {
    id: 'peasant',
    name: 'Paysan',
    types: ['ACTION', 'TRAVELLER'],
    cost: 2,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Achat, +1 💰. Quand vous défaussez du jeu, vous pouvez échanger contre un Soldat (depuis la pile).',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    upgradesTo: 'soldier'
};
