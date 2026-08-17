import { CardDefinition } from '../../types/CardDefinition.js';

export const baron: CardDefinition = {
    id: 'baron',
    name: 'Baron',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'DISCARD',
            min: 0,
            max: 1,
            filter: { cardIds: ['estate'] },
            requiredCount: 1,
            onSuccess: [{ type: 'ADD_MONEY', amount: 4 }],
            onFailure: [{ type: 'GAIN_CARD', cardId: 'estate', destination: 'discardPile' }]
        }
    ],
    description: '+1 Achat. Vous pouvez défausser une carte Domaine pour obtenir +4 ??. Si vous ne le faites pas, gagnez un Domaine.',
    image: '/card-images/baron.jpg',

    expansion: 'Intrigue'
};
