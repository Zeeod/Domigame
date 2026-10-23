import { CardDefinition } from '../../types/CardDefinition.js';

export const champion: CardDefinition = {
    id: 'champion',
    name: 'Champion',
    types: ['ACTION', 'DURATION'],
    cost: 6,
    expansion: 'adventures',
    isNonSupply: true,
    description: '+1 Action. Pour le reste de la partie, quand un autre joueur joue une Attaque, elle ne vous affecte pas, et quand vous jouez une Action, +1 Action.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    durationEffects: [],
    isPermanentDuration: true,
    blocksAttack: true
};
