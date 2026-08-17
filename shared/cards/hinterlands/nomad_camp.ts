import { CardDefinition } from '../../types/CardDefinition.js';

export const nomadCamp: CardDefinition = {
    id: 'nomad_camp',
    name: 'Campement de nomades',
    types: ['ACTION'],
    cost: 4,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+1 Achat, +2 💰. Quand vous gagnez cette carte, mettez-la sur votre pioche.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 }
    ],
    onGain: [
        { type: 'MOVE_TO_POSITION', from: 'discardPile', position: 'TOP' }
    ]
};
