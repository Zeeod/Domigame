import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Crystal Ball - Prosperity 2nd Edition
 * Cost: 5
 * Types: TREASURE
 * Text: 1$. When you play this, look at the top card of your deck. 
 * You may trash it, discard it, or put it into your hand.
 */
export const crystalBall: CardDefinition = {
    id: 'crystal_ball',
    name: 'Boule de cristal',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Vaut 1 💰. Regardez la carte du haut de votre pioche. Vous pouvez l\'écarter, la défausser, ou la placer dans votre main.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'REVEAL_CARDS',
            amount: 1,
            source: 'deck',
            destination: 'limbo'
        },
        {
            type: 'CHOOSE_OPTION',
            options: [
                { label: 'Ecarter', effects: [{ type: 'SELECT_AND_APPLY', sourceZone: 'limbo', action: 'TRASH' }] },
                { label: 'Défausser', effects: [{ type: 'SELECT_AND_APPLY', sourceZone: 'limbo', action: 'DISCARD' }] },
                { label: 'Prendre en main', effects: [{ type: 'SELECT_AND_APPLY', sourceZone: 'limbo', action: 'GAIN' }] },
                { label: 'Laisser sur la pioche', effects: [] } // Moved back automatically if nothing done? Assuming engine handles limbo cleanup
            ],
            message: 'Que faire de la carte révélée ?'
        }
    ]
};
