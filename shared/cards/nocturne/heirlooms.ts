import { CardDefinition } from '../../types/CardDefinition.js';

export const Pasture: CardDefinition = {
    id: 'pasture',
    name: 'Pâturage',
    cost: 2,
    types: ['TREASURE', 'VICTORY', 'HEIRLOOM'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '1💰. 1 PV par Domaine (Estate) que vous possédez.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 }
    ],
    dynamicVP: true,
    vpCalculator: (allCards: { id: string }[]) => allCards.filter(c => c.id === 'estate').length,
    isNonSupply: true,
}

export const HauntedMirror: CardDefinition = {
    id: 'haunted_mirror',
    name: 'Miroir Hanté',
    cost: 0,
    types: ['TREASURE', 'HEIRLOOM'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '1💰. Quand vous écartez cette carte, vous pouvez écarter une carte Action ou Victoire de votre main pour gagner un Fantôme (Ghost) sur votre deck.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 }
    ],
    isNonSupply: true
}

export const Goat: CardDefinition = {
    id: 'goat',
    name: 'Chèvre',
    cost: 2,
    types: ['TREASURE', 'HEIRLOOM'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '1💰. Quand vous jouez cette carte, vous pouvez écarter une carte de votre main.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'SELECT_AND_APPLY',
            message: 'Voulez-vous écarter une carte ?',
            sourceZone: 'hand',
            min: 0,
            max: 1,
            action: 'TRASH'
        }
    ],
    isNonSupply: true
}

export const LuckyCoin: CardDefinition = {
    id: 'lucky_coin',
    name: 'Pièce de Chance',
    cost: 4,
    types: ['TREASURE', 'HEIRLOOM'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '1💰. Quand vous jouez cette carte, gagnez un Argent (Silver).',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'silver' }
    ],
    isNonSupply: true
}

export const MagicLamp: CardDefinition = {
    id: 'magic_lamp',
    name: 'Lampe Magique',
    cost: 0,
    types: ['TREASURE', 'HEIRLOOM'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '1💰. Quand vous jouez cette carte, si vous avez exactement 6 cartes en jeu, vous pouvez écarter ceci. Si vous le faites, gagnez 3 Vœux (Wishes).',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'CONDITION',
            condition: 'CARDS_IN_PLAY_COUNT',
            value: 6,
            comparator: '==',
            trueEffects: [
                {
                    type: 'CHOOSE_OPTION',
                    message: 'Écarter la Lampe Magique pour gagner 3 Vœux ?',
                    options: [
                        { label: 'Oui', effects: [{ type: 'TRASH_SELF' }, { type: 'GAIN_CARD', cardId: 'wish', count: 3 }] },
                        { label: 'Non', effects: [] }
                    ]
                }
            ]
        }
    ],
    isNonSupply: true
}

export const Pouch: CardDefinition = {
    id: 'pouch',
    name: 'Bourse',
    cost: 2,
    types: ['TREASURE', 'HEIRLOOM'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '1💰. +1 Achat.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 }
    ],
    isNonSupply: true
}

export const CursedGold: CardDefinition = {
    id: 'cursed_gold',
    name: 'Or Maudit',
    cost: 4,
    types: ['TREASURE', 'HEIRLOOM'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '3💰. Quand vous jouez cette carte, gagnez une Malédiction (Curse).',
    treasureValue: 3,
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'GAIN_CARD', cardId: 'curse' }
    ],
    isNonSupply: true
}

export const ALL_HEIRLOOMS = [
    Pasture, HauntedMirror, Goat, LuckyCoin, MagicLamp, Pouch, CursedGold
];
