import { CardDefinition } from '../../types/CardDefinition.js';

export const soothsayer: CardDefinition = {
    id: 'soothsayer',
    name: 'Devin',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'guilds',
    description: 'Recevez un Or. Chaque autre joueur reçoit une Malédiction, et s\'il l\'a fait, pioche une carte.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'gold' },
        { type: 'ATTACK', attackEffects: [{ type: 'SOOTHSAYER_ATTACK' }] }
    ] as any
};
