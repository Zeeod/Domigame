import { CardDefinition } from '../../types/CardDefinition.js';

export const trail: CardDefinition = {
    id: 'trail',
    name: 'Piste',
    cost: 4,
    types: ['ACTION', 'REACTION'],
    description: '+1 Carte, +1 Action. Quand vous recevez, écartez ou défaussez cette carte, hors phase d\'Ajustement, vous pouvez la jouer.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ] as any,
    // Triggers required to activate reaction opportunity or auto-play
    onGain: [{ type: 'MAY_PLAY_THIS' }] as any,
    onTrash: [{ type: 'MAY_PLAY_THIS', fromTrash: true }] as any,
    expansion: 'hinterlands',
    isLegacy: false,
    onDiscardOutsideCleanup: [{ type: 'MAY_PLAY_THIS' }] as any
};
