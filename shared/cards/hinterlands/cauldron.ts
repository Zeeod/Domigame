import { CardDefinition } from '../../types/CardDefinition.js';

export const cauldron: CardDefinition = {
    id: 'cauldron',
    name: 'Chaudron',
    cost: 5,
    types: ['TREASURE', 'ATTACK'],
    description: '2 💰, +1 Achat. La troisième fois que vous recevez une carte Action ce tour-ci, chaque autre joueur reçoit une Malédiction.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'CAULDRON' }
    ] as any,
    // Trigger needs to be checked dynamically on GAIN event globally or via engine hook
    triggers: [],
    expansion: 'hinterlands',
    isLegacy: false,
    treasureValue: 0
};
