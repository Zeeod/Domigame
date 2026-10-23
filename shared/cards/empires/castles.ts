import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Empires — Castles (one pile, cheapest on top). VP computed by VictoryChecker (vpCalculator).
 */
const castleCount = (allCards: any[], getDef: (id: string) => CardDefinition | undefined) =>
    allCards.filter(c => getDef(c.id)?.types.includes('CASTLE' as any)).length;

export const humbleCastle: CardDefinition = {
    id: 'humble_castle', name: 'Humble château', cost: 3, types: ['TREASURE', 'VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: '1 💰. Vaut 1 PV par Château que vous possédez.',
    treasureValue: 0,
    effects: [{ type: 'ADD_MONEY', amount: 1 }],
    dynamicVP: true,
    vpCalculator: castleCount
};

export const crumblingCastle: CardDefinition = {
    id: 'crumbling_castle', name: 'Château en ruine', cost: 4, types: ['VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: '1 PV. Quand vous recevez ou écartez cette carte, +1 🛡️ et recevez un Argent.',
    victoryPoints: 1,
    effects: [],
    onGain: [{ type: 'ADD_VICTORY_TOKENS', amount: 1 }, { type: 'GAIN_CARD', cardId: 'silver' }] as any,
    onTrash: [{ type: 'ADD_VICTORY_TOKENS', amount: 1 }, { type: 'GAIN_CARD', cardId: 'silver' }] as any
};

export const smallCastle: CardDefinition = {
    id: 'small_castle', name: 'Petit château', cost: 5, types: ['ACTION', 'VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: 'Écartez cette carte ou un Château de votre main. Si vous le faites, recevez un Château. 2 PV.',
    victoryPoints: 2,
    effects: [{ type: 'SMALL_CASTLE' }] as any
};

export const hauntedCastle: CardDefinition = {
    id: 'haunted_castle', name: 'Château hanté', cost: 6, types: ['VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: '2 PV. Quand vous recevez cette carte pendant votre tour, recevez un Or, et chaque autre joueur ayant 5 cartes ou plus en main en place 2 sur sa pioche.',
    victoryPoints: 2,
    effects: [],
    onGain: [{ type: 'HAUNTED_CASTLE_ON_GAIN' }] as any
};

export const opulentCastle: CardDefinition = {
    id: 'opulent_castle', name: 'Château opulent', cost: 7, types: ['ACTION', 'VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: 'Défaussez autant de cartes Victoire que vous voulez, en les dévoilant. +2 💰 par carte défaussée. 3 PV.',
    victoryPoints: 3,
    effects: [
        { type: 'ARTIFICER_START' },
        { type: 'DISCARD', min: 0, max: 99, filter: { cardTypes: ['VICTORY'] }, message: 'Château opulent : défaussez des cartes Victoire (+2 💰 chacune)' },
        { type: 'OPULENT_CASTLE_PAY' }
    ] as any
};

export const sprawlingCastle: CardDefinition = {
    id: 'sprawling_castle', name: 'Château tentaculaire', cost: 8, types: ['VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: '4 PV. Quand vous recevez cette carte, recevez un Duché ou 3 Domaines.',
    victoryPoints: 4,
    effects: [],
    onGain: [{ type: 'SELECT_OPTION', message: 'Château tentaculaire : choisissez', options: [
        { label: 'Un Duché', effects: [{ type: 'GAIN_CARD', cardId: 'duchy' }] },
        { label: '3 Domaines', effects: [{ type: 'GAIN_CARD', cardId: 'estate' }, { type: 'GAIN_CARD', cardId: 'estate' }, { type: 'GAIN_CARD', cardId: 'estate' }] }
    ] }] as any
};

export const grandCastle: CardDefinition = {
    id: 'grand_castle', name: 'Grand château', cost: 9, types: ['VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: '5 PV. Quand vous recevez cette carte, dévoilez votre main. +1 🛡️ par carte Victoire dans votre main et/ou en jeu.',
    victoryPoints: 5,
    effects: [],
    onGain: [{ type: 'GRAND_CASTLE_ON_GAIN' }] as any
};

export const kingsCastle: CardDefinition = {
    id: 'kings_castle', name: 'Château du roi', cost: 10, types: ['VICTORY', 'CASTLE'], expansion: 'empires', isSubCard: true,
    description: 'Vaut 2 PV par Château que vous possédez.',
    effects: [],
    dynamicVP: true,
    vpCalculator: (allCards, getDef) => 2 * castleCount(allCards, getDef)
};
