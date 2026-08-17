import { CardDefinition } from '../../types/CardDefinition.js';

export const butcher: CardDefinition = {
    id: 'butcher',
    name: 'Boucher',
    types: ['ACTION'],
    cost: 5,
    expansion: 'guilds',
    set: 'guilds',
    description: '+2 Coffres. Vous pouvez écarter une carte de votre main et payer des Coffres. Gagnez une carte coûtant jusqu\'au coût de la carte écartée plus les Coffres payés.',
    effects: [
        { type: 'ADD_COFFERS', amount: 2 },
        {
            type: 'TRASH',
            min: 0,
            max: 1,
            from: 'hand',
            message: 'Écartez une carte pour améliorer',
            onSuccess: [
                { type: 'PAY_COFFERS_AND_GAIN', destination: 'discardPile' }
            ]
        }
    ] as any
};
