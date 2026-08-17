/**
 * Library - Base Action Card
 * Draw until you have 7 cards in hand.
 * You may set aside any Action cards drawn this way, discarding them afterwards.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const library: CardDefinition = {
    id: 'library',
    name: 'Bibliothèque',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 7, maySkipActions: true }
    ],
    description: 'Piochez jusqu\'à ce que vous ayez 7 cartes en main, en mettant de côté chaque carte Action piochée que vous voulez. Défaussez les cartes mises de côté après avoir fini de piocher.',
    image: '/card-images/library.jpg',

    expansion: 'Base'
};


