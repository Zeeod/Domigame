import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Investment - Prosperity 2nd Edition
 * Cost: 5
 * Types: TREASURE
 * Text: 1$. When you play this, trash a card from your hand. 
 * If you do, +1$ for each uniquely named card in the trash.
 */
export const investment: CardDefinition = {
    id: 'investment',
    name: 'Investissement',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Vaut 1 💰. Écartez une carte de votre main. Si vous le faites, +1 💰 pour chaque carte de nom différent dans le rebut.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            onSuccess: [
                {
                    type: 'ADD_MONEY',
                    amount: {
                        type: 'COUNT_UNIQUE_CARDS_IN_TRASH'
                    } as any
                }
            ]
        }
    ]
};
