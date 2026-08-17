/**
 * Village - Base Action Card
 * +1 Card, +2 Actions
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const village: CardDefinition = {
    id: 'village',
    name: 'Village',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'MODIFY_RESOURCE', resource: 'actions', amount: 2 }
    ],
    description: '+1 Carte ; +2 Actions.',
    image: '/card-images/village.jpg',

    expansion: 'Base'
};


