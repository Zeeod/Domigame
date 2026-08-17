import { CardDefinition } from '../../types/CardDefinition.js';

export const lostCity: CardDefinition = {
    id: 'lost_city',
    name: 'Cité perdue',
    types: ['ACTION'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: '+2 Cartes, +2 Actions. Quand vous gagnez cette carte, chaque autre joueur pioche une carte.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    onGain: [
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effect: { type: 'DRAW', amount: 1 }
        }
    ] as any
};
