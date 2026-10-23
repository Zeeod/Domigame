import { CardDefinition } from '../../types/CardDefinition.js';

export const bandOfMisfits: CardDefinition = {
    id: 'band_of_misfits',
    name: 'Bande de Brigands',
    cost: 5,
    types: ['ACTION' as any, 'COMMAND' as any],
    expansion: 'dark_ages',
    description: 'Jouez une carte Action non-Commande de la réserve qui coûte moins que cette carte, en la laissant dans la réserve.',
    effects: [{ type: 'BAND_OF_MISFITS' }] as any
};
