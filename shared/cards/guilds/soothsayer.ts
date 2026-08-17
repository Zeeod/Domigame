import { CardDefinition } from '../../types/CardDefinition.js';

export const soothsayer: CardDefinition = {
    id: 'soothsayer',
    name: 'Devin',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'guilds',
    set: 'guilds',
    description: 'Gagnez un Or. Chaque autre joueur gagne une Malédiction. Chaque joueur ayant fait cela pioche une carte.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'GAIN_CARD', cardId: 'curse', destination: 'discardPile' },
                { type: 'DRAW_IF_GAINED_CURSE', amount: 1 }
            ]
        }
    ] as any
};
