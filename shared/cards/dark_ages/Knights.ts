import { CardDefinition } from '../../types/CardDefinition.js';
import { EffectDefinition } from '../../types/EffectDefinition.js';

const KNIGHT_ATTACK_EFFECT: EffectDefinition = {
    type: 'ATTACK',
    attackEffects: [
        {
            type: 'REVEAL_CARDS',
            amount: 2,
            source: 'deck',
            destination: 'limbo'
        },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'limbo',
            destination: 'trash',
            max: 1,
            optional: true,
            filter: { minCost: 3, maxCost: 6 },
            message: 'Choisissez une carte à écarter (coût 3-6)',
            effects: [
                {
                    type: 'CONDITION',
                    condition: 'LAST_SELECTED_HAS_TYPE',
                    value: 'KNIGHT',
                    trueEffects: [{ type: 'TRASH_SELF' }]
                }
            ]
        },
        {
            type: 'MOVE_CARDS',
            source: 'limbo',
            destination: 'discardPile',
            count: 'ALL'
        }
    ]
};

export const Knights: CardDefinition[] = [
    {
        id: 'dame_anna',
        name: 'Dame Anna',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "Écartez jusqu'à 2 cartes de votre main. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'TRASH', min: 0, max: 2, from: 'hand', message: 'Écartez jusqu\'à 2 cartes' },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'dame_josephine',
        name: 'Dame Joséphine',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'VICTORY', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "2 VP. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        victoryPoints: 2,
        effects: [
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'dame_molly',
        name: 'Dame Molly',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+2 Actions. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'ADD_ACTIONS', amount: 2 },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'dame_natalie',
        name: 'Dame Natalie',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "Vous pouvez recevoir une carte coûtant jusqu'à 3 pièces. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'GAIN_CARD', maxCost: 3, destination: 'discardPile' },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'dame_sylvia',
        name: 'Dame Sylvia',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+2 Pièces. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'ADD_MONEY', amount: 2 },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'sir_bailey',
        name: 'Messire Bailey',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+1 Carte. +1 Action. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'DRAW', amount: 1 },
            { type: 'ADD_ACTIONS', amount: 1 },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'sir_destry',
        name: 'Messire Destry',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+2 Cartes. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'DRAW', amount: 2 },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'sir_martin',
        name: 'Messire Martin',
        cost: 4,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "+2 Achats. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'ADD_BUYS', amount: 2 },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'sir_michael',
        name: 'Messire Michael',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "Chaque autre joueur défausse jusqu'à ce qu'il n'ait plus que 3 cartes en main. Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci.",
        effects: [
            { type: 'DISCARD_TO_HAND_SIZE', targetHandSize: 3 },
            KNIGHT_ATTACK_EFFECT
        ],
        isSubCard: true
    },
    {
        id: 'sir_vander',
        name: 'Messire Vander',
        cost: 5,
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "Chaque autre joueur dévoile les 2 cartes du dessus de son deck, en écarte une coûtant entre 3 et 6 pièces et défausse le reste. Si un Chevalier est écarté, écartez celui-ci. Lorsque cette carte est écartée, recevez un Or.",
        effects: [
            KNIGHT_ATTACK_EFFECT
        ],
        onTrash: [
            { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' }
        ],
        isSubCard: true
    },
    // The Mixed Pile Placeholder
    {
        id: 'knights',
        name: 'Chevaliers',
        cost: 5, // Variable, but mostly 5.
        types: ['ACTION', 'ATTACK', 'KNIGHT'],
        expansion: 'Dark Ages',
        set: 'Dark Ages',
        description: "Pile de Chevaliers (Mélangée)",
        mixedPile: {
            type: 'SHUFFLED',
            cards: ['dame_anna', 'dame_josephine', 'dame_molly', 'dame_natalie', 'dame_sylvia', 'sir_bailey', 'sir_destry', 'sir_martin', 'sir_michael', 'sir_vander']
        }
    }
];
