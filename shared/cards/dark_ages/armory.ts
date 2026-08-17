import { CardDefinition } from '../../types/CardDefinition.js';

export const armory: CardDefinition = {
    id: 'armory',
    name: 'Armurerie',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Gagnez une carte coûtant jusqu\'à 4💰, et mettez-la sur votre deck.',
    effects: [
        { type: 'GAIN_CARD', maxCost: 4, destination: 'deck' }
    ]
};
