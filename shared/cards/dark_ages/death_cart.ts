import { CardDefinition } from '../../types/CardDefinition.js';

export const deathCart: CardDefinition = {
    id: 'death_cart',
    name: 'Chariot Mortuaire',
    cost: 4,
    types: ['ACTION', 'LOOTER'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+5💰. Vous pouvez écarter une carte Action de votre main. Sinon, écartez cette carte.',
    effects: [
        { type: 'ADD_MONEY', amount: 5 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Écartez une carte Action de votre main ou écartez le Chariot Mortuaire.',
            options: [
                { label: 'Écarter une Action de ma main', effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', filter: { cardTypes: ['ACTION'] } }] },
                { label: 'Écarter le Chariot Mortuaire', effects: [{ type: 'TRASH_SELF' }] }
            ]
        } as any
    ],
    onGain: [
        { type: 'GAIN_CARD', cardId: 'ruins', destination: 'discardPile' },
        { type: 'GAIN_CARD', cardId: 'ruins', destination: 'discardPile' }
    ]
};
