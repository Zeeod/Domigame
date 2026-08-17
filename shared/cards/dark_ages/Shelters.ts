import { CardDefinition } from '../../types/CardDefinition.js';

export const Shelters: CardDefinition[] = [
    {
        id: 'hovel',
        name: 'Cabane',
        cost: 1,
        types: ['REACTION', 'SHELTER'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        isSubCard: true, // Shelters are not kingdom cards, they replace starting Estates
        description: "Lorsque vous achetez une carte Victoire, vous pouvez écarter cette carte de votre main.",
        reactionTrigger: 'BUY',
        reactionCondition: { type: 'GAIN_TYPE', value: 'VICTORY' } as any,
        reactionEffects: [
            { type: 'TRASH_SELF' }
        ]
    },
    {
        id: 'necropolis',
        name: 'Nécropole',
        cost: 1,
        types: ['ACTION', 'SHELTER'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        isSubCard: true,
        description: "+2 Actions",
        effects: [
            { type: 'ADD_ACTIONS', amount: 2 }
        ]
    },
    {
        id: 'overgrown_estate',
        name: 'Domaine luxuriant',
        cost: 1,
        types: ['VICTORY', 'SHELTER'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        isSubCard: true,
        description: "0 VP. Lorsque vous écartez cette carte, +1 Carte.",
        victoryPoints: 0,
        onTrash: [
            { type: 'DRAW', amount: 1 }
        ]
    }
];
