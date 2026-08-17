import { CardDefinition } from '../../types/CardDefinition.js';

export const encampment: CardDefinition = {
    id: 'encampment',
    name: 'Campement',
    types: ['ACTION'],
    cost: 2,
    description: "+2 Cartes, +2 Actions. Vous pouvez révéler un Or ou un Butin de votre main. Sinon, reposez cette carte sur sa pile à la fin du tour (lors du Nettoyage).",
    expansion: 'empires',
    isSubCard: true,
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 2 },
        {
            type: 'CONDITION',
            condition: 'HAS_IN_HAND',
            filter: { cardIds: ['gold', 'plunder'] },
            falseEffects: [
                { type: 'RETURN_TO_SUPPLY_AT_CLEANUP' } as any
            ]
        } as any
    ]
};
