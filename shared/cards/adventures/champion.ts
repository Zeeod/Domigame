import { CardDefinition } from '../../types/CardDefinition.js';

export const champion: CardDefinition = {
    id: 'champion',
    name: 'Champion',
    types: ['ACTION', 'DURATION'],
    cost: 6,
    expansion: 'adventures',
    set: 'adventures',
    isNonSupply: true,
    description: '+1 Action. Pour le reste de la partie: +1 Action quand vous jouez une Action. Les Attaques ne vous affectent pas.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    durationEffects: [
        { type: 'PERMANENT_PLUS_ACTION' },
        { type: 'PERMANENT_ATTACK_IMMUNITY' }
    ] as any,
    isPermanentDuration: true
};
