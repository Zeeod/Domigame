import { CardDefinition } from '../../types/CardDefinition.js';

export const Cathedral: CardDefinition = {
    id: 'cathedral',
    name: 'Cathédrale',
    types: ['PROJECT'],
    cost: 3,
    description: "Au début de votre tour, écartez une carte de votre main.",
    onTurnStart: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            source: 'hand',
            message: 'Cathédrale: Écartez une carte de votre main'
        }
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
