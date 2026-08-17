import { CardDefinition } from '../../types/CardDefinition.js';

export const caravanGuard: CardDefinition = {
    id: 'caravan_guard',
    name: 'Garde de caravane',
    types: ['ACTION', 'DURATION', 'REACTION'],
    isReaction: true,
    reactionTrigger: 'ATTACK',
    cost: 3,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Carte, +1 Action. Au début de votre prochain tour, +1 💰. Réaction: Quand un autre joueur joue une Attaque, jouez cette carte.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    durationEffects: [
        { type: 'ADD_MONEY', amount: 1 }
    ],

    reactionEffects: [
        { type: 'PLAY_THIS_CARD' }
    ] as any
};
