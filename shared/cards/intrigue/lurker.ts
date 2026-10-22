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
            message: 'Rôdeur : choisissez',
            options: [
                { label: 'Écarter une Action de la réserve', effects: [{ type: 'TRASH_FROM_SUPPLY', filter: { cardTypes: ['ACTION'] }, message: 'Rôdeur : écartez une carte Action de la réserve' } as any] },
                { label: 'Recevoir une Action du rebut', effects: [{ type: 'GAIN_FROM_TRASH', cardTypes: ['ACTION'], destination: 'discardPile' } as any] }
            ]
        }
    ],
    description: '+1 Action. Choisissez : Écartez une carte Action de la réserve ; ou Gagnez une carte Action du rebut.',
    image: '/card-images/lurker.jpg',
    expansion: 'intrigue'
};
