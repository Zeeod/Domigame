import { CardDefinition } from '../../types/CardDefinition.js';

export const seaWitch: CardDefinition = {
    id: 'sea_witch',
    name: 'Sorcière des mers',
    types: ['ACTION', 'ATTACK', 'DURATION'],
    description: '+2 Cartes. Chaque autre joueur gagne une Malédiction. Au début de votre prochain tour : +2 Cartes, puis défaussez 2 cartes.',
    cost: 5,
    set: 'seaside',
    effects: [
        {
            type: 'DRAW',
            amount: 2
        },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'GAIN_CARD',
                    cardId: 'curse',
                    destination: 'discardPile'
                }
            ]
        }
    ],
    durationEffects: [
        {
            type: 'DRAW',
            amount: 2
        },
        {
            type: 'DISCARD',
            min: 2,
            max: 2,
            message: 'Défaussez 2 cartes.'
        }
    ]
};
