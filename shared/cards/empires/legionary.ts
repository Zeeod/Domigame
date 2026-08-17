import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Legionary (Cost 5) - Action-Attack
 * +3 Coins. You may reveal a Gold. If you do, each other player discards down to 2 cards, then draws a card.
 */
export const legionary: CardDefinition = {
    id: 'legionary',
    name: 'Légionnaire',
    description: "3 💰. Vous pouvez révéler un Or de votre main. Si vous le faites, chaque autre joueur défausse jusqu'à avoir 2 cartes en main, puis pioche une carte.",
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Reveal a Gold?',
            options: [
                {
                    label: 'Reveal Gold',
                    effects: [
                        {
                            type: 'REVEAL_CARDS',
                            source: 'hand',
                            filter: { cardIds: ['gold'] },
                            amount: 1,
                            next: [
                                {
                                    type: 'EACH_PLAYER',
                                    filter: 'OTHERS',
                                    effects: [
                                        {
                                            type: 'DISCARD_TO_HAND_SIZE',
                                            targetHandSize: 2
                                        },
                                        { type: 'DRAW', amount: 1 }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                { label: 'Pass', effects: [] }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
