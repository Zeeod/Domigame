import { CardDefinition } from '../../types/CardDefinition.js';

export const lurker: CardDefinition = {
    id: 'lurker',
    name: 'Rôdeur',
    cost: 2,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CHOOSE_OPTION',
            options: [
                {
                    label: 'Écarter une Action de la réserve',
                    effects: [{
                        type: 'CHOOSE_FROM_ZONE',
                        sourceZone: 'supply',
                        filter: { cardTypes: ['ACTION'] },
                        destination: 'trash',
                        message: 'Rôdeur : Écartez une carte Action de la réserve'
                    }]
                },
                {
                    label: 'Gagner une Action du rebut',
                    effects: [{
                        type: 'CHOOSE_FROM_ZONE',
                        sourceZone: 'trash',
                        filter: { cardTypes: ['ACTION'] },
                        destination: 'discardPile',
                        message: 'Rôdeur : Gagnez une Action du rebut'
                    }]
                }
            ]
        }
    ],
    description: '+1 Action. Choisissez : Écartez une carte Action de la réserve ; ou Gagnez une carte Action du rebut.',
    image: '/card-images/lurker.jpg',
    expansion: 'Intrigue'
};
