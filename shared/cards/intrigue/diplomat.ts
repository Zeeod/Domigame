import { CardDefinition } from '../../types/CardDefinition.js';

export const diplomat: CardDefinition = {
    id: 'diplomat',
    name: 'Diplomate',
    cost: 4,
    types: ['ACTION', 'REACTION'],
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'CONDITION',
            condition: 'HAND_SIZE',
            comparator: '<=',
            value: 5,
            trueEffects: [{ type: 'ADD_ACTIONS', amount: 2 }]
        }
    ],
    isReaction: true,
    reactionTrigger: 'ATTACK',
    reactionCondition: { type: 'HAND_SIZE', comparator: '>=', value: 5 },
    reactionEffects: [
        { type: 'DRAW', amount: 2 },
        { type: 'DISCARD', min: 3, max: 3 }
    ],
    description: '+2 Cartes. Si vous avez 5 cartes ou moins en main après avoir pioché : +2 Actions. Réaction : Quand un autre joueur joue une carte Attaque, si vous avez 5 cartes ou plus en main, vous pouvez révéler cette carte pour piocher 2 cartes puis en défausser 3.',
    image: '/card-images/diplomat.jpg',
    expansion: 'Intrigue'
};
