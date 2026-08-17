import { CardDefinition } from '../../types/CardDefinition.js';

export const mandarin: CardDefinition = {
    id: 'mandarin',
    name: 'Mandarin',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+3 💰. Mettez une carte de votre main sur votre pioche. Quand vous gagnez cette carte, mettez tous les Trésors en jeu sur votre pioche dans l\'ordre de votre choix.',
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'TOPDECK_FROM_HAND', min: 1, max: 1, message: 'Mettez une carte sur votre pioche' }
    ] as any,
    onGain: [
        { type: 'TOPDECK_ALL_TREASURES_IN_PLAY' }
    ] as any
};
