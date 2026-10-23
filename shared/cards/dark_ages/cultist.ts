import { CardDefinition } from '../../types/CardDefinition.js';

export const cultist: CardDefinition = {
    id: 'cultist',
    name: 'Cultiste',
    cost: 5,
    types: ['ACTION', 'ATTACK', 'LOOTER'],
    expansion: 'dark_ages',
    description: '+2 Cartes. Chaque autre joueur reçoit une Ruine. Vous pouvez jouer un Cultiste de votre main. Quand vous écartez cette carte, +3 Cartes.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'ruins' }] },
        { type: 'MAY_PLAY_FROM_HAND', filter: { cardIds: ['cultist'] }, message: 'Cultiste : jouer un autre Cultiste de votre main ?' }
    ] as any,
    onTrash: [
        { type: 'DRAW', amount: 3 }
    ]
};
