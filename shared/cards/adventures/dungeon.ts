import { CardDefinition } from '../../types/CardDefinition.js';

export const dungeon: CardDefinition = {
    id: 'dungeon',
    name: 'Donjon',
    types: ['ACTION', 'DURATION'],
    cost: 3,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Action. Maintenant et au début de votre prochain tour: +2 Cartes, puis défaussez 2 cartes.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DRAW', amount: 2 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Défaussez 2 cartes.' }
    ],
    durationEffects: [
        { type: 'DRAW', amount: 2 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Défaussez 2 cartes.' }
    ]
};
