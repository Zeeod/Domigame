import { CardDefinition } from '../../types/CardDefinition.js';

export const soldier: CardDefinition = {
    id: 'soldier',
    name: 'Soldat',
    types: ['ACTION', 'ATTACK', 'TRAVELLER'],
    cost: 3,
    expansion: 'adventures',
    set: 'adventures',
    isNonSupply: true,
    description: '+2 💰. +1 💰 par autre Attaque que vous avez en jeu. Chaque autre joueur ayant 4 cartes ou plus en main défausse une carte. Quand vous défaussez, échangez contre un Fugitif.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_MONEY_PER_ATTACK_IN_PLAY' },
        {
            type: 'ATTACK',
            attackEffects: [{ type: 'DISCARD_IF_4_OR_MORE', count: 1 }]
        }
    ] as any,
    upgradesTo: 'fugitive'
};
