import { CardDefinition } from '../../types/CardDefinition.js';

export const huntingGrounds: CardDefinition = {
    id: 'hunting_grounds',
    name: 'Terrains de Chasse',
    cost: 6,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+4 Cartes. Quand vous écartez cette carte, gagnez un Duché ou 3 Domaines.',
    effects: [
        { type: 'DRAW', amount: 4 }
    ],
    onTrash: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez:',
            options: [
                { label: 'Gagner un Duché', effects: [{ type: 'GAIN_CARD', cardId: 'duchy', destination: 'discardPile' }] },
                {
                    label: 'Gagner 3 Domaines', effects: [
                        { type: 'GAIN_CARD', cardId: 'estate', destination: 'discardPile' },
                        { type: 'GAIN_CARD', cardId: 'estate', destination: 'discardPile' },
                        { type: 'GAIN_CARD', cardId: 'estate', destination: 'discardPile' }
                    ]
                }
            ]
        } as any
    ]
};
