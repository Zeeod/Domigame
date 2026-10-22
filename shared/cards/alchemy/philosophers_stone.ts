import { CardDefinition } from '../../types/CardDefinition.js';

export const PhilosophersStone: CardDefinition = {
    id: 'philosophers_stone',
    name: 'Pierre Philosophale',
    types: ['TREASURE'],
    cost: 3,
    potionCost: 1,
    expansion: 'alchemy',
    description: 'Quand vous jouez cette carte, comptez votre pioche et votre défausse. +1 💰 par tranche de 5 cartes (arrondi à l\'inférieur).',
    treasureValue: 0,
    effects: [{ type: 'PHILOSOPHERS_STONE' }] as any
};
