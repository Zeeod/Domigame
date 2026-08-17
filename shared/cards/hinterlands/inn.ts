import { CardDefinition } from '../../types/CardDefinition.js';

export const inn: CardDefinition = {
    id: 'inn',
    name: 'Auberge',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+2 Cartes, +2 Actions. Défaussez 2 cartes. Quand vous gagnez cette carte, vous pouvez mélanger n\'importe quel nombre de cartes Action de votre défausse dans votre pioche.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Défaussez 2 cartes.' }
    ],
    onGain: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'discardPile',
            filter: { cardTypes: ['ACTION'] },
            min: 0,
            max: 99,
            optional: true,
            message: 'Choisissez des Actions à mélanger dans votre pioche',
            effects: [
                { type: 'MOVE_TO_DECK_AND_SHUFFLE' }
            ]
        }
    ] as any
};
