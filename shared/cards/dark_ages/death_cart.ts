import { CardDefinition } from '../../types/CardDefinition.js';

export const deathCart: CardDefinition = {
    id: 'death_cart',
    name: 'Chariot Mortuaire',
    cost: 4,
    types: ['ACTION', 'LOOTER'],
    expansion: 'dark_ages',
    description: '+5 💰. Vous pouvez écarter une carte Action de votre main. Sinon, écartez cette carte. Quand vous recevez cette carte, recevez 2 Ruines.',
    effects: [
        { type: 'ADD_MONEY', amount: 5 },
        { type: 'DEATH_CART' }
    ] as any,
    onGain: [
        { type: 'GAIN_CARD', cardId: 'ruins', destination: 'discardPile' },
        { type: 'GAIN_CARD', cardId: 'ruins', destination: 'discardPile' }
    ]
};
