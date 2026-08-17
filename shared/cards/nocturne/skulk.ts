import { CardDefinition } from '../../types/CardDefinition.js';

export const Skulk: CardDefinition = {
    id: 'skulk',
    name: 'Skulk',
    cost: 4,
    types: ['ACTION', 'DOOM'],
    heirloom: 'cursed_gold',
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Achat. Quand vous recevez cette carte, chaque autre joueur reçoit la prochaine Malédiction (Hex).',
    effects: [
        { type: 'ADD_BUYS', amount: 1 }
    ],
    onGain: [
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'RECEIVE_HEX' }
            ]
        }
    ]
};
