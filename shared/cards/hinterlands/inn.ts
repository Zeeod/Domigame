import { CardDefinition } from '../../types/CardDefinition.js';

export const inn: CardDefinition = {
    id: 'inn',
    name: 'Auberge',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    description: '+2 Cartes, +2 Actions. Défaussez 2 cartes. Quand vous recevez cette carte, dévoilez autant de cartes Action de votre défausse que vous voulez (celle-ci comprise) et mélangez-les dans votre pioche.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Défaussez 2 cartes.' }
    ],
    onGain: [{ type: 'INN_ON_GAIN' }] as any
};
