import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Settlers (Cost 2) - Action
 * +1 Action, +1 Card. You may look through your discard pile and put a Copper from it into your hand.
 */
export const settlers: CardDefinition = {
    id: 'settlers',
    name: 'Colons',
    description: "+1 Carte. +1 Action. Regardez dans votre défausse. Vous pouvez révéler un Cuivre et le prendre en main.",
    cost: 2,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Mettre un Cuivre de votre défausse dans votre main ?',
            options: [
                {
                    label: 'Oui',
                    effects: [
                        {
                            type: 'MOVE_CARDS',
                            source: 'discardPile',
                            destination: 'hand',
                            filter: { cardIds: ['copper'] },
                            count: 1
                        }
                    ]
                },
                { label: 'Non', effects: [] }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};
