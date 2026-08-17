import { CardDefinition } from '../../types/CardDefinition.js';

export const catacombs: CardDefinition = {
    id: 'catacombs',
    name: 'Catacombes',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Regardez les 3 cartes du dessus de votre deck. Choisissez: les prendre en main; ou les défausser et +3 Cartes. Quand vous écartez cette carte, gagnez une carte coûtant moins.',
    effects: [
        { type: 'CATACOMBS_CHOICE' } as any
    ],
    onTrash: [
        { type: 'GAIN_CARD', maxCost: 4, destination: 'discardPile' }
    ]
};
