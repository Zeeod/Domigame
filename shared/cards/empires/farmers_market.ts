import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Farmers' Market (Cost 3) - Action-Gathering
 * +1 Buy. If there are VP tokens on this pile, take them and trash this. 
 * Otherwise, put +1 VP on this pile and +1 Coin.
 */
export const farmersMarket: CardDefinition = {
    id: 'farmers_market',
    name: "Marché fermier",
    description: '+1 Achat. S\'il y a 4 🛡️ ou plus sur la pile des Marchés fermiers, prenez-les et écartez cette carte. Sinon, ajoutez 1 🛡️ sur la pile, puis +1 💰 par 🛡️ sur la pile.',
    cost: 3,
    types: ['ACTION', 'GATHERING'],
    effects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'FARMERS_MARKET' }] as any,
    expansion: 'empires'
};
