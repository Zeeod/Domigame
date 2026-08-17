import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Fortune (Cost 8💰 8 Debt) - Treasure
 * +1 Buy. When you play this, double your current Coins this turn.
 * When you gain this, for each Silver you have in play, +1 Buy.
 */
export const fortune: CardDefinition = {
    id: 'fortune',
    name: 'Fortune',
    description: "+1 Achat. Lorsque vous jouez cette carte, doublez vos 💰 si vous ne l'avez pas encore fait ce tour-ci. Lorsque vous recevez cette carte, gagnez un Or par Gladiateur que vous avez en jeu.",
    cost: 8,
    debtCost: 8,
    types: ['TREASURE'],
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'MULTIPLY_MONEY', multiplier: 2 }
    ],
    onGain: [
        {
            type: 'GAIN_CARD',
            cardId: 'gold',
            count: {
                type: 'COUNT_CARDS_IN_PLAY',
                filter: { cardIds: ['gladiator'] }
            } as any
        }
    ],
    isSubCard: true,
    set: 'empires',
    expansion: 'empires'
};
