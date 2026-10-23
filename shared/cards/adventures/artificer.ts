import { CardDefinition } from '../../types/CardDefinition.js';

export const artificer: CardDefinition = {
    id: 'artificer',
    name: 'Artisan',
    types: ['ACTION'],
    cost: 5,
    expansion: 'adventures',
    description: '+1 Carte, +1 Action, +1 💰. Défaussez autant de cartes que vous voulez. Vous pouvez recevoir sur votre pioche une carte coûtant exactement 1 💰 par carte défaussée.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'ARTIFICER_START' },
        { type: 'DISCARD', min: 0, max: 99, message: 'Artisan : défaussez autant de cartes que vous voulez' },
        { type: 'ARTIFICER_GAIN' }
    ] as any
};
