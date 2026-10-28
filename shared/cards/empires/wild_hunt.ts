import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Wild Hunt (Cost 5) - Action-Gathering
 * Choose one: +3 Cards and put 1 VP on the Wild Hunt pile; or gain an Estate and take the VP tokens from the Wild Hunt pile.
 */
export const wildHunt: CardDefinition = {
    id: 'wild_hunt',
    name: 'Chasse gardée',
    description: 'Choisissez : +3 Cartes et ajoutez 1 🛡️ sur la pile des Chasses sauvages ; ou recevez un Domaine, et si vous le faites, prenez les 🛡️ de la pile.',
    cost: 5,
    types: ['ACTION', 'GATHERING'],
    effects: [{ type: 'SELECT_OPTION', message: 'Chasse gardée : choisissez', options: [
        { label: '+3 Cartes et +1 🛡️ sur la pile', effects: [{ type: 'DRAW', amount: 3 }, { type: 'ADD_PILE_VP', cardId: 'wild_hunt', amount: 1 }] },
        { label: 'Recevoir un Domaine et prendre les 🛡️ de la pile', effects: [{ type: 'WILD_HUNT_ESTATE' }] }
    ] }] as any,
    expansion: 'empires'
};
