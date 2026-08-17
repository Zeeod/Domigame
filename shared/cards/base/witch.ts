import { CardDefinition } from '../../types/CardDefinition.js';

export const witch: CardDefinition = {
    id: 'witch',
    name: 'Sorcière',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'base',
    set: 'base',
    description: '+2 Cartes. Chaque autre joueur reçoit une Malédiction.',
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [{
                type: 'GAIN_CARD',
                cardId: 'curse',
                destination: 'discardPile'
            }]
        }
    ],
    image: '/card-images/witch.jpg'
};
