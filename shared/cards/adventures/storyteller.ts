import { CardDefinition } from '../../types/CardDefinition.js';

export const storyteller: CardDefinition = {
    id: 'storyteller',
    name: 'Conteur',
    types: ['ACTION'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Action. Jouez jusqu\'à 3 Trésors de votre main. Ensuite payez tous vos 💰 pour piocher autant de cartes.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'PLAY_TREASURES_FROM_HAND', max: 3 },
        { type: 'PAY_ALL_COINS_TO_DRAW' }
    ] as any
};
