import { CardDefinition } from '../../types/CardDefinition.js';

export const pawn: CardDefinition = {
    id: 'pawn',
    name: 'Pion',
    cost: 2,
    types: ['ACTION'],
    effects: [
        {
            type: 'CHOOSE_OPTION',
            count: 2,
            different: true,
            message: 'Choisissez 2 options différentes :',
            options: [
                { label: '+1 Carte', effects: [{ type: 'DRAW', amount: 1 }] },
                { label: '+1 Action', effects: [{ type: 'ADD_ACTIONS', amount: 1 }] },
                { label: '+1 Achat', effects: [{ type: 'ADD_BUYS', amount: 1 }] },
                { label: '+1 ??', effects: [{ type: 'ADD_MONEY', amount: 1 }] }
            ]
        }
    ],
    description: 'Choisissez deux : +1 Carte ; +1 Action ; +1 Achat ; +1 ??. (Les choix doivent être différents)',
    image: '/card-images/pawn.jpg',
    expansion: 'Intrigue'
};
