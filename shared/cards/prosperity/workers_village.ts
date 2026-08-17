import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Worker's Village - Prosperity 2nd Edition
 * Cost: 4
 * Types: ACTION
 * Text: +1 Card, +2 Actions, +1 Buy.
 */
export const workersVillage: CardDefinition = {
    id: 'workers_village',
    name: 'Village ouvrier', // Or Village de Travailleurs
    cost: 4,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+1 Carte, +2 Actions, +1 Achat.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'ADD_BUYS', amount: 1 }
    ]
};
