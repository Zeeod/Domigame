import { CardDefinition } from '../../types/CardDefinition.js';

export const Alchemist: CardDefinition = {
    id: 'alchemist',
    name: 'Alchimiste',
    types: ['ACTION'],
    cost: 3,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "+2 Cartes.\n+1 Action.\nLorsque vous écartez cette carte du jeu, si vous avez une Potion en jeu, vous pouvez replacer cette carte sur votre deck.",
    effects: [
        {
            type: 'DRAW',
            amount: 2
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        }
    ],
    onCleanup: [
        {
            type: 'CONDITION',
            condition: 'CARDS_IN_PLAY_COUNT',
            filter: { cardIds: ['potion'] },
            comparator: '>=',
            value: 1,
            trueEffects: [
                {
                    type: 'CHOOSE_OPTION',
                    message: "Voulez-vous replacer l'Alchimiste sur votre deck?",
                    options: [
                        {
                            label: 'Oui',
                            effects: [
                                {
                                    type: 'MOVE_CARDS',
                                    source: 'playArea',
                                    destination: 'deck',
                                    count: 1,
                                    filter: { cardIds: ['alchemist'] }
                                }
                            ]
                        },
                        {
                            label: 'Non',
                            effects: []
                        }
                    ]
                }
            ]
        }
    ]
};
