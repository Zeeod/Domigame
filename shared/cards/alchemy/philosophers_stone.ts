import { CardDefinition } from '../../types/CardDefinition.js';

export const PhilosophersStone: CardDefinition = {
    id: 'philosophers_stone',
    name: 'Pierre Philosophale',
    types: ['TREASURE'],
    cost: 3,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "Lorsque vous jouez cette carte, comptez votre deck et votre défausse. Recevez 1 pièce pour chaque tranche de 5 cartes.",
    treasureValue: 0,
    effects: [
        {
            type: 'ADD_COINS_PER_CARDS',
            divisor: 5,
            sources: ['deck', 'discardPile']
        } as any
    ]
};
