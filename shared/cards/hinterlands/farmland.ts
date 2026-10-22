import { CardDefinition } from '../../types/CardDefinition.js';

export const farmland: CardDefinition = {
    id: 'farmland',
    name: 'Terres cultivées',
    types: ['VICTORY'],
    cost: 6,
    expansion: 'hinterlands',
    description: '2 PV. Quand vous recevez cette carte, écartez une carte de votre main et recevez une carte autre que Terres cultivées coûtant exactement 2 💰 de plus.',
    victoryPoints: 2,
    effects: [],
    onGain: [
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Terres cultivées : écartez une carte', onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2, exact: true, excludeIds: ['farmland'] }] }
    ] as any
};
