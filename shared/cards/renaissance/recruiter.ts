import { CardDefinition } from '../../types/CardDefinition.js';

export const Recruiter: CardDefinition = {
    id: 'recruiter',
    name: 'Recruteur',
    types: ['ACTION'],
    cost: 5,
    effects: [
        {
            type: 'DRAW',
            amount: 2,
        },
        {
            type: 'RECRUITER_EFFECT',
        },
    ],
    description: "+2 Cartes. Écartez une carte de votre main. +1 Villageois par pièce que la carte coûte.",
    expansion: 'Renaissance',
    set: 'renaissance'
};
