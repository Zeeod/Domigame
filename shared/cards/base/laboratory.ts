/**
 * Laboratory - Base Action Card
 * +2 Cards, +1 Action
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const laboratory: CardDefinition = {
    id: 'laboratory',
    name: 'Laboratoire',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'MODIFY_RESOURCE', resource: 'actions', amount: 1 }
    ],
    description: '+2 Cartes ; +1 Action.',
    image: '/card-images/laboratory.jpg',

    expansion: 'Base'
};


