import { CardDefinition } from '../../types/CardDefinition.js';

export const rats: CardDefinition = {
    id: 'rats',
    name: 'Rats',
    cost: 4,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: '+1 Carte, +1 Action. Gagnez un Rats. Écartez une carte de votre main (autre que Rats). Quand vous écartez cette carte, +1 Carte.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'rats', destination: 'discardPile' },
        {
            // If the hand only has Rats, nothing is trashed (the player reveals their hand)
            type: 'TRASH',
            min: 1,
            max: 1,
            source: 'hand',
            filter: { excludeIds: ['rats'] },
            message: 'Écartez une carte de votre main (autre que Rats)'
        } as any
    ],
    onTrash: [
        { type: 'DRAW', amount: 1 }
    ]
};
