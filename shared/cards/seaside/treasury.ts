import { CardDefinition } from '../../types/CardDefinition';

export const treasury: CardDefinition = {
    id: 'treasury',
    name: 'Trésorerie',
    types: ['ACTION'],
    description: '+1 Carte ; +1 Action ; +1 Pièce. Lorsque vous défaussez cette carte du jeu, si vous n\'avez pas acheté de carte Victoire, vous pouvez la replacer sur votre pioche.',
    cost: 5,
    set: 'seaside',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    // The "When discard from play" logic is handled in `TurnMachine` cleanup.
    // I already added `boughtVictoryCard` tracking.
    // I need to implement the check in `TurnMachine`.
};
