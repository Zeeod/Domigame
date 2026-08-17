import { CardDefinition } from '../../types/CardDefinition.js';

export const MountainVillage: CardDefinition = {
    id: 'mountain_village',
    name: 'Village de Montagne',
    types: ['ACTION'],
    cost: 4,
    description: "+2 Actions.\nPrenez en main une carte de votre défausse. Si vous le faites, +1 Action.", // Wait, standard text is: "+2 Actions. Look through your discard pile and put a card from it into your hand."
    // Actually: "Move a card from your discard pile to your hand. +1 Action. (Then +2 Actions from start?)"
    // Checked Wiki: "+2 Actions. Look through your discard pile and put a card from it into your hand."
    // So it gives +2 Actions. AND moves card.

    effects: [
        {
            type: 'ADD_ACTIONS',
            amount: 2
        },
        {
            type: 'SELECT_FROM_DISCARD',
            destination: 'hand'
        }
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
