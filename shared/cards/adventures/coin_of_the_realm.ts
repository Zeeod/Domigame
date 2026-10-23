import { CardDefinition } from '../../types/CardDefinition.js';

export const coinOfTheRealm: CardDefinition = {
    id: 'coin_of_the_realm',
    name: 'Pièce du royaume',
    types: ['TREASURE', 'RESERVE'],
    cost: 2,
    expansion: 'adventures',
    description: '1 💰. Quand vous jouez cette carte, placez-la sur votre plateau Taverne. Juste après avoir résolu une Action, vous pouvez l\'appeler pour +2 Actions.',
    treasureValue: 0,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any,
    triggers: [{ trigger: 'AFTER_ACTION', call: true, effects: [{ type: 'ADD_ACTIONS', amount: 2 }] }] as any
};
