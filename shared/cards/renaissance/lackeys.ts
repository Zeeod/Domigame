import { CardDefinition } from '../../types/CardDefinition.js';

export const Lackeys: CardDefinition = {
    id: 'lackeys',
    name: 'Laquais',
    types: ['ACTION'],
    cost: 6,
    description: "+2 Cartes.\nLorsque vous recevez cette carte, +2 Villageois.",
    effects: [
        {
            type: 'DRAW',
            amount: 2
        }
    ],
    onGain: [
        {
            type: 'ADD_VILLAGERS',
            amount: 2
        } as any
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
