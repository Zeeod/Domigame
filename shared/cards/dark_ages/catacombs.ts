import { CardDefinition } from '../../types/CardDefinition.js';

export const catacombs: CardDefinition = {
    id: 'catacombs',
    name: 'Catacombes',
    cost: 5,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: 'Regardez les 3 cartes du dessus de votre deck. Choisissez: les prendre en main; ou les défausser et +3 Cartes. Quand vous écartez cette carte, gagnez une carte coûtant moins.',
    effects: [{ type: 'CATACOMBS' }] as any,
    onTrash: [{ type: 'GAIN_CHEAPER_THAN', cardId: 'catacombs' }] as any
};
