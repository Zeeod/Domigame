import { CardDefinition } from '../../types/CardDefinition.js';

export const transmogrify: CardDefinition = {
    id: 'transmogrify',
    name: 'Métamorphose',
    types: ['ACTION', 'RESERVE'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Mettez cette carte sur votre tapis de Réserve. Réserve: Au début de votre tour, appelez cette carte pour écarter une carte de votre main et gagner une carte coûtant jusqu\'à 1 💰 de plus.',
    effects: [
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
