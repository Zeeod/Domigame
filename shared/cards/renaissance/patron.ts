import { CardDefinition } from '../../types/CardDefinition.js';

export const Patron: CardDefinition = {
    id: 'patron',
    name: 'Mécène',
    types: ['ACTION', 'REACTION'],
    cost: 4,
    description: "+1 Villageois. +2 💰.\nLorsque vous révélez cette carte, +1 Coffre.",
    effects: [
        {
            type: 'ADD_VILLAGERS',
            amount: 1
        },
        {
            type: 'ADD_MONEY',
            amount: 2
        }
    ],
    isReaction: true,
    reactionTrigger: 'REVEAL',
    reactionEffects: [
        {
            type: 'ADD_COFFERS',
            amount: 1
        }
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
