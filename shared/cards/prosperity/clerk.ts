import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Clerk - Prosperity 2nd Edition
 * Cost: 4
 * Types: ACTION
 * Text: +2 Money. You may put this on top of your deck.
 */
export const clerk: CardDefinition = {
    id: 'clerk',
    name: 'Clerc',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+2 💰. Vous pouvez placer cette carte sur votre pioche.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'playArea',
            destination: 'deck',
            message: 'Voulez-vous placer cette carte sur votre pioche ?',
            min: 0,
            max: 1,
            filter: { cardIds: ['clerk'] },
            optional: true
        }
    ]
};
