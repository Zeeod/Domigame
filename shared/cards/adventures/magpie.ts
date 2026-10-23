import { CardDefinition } from '../../types/CardDefinition.js';

export const magpie: CardDefinition = {
    id: 'magpie',
    name: 'Pie',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    description: '+1 Carte, +1 Action. Révélez la carte du dessus de votre pioche. Si c\'est un Trésor, prenez-la en main. Si c\'est une Action ou Victoire, gagnez une Pie.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'MAGPIE' }
    ] as any
};
