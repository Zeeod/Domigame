import { CardDefinition } from '../../types/CardDefinition.js';

export const pillage: CardDefinition = {
    id: 'pillage',
    name: 'Pillage',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    expansion: 'dark_ages',
    description: 'Écartez cette carte. Si vous le faites, recevez 2 Butins, et chaque autre joueur ayant 5 cartes ou plus en main dévoile sa main et défausse une carte de votre choix.',
    effects: [{ type: 'PILLAGE' }] as any
};
