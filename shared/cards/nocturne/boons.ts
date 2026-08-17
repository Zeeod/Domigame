import { CardDefinition } from '../../types/CardDefinition.js';

export const TheEarthsGift: CardDefinition = {
    id: 'the_earths_gift',
    name: 'Don de la Terre',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Vous pouvez écarter un Trésor pour recevoir une carte coûtant jusqu\'à 4💰.',
    isNonSupply: true,
    effects: []
};

export const TheFieldsGift: CardDefinition = {
    id: 'the_fields_gift',
    name: 'Don des Champs',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Action, +1💰.',
    isNonSupply: true,
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ]
};

export const TheFlamesGift: CardDefinition = {
    id: 'the_flames_gift',
    name: 'Don des Flammes',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Vous pouvez écarter une carte de votre main.',
    isNonSupply: true,
    effects: [
        {
            type: 'SELECT_AND_APPLY',
            message: 'Voulez-vous écarter une carte ?',
            sourceZone: 'hand',
            min: 0,
            max: 1,
            action: 'TRASH'
        }
    ]
};

export const TheForestsGift: CardDefinition = {
    id: 'the_forests_gift',
    name: 'Don de la Forêt',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Carte, +1 Achat.',
    isNonSupply: true,
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 }
    ]
};

export const TheMoonsGift: CardDefinition = {
    id: 'the_moons_gift',
    name: 'Don de la Lune',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Vous pouvez mettre votre défausse dans votre deck.',
    isNonSupply: true,
    effects: []
};

export const TheMountainsGift: CardDefinition = {
    id: 'the_mountains_gift',
    name: 'Don de la Montagne',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Argent (Silver).',
    isNonSupply: true,
    effects: [
        { type: 'GAIN_CARD', cardId: 'silver' }
    ]
};

export const TheRiversGift: CardDefinition = {
    id: 'the_rivers_gift',
    name: 'Don de la Rivière',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Carte au début de votre prochain tour.',
    isNonSupply: true,
    effects: [
        {
            type: 'DURATION',
            durationEffects: [{ type: 'DRAW', amount: 1 }]
        } as any
    ]
};

export const TheSeasGift: CardDefinition = {
    id: 'the_seas_gift',
    name: 'Don de la Mer',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Carte.',
    isNonSupply: true,
    effects: [
        { type: 'DRAW', amount: 1 }
    ]
};

export const TheSkysGift: CardDefinition = {
    id: 'the_skys_gift',
    name: 'Don du Ciel',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Vous pouvez défausser 3 cartes pour recevoir un Or sur votre deck.',
    isNonSupply: true,
    effects: []
};

export const TheSunsGift: CardDefinition = {
    id: 'the_suns_gift',
    name: 'Don du Soleil',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Regardez les 4 cartes du dessus de votre deck. Défaussez-en autant que vous voulez et remettez les autres dans l\'ordre de votre choix.',
    isNonSupply: true,
    effects: []
};

export const TheSwampsGift: CardDefinition = {
    id: 'the_swamps_gift',
    name: 'Don du Marais',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Volonté du Feu (Will-o\'-Wisp).',
    isNonSupply: true,
    effects: [
        { type: 'GAIN_CARD', cardId: 'will_o_wisp' }
    ]
};

export const TheWindsGift: CardDefinition = {
    id: 'the_winds_gift',
    name: 'Don des Vents',
    cost: 0,
    types: ['BOON'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+2 Cartes, défaussez 2 cartes.',
    isNonSupply: true,
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'SELECT_AND_APPLY',
            sourceZone: 'hand',
            min: 2,
            max: 2,
            action: 'DISCARD'
        }
    ]
};

export const ALL_BOONS = [
    TheEarthsGift, TheFieldsGift, TheFlamesGift, TheForestsGift,
    TheMoonsGift, TheMountainsGift, TheRiversGift, TheSeasGift,
    TheSkysGift, TheSunsGift, TheSwampsGift, TheWindsGift
];
