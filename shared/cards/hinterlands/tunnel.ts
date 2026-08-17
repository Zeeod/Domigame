import { CardDefinition } from '../../types/CardDefinition.js';

export const tunnel: CardDefinition = {
    id: 'tunnel',
    name: 'Tunnel',
    types: ['VICTORY', 'REACTION'],
    cost: 3,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '2 PV. Quand vous défaussez cette carte en dehors de la phase Précédant les achats, vous pouvez la révéler pour gagner un Or.',
    victoryPoints: 2,
    effects: [],
    reactionEffects: [
        { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' }
    ]
};
