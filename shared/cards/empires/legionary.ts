import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Legionary (Cost 5) - Action-Attack
 * +3 Coins. You may reveal a Gold. If you do, each other player discards down to 2 cards, then draws a card.
 */
export const legionary: CardDefinition = {
    id: 'legionary',
    name: 'Légionnaire',
    description: "3 💰. Vous pouvez révéler un Or de votre main. Si vous le faites, chaque autre joueur défausse jusqu'à avoir 2 cartes en main, puis pioche une carte.",
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'LEGIONARY' }] as any,
    expansion: 'empires'
};
