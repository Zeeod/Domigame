import { CardDefinition } from '../../types/CardDefinition.js';

export const feodum: CardDefinition = {
    id: 'feodum',
    name: 'Fief',
    cost: 4,
    types: ['VICTORY'],
    expansion: 'dark_ages',
    description: 'Vaut 1 PV pour chaque 3 Argents dans votre deck. Quand vous écartez cette carte, gagnez 3 Argents.',
    victoryPoints: 0,
    onTrash: [
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' },
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' },
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' }
    ]
};
