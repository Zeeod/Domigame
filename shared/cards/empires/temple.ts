import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Temple (Cost 4) - Action-Gathering
 * Trash 1 to 3 cards with different names from your hand. +1 VP for each card trashed. 
 * When you gain this, put 1 VP on the Temple pile.
 */
export const temple: CardDefinition = {
    id: 'temple',
    name: 'Temple',
    description: '+1 🛡️. Écartez de 1 à 3 cartes de noms différents de votre main. Ajoutez 1 🛡️ sur la pile des Temples. Quand vous recevez cette carte, prenez les 🛡️ de la pile.',
    cost: 4,
    types: ['ACTION', 'GATHERING'],
    effects: [{ type: 'TEMPLE' }] as any,
    onGain: [{ type: 'TAKE_PILE_VP', cardId: 'temple' }] as any,
    expansion: 'empires'
};
