import { CardDefinition } from '../../types/CardDefinition.js';

export const margrave: CardDefinition = {
    id: 'margrave',
    name: 'Margrave',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+3 Cartes, +1 Achat. Chaque autre joueur pioche une carte puis défausse jusqu\'à avoir 3 cartes en main.',
    effects: [
        { type: 'DRAW', amount: 3 },
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'DRAW', amount: 1 },
                { type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }
            ]
        }
    ] as any
};
