import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Chariot Race (Cost 3) - Action
 * +1 Action. Reveal the top card of your deck. If it costs more than the top card of the player to your left, +1 VP and +1 Coin.
 */
export const chariotRace: CardDefinition = {
    id: 'chariot_race',
    name: 'Course de chars',
    description: '+1 Action. Dévoilez la carte du dessus de votre pioche et prenez-la en main. Le joueur à votre gauche dévoile la carte du dessus de sa pioche. Si votre carte coûte plus, +1 💰 et +1 🛡️.',
    cost: 3,
    types: ['ACTION'],
    effects: [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'CHARIOT_RACE' }] as any,
    expansion: 'empires'
};
