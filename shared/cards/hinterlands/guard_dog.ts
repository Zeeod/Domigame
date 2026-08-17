import { CardDefinition } from '../../types/CardDefinition.js';

export const guard_dog: CardDefinition = {
    id: 'guard_dog',
    name: 'Chien de garde',
    cost: 3,
    types: ['ACTION', 'REACTION'],
    description: '+2 Cartes. Si vous avez 5 cartes ou moins en main, +2 Cartes. \nRéaction: Lorsqu\'un autre joueur joue une Attaque, vous pouvez jouer cette carte de votre main.',
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'CONDITION',
            condition: 'HAND_SIZE',
            value: 5,
            comparator: '<=',
            trueEffects: [
                { type: 'DRAW', amount: 2 }
            ]
        }
    ],
    isReaction: true,
    reactionTrigger: 'ATTACK', // Triggered when opponent plays attack
    reactionEffects: [
        { type: 'PLAY_THIS_CARD' }
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
