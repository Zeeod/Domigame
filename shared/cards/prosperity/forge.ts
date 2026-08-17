import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Forge - Prosperity 2nd Edition
 * Cost: 7
 * Types: ACTION
 * Text: Trash any number of cards from your hand. 
 * Gain a card with cost exactly equal to the total cost of the trashed cards.
 */
export const forge: CardDefinition = {
    id: 'forge',
    name: 'Forge',
    cost: 7,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Écartez n\'importe quel nombre de cartes de votre main. Gagnez une carte coûtant exactement le coût total des cartes écartées.',
    effects: [
        {
            type: 'TRASH',
            min: 0,
            max: 99,
            from: 'hand',
            onSuccess: [
                {
                    type: 'GAIN_CARD_EXACT_COST',
                    useTotalTrashedCost: true,
                    destination: 'discardPile'
                }
            ]
        }
    ]
};
