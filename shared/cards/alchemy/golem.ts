import { CardDefinition } from '../../types/CardDefinition.js';

export const Golem: CardDefinition = {
    id: 'golem',
    name: 'Golem',
    types: ['ACTION'],
    cost: 4,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "Révélez des cartes de votre deck jusqu'à ce que vous ayez révélé 2 cartes Action autres que des Golems. Écartez les autres cartes révélées, puis jouez les cartes Action révélées dans n'importe quel ordre.",
    effects: [
        {
            type: 'REVEAL_UNTIL',
            condition: { cardTypes: ['ACTION'], excludeTypes: ['GOLEM'] },
            amount: 2,
            destination: 'aside',
            failDestination: 'discardPile'
        },
        {
            type: 'PLAY_TARGET',
            sourceZone: 'aside',
            message: "Golem : Choisissez l'ordre de jeu des Actions révélées"
        }
    ]
};
