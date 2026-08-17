/**
 * Mine - Base Action Card
 * You may trash a Treasure card from your hand. 
 * Gain a Treasure card to your hand costing up to 3 more than it.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const mine: CardDefinition = {
    id: 'mine',
    name: 'Mine',
    cost: 5,
    types: ['ACTION'],
    effects: [
        {
            type: 'TRASH',
            min: 0,
            max: 1,
            from: 'hand',
            filter: { cardTypes: ['TREASURE'] },
            onSuccess: [{
                type: 'GAIN_CARD_PLUS_COST',
                costBonus: 3,
                destination: 'hand',
                cardTypes: ['TREASURE']
            }]
        }
    ],
    description: 'Écartez une carte Trésor de votre main. Gagnez une carte Trésor coûtant jusqu\'à 3 Pièces de plus que la carte écartée. Ajoutez-la à votre main.',
    image: '/card-images/mine.jpg',

    expansion: 'Base'
};


