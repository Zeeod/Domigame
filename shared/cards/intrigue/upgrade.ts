import { CardDefinition } from '../../types/CardDefinition.js';

export const upgrade: CardDefinition = {
    id: 'upgrade',
    name: 'Amélioration',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 1, destination: 'discardPile' }]
        }
    ],
    description: '+1 Carte ; +1 Action. Écartez une carte de votre main. Gagnez une carte coûtant exactement 1 ?? de plus que la carte écartée.',
    image: '/card-images/upgrade.jpg',

    expansion: 'Intrigue'
};


