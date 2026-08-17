/**
 * Festival - Base Action Card
 * +2 Actions, +1 Buy, +2 Money
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const festival: CardDefinition = {
    id: 'festival',
    name: 'Festival',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'MODIFY_RESOURCE', resource: 'actions', amount: 2 },
        { type: 'MODIFY_RESOURCE', resource: 'buys', amount: 1 },
        { type: 'MODIFY_RESOURCE', resource: 'coins', amount: 2 }
    ],
    description: '+2 Actions ; +1 Achat ; +2 Pièces.',
    image: '/card-images/festival.jpg',

    expansion: 'Base'
};


