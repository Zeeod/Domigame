import { CardDefinition } from '../../types/CardDefinition.js';

export const tunnel: CardDefinition = {
    id: 'tunnel',
    name: 'Tunnel',
    types: ['VICTORY', 'REACTION'],
    cost: 3,
    expansion: 'hinterlands',
    description: '2 PV. Quand vous défaussez cette carte hors phase d\'Ajustement, vous pouvez la dévoiler pour recevoir un Or.',
    victoryPoints: 2,
    effects: [],
    onDiscardOutsideCleanup: [{ type: 'TUNNEL' }] as any
};
