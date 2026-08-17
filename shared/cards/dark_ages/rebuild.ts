import { CardDefinition } from '../../types/CardDefinition.js';

export const rebuild: CardDefinition = {
    id: 'rebuild',
    name: 'Reconstruction',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Action. Nommez une carte. Révélez des cartes de votre deck jusqu\'à en révéler une Victoire autre que la carte nommée. Défaussez les autres, écartez la Victoire et gagnez une Victoire coûtant jusqu\'à 3💰 de plus.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REBUILD_EFFECT' } as any
    ]
};
