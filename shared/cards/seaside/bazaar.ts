import { CardDefinition } from '../../types/CardDefinition';

export const bazaar: CardDefinition = {
    id: 'bazaar',
    name: 'Bazar',
    types: ['ACTION'],
    description: '+1 Carte ; +2 Actions ; +1 Pièce.',
    cost: 5,
    set: 'seaside',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'ADD_MONEY', amount: 1 }
    ]
};
