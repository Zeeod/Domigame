import { CardDefinition } from '../../types/CardDefinition.js';

export const marauder: CardDefinition = {
    id: 'marauder',
    name: 'Maraudeur',
    cost: 4,
    types: ['ACTION', 'ATTACK', 'LOOTER'],
    expansion: 'dark_ages',
    description: 'Gagnez un Butin. Chaque autre joueur gagne une Ruine.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'spoils' },
        { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'ruins' }] }
    ] as any
};
