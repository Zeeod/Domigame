import { CardDefinition } from '../../types/CardDefinition.js';

export const hornOfPlenty: CardDefinition = {
    id: 'horn_of_plenty',
    name: 'Corne d\'abondance',
    types: ['TREASURE'],
    cost: 5,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '0 💰. Quand vous jouez cette carte, gagnez une carte coûtant jusqu\'à 1 💰 par carte de nom différent que vous avez en jeu. Si c\'est une carte Victoire, écartez cette carte.',
    treasureValue: 0,
    effects: [
        { type: 'GAIN_CARD_COST_UNIQUE_IN_PLAY' }
    ] as any
};
