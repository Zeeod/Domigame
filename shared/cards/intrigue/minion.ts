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
                { label: '+2 ??', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                {
                    label: 'Défausser main, +4 Cartes, les autres ausssi si main > 4',
                    effects: [
                        { type: 'DISCARD', min: 0, max: 99 },
                        { type: 'DRAW', amount: 4 },
                        {
                            type: 'ATTACK',
                            attackEffects: [
                                {
                                    type: 'CONDITION',
                                    condition: 'HAND_SIZE',
                                    comparator: '>=',
                                    value: 5,
                                    trueEffects: [
                                        { type: 'DISCARD', min: 0, max: 99 },
                                        { type: 'DRAW', amount: 4 }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    description: '+1 Action. Choisissez : +2 ?? ; ou défaussez votre main, +4 Cartes et chaque autre joueur ayant au moins 5 cartes en main défausse la sienne et pioche 4 cartes.',
    image: '/card-images/minion.jpg',
    expansion: 'Intrigue'
};
