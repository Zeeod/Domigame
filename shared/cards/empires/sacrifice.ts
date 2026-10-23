import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Sacrifice (Cost 4) - Action
 * Trash a card from your hand. If it's an Action, +2 Cards and +2 Actions. 
 * If it's a Treasure, +2 Coins. If it's a Victory, +2 VP.
 */
export const sacrifice: CardDefinition = {
    id: 'sacrifice',
    name: 'Sacrifice',
    description: "Écartez une carte de votre main. Si c'est une Action, +2 Cartes, +2 Actions. Si c'est un Trésor, +2 💰. Si c'est une Victoire, +2 PV.",
    cost: 4,
    types: ['ACTION'],
    effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Sacrifice : écartez une carte', onSuccess: [{ type: 'SACRIFICE_BONUS' }] }] as any,
    expansion: 'empires'
};
