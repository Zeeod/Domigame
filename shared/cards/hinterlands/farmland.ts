import { CardDefinition } from '../../types/CardDefinition.js';

export const farmland: CardDefinition = {
    id: 'farmland',
    name: 'Terres cultivées',
    types: ['VICTORY'],
    cost: 6,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '2 PV. Quand vous achetez cette carte, écartez une carte de votre main et gagnez une carte coûtant exactement 2 💰 de plus.',
    victoryPoints: 2,
    effects: [],
    onBuy: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Écartez une carte pour en gagner une coûtant +2',
            onSuccess: [
                { type: 'GAIN_CARD_EXACT_COST', costBonus: 2, destination: 'discardPile' }
            ]
        }
    ] as any
};
