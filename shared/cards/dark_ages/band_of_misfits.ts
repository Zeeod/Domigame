import { CardDefinition } from '../../types/CardDefinition.js';

export const bandOfMisfits: CardDefinition = {
    id: 'band_of_misfits',
    name: 'Bande de Brigands',
    cost: 5,
    types: ['ACTION' as any, 'COMMAND' as any],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Jouer cette carte comme si c\'était une carte Action de la Réserve coûtant moins.',
    effects: [
        { type: 'PLAY_AS_SUPPLY_ACTION', maxCost: 4 } as any
    ]
};
