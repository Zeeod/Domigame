import { CardDefinition } from '../../types/CardDefinition.js';

export const BadOmens: CardDefinition = {
    id: 'bad_omens',
    name: 'Mauvais Augures',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Mettez votre pioche dans votre défausse. Si vous avez 2💰 ou plus en jeu, mettez 2 Cuivres de votre défausse sur votre deck.',
    isNonSupply: true,
    effects: [
        // TODO: Implement
    ]
};

export const Delusion: CardDefinition = {
    id: 'delusion',
    name: 'Délire',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Si vous n\'avez pas d\'État, recevez Delusions. (Sinon, rien ne se passe.)',
    isNonSupply: true,
    effects: []
};

export const Envy: CardDefinition = {
    id: 'envy',
    name: 'Envie',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Pendant le reste du tour, vos Silvers et Golds valent 1💰.',
    isNonSupply: true,
    effects: []
};

export const Famine: CardDefinition = {
    id: 'famine',
    name: 'Famine',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Révélez les 3 cartes du dessus de votre deck. Écartez-en les Actions et défaussez le reste.',
    isNonSupply: true,
    effects: [
        {
            type: 'REVEAL_TOP_OF_DECK',
            amount: 3,
            next: [
                {
                    type: 'CHOOSE_FROM_REVEALED',
                    message: 'Écartez les Actions révélées',
                    min: 0,
                    max: 3,
                    destination: 'trash', // Wait, Hex says "Trash the Actions, Discard the rest"
                    // We need a forced filter/choice
                } as any
            ]
        }
    ]
};

export const Fear: CardDefinition = {
    id: 'fear',
    name: 'Peur',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Si vous avez au moins 5 cartes en main (après défausse d\'une carte le cas échéant), défaussez une Action ou un Trésor.',
    isNonSupply: true,
    effects: []
};

export const Greed: CardDefinition = {
    id: 'greed',
    name: 'Cupidité',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Recevez un Cuivre sur votre deck.',
    isNonSupply: true,
    effects: [
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'deck' }
    ]
};

export const Haunting: CardDefinition = {
    id: 'haunting',
    name: 'Hantise',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Si vous avez au moins 4 cartes en main, mettez une carte de votre main sur votre deck.',
    isNonSupply: true,
    effects: []
};

export const Locusts: CardDefinition = {
    id: 'locusts',
    name: 'Criquets',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Écartez la carte du dessus de votre deck. Si c\'était un Cuivre ou un Domaine, recevez une Malédiction. Sinon, recevez une carte coûtant moins que la carte écartée, partageant un type avec elle.',
    isNonSupply: true,
    effects: []
};

export const Misery: CardDefinition = {
    id: 'misery',
    name: 'Misère',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Si vous n\'avez pas Miserable, recevez-le. Si vous l\'avez déjà, retournez-le sur Twice Miserable.',
    isNonSupply: true,
    effects: []
};

export const Plague: CardDefinition = {
    id: 'plague',
    name: 'Peste',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Recevez une Malédiction (Curse).',
    isNonSupply: true,
    effects: [
        { type: 'GAIN_CARD', cardId: 'curse' }
    ]
};

export const Poverty: CardDefinition = {
    id: 'poverty',
    name: 'Pauvreté',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Défaussez jusqu\'à avoir 3 cartes en main.',
    isNonSupply: true,
    effects: [
        { type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }
    ]
};

export const War: CardDefinition = {
    id: 'war',
    name: 'Guerre',
    cost: 0,
    types: ['HEX'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Révélez des cartes de votre deck jusqu\'à une carte coûtant 3💰 ou 4💰. Écartez-la et défaussez le reste.',
    isNonSupply: true,
    effects: []
};

export const ALL_HEXES = [
    BadOmens, Delusion, Envy, Famine, Fear, Greed,
    Haunting, Locusts, Misery, Plague, Poverty, War
];
