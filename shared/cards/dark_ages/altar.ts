import { CardDefinition } from '../../types/CardDefinition.js';

export const altar: CardDefinition = {
    id: 'altar',
    name: 'Autel',
    cost: 6,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Écartez une carte de votre main. Gagnez une carte coûtant jusqu\'à 5💰.',
    effects: [
        { type: 'TRASH', min: 1, max: 1, from: 'hand' },
        { type: 'GAIN_CARD', maxCost: 5, destination: 'discardPile' }
    ]
};
