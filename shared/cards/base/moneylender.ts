/**
 * Moneylender - Base Action Card
 * Trash a Copper from your hand. If you do, +3 Money.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const moneylender: CardDefinition = {
    id: 'moneylender',
    name: 'Argentier',
    cost: 4,
    types: ['ACTION'],
    effects: [
        {
            type: 'TRASH',
            min: 0,
            max: 1,
            from: 'hand',
            filter: { cardIds: ['copper'] },
            onSuccess: [{ type: 'ADD_MONEY', amount: 3 }]
        }
    ],
    description: 'Vous pouvez écarter un Cuivre de votre main. Si vous le faites, +3 Pièces.',
    image: '/card-images/moneylender.jpg',

    expansion: 'Base'
};


