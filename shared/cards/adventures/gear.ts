import { CardDefinition } from '../../types/CardDefinition.js';

export const gear: CardDefinition = {
    id: 'gear',
    name: 'Équipement',
    types: ['ACTION', 'DURATION'],
    cost: 3,
    expansion: 'adventures',
    set: 'adventures',
    description: '+2 Cartes. Mettez de côté jusqu\'à 2 cartes de votre main face cachée (sous cette carte). Au début de votre prochain tour, prenez-les en main.',
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'SET_ASIDE_LINKED',
            count: 2,
            min: 0,
            max: 2,
            message: 'Mettez de côté jusqu\'à 2 cartes'
        }
    ] as any,
    durationEffects: [
        { type: 'RETURN_LINKED_CARDS' }
    ] as any
};
