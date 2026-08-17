import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Castles (Pile of 8 different cards)
 */

export const humbleCastle: CardDefinition = {
    id: 'humble_castle',
    name: 'Château Humble',
    description: "1 💰. Tient lieu de Victoire.",
    cost: 3,
    types: ['VICTORY', 'TREASURE', 'CASTLE'],
    effects: [{ type: 'ADD_MONEY', amount: 1 }],
    victoryPoints: 0, // Calculated dynamically: 1 VP per Castle
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};

export const crumblingCastle: CardDefinition = {
    id: 'crumbling_castle',
    name: 'Château en Ruines',
    description: "+1 Carte. +1 Action. Lorsque vous recevez ou écartez cette carte, +1 PV et recevez un Argent.",
    cost: 4,
    types: ['VICTORY', 'ACTION', 'CASTLE'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    onGain: [
        { type: 'ADD_VICTORY_TOKENS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'silver' }
    ],
    onTrash: [
        { type: 'ADD_VICTORY_TOKENS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'silver' }
    ],
    victoryPoints: 1,
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};

export const smallCastle: CardDefinition = {
    id: 'small_castle',
    name: 'Petit Château',
    description: "Écartez ce Château ou un autre Château de votre main. Si vous le faites, recevez un Château coûtant jusqu'à 2 💰 de plus.",
    cost: 5,
    types: ['VICTORY', 'ACTION', 'CASTLE'],
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            message: 'Écartez un Château (ou celui-ci) pour en gagner un plus cher',
            filter: { cardIds: ['humble_castle', 'crumbling_castle', 'small_castle', 'haunted_castle', 'opulent_castle', 'sprawling_castle', 'grand_castle', 'kings_castle'] },
            min: 1, max: 1,
            destination: 'trash',
            onSuccess: [
                {
                    type: 'GAIN_CARD_PLUS_COST' as any,
                    amount: 2,
                    filter: { cardTypes: ['VICTORY'] }
                }
            ]
        } as any
    ],
    victoryPoints: 2,
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};

export const hauntedCastle: CardDefinition = {
    id: 'haunted_castle',
    name: 'Château Hanté',
    description: "2 💰. Lorsque vous recevez cette carte, chaque autre joueur met 2 cartes de sa main sur son deck.",
    cost: 6,
    types: ['VICTORY', 'ACTION', 'CASTLE'],
    effects: [{ type: 'ADD_MONEY', amount: 2 }],
    onGain: [
        {
            type: 'EACH_PLAYER',
            filter: 'OTHERS',
            effects: [
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'hand',
                    message: 'Mettez 2 cartes sur votre deck',
                    min: 2, max: 2,
                    destination: 'deck'
                }
            ]
        }
    ],
    victoryPoints: 2,
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};

export const opulentCastle: CardDefinition = {
    id: 'opulent_castle',
    name: 'Château Opulent',
    description: "Défaussez n'importe quel nombre de cartes Victoire. +2 💰 par carte défaussée.",
    cost: 7,
    types: ['VICTORY', 'ACTION', 'CASTLE'],
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            message: 'Défaussez des cartes Victoire pour +2💰 chacune',
            filter: { cardTypes: ['VICTORY'] },
            min: 0, max: 10,
            destination: 'discardPile',
            onSuccess: [
                { type: 'ADD_MONEY', amount: { type: 'COUNT_DISCARDED' } as any }
            ]
        } as any
    ],
    victoryPoints: 3,
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};

export const sprawlingCastle: CardDefinition = {
    id: 'sprawling_castle',
    name: 'Château Étendu',
    description: "Lorsque vous recevez cette carte, prenez 3 Domaines ou 1 Duché.",
    cost: 8,
    types: ['VICTORY', 'CASTLE'],
    onGain: [
        {
            type: 'CHOICE',
            options: ['3 Domaines', '1 Duché'],
            effects: {
                '3 Domaines': [{ type: 'GAIN_CARD', cardId: 'estate', amount: 3 } as any],
                '1 Duché': [{ type: 'GAIN_CARD', cardId: 'duchy' }]
            }
        }
    ],
    victoryPoints: 4,
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};

export const grandCastle: CardDefinition = {
    id: 'grand_castle',
    name: 'Grand Château',
    description: "Lorsque vous recevez cette carte, révélez votre main. +1 PV par carte Victoire dans votre main et en jeu.",
    cost: 9,
    types: ['VICTORY', 'ACTION', 'CASTLE'],
    effects: [
        {
            type: 'ADD_MONEY',
            amount: { type: 'COUNT_CARDS_IN_PLAY', filter: { types: ['VICTORY'] } } as any
        }
    ],
    onGain: [
        { type: 'REVEAL_HAND' },
        {
            type: 'ADD_VICTORY_TOKENS',
            amount: { type: 'COUNT_CARDS_IN_HAND', filter: { types: ['VICTORY'] } } as any
        }
    ],
    victoryPoints: 5,
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};

export const kingsCastle: CardDefinition = {
    id: 'kings_castle',
    name: 'Château du Roi',
    description: "2 PV par Château que vous possédez.",
    cost: 10,
    types: ['VICTORY', 'CASTLE'],
    victoryPoints: 0, // Calculated dynamically: 2 VP per Castle
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};
