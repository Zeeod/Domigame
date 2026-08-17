import { CardDefinition } from '../../types/CardDefinition.js';

export const coinOfTheRealm: CardDefinition = {
    id: 'coin_of_the_realm',
    name: 'Pièce du royaume',
    types: ['TREASURE', 'RESERVE'],
    cost: 2,
    expansion: 'adventures',
    set: 'adventures',
    description: '1 💰. Mettez cette carte sur votre tapis de Réserve. Réserve: Après avoir joué une Action, appelez cette carte pour +2 Actions.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
