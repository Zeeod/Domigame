import { CardDefinition } from '../../types/CardDefinition.js';

export const swindler: CardDefinition = {
    id: 'swindler',
    name: 'Escroc',
    cost: 3,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ATTACK', attackEffects: [{ type: 'SWINDLER_ATTACK' }] }
    ] as any,
    description: '+2 ??. Chaque autre joueur écarte la carte du dessus de son deck et vous choisissez une carte de même coût dans la réserve pour la remplacer.',
    image: '/card-images/swindler.jpg',
    expansion: 'intrigue'
};
