import { CardDefinition } from '../../types/CardDefinition.js';

export const transmogrify: CardDefinition = {
    id: 'transmogrify',
    name: 'Métamorphose',
    types: ['ACTION', 'RESERVE'],
    cost: 4,
    expansion: 'adventures',
    description: '+1 Action. Placez cette carte sur votre plateau Taverne. Au début de votre tour, vous pouvez l\'appeler pour écarter une carte de votre main et recevoir en main une carte coûtant jusqu\'à 1 💰 de plus.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any,
    triggers: [{ trigger: 'START_TURN', call: true, effects: [{ type: 'TRANSMOGRIFY' }] }] as any
};
