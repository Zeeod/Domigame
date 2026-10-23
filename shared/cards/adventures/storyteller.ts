import { CardDefinition } from '../../types/CardDefinition.js';

export const storyteller: CardDefinition = {
    id: 'storyteller',
    name: 'Conteur',
    types: ['ACTION'],
    cost: 5,
    expansion: 'adventures',
    description: '+1 Action, +1 💰. Jouez jusqu\'à 3 Trésors de votre main. Puis +1 Carte, et payez tous vos 💰 pour +1 Carte par 💰 payé.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'STORYTELLER' }
    ] as any
};
