import { CardDefinition } from '../../types/CardDefinition.js';

export const teacher: CardDefinition = {
    id: 'teacher',
    name: 'Maître',
    types: ['ACTION', 'RESERVE'],
    cost: 6,
    expansion: 'adventures',
    set: 'adventures',
    isNonSupply: true,
    description: 'Mettez cette carte sur votre tapis de Réserve. Réserve: Au début de votre tour, appelez cette carte pour déplacer votre jeton +1 Carte, +1 Action, +1 Achat, ou +1 💰 sur une pile Action de la Réserve.',
    effects: [
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
