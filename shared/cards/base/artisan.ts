/**
 * Artisan - Base Action Card (2nd Edition)
 * Gain a card to your hand costing up to 5. 
 * Put a card from your hand onto your deck.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const artisan: CardDefinition = {
    id: 'artisan',
    name: 'Artisan',
    cost: 6,
    types: ['ACTION'],
    effects: [
        { type: 'GAIN_CARD', destination: 'hand', maxCost: 5 },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            destination: 'deck',
            min: 1,
            max: 1,
            message: 'Choisissez une carte de votre main à mettre sur votre deck'
        }
    ],
    description: 'Gagnez une carte coûtant jusqu\'à 5 Pièces et ajoutez-la à votre main. Placez une carte de votre main sur votre pioche.',
    image: '/card-images/artisan.jpg',

    expansion: 'Base'
};
