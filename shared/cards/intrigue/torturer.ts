import { CardDefinition } from '../../types/CardDefinition.js';

export const torturer: CardDefinition = {
    id: 'torturer',
    name: 'Tortureur',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'DRAW', amount: 3 },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'CHOOSE_OPTION',
                    message: 'Bourreau : Choisissez votre supplice',
                    options: [
                        { label: 'Défausser 2 cartes', effects: [{ type: 'DISCARD', min: 2, max: 2 }] },
                        { label: 'Gagner une Malédiction en main', effects: [{ type: 'GAIN_CARD', cardId: 'curse', destination: 'hand' }] }
                    ]
                }
            ]
        }
    ],
    description: '+3 Cartes. Chaque autre joueur choisit : défausser 2 cartes de sa main ; ou gagner une carte Malédiction dans sa main.',
    image: '/card-images/torturer.jpg',

    expansion: 'Intrigue'
};


