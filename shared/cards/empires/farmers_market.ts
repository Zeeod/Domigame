import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Farmers' Market (Cost 3) - Action-Gathering
 * +1 Buy. If there are VP tokens on this pile, take them and trash this. 
 * Otherwise, put +1 VP on this pile and +1 Coin.
 */
export const farmersMarket: CardDefinition = {
    id: 'farmers_market',
    name: "Marché fermier",
    description: "+1 Achat. S'il y a 4 PV+ sur la pile Marché Fermier, prenez-les et écartez cette carte. Sinon, ajoutez 1 PV sur la pile et +1 💰.",
    cost: 3,
    types: ['ACTION', 'GATHERING'],
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'CONDITION',
            condition: 'PILE_HAS_VP',
            pileId: 'farmers_market',
            trueEffects: [
                { type: 'TAKE_VP_FROM_PILE', pileId: 'farmers_market' },
                { type: 'TRASH_SELF' }
            ],
            falseEffects: [
                { type: 'GATHER_VP', pileId: 'farmers_market', amount: 1 },
                { type: 'ADD_MONEY', amount: 1 }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
