import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Overlord (Cost 8 Debt) - Action
 * Play this as a copy of any Action card in the Supply costing up to 5💰.
 * (Type: ACTION-COMMAND)
 */
export const overlord: CardDefinition = {
    id: 'overlord',
    name: 'Seigneur',
    description: 'Jouez une carte Action non-Commande de la réserve coûtant jusqu\'à 5 💰, en la laissant dans la réserve.',
    cost: 0,
    debtCost: 8,
    types: ['ACTION', 'COMMAND' as any],
    effects: [{ type: 'OVERLORD' }] as any,
    expansion: 'empires'
};
