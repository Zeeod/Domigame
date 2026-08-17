import { CardDefinition } from '../../types/CardDefinition.js';

export const Ruins: CardDefinition[] = [
    {
        id: 'abandoned_mine',
        name: 'Mine abandonnée',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+1 Pièce.",
        effects: [
            { type: 'ADD_MONEY', amount: 1 }
        ],
        isSubCard: true
    },
    {
        id: 'ruined_library',
        name: 'Bibliothèque en ruines',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+1 Carte.",
        effects: [
            { type: 'DRAW', amount: 1 }
        ],
        isSubCard: true
    },
    {
        id: 'ruined_market',
        name: 'Marché en ruines',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+1 Achat.",
        effects: [
            { type: 'ADD_BUYS', amount: 1 }
        ],
        isSubCard: true
    },
    {
        id: 'ruined_village',
        name: 'Village en ruines',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+1 Action.",
        effects: [
            { type: 'ADD_ACTIONS', amount: 1 }
        ],
        isSubCard: true
    },
    {
        id: 'survivors',
        name: 'Survivants',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "Regardez les 2 cartes du dessus de votre deck. Défaussez-les ou replacez-les dans l'ordre de votre choix.",
        effects: [
            {
                type: 'CHOICE',
                options: ['Défausser', 'Replacer'],
                effects: {
                    'Défausser': [
                        { type: 'REVEAL_CARDS', amount: 2, source: 'deck', destination: 'discardPile' }
                    ],
                    'Replacer': [
                        { type: 'REVEAL_CARDS', amount: 2, source: 'deck', destination: 'limbo' },
                        { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Replacez les cartes sur votre deck' }
                    ]
                }
            }
        ],
        isSubCard: true
    },
    // The Mixed Pile Placeholder
    {
        id: 'ruins',
        name: 'Ruines',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "Pile de Ruines (Mélangée)",
        mixedPile: {
            type: 'SHUFFLED',
            cards: ['abandoned_mine', 'ruined_library', 'ruined_market', 'ruined_village', 'survivors']
        },
        buyRestriction: {
            type: 'NO_COPPER_IN_PLAY' // Not strictly true, but needs a valid restriction logic if processed
        }
        // Note: Effects are not used for the pile placeholder
    }
];
