import { CardDefinition } from '../../types/CardDefinition.js';

export const mining_village: CardDefinition = {
    id: 'mining_village',
    name: 'Exploitation minière',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        {
            type: 'CHOOSE_OPTION',
            options: [
                { label: 'Écarter cette carte pour +2 💰', effects: [{ type: 'TRASH_SELF' }, { type: 'ADD_MONEY', amount: 2 }] },
                { label: 'Garder cette carte', effects: [] }
            ]
        }
    ],
    description: '+1 Carte ; +2 Actions. Vous pouvez écarter cette carte pour +2 💰.',
    image: '/card-images/mining_village.jpg',

    expansion: 'Intrigue'
};
