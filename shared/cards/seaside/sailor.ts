import { CardDefinition } from '../../types/CardDefinition';

export const sailor: CardDefinition = {
    id: 'sailor',
    name: 'Marin',
    types: ['ACTION', 'DURATION'],
    cost: 4,
    description: '+1 Action. Une fois durant ce tour, lorsque vous gagnez une carte Durée, vous pouvez la jouer. Au début de votre prochain tour : +2 Pièces ; vous pouvez écarter une carte de votre main.',
    set: 'seaside',
    effects: [
        {
            type: 'ADD_ACTIONS',
            amount: 1
        },
        {
            type: 'ADD_ACTIONS', // Placeholder for reaction logic
            amount: 1
        }
    ],
    durationEffects: [
        {
            type: 'ADD_MONEY',
            amount: 2
        },
        {
            type: 'TRASH',
            min: 0,
            max: 1,
            from: 'hand'
        }
    ]
};
