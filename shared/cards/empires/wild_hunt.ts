import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Wild Hunt (Cost 5) - Action-Gathering
 * Choose one: +3 Cards and put 1 VP on the Wild Hunt pile; or gain an Estate and take the VP tokens from the Wild Hunt pile.
 */
export const wildHunt: CardDefinition = {
    id: 'wild_hunt',
    name: 'Chasse gardée',
    description: "Choisissez une option : +3 Cartes et ajoutez 1 PV à la pile Chasse Sauvage ; ou recevez le Domaine, et si vous le faites, prenez les PV de la pile.",
    cost: 5,
    types: ['ACTION', 'GATHERING'],
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Wild Hunt',
            options: [
                {
                    label: '+3 Cards, +1 VP to pile',
                    effects: [
                        { type: 'DRAW', amount: 3 },
                        { type: 'GATHER_VP', pileId: 'wild_hunt', amount: 1 }
                    ]
                },
                {
                    label: 'Gain Estate, Take VP from pile',
                    effects: [
                        { type: 'GAIN_CARD', cardId: 'estate', destination: 'discardPile' },
                        { type: 'TAKE_VP_FROM_PILE', pileId: 'wild_hunt' }
                    ]
                }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
