import { CardDefinition } from '../../types/CardDefinition.js';

export const sage: CardDefinition = {
    id: 'sage',
    name: 'Sage',
    cost: 3,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Action. Révélez les cartes de votre deck jusqu\'à en trouver une coûtant 3💰 ou plus. Prenez-la en main et défaussez le reste.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_UNTIL',
            condition: { minCost: 3 },
            destination: 'hand'
        } as any
    ]
};
