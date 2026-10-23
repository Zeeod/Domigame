import { CardDefinition } from '../../types/CardDefinition.js';

export const teacher: CardDefinition = {
    id: 'teacher',
    name: 'Maître',
    types: ['ACTION', 'RESERVE'],
    cost: 6,
    expansion: 'adventures',
    isNonSupply: true,
    description: 'Placez cette carte sur votre plateau Taverne. Au début de votre tour, vous pouvez l\'appeler pour déplacer votre jeton +1 Carte, +1 Action, +1 Achat ou +1 💰 sur une pile Action de la réserve où vous n\'avez aucun jeton.',
    effects: [
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any,
    triggers: [{ trigger: 'START_TURN', call: true, effects: [{ type: 'TEACHER' }] }] as any
};
