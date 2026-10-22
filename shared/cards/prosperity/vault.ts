import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Vault - Prosperity 2nd Edition
 * Cost: 5
 * Types: ACTION
 * Text: +2 Cards. Discard any number of cards for +1$ each. 
 * Each other player may discard 2 cards to draw a card.
 */
export const vault: CardDefinition = {
    id: 'vault',
    name: 'Chambre forte',
    cost: 5,
    types: ['ACTION'],
    expansion: 'prosperity',
    description: '+2 Cartes. Défaussez n\'importe quel nombre de cartes pour +1 💰 chacune. Chaque autre joueur peut défausser 2 cartes pour piocher 1 carte.',
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'DISCARD', min: 0, max: 99,
            message: 'Chambre forte : défaussez autant de cartes que vous voulez (+1 💰 chacune)',
            onSuccess: [{ type: 'ADD_MONEY', amount: { type: 'COUNT_DISCARDED' } }]
        },
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effects: [{
                type: 'SELECT_OPTION',
                message: 'Chambre forte : défausser 2 cartes pour piocher 1 carte ?',
                options: [
                    { label: 'Défausser 2 cartes, piocher 1', effects: [{ type: 'CONDITION', condition: 'HAND_SIZE', comparator: '>=', value: 2, trueEffects: [{ type: 'DISCARD', min: 2, max: 2, message: 'Défaussez 2 cartes', onSuccess: [{ type: 'DRAW', amount: 1 }] }] }] },
                    { label: 'Ne rien faire', effects: [] }
                ]
            }]
        }
    ] as any
};
