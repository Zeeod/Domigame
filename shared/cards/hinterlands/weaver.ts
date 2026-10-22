import { CardDefinition } from '../../types/CardDefinition.js';

export const weaver: CardDefinition = {
    id: 'weaver',
    name: 'Tisserand',
    cost: 4,
    types: ['ACTION', 'REACTION'],
    description: 'Recevez deux Argents ou une carte coûtant jusqu\'à 4 💰. Quand vous défaussez cette carte hors phase d\'Ajustement, vous pouvez la jouer.',
    effects: [{ type: 'WEAVER' }] as any,
    expansion: 'hinterlands',
    isLegacy: false,
    onDiscardOutsideCleanup: [{ type: 'MAY_PLAY_THIS' }] as any
};
