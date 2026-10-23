import { CardDefinition } from '../../types/CardDefinition.js';

export const Ruins: CardDefinition[] = [
    {
        id: 'abandoned_mine',
        name: 'Mine abandonnée',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'dark_ages',
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
        expansion: 'dark_ages',
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
        expansion: 'dark_ages',
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
        expansion: 'dark_ages',
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
        expansion: 'dark_ages',
        description: "Regardez les 2 cartes du dessus de votre deck. Défaussez-les ou replacez-les dans l'ordre de votre choix.",
        effects: [{ type: 'SURVIVORS' }] as any,
        isSubCard: true
    },
    // The Mixed Pile Placeholder
    {
        id: 'ruins',
        name: 'Ruines',
        cost: 0,
        types: ['ACTION', 'RUINS'],
        expansion: 'dark_ages',
        description: "Pile de Ruines (Mélangée)",
        // 10 of each Ruins are shuffled together; the pile uses 10 per player after the first
        mixedPile: {
            type: 'SHUFFLED',
            cards: ['abandoned_mine', 'ruined_library', 'ruined_market', 'ruined_village', 'survivors']
        }
        // Note: Effects are not used for the pile placeholder
    }
];
