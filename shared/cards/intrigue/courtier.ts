import { CardDefinition } from '../../types/CardDefinition.js';

export const courtier: CardDefinition = {
    id: 'courtier',
    name: 'Courtisan',
    cost: 5,
    types: ['ACTION'],
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: 1,
            max: 1,
            message: 'Révélez une carte de votre main',
            destination: 'hand', // Revealed and kept in hand
            context: { specialAction: 'REVEAL_AND_KEEP' } // Engine should set lastRevealedCards
        },
        {
            type: 'CHOOSE_OPTION',
            variableCount: 'REVEAL_TYPES',
            different: true,
            message: 'Courtisan : Choisissez des avantages',
            options: [
                { label: '+1 Action', effects: [{ type: 'ADD_ACTIONS', amount: 1 }] },
                { label: '+1 Achat', effects: [{ type: 'ADD_BUYS', amount: 1 }] },
                { label: '+3 ??', effects: [{ type: 'ADD_MONEY', amount: 3 }] },
                { label: 'Gagner un Or', effects: [{ type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' }] }
            ]
        }
    ],
    description: 'Révélez une carte de votre main. Pour chaque type de cette carte (Action, Trésor, Victoire, ...), choisissez un avantage différent : +1 Action ; +1 Achat ; +3 ?? ; ou gagnez un Or.',
    image: '/card-images/courtier.jpg',
    expansion: 'Intrigue'
};
