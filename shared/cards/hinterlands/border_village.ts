import { CardDefinition } from '../../types/CardDefinition.js';

export const borderVillage: CardDefinition = {
    id: 'border_village',
    name: 'Village frontalier',
    types: ['ACTION'],
    cost: 6,
    expansion: 'hinterlands',
    description: '+1 Carte, +2 Actions. Quand vous recevez cette carte, recevez une carte moins chère.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    onGain: [{ type: 'GAIN_CHEAPER_THAN', cardId: 'border_village' }] as any
};
