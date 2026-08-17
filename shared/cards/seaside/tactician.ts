import { CardDefinition } from '../../types/CardDefinition';

export const tactician: CardDefinition = {
    id: 'tactician',
    name: 'Tacticien',
    types: ['ACTION', 'DURATION'],
    description: 'Défaussez votre main. Si vous le faites, au début de votre prochain tour : +5 Cartes, +1 Achat et +1 Action.',
    cost: 5,
    set: 'seaside',
    effects: [
        {
            type: 'DISCARD',
            forceAll: true
        }
    ],
    // Helper for Duration logic:
    // Engine automatically replays "duration" effects?
    // Or I need `durationEffects` field in CardDefinition?
    // See `Caravan`.
    durationEffects: [
        {
            type: 'DRAW',
            amount: 5
        },
        {
            type: 'ADD_BUYS',
            amount: 1
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        }
    ]
};
