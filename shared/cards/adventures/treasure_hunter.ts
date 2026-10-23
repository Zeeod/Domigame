import { CardDefinition } from '../../types/CardDefinition.js';

export const treasureHunter: CardDefinition = {
    id: 'treasure_hunter',
    name: 'Chercheur de trésors',
    types: ['ACTION', 'TRAVELLER'],
    cost: 3,
    expansion: 'adventures',
    isNonSupply: true,
    description: '+1 Action, +1 💰. Recevez un Argent par carte que le joueur à votre droite a reçue à son dernier tour. Quand vous défaussez cette carte du jeu, vous pouvez l\'échanger contre un Guerrier.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'GAIN_SILVER_PER_CARDS_GAINED_LAST_TURN' }
    ] as any,
    upgradesTo: 'warrior'
};
