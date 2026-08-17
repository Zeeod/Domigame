/**
 * Remodel - Base Action Card
 * Trash a card from your hand. Gain a card costing up to 2 more than the trashed card.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const remodel: CardDefinition = {
    id: 'remodel',
    name: 'Rénovation',
    cost: 4,
    types: ['ACTION'],
    effects: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2, destination: 'discardPile' }]
        }
    ],
    description: 'Écartez une carte de votre main. Gagnez une carte coûtant jusqu\'à 2 Pièces de plus que la carte écartée.',
    image: '/card-images/remodel.jpg',

    expansion: 'Base'
};


