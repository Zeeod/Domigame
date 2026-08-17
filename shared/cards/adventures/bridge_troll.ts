import { CardDefinition } from '../../types/CardDefinition.js';

export const bridgeTroll: CardDefinition = {
    id: 'bridge_troll',
    name: 'Troll du pont',
    types: ['ACTION', 'ATTACK', 'DURATION'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Chaque autre joueur prend son jeton -1 💰. Maintenant et au début de votre prochain tour: +1 Achat. Tant que cette carte est en jeu, les cartes coûtent 1 💰 de moins.',
    effects: [
        {
            type: 'ATTACK',
            attackEffects: [{ type: 'TAKE_MINUS_COIN_TOKEN' }]
        },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'COST_REDUCTION', amount: 1 }
    ] as any,
    durationEffects: [
        { type: 'ADD_BUYS', amount: 1 }
    ]
};
