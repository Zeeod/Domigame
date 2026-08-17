import { CardDefinition } from '../../types/CardDefinition.js';

export const FlagBearer: CardDefinition = {
    id: 'flag_bearer',
    name: 'Porte-Drapeau',
    types: ['ACTION'],
    cost: 3,
    effects: [
        {
            type: 'ADD_MONEY',
            amount: 2,
        },
    ],
    // "When you gain or trash this, take the Flag."
    onGain: [
        {
            type: 'TAKE_ARTIFACT',
            artifact: 'flag',
        },
    ],
    onTrash: [
        {
            type: 'TAKE_ARTIFACT',
            artifact: 'flag',
        },
    ],
    description: "+3 Pièces. Lorsque vous recevez ou écartez cette carte, prenez le Drapeau.",
    expansion: 'Renaissance',
    set: 'renaissance'
};
