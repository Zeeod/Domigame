import { CardDefinition } from '../../types/CardDefinition.js';

export const artificer: CardDefinition = {
    id: 'artificer',
    name: 'Artisan',
    types: ['ACTION'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Carte, +1 Action, +1 💰. Vous pouvez défausser autant de cartes que vous voulez. Gagnez une carte sur votre pioche coûtant exactement 1 💰 par carte défaussée.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'DISCARD',
            min: 0,
            max: 99,
            message: 'Défaussez des cartes pour gagner une carte',
            onSuccess: [{ type: 'GAIN_CARD_EXACT_COST_DISCARDED', destination: 'deck' }]
        }
    ] as any
};
