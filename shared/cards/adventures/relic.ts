import { CardDefinition } from '../../types/CardDefinition.js';

export const relic: CardDefinition = {
    id: 'relic',
    name: 'Relique',
    types: ['TREASURE', 'ATTACK'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: '2 💰. Chaque autre joueur met son jeton -1 Carte sur sa pioche.',
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [{ type: 'PUT_MINUS_CARD_TOKEN' }]
        }
    ] as any
};
