/**
 * Vassal - Base Action Card (2nd Edition)
 * +2 Money.
 * Discard the top card of your deck. If it's an Action card, you may play it.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const vassal: CardDefinition = {
    id: 'vassal',
    name: 'Vassal',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'VASSAL_EFFECT' } as any
    ],
    description: '+2 Pièces. Défaussez la carte du sommet de votre pioche. Si c\'est une carte Action, vous pouvez la jouer.',
    image: '/card-images/vassal.jpg',

    expansion: 'Base'
};
