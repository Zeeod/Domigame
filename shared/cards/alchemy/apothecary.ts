import { CardDefinition } from '../../types/CardDefinition.js';

export const Apothecary: CardDefinition = {
    id: 'apothecary',
    name: 'Apothicaire',
    types: ['ACTION'],
    cost: 2,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "+1 Carte.\n+1 Action.\nRévélez les 4 premières cartes de votre deck. Mettez les Cuivres et Potions révélés dans votre main. Replacez le reste sur votre deck dans l'ordre de votre choix.",
    effects: [
        {
            type: 'DRAW',
            amount: 1
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        },
        {
            type: 'REVEAL_CARDS',
            amount: 4,
            source: 'deck',
            destination: 'limbo',
            next: [
                {
                    type: 'MOVE_CARDS',
                    source: 'limbo',
                    destination: 'hand',
                    filter: { cardIds: ['copper', 'potion'] }
                },
                {
                    type: 'MOVE_CARDS',
                    source: 'limbo',
                    destination: 'deck',
                    // Logic for "put back in any order" is handled by MOVE_CARDS when multiple cards go to deck
                    // Verify if engine prompts for order. If not, might default to order revealed or random.
                    // For now using MOVE_CARDS.
                }
            ]
        }
    ]
};
