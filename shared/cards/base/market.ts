/**
 * Market - Base Action Card
 * +1 Card, +1 Action, +1 Buy, +1 Money
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const market: CardDefinition = {
    id: 'market',
    name: 'Marché',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'MODIFY_RESOURCE', resource: 'actions', amount: 1 },
        { type: 'MODIFY_RESOURCE', resource: 'buys', amount: 1 },
        { type: 'MODIFY_RESOURCE', resource: 'coins', amount: 1 }
    ],
    description: '+1 Carte ; +1 Action ; +1 Achat ; +1 Pièce.',
    image: '/card-images/market.jpg',

    expansion: 'Base'
};


