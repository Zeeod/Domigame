import { CardDefinition } from '../../types/CardDefinition.js';

export const urchin: CardDefinition = {
    id: 'urchin',
    name: 'Gamin des Rues',
    cost: 3,
    types: ['ACTION', 'ATTACK'],
    expansion: 'dark_ages',
    description: '+1 Carte, +1 Action. Chaque autre joueur défausse jusqu\'à 4 cartes en main. Quand vous jouez une autre Attaque avec cette carte en jeu, vous pouvez écarter cette carte pour gagner un Mercenaire.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 4 }] }
    ] as any,
    triggers: [{ trigger: 'ON_PLAY', filter: { cardTypes: ['ATTACK'] }, effects: [{ type: 'URCHIN_OFFER' }] }] as any
};
