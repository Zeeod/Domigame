import { CardDefinition } from '../../types/CardDefinition.js';

export const tournament: CardDefinition = {
    id: 'tournament',
    name: 'Tournoi',
    types: ['ACTION'],
    cost: 4,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+1 Action. Chaque joueur peut révéler une Province de sa main. Si vous en révélez une, défaussez-la et gagnez un Prix ou un Duché. Sinon si quelqu\'un en a révélé, +1 Carte, +1 💰.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'TOURNAMENT_EFFECT' }
    ] as any
};
