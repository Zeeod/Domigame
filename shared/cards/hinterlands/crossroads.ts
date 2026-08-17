import { CardDefinition } from '../../types/CardDefinition.js';

export const crossroads: CardDefinition = {
    id: 'crossroads',
    name: 'Croisée des chemins',
    types: ['ACTION'],
    cost: 2,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: 'Révélez votre main. +1 Carte par carte Victoire révélée. Si c\'est la première fois que vous jouez une Croisée des chemins ce tour-ci, +3 Actions.',
    effects: [
        {
            type: 'REVEAL_HAND',
            message: 'Croisée des chemins : Révélation de la main'
        },
        {
            type: 'DRAW',
            amount: {
                type: 'COUNT_CARDS_IN_HAND',
                filter: { types: ['VICTORY'] }
            } as any
        },
        {
            type: 'CONDITION',
            condition: 'FIRST_TIME_PLAYED_THIS_TURN',
            value: 1,
            // @ts-ignore
            cardId: 'crossroads',
            trueEffects: [
                { type: 'ADD_ACTIONS', amount: 3 }
            ]
        }
    ]
};
