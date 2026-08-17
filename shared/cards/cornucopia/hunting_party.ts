import { CardDefinition } from '../../types/CardDefinition.js';

export const huntingParty: CardDefinition = {
    id: 'hunting_party',
    name: 'Partie de chasse',
    types: ['ACTION'],
    cost: 5,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+1 Carte, +1 Action. Révélez votre main. Révélez des cartes du dessus de votre pioche jusqu\'à en révéler une non présente en main. Mettez-la en main. Défaussez le reste.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_HAND' },
        { type: 'REVEAL_UNTIL_UNIQUE', destination: 'hand' }
    ] as any
};
