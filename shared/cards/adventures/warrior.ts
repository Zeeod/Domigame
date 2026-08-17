import { CardDefinition } from '../../types/CardDefinition.js';

export const warrior: CardDefinition = {
    id: 'warrior',
    name: 'Guerrier',
    types: ['ACTION', 'ATTACK', 'TRAVELLER'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    isNonSupply: true,
    description: '+2 Cartes. Une fois par Voyageur que vous avez en jeu: Chaque autre joueur défausse la carte du dessus de sa pioche et l\'écarte si elle coûte 3 ou 4 💰. Quand vous défaussez, échangez contre un Héros.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'WARRIOR_ATTACK' }
    ] as any,
    upgradesTo: 'hero'
};
