import { CardDefinition } from '../../types/CardDefinition.js';

export const minion: CardDefinition = {
    id: 'minion',
    name: 'Larbin',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CHOOSE_OPTION',
            options: [
                { label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                {
                    label: 'Défausser votre main, +4 Cartes (attaque)',
                    effects: [
                        { type: 'DISCARD_HAND' },
                        { type: 'DRAW', amount: 4 },
                        {
                            type: 'ATTACK',
                            attackEffects: [
                                {
                                    type: 'CONDITION', condition: 'HAND_SIZE', comparator: '>=', value: 5,
                                    trueEffects: [{ type: 'DISCARD_HAND' }, { type: 'DRAW', amount: 4 }]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ] as any,
    description: '+1 Action. Choisissez : +2 ?? ; ou défaussez votre main, +4 Cartes et chaque autre joueur ayant au moins 5 cartes en main défausse la sienne et pioche 4 cartes.',
    image: '/card-images/minion.jpg',
    expansion: 'intrigue'
};
