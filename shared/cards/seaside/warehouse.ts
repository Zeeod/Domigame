import { CardDefinition } from '../../types/CardDefinition';

export const warehouse: CardDefinition = {
    id: 'warehouse',
    name: 'Entrepôt',
    types: ['ACTION'],
    description: '+3 Cartes ; +1 Action. Défaussez 3 cartes.',
    cost: 3,
    set: 'seaside',
    effects: [
        {
            type: 'DRAW',
            amount: 3
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        },
        {
            type: 'DISCARD',
            min: 3,
            max: 3,
            message: 'Défaussez 3 cartes.'
        }
    ]
};
