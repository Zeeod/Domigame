import { CardDefinition } from '../../types/CardDefinition.js';

export const merchantGuild: CardDefinition = {
    id: 'merchant_guild',
    name: 'Guilde des marchands',
    types: ['ACTION'],
    cost: 5,
    expansion: 'guilds',
    set: 'guilds',
    description: '+1 Achat, +1 💰. Tant que cette carte est en jeu, quand vous achetez une carte, +1 Coffre.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    triggers: [
        {
            trigger: 'ON_BUY',
            effects: [
                { type: 'ADD_COFFERS', amount: 1 }
            ]
        }
    ]
};
