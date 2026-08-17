import { CardDefinition } from '../../types/CardDefinition.js';

export const berserker: CardDefinition = {
    id: 'berserker',
    name: 'Berserker',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    description: 'Gagnez une carte coûtant moins que cette carte. Si vous avez une carte Action en jeu, jouez le Berserker. \nAttaque: Les autres joueurs défaussent jusqu\'à avoir 3 cartes en main.',
    effects: [
        {
            type: 'GAIN_CARD',
            maxCost: 4, // Less than 5
            destination: 'discardPile'
        },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }
            ]
        }
    ],
    onGain: [
        {
            type: 'CONDITION',
            condition: 'HAS_CARD_TYPE_IN_PLAY',
            cardType: 'ACTION',
            trueEffects: [
                { type: 'PLAY_THIS_CARD' }
            ]
        }
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
