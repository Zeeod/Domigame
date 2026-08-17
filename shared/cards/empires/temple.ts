import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Temple (Cost 4) - Action-Gathering
 * Trash 1 to 3 cards with different names from your hand. +1 VP for each card trashed. 
 * When you gain this, put 1 VP on the Temple pile.
 */
export const temple: CardDefinition = {
    id: 'temple',
    name: 'Temple',
    description: "+1 PV. Écartez 1 à 3 cartes de votre main. Ajoutez 1 PV à la pile Temple chaque fois que vous en recevez un.",
    cost: 4,
    types: ['ACTION', 'GATHERING'],
    effects: [
        {
            type: 'TRASH',
            min: 1,
            max: 3,
            filter: { uniqueNames: true }
        },
        { type: 'ADD_VP_TOKENS_PER_MOVED', amount: 1 }
    ],
    onGain: [
        { type: 'GATHER_VP', pileId: 'temple', amount: 1 }
    ],
    set: 'empires',
    expansion: 'empires'
};
