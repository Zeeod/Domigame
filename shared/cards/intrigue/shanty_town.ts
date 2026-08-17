import { CardDefinition } from '../../types/CardDefinition.js';

export const shanty_town: CardDefinition = {
    id: 'shanty_town',
    name: 'Bidonville',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'REVEAL_HAND' },
        {
            type: 'CONDITION',
            condition: 'NO_ACTIONS_IN_HAND',
            trueEffects: [{ type: 'DRAW', amount: 2 }]
        }
    ],
    description: '+2 Actions. Révélez votre main. Si vous n\'avez aucune carte Action, +2 Cartes.',
    image: '/card-images/shanty_town.jpg',
    expansion: 'Intrigue'
};
