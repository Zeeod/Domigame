import { CardDefinition } from '../../types/CardDefinition.js';

export const harvest: CardDefinition = {
    id: 'harvest',
    name: 'Moisson',
    types: ['ACTION'],
    cost: 5,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: 'Révélez les 4 cartes du dessus de votre pioche. +1 💰 par carte de nom différent révélée. Défaussez les cartes révélées.',
    effects: [
        {
            type: 'REVEAL_CARDS',
            amount: 4,
            source: 'deck',
            destination: 'discardPile'
        },
        { type: 'ADD_MONEY_PER_UNIQUE_CARD', revealedCards: 4 }
    ] as any
};
