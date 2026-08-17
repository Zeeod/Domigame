import { CardDefinition } from '../../types/CardDefinition';

export const blockade: CardDefinition = {
    id: 'blockade',
    name: 'Blocus',
    types: ['ACTION', 'DURATION', 'ATTACK'],
    cost: 4,
    description: 'Gagnez une carte coûtant jusqu\'à 4 Pièces et mettez-la de côté. Au début de votre prochain tour, ajoutez-la à votre main. Tant qu\'elle est mise de côté, lorsqu\'un autre joueur gagne un exemplaire de cette carte à son tour, il gagne une carte Malédiction.',
    set: 'seaside',
    effects: [
        {
            type: 'GAIN_CARD',
            destination: 'aside',
            linkToSource: true,
            maxCost: 4
        }
    ],
    durationEffects: [
        {
            type: 'RETURN_LINKED_CARDS'
        }
    ],
    triggers: [
        {
            trigger: 'ON_OPPONENT_GAIN',
            filter: {
                matchLinkedId: true
            },
            effects: [
                {
                    type: 'GAIN_CARD',
                    cardId: 'curse', // Assuming 'curse' is the ID for Curse card
                    destination: 'discardPile'
                }
            ]
        }
    ]
};
