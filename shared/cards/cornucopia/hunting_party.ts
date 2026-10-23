import { CardDefinition } from '../../types/CardDefinition.js';

export const huntingParty: CardDefinition = {
    id: 'hunting_party',
    name: 'Partie de chasse',
    types: ['ACTION'],
    cost: 5,
    expansion: 'cornucopia',
    description: '+1 Carte, +1 Action. Dévoilez votre main. Dévoilez des cartes de votre pioche jusqu\'à dévoiler une carte qui n\'est pas une copie d\'une carte de votre main. Prenez-la en main et défaussez le reste.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'HUNTING_PARTY' }
    ] as any
};
