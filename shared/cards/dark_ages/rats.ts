import { CardDefinition } from '../../types/CardDefinition.js';

export const rats: CardDefinition = {
    id: 'rats',
    name: 'Rats',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +1 Action. Gagnez un Rats. Écartez une carte de votre main (autre que Rats). Quand vous écartez cette carte, +1 Carte.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'rats', destination: 'discardPile' },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            filter: { excludeIds: ['rats'] },
            min: 1,
            max: 1,
            message: 'Choisissez une carte à écarter (autre que Rats)',
            context: { specialAction: 'TRASH' },
            effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand' } as any]
        }
    ],
    onTrash: [
        { type: 'DRAW', amount: 1 }
    ]
};
