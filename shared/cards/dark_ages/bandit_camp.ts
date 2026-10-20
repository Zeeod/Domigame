import { CardDefinition } from '../../types/CardDefinition.js';

export const banditCamp: CardDefinition = {
    id: 'bandit_camp',
    name: 'Camp de Bandits',
    cost: 5,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: '+1 Carte, +2 Actions. Gagnez un Butin.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'GAIN_CARD', cardId: 'spoils', destination: 'discardPile' }
    ]
};
