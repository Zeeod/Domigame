import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * City - Prosperity 2nd Edition
 * Cost: 5
 * Types: ACTION
 * Text: +1 Card, +2 Actions. 
 * If there are 1 or more empty Supply piles, +1 Card.
 * If there are 2 or more empty Supply piles, +1 Buy and +1 Money.
 */
export const city: CardDefinition = {
    id: 'city',
    name: 'Ville',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+1 Carte, +2 Actions. S\'il y a au moins une pile vide, +1 Carte. S\'il y a au moins deux piles vides, +1 Achat et +1 💰.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        {
            type: 'IF_EMPTY_PILES',
            minPiles: 1,
            effect: { type: 'DRAW', amount: 1 }
        },
        {
            type: 'IF_EMPTY_PILES',
            minPiles: 2,
            effect: {
                type: 'SEQUENCE',
                effects: [
                    { type: 'ADD_BUYS', amount: 1 },
                    { type: 'ADD_MONEY', amount: 1 }
                ]
            }
        }
    ]
};
