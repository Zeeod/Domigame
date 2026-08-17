import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Expand - Prosperity 2nd Edition
 * Cost: 7
 * Types: ACTION
 * Text: Trash a card from your hand. Gain a card costing up to 3 more than it.
 */
export const expand: CardDefinition = {
    id: 'expand',
    name: 'Agrandissement',
    cost: 7,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Écartez une carte de votre main. Gagnez une carte coûtant jusqu\'à 3 💰 de plus que la carte écartée.',
    effects: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            onSuccess: [
                {
                    type: 'GAIN_CARD_PLUS_COST',
                    costBonus: 3,
                    destination: 'discardPile'
                }
            ]
        }
    ]
};
