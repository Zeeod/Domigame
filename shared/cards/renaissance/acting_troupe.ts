import { CardDefinition } from '../../types/CardDefinition.js';

export const ActingTroupe: CardDefinition = {
    id: 'acting_troupe',
    name: 'Troupe de Théâtre',
    types: ['ACTION'],
    cost: 3,
    description: "+4 Villageois. Écartez cette carte.",
    effects: [
        {
            type: 'ADD_VILLAGERS',
            amount: 4
        },
        {
            type: 'TRASH_SELF'
        }
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
