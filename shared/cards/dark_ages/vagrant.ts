import { CardDefinition } from '../../types/CardDefinition.js';

export const vagrant: CardDefinition = {
    id: 'vagrant',
    name: 'Vagabond',
    cost: 2,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +1 Action. Révélez la carte du dessus de votre deck. Si c\'est une carte Malédiction, Ruine, Abri ou Victoire, prenez-la en main.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_TOP_AND_MAYBE_TAKE', filter: { cardTypes: ['CURSE', 'RUINS', 'SHELTER', 'VICTORY'] } } as any
    ]
};
