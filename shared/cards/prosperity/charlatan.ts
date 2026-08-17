import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Charlatan - Prosperity 2nd Edition
 * Cost: 5
 * Types: ACTION, ATTACK
 * Text: +$3. Each other player gains a Curse. You may trash a Curse from your hand.
 */
export const charlatan: CardDefinition = {
    id: 'charlatan',
    name: 'Charlatan',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+3 💰. Chaque autre joueur gagne une Malédiction. Vous pouvez écarter une Malédiction de votre main.',
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'GAIN_CARD', cardId: 'curse', destination: 'discardPile' }
            ]
        },
        {
            type: 'TRASH',
            min: 0,
            max: 1,
            from: 'hand',
            filter: { cardIds: ['curse'] }
        }
    ]
};
