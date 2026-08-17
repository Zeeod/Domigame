import { CardDefinition } from '../../types/CardDefinition.js';

export const menagerie: CardDefinition = {
    id: 'menagerie',
    name: 'Ménagerie',
    types: ['ACTION'],
    cost: 3,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+1 Action. Révélez votre main. Si les cartes ont toutes des noms différents, +3 Cartes. Sinon, +1 Carte.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_HAND' },
        {
            type: 'CONDITION',
            condition: 'ALL_CARDS_UNIQUE_IN_HAND',
            trueEffects: [{ type: 'DRAW', amount: 3 }],
            falseEffects: [{ type: 'DRAW', amount: 1 }]
        }
    ] as any
};
