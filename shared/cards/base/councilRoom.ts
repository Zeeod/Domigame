/**
 * Council Room - Base Action Card
 * +4 Cards, +1 Buy. Each other player draws a card.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const councilRoom: CardDefinition = {
    id: 'council_room',
    name: 'Salle du Conseil',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 4 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ALL_OTHERS_DRAW', amount: 1 }
    ],
    description: '+4 Cartes ; +1 Achat. Chaque autre joueur pioche une carte.',
    image: '/card-images/council_room.jpg',

    expansion: 'Base'
};


