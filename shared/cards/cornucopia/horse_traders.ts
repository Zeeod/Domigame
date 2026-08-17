import { CardDefinition } from '../../types/CardDefinition.js';

export const horseTraders: CardDefinition = {
    id: 'horse_traders',
    name: 'Maquignon',
    types: ['ACTION', 'REACTION'],
    cost: 4,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+1 Achat, +3 💰. Défaussez 2 cartes. Réaction: Quand un autre joueur joue une Attaque, vous pouvez mettre cette carte de côté et piocher une carte au début de votre prochain tour.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Défaussez 2 cartes.' }
    ],
    reactionTrigger: 'ATTACK',
    reactionEffects: [
        { type: 'SET_ASIDE_UNTIL_NEXT_TURN', drawOnReturn: 1 }
    ] as any
};
