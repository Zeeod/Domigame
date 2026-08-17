import { CardDefinition } from '../../types/CardDefinition.js';

export const souk: CardDefinition = {
    id: 'souk',
    name: 'Souk',
    cost: 7,
    types: ['ACTION'],
    description: '+1 Achat. +1 💰 par carte en main. \nLors du gain: écartez jusqu\'à 2 cartes de votre main.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY_PER_CARD_IN_HAND', amount: 1 }
    ],
    onGain: [
        { type: 'TRASH', min: 0, max: 2, from: 'hand' }
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
