import { CardDefinition } from '../../types/CardDefinition.js';

export const royalCarriage: CardDefinition = {
    id: 'royal_carriage',
    name: 'Carrosse royal',
    types: ['ACTION', 'RESERVE'],
    cost: 5,
    expansion: 'adventures',
    description: '+1 Action. Placez cette carte sur votre plateau Taverne. Juste après avoir résolu une Action, si elle est encore en jeu, vous pouvez appeler cette carte pour rejouer cette Action.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any,
    triggers: [{ trigger: 'AFTER_ACTION', call: true, filter: { excludeTypes: ['COMMAND'] }, effects: [{ type: 'REPLAY_ACTION' }] }] as any
};
