import { CardDefinition } from '../../types/CardDefinition.js';

export const cultist: CardDefinition = {
    id: 'cultist',
    name: 'Cultiste',
    cost: 5,
    types: ['ACTION', 'ATTACK', 'LOOTER'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+2 Cartes. Chaque autre joueur gagne une Ruine. Vous pouvez jouer un autre Cultiste de votre main. Quand vous écartez cette carte, +3 Cartes.',
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effect: { type: 'GAIN_CARD', cardId: 'ruins', destination: 'discardPile' }
        },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            filter: { cardIds: ['cultist'] },
            optional: true,
            message: 'Voulez-vous jouer un autre Cultiste ?',
            effects: [
                { type: 'PLAY_TARGET' }
            ]
        }
    ],
    onTrash: [
        { type: 'DRAW', amount: 3 }
    ]
};
