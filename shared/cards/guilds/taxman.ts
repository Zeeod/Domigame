import { CardDefinition } from '../../types/CardDefinition.js';

export const taxman: CardDefinition = {
    id: 'taxman',
    name: 'Percepteur',
    types: ['ACTION', 'ATTACK'],
    cost: 4,
    expansion: 'guilds',
    set: 'guilds',
    description: 'Vous pouvez écarter un Trésor de votre main. Chaque autre joueur ayant 5 cartes ou plus en main défausse une copie du Trésor écartésame. Gagnez un Trésor sur votre pioche coûtant jusqu\'à 3 💰 de plus.',
    effects: [
        {
            type: 'TRASH',
            min: 0,
            max: 1,
            filter: { cardTypes: ['TREASURE'] },
            from: 'hand',
            message: 'Écartez un Trésor pour attaquer',
            onSuccess: [
                {
                    type: 'ATTACK',
                    attackEffects: [
                        { type: 'DISCARD_COPY_IF_HAND_5_OR_MORE' }
                    ]
                },
                { type: 'GAIN_TREASURE', costBonus: 3, destination: 'deck' }
            ]
        }
    ] as any
};
