import { CardDefinition } from '../../types/CardDefinition.js';

export const Ducat: CardDefinition = {
    id: 'ducat',
    name: 'Ducat',
    types: ['TREASURE'],
    cost: 2,
    description: "+1 Coffre. +1 Achat.\nLorsque vous recevez cette carte, vous pouvez écarter un Cuivre de votre main.",
    effects: [
        {
            type: 'ADD_COFFERS',
            amount: 1
        },
        {
            type: 'ADD_BUYS',
            amount: 1
        }
    ],
    onGain: [
        {
            type: 'TRASH',
            source: 'hand',
            min: 0,
            max: 1,
            filter: {
                cardIds: ['copper']
            },
            message: 'Vous pouvez écarter un Cuivre'
        } as any
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
