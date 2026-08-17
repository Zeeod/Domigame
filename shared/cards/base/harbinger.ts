/**
 * Harbinger - Base Action Card (2nd Edition)
 * +1 Card, +1 Action.
 * Look through your discard pile. You may put a card from it onto your deck.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const harbinger: CardDefinition = {
    id: 'harbinger',
    name: 'Présage',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SELECT_FROM_DISCARD', destination: 'deck' }
    ],
    description: '+1 Carte ; +1 Action. Regardez dans votre défausse. Vous pouvez placer une carte de votre défausse sur votre pioche.',
    image: '/card-images/harbinger.jpg',

    expansion: 'Base'
};


