import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Crown (Cost 5) - Action-Treasure
 * If it's your Action phase, play an Action from your hand twice.
 * If it's your Buy phase, play a Treasure from your hand twice.
 */
export const crown: CardDefinition = {
    id: 'crown',
    name: 'Couronne',
    description: "Si c'est votre phase d'Action, vous pouvez jouer une carte Action de votre main deux fois. Si c'est votre phase d'Achat, vous pouvez jouer un Trésor de votre main deux fois.",
    cost: 5,
    types: ['ACTION', 'TREASURE'],
    effects: [{ type: 'CROWN' }] as any,
    expansion: 'empires'
};
