import { CardDefinition } from '../../types/CardDefinition.js';

export const Herbalist: CardDefinition = {
    id: 'herbalist',
    name: 'Herboriste',
    types: ['ACTION'],
    cost: 2,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "+1 Achat.\n+1 Pièce.\nLorsque vous écartez cette carte du jeu, vous pouvez replacer une de vos cartes Trésor en jeu sur votre deck.",
    effects: [
        {
            type: 'ADD_BUYS',
            amount: 1
        },
        {
            type: 'ADD_MONEY',
            amount: 1
        }
    ],
    onCleanup: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'playArea',
            destination: 'deck',
            min: 0,
            max: 1,
            filter: { cardTypes: ['TREASURE'] },
            message: 'Choisissez un Trésor à replacer sur votre deck'
        }
    ]
};
