import { CardDefinition } from '../../types/CardDefinition.js';

export const baker: CardDefinition = {
    id: 'baker',
    name: 'Boulanger',
    types: ['ACTION'],
    cost: 5,
    expansion: 'guilds',
    set: 'guilds',
    description: '+1 Carte, +1 Action, +1 Coffre. Mise en place: Chaque joueur reçoit +1 Coffre.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_COFFERS', amount: 1 }
    ] as any
    // Note: Setup effect needs special game initialization handling
};
