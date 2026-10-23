import { CardDefinition } from '../../types/CardDefinition.js';

export const hornOfPlenty: CardDefinition = {
    id: 'horn_of_plenty',
    name: 'Corne d\'abondance',
    types: ['TREASURE'],
    cost: 5,
    expansion: 'cornucopia',
    description: 'Quand vous jouez cette carte, recevez une carte coûtant jusqu\'à 1 💰 par carte de nom différent que vous avez en jeu (celle-ci comprise). Si c\'est une carte Victoire, écartez cette carte.',
    treasureValue: 0,
    effects: [{ type: 'HORN_OF_PLENTY' }] as any
};
