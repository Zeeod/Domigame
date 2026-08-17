import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Rabble - Prosperity 2nd Edition
 * Cost: 5
 * Types: ACTION, ATTACK
 * Text: +3 Cards. Each other player reveals the top 3 cards of their deck, 
 * discards the Actions and Treasures, and puts the rest back in any order.
 */
export const rabble: CardDefinition = {
    id: 'rabble',
    name: 'Cohue',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+3 Cartes. Chaque autre joueur révèle les 3 premières cartes de sa pioche, défausse les cartes Action et Trésor, et remet les autres sur sa pioche dans n\'importe quel ordre.',
    effects: [
        { type: 'DRAW', amount: 3 },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'REVEAL_AND_APPLY',
                    amount: 3,
                    from: 'deck',
                    onActionsTreasures: { action: 'DISCARD' },
                    onOthers: { action: 'TOPDECK_ORDER' }
                }
            ]
        }
    ]
};
