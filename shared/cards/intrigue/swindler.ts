import { CardDefinition } from '../../types/CardDefinition.js';

export const swindler: CardDefinition = {
    id: 'swindler',
    name: 'Escroc',
    cost: 3,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'REVEAL_CARDS', amount: 1, source: 'deck', destination: 'limbo' },
                { type: 'MOVE_CARDS', source: 'limbo', destination: 'trash' },
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'supply',
                    min: 1,
                    max: 1,
                    message: 'Choisissez une carte de remplacement (même coût)',
                    filter: { exactCost: 'LAST_TRASHED_COST' },
                    context: { specialAction: 'SWINDLER_REPLACEMENT' }
                }
            ]
        }
    ],
    description: '+2 ??. Chaque autre joueur écarte la carte du dessus de son deck et vous choisissez une carte de même coût dans la réserve pour la remplacer.',
    image: '/card-images/swindler.jpg',
    expansion: 'Intrigue'
};
