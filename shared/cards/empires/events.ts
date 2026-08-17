import { CardDefinition } from '../../types/CardDefinition.js';

export const advance: CardDefinition = {
    id: 'advance',
    name: 'Avancée',
    types: ['EVENT'],
    cost: 0,
    description: "Vous pouvez écarter une carte Action de votre main. Si vous le faites, gagnez une carte Action coûtant jusqu'à 6$.",
    expansion: 'empires',
    effects: [
        {
            type: 'SELECT_AND_APPLY',
            sourceZone: 'hand',
            filter: { cardTypes: ['ACTION'] },
            min: 0,
            max: 1,
            message: "Écartez une carte Action pour en gagner une coûtant jusqu'à 6$.",
            effects: [{ type: 'TRASH' }],
            onSuccess: [{ type: 'GAIN_CARD', maxCost: 6, filter: { cardTypes: ['ACTION'] } }]
        } as any
    ]
};

export const annex: CardDefinition = {
    id: 'annex',
    name: 'Annexion',
    types: ['EVENT'],
    cost: 8, // Debt? Wait, image shows 8 with a reddish circle. That's Debt.
    debtCost: 8,
    description: "Regardez dans votre pile de défausse. Mélangez-en autant de cartes que vous voulez (jusqu'à 5) dans votre pioche. Gagnez un Duché.",
    expansion: 'empires',
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'discardPile',
            min: 0,
            max: 5,
            message: "Choisissez jusqu'à 5 cartes à mélanger dans votre pioche.",
            onSuccess: [
                { type: 'MOVE_CARDS', destination: 'deck', shuffle: true },
                { type: 'GAIN_CARD', cardId: 'duchy' }
            ]
        } as any
    ]
};

export const banquet: CardDefinition = {
    id: 'banquet',
    name: 'Banquet',
    types: ['EVENT'],
    cost: 3,
    description: "Gagnez 2 Cuivres et une carte (non-Victoire) coûtant jusqu'à 5$.",
    expansion: 'empires',
    effects: [
        { type: 'GAIN_CARD', cardId: 'copper', count: 2 },
        { type: 'GAIN_CARD', maxCost: 5, cardTypes: ['ACTION', 'TREASURE'] }
    ]
};

export const conquest: CardDefinition = {
    id: 'conquest',
    name: 'Conquête',
    types: ['EVENT'],
    cost: 6,
    description: "Gagnez 2 Argents. +1 PV par Argent que vous avez gagné ce tour-ci.",
    expansion: 'empires',
    effects: [
        { type: 'GAIN_CARD', cardId: 'silver', amount: 2 },
        { type: 'ADD_VP_PER_GAINED', filter: { cardIds: ['silver'] } } as any
    ]
};

export const delve: CardDefinition = {
    id: 'delve',
    name: 'Fouille',
    types: ['EVENT'],
    cost: 2,
    description: "+1 Achat. Gagnez un Argent.",
    expansion: 'empires',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'silver' }
    ]
};

export const dominate: CardDefinition = {
    id: 'dominate',
    name: 'Domination',
    types: ['EVENT'],
    cost: 14,
    description: "Gagnez une Province. Si vous le faites, +9 PV.",
    expansion: 'empires',
    effects: [
        {
            type: 'GAIN_CARD',
            cardId: 'province',
            onSuccess: [{ type: 'ADD_VICTORY_TOKENS', amount: 9 }]
        } as any
    ]
};

export const donate: CardDefinition = {
    id: 'donate',
    name: 'Donation',
    types: ['EVENT'],
    cost: 8,
    debtCost: 8,
    description: "À la fin de votre tour, mettez votre main, votre pioche et votre pile de défausse ensemble, écartez-en autant de cartes que vous voulez, puis recevez 5 nouvelles cartes.",
    expansion: 'empires',
    effects: [
        { type: 'SCHEDULE_TURN_END_EFFECT', effect: 'DONATE_EFFECT' } as any
    ]
};

export const ritual: CardDefinition = {
    id: 'ritual',
    name: 'Rituel',
    types: ['EVENT'],
    cost: 4,
    description: "Gagnez une Malédiction. Si vous le faites, écartez une carte de votre main pour +1 PV par dollar de son coût.",
    expansion: 'empires',
    effects: [
        {
            type: 'GAIN_CARD',
            cardId: 'curse',
            onSuccess: [
                {
                    type: 'SELECT_AND_APPLY',
                    sourceZone: 'hand',
                    min: 1,
                    max: 1,
                    message: "Écartez une carte pour gagner des PV selon son coût.",
                    effects: [{ type: 'TRASH' }],
                    onEach: [{ type: 'ADD_VP_PER_COST' } as any]
                }
            ]
        } as any
    ]
};

export const saltTheEarth: CardDefinition = {
    id: 'salt_the_earth',
    name: 'Saler la Terre',
    types: ['EVENT'],
    cost: 4,
    description: "+1 PV. Écartez une carte Victoire de la réserve.",
    expansion: 'empires',
    effects: [
        { type: 'ADD_VICTORY_TOKENS', amount: 1 },
        { type: 'TRASH_FROM_SUPPLY', filter: { cardTypes: ['VICTORY'] } } as any
    ]
};

export const tax: CardDefinition = {
    id: 'tax',
    name: 'Taxe',
    types: ['EVENT'],
    cost: 2,
    description: "Ajoutez 2 Dette à une pile de la réserve. Quand un joueur achète une carte de cette pile, il prend la Dette qui est dessus.",
    expansion: 'empires',
    effects: [
        { type: 'ADD_DEBT_TO_PILE' } as any
    ]
};

export const triumph: CardDefinition = {
    id: 'triumph',
    name: 'Triomphe',
    types: ['EVENT'],
    cost: 5,
    debtCost: 8,
    description: "Gagnez un Domaine. Si vous le faites, +1 PV par carte que vous avez gagnée ce tour-ci.",
    expansion: 'empires',
    effects: [
        {
            type: 'GAIN_CARD',
            cardId: 'estate',
            onSuccess: [{ type: 'ADD_VP_PER_GAINED' } as any]
        } as any
    ]
};

export const wedding: CardDefinition = {
    id: 'wedding',
    name: 'Mariage',
    types: ['EVENT'],
    cost: 4,
    debtCost: 8,
    description: "+1 PV. Gagnez un Or.",
    expansion: 'empires',
    effects: [
        { type: 'ADD_VICTORY_TOKENS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'gold' }
    ]
};

export const windfall: CardDefinition = {
    id: 'windfall',
    name: 'Aubaine',
    types: ['EVENT'],
    cost: 5,
    description: "Si votre pioche et votre pile de défausse sont vides, gagnez 3 Ors.",
    expansion: 'empires',
    effects: [
        {
            type: 'CONDITION',
            condition: 'DECK_AND_DISCARD_EMPTY' as any,
            trueEffects: [{ type: 'GAIN_CARD', cardId: 'gold', amount: 3 }]
        } as any
    ]
};
