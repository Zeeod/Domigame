import { CardDefinition } from '../../types/CardDefinition.js';

export const magpie: CardDefinition = {
    id: 'magpie',
    name: 'Pie',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Carte, +1 Action. Révélez la carte du dessus de votre pioche. Si c\'est un Trésor, prenez-la en main. Si c\'est une Action ou Victoire, gagnez une Pie.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_TOP_DECK',
            amount: 1,
            onTreasure: [{ type: 'DRAW', amount: 1 }],
            onActionOrVictory: [{ type: 'GAIN_CARD', cardId: 'magpie', destination: 'discardPile' }]
        }
    ] as any
};
