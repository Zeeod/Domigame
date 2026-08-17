import { CardDefinition } from '../../types/CardDefinition.js';

export const ironmonger: CardDefinition = {
    id: 'ironmonger',
    name: 'Ferronnier',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +1 Action. Révélez la carte du dessus de votre deck; vous pouvez la défausser. Si c\'est une Action, +1 Action. Trésor, +1💰. Victoire, +1 Carte.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'IRONMONGER_REVEAL' } as any
    ]
};
