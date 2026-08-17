import { CardDefinition } from '../../types/CardDefinition.js';

export const urchin: CardDefinition = {
    id: 'urchin',
    name: 'Gamin des Rues',
    cost: 3,
    types: ['ACTION', 'ATTACK'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +1 Action. Chaque autre joueur défausse jusqu\'à 4 cartes en main. Quand vous jouez une autre Attaque avec cette carte en jeu, vous pouvez écarter cette carte pour gagner un Mercenaire.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effect: { type: 'DISCARD_DOWN_TO', amount: 4 } as any
        }
    ]
};
