import { CardDefinition } from '../../types/CardDefinition.js';

export const Shepherd: CardDefinition = {
    id: 'shepherd',
    name: 'Berger',
    cost: 3,
    types: ['ACTION'],
    heirloom: 'pasture',
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Action. Défaussez autant de cartes Victoire que vous le souhaitez. +2 Cartes par carte ainsi défaussée.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'SELECT_AND_APPLY',
            message: 'Défaussez des cartes Victoire pour piocher',
            sourceZone: 'hand',
            min: 0,
            filter: { cardTypes: ['VICTORY'] },
            action: 'DISCARD',
            drawMultiplier: 2
        } as any
    ]
};
