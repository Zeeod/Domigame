import { CardDefinition } from '../../types/CardDefinition.js';

export const marauder: CardDefinition = {
    id: 'marauder',
    name: 'Maraudeur',
    cost: 4,
    types: ['ACTION', 'ATTACK', 'LOOTER'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Gagnez un Butin. Chaque autre joueur gagne une Ruine.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'spoils', destination: 'discardPile' },
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effect: { type: 'GAIN_CARD', cardId: 'ruins', destination: 'discardPile' }
        }
    ]
};
