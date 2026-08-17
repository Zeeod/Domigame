import { CardDefinition } from '../../types/CardDefinition.js';

export const pillage: CardDefinition = {
    id: 'pillage',
    name: 'Pillage',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Écartez cette carte. Si vous le faites, chaque autre joueur ayant 5 cartes ou plus en main révèle sa main et vous en choisissez une qu\'il défausse. Gagnez 2 Butins.',
    effects: [
        { type: 'TRASH_SELF' },
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effect: {
                type: 'CONDITION',
                condition: 'HAND_SIZE',
                comparator: '>=',
                value: 5,
                trueEffects: [
                    { type: 'REVEAL_HAND' },
                    { type: 'DISCARD', min: 1, max: 1, message: 'Attaque Pillage : Défaussez une carte.' }
                ]
            } as any
        },
        { type: 'GAIN_CARD', cardId: 'spoils', destination: 'discardPile' },
        { type: 'GAIN_CARD', cardId: 'spoils', destination: 'discardPile' }
    ]
};
