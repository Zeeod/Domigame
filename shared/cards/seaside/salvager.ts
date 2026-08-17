import { CardDefinition } from '../../types/CardDefinition';

export const salvager: CardDefinition = {
    id: 'salvager',
    name: 'Chasseur de trésors',
    types: ['ACTION'],
    description: '+1 Achat. Écartez une carte de votre main. +1 Pièce par coût de la carte écartée.',
    cost: 4,
    set: 'seaside',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Écartez une carte pour gagner son coût en pièces',
            onSuccess: [
                { type: 'ADD_MONEY', amount: { type: 'LAST_TRASHED_COST' } }
            ]
        }
    ]
};
