import { CardDefinition } from '../../types/CardDefinition.js';

export const ranger: CardDefinition = {
    id: 'ranger',
    name: 'Ranger',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Achat. Retournez votre jeton de Voyage (il commence face cachée). Si face visible, +5 Cartes.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'FLIP_JOURNEY_TOKEN', onFaceUp: [{ type: 'DRAW', amount: 5 }] }
    ] as any
};
