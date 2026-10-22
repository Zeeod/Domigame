import { CardDefinition } from '../../types/CardDefinition';

export const pirate: CardDefinition = {
    id: 'pirate',
    name: 'Pirate',
    types: ['ACTION', 'DURATION', 'REACTION'],
    cost: 5,
    description: "Au début de votre prochain tour, recevez en main un Trésor coûtant jusqu'à 6 💰. Quand un joueur (vous compris) reçoit un Trésor, vous pouvez jouer cette carte depuis votre main.",
    expansion: 'seaside',
    effects: [],
    durationEffects: [
        { type: 'GAIN_CARD', destination: 'hand', maxCost: 6, cardTypes: ['TREASURE'], message: 'Pirate : recevez en main un Trésor coûtant jusqu\'à 6 💰' }
    ] as any,
    isReaction: true,
    reactionTrigger: 'ANY_GAIN' as any,
    reactionCondition: { type: 'GAIN_TYPE', value: 'TREASURE' } as any,
    reactionEffects: [{ type: 'PLAY_THIS_CARD' }] as any
};
