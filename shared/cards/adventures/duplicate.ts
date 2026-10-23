import { CardDefinition } from '../../types/CardDefinition.js';

export const duplicate: CardDefinition = {
    id: 'duplicate',
    name: 'Copie',
    types: ['ACTION', 'RESERVE'],
    cost: 4,
    expansion: 'adventures',
    description: 'Placez cette carte sur votre plateau Taverne. Quand vous recevez une carte coûtant jusqu\'à 6 💰, vous pouvez appeler cette carte pour en recevoir une copie.',
    effects: [
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any,
    triggers: [{ trigger: 'ON_GAIN', call: true, filter: { maxCost: 6 }, effects: [{ type: 'GAIN_COPY_OF_GAINED' }] }] as any
};
