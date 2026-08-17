/**
 * Militia - Base Action-Attack Card
 * +2 Money. Each other player discards down to 3 cards in hand.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const militia: CardDefinition = {
    id: 'militia',
    name: 'Milice',
    cost: 4,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'DISCARD_TO_HAND_SIZE', targetHandSize: 3 }
            ]
        }
    ],
    description: '+2 Pièces. Chaque autre joueur défausse des cartes de sa main jusqu\'à n\'en avoir plus que 3.',
    image: '/card-images/militia.jpg',

    expansion: 'Base'
};


