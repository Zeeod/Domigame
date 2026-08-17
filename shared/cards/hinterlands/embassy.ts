import { CardDefinition } from '../../types/CardDefinition.js';

export const embassy: CardDefinition = {
    id: 'embassy',
    name: 'Ambassade',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+5 Cartes. Défaussez 3 cartes. Quand vous gagnez cette carte, chaque autre joueur gagne un Argent.',
    effects: [
        { type: 'DRAW', amount: 5 },
        { type: 'DISCARD', min: 3, max: 3, message: 'Défaussez 3 cartes.' }
    ],
    onGain: [
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effect: { type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' }
        }
    ] as any
};
