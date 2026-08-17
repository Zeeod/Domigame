import { CardDefinition } from '../../types/CardDefinition.js';

export const squire: CardDefinition = {
    id: 'squire',
    name: 'Écuyer',
    cost: 2,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1💰. Choisissez: +2 Actions; ou +2 Achats; ou gagnez un Argent. Quand vous écartez cette carte, gagnez une carte Attaque.',
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus:',
            options: [
                { label: '+2 Actions', effects: [{ type: 'ADD_ACTIONS', amount: 2 }] },
                { label: '+2 Achats', effects: [{ type: 'ADD_BUYS', amount: 2 }] },
                { label: 'Gagner un Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' }] }
            ]
        } as any
    ],
    onTrash: [
        { type: 'GAIN_CARD', filter: { cardTypes: ['ATTACK'] }, destination: 'discardPile' } as any
    ]
};
