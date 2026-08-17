import { CardDefinition } from '../../types/CardDefinition.js';

export const scheme: CardDefinition = {
    id: 'scheme',
    name: 'Stratagème',
    types: ['ACTION'],
    cost: 3,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: "+1 Carte, +1 Action. À la fin de ce tour, vous pouvez choisir une carte Action en jeu et la mettre sur votre deck.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    triggers: [
        {
            trigger: 'ON_CLEANUP',
            effects: [
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'playArea',
                    destination: 'deck',
                    min: 0,
                    max: 1,
                    filter: { cardTypes: ['ACTION'] },
                    message: "Choisissez une carte Action en jeu à mettre sur votre deck (Stratagème)."
                }
            ]
        }
    ]
};
