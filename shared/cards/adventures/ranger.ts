import { CardDefinition } from '../../types/CardDefinition.js';

export const ranger: CardDefinition = {
    id: 'ranger',
    name: 'Ranger',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    description: '+1 Achat. Retournez votre jeton Voyage (il commence face visible). S\'il est alors face visible, +5 Cartes.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'FLIP_JOURNEY_TOKEN', onFaceUp: [{ type: 'DRAW', amount: 5 }] }
    ] as any
};
