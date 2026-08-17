
import { CardDefinition } from '../../types/CardDefinition.js';

export const Alliance: CardDefinition = {
    id: 'alliance',
    name: 'Alliance',
    types: ['EVENT'],
    cost: 10,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez une Province, un Duché, un Domaine, un Or, un Argent et un Cuivre.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'province' },
        { type: 'GAIN_CARD', cardId: 'duchy' },
        { type: 'GAIN_CARD', cardId: 'estate' },
        { type: 'GAIN_CARD', cardId: 'gold' },
        { type: 'GAIN_CARD', cardId: 'silver' },
        { type: 'GAIN_CARD', cardId: 'copper' }
    ]
};

export const Banish: CardDefinition = {
    id: 'banish',
    name: 'Bannissement',
    types: ['EVENT'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Exilez n'importe quel nombre de cartes de votre main ayant le même nom. Gagnez une carte coûtant jusqu'à 2 Pièces de plus que les cartes exilées.",
    effects: [
        // Exile logic
    ]
};

export const Bargain: CardDefinition = {
    id: 'bargain',
    name: 'Marchandage',
    types: ['EVENT'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez une carte non-Victoire coûtant jusqu'à 5 Pièces. Gagnez 3 Chevaux.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'horse', count: 3 }
        // Choice gain
    ]
};

export const Commerce: CardDefinition = {
    id: 'commerce',
    name: 'Commerce',
    types: ['EVENT'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez un Or par carte différente que vous avez gagnée ce tour-ci.",
    effects: [
        // Gain logic
    ]
};

export const Demand: CardDefinition = {
    id: 'demand',
    name: 'Exigence',
    types: ['EVENT'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez un Cheval. Gagnez une carte coûtant jusqu'à 6 Pièces. Mettez-la sur votre deck.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'horse' }
        // Gain on deck
    ]
};

export const Desperation: CardDefinition = {
    id: 'desperation',
    name: 'Désespoir',
    types: ['EVENT'],
    cost: 0,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Une fois par tour : gagnez une Malédiction. +1 Achat, +2 Pièces.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'curse' },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 }
    ]
};

export const Enclave: CardDefinition = {
    id: 'enclave',
    name: 'Enclave',
    types: ['EVENT'],
    cost: 8,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez un Or. Exilez un Duché de la réserve.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'gold' },
        { type: 'GAIN_CARD', cardId: 'duchy', destination: 'exile' }
    ]
};

export const Enhance: CardDefinition = {
    id: 'enhance',
    name: 'Renforcement',
    types: ['EVENT'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Vous pouvez écarter une carte non-Victoire de votre main pour gagner une carte coûtant jusqu'à 2 Pièces de plus.",
    effects: [
        // Trash Gain
    ]
};

export const Gamble: CardDefinition = {
    id: 'gamble',
    name: 'Pari',
    types: ['EVENT'],
    cost: 2,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Action. Révélez la carte du dessus de votre deck. SI c'est une Action ou un Trésor, vous pouvez la jouer.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 }
        // Reveal Play
    ]
};

export const Invest: CardDefinition = {
    id: 'invest',
    name: 'Investissement',
    types: ['EVENT'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Exilez une carte Action de votre main. Si vous le faites : à la fin de la partie, révélez votre Exil...",
    effects: [
        // Exile
    ]
};

export const March: CardDefinition = {
    id: 'march',
    name: 'Marche',
    types: ['EVENT'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Défaussez une carte. Si vous le faites, vous pouvez jouer une Action de votre défausse.",
    effects: [
        // Discard Play
    ]
};

export const Populate: CardDefinition = {
    id: 'populate',
    name: 'Peuplement',
    types: ['EVENT'],
    cost: 10,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez une carte de chaque pile Action de la réserve.",
    effects: [
        // Bulk gain
    ]
};

export const Pursue: CardDefinition = {
    id: 'pursue',
    name: 'Poursuite',
    types: ['EVENT'],
    cost: 2,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Nommez une carte. Révélez 4 cartes de votre deck. Mettez les cartes nommées révélées dans votre main et défaussez le reste.",
    effects: [
        // Name Reveal
    ]
};

export const Reap: CardDefinition = {
    id: 'reap',
    name: 'Moisson',
    types: ['EVENT'],
    cost: 7,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez un Or. Si vous le faites, gagnez une carte Victoire coûtant jusqu'à 4 Pièces (probablement Domaine).",
    effects: [
        { type: 'GAIN_CARD', cardId: 'gold' }
        // Gain logic
    ]
};

export const Ride: CardDefinition = {
    id: 'ride',
    name: 'Chevauchée',
    types: ['EVENT'],
    cost: 2,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez un Cheval.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'horse' }
    ]
};

export const SeizeTheDay: CardDefinition = {
    id: 'seize_the_day',
    name: 'Saisir le Jour',
    types: ['EVENT'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Une fois par partie : jouez un tour supplémentaire après celui-ci.",
    effects: [
        { type: 'SCHEDULE_EXTRA_TURN' } // Correct Type
    ]
};

export const Stampede: CardDefinition = {
    id: 'stampede',
    name: 'Ruée',
    types: ['EVENT'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Si vous avez 5 cartes ou moins en jeu : gagnez 5 Chevaux sur votre deck.",
    effects: [
        // Condition gain deck
    ]
};

export const Toil: CardDefinition = {
    id: 'toil',
    name: 'Labeur',
    types: ['EVENT'],
    cost: 2,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Achat. Vous pouvez jouer une Action de votre main.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 }
        // Play action
    ]
};

export const Transport: CardDefinition = {
    id: 'transport',
    name: 'Transport',
    types: ['EVENT'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Vous pouvez écarter une carte Action de votre main. Si vous le faites, mettez une carte Action exilée de la réserve sur votre deck.",
    effects: [
        // Exile interaction
    ]
};
