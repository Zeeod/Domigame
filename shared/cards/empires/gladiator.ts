import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Gladiator (Cost 3💰) - Action
 * +2💰. Reveal a card from your hand. 
 * The player to your left may reveal a copy of it from their hand. 
 * If they don't, +1💰 and you may trash a Gladiator from the Supply.
 */
export const gladiator: CardDefinition = {
    id: 'gladiator',
    name: 'Gladiateur',
    description: '+2 💰. Dévoilez une carte de votre main. Le joueur à votre gauche peut dévoiler une copie de cette carte de sa main. S\'il ne le fait pas, +1 💰 et écartez un Gladiateur de la réserve.',
    cost: 3,
    types: ['ACTION'],
    effects: [{ type: 'ADD_MONEY', amount: 2 }, { type: 'GLADIATOR' }] as any,
    expansion: 'empires',
    isSubCard: true
};
