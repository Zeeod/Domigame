import { CardDefinition } from '../../types/CardDefinition.js';

export const oldWitch: CardDefinition = {
    id: 'old_witch',
    name: 'Vieille Sorcière',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'DRAW', amount: 3 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'GAIN_CARD', cardId: 'curse' },
                {
                    type: 'TRASH',
                    source: 'hand',
                    filter: { cardIds: ['curse'] },
                    min: 0,
                    max: 1,
                    message: 'Vous pouvez écarter une Malédiction de votre main.'
                }
            ]
        }
    ],
    description: '+3 Cartes. Chaque autre joueur reçoit une Malédiction et peut écarter une Malédiction de sa main.',
    image: '/card-images/old_witch.jpg',
    expansion: 'Renaissance',
    set: 'renaissance'
};
