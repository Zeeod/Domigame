import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Overlord (Cost 8 Debt) - Action
 * Play this as a copy of any Action card in the Supply costing up to 5💰.
 * (Type: ACTION-COMMAND)
 */
export const overlord: CardDefinition = {
    id: 'overlord',
    name: 'Seigneur',
    description: "Jouez cette carte comme si c'était une carte Action de la réserve coûtant jusqu'à 5 💰. Cette carte est la carte choisie jusqu'à ce qu'elle quitte le jeu.",
    cost: 0,
    debtCost: 8,
    types: ['ACTION', 'COMMAND' as any],
    effects: [
        {
            type: 'PLAY_AS_SUPPLY_ACTION',
            maxCost: 5,
            cardTypes: ['ACTION']
        } as any
    ],
    set: 'empires',
    expansion: 'empires'
};
