import { CardDefinition } from '../../types/CardDefinition.js';

export const royalCarriage: CardDefinition = {
    id: 'royal_carriage',
    name: 'Carrosse royal',
    types: ['ACTION', 'RESERVE'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Action. Mettez cette carte sur votre tapis de Réserve. Réserve: Après avoir joué une Action qui n\'est pas une Commande, appelez cette carte pour rejouer l\'Action.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
