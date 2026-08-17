import { CardDefinition } from '../../types/CardDefinition.js';

export const amass: CardDefinition = {
    id: 'amass',
    name: 'Amasser',
    cost: 2,
    types: ['EVENT'],
    description: "Si vous n'avez pas de cartes Action en jeu, recevez une Action coûtant jusqu'à 5 💰.",
    expansion: 'rising_sun'
};

export const asceticism: CardDefinition = {
    id: 'asceticism',
    name: 'Ascétisme',
    cost: 2,
    types: ['EVENT'],
    description: "Payez n'importe quel montant de 💰 pour écarter autant de cartes de votre main.",
    expansion: 'rising_sun'
};

export const continue_event: CardDefinition = {
    id: 'continue',
    name: 'Continuer',
    cost: 8,
    types: ['EVENT'],
    description: "Une fois par tour : Recevez une Action non-Attaque coûtant jusqu'à 4 💰. Revenez à votre phase d'Action et +1 Action et +1 Achat.",
    expansion: 'rising_sun'
};

export const credit: CardDefinition = {
    id: 'credit',
    name: 'Crédit',
    cost: 2,
    types: ['EVENT'],
    description: "Recevez une Action ou un Trésor coûtant jusqu'à 8 💰. +1 Dette égale à son coût.",
    expansion: 'rising_sun'
};

export const foresight: CardDefinition = {
    id: 'foresight',
    name: 'Prévoyance',
    cost: 2,
    types: ['EVENT'],
    description: "Révélez les cartes de votre pioche jusqu'à révéler une Action. Mettez-la de côté et défaussez le reste. Mettez-la dans votre main à la fin de votre tour.",
    expansion: 'rising_sun'
};

export const gather: CardDefinition = {
    id: 'gather',
    name: 'Rassembler',
    cost: 7,
    types: ['EVENT'],
    description: "Recevez une carte coûtant exactement 3 💰, une coûtant exactement 4 💰 et une coûtant exactement 5 💰.",
    expansion: 'rising_sun'
};

export const kintsugi: CardDefinition = {
    id: 'kintsugi',
    name: 'Kintsugi',
    cost: 3,
    types: ['EVENT'],
    description: "Écartez une carte de votre main. Si vous avez reçu un Or, recevez une carte coûtant jusqu'à 2 💰 de plus que celle écartée.",
    expansion: 'rising_sun'
};

export const practice: CardDefinition = {
    id: 'practice',
    name: 'Entraînement',
    cost: 3,
    types: ['EVENT'],
    description: "Vous pouvez jouer une Action de votre main deux fois.",
    expansion: 'rising_sun'
};

export const receive_tribute: CardDefinition = {
    id: 'receive_tribute',
    name: 'Recevoir le Tribut',
    cost: 5,
    types: ['EVENT'],
    description: "Si vous avez reçu au moins 3 cartes ce tour-ci, recevez jusqu'à 3 Actions de noms différents dont vous n'avez pas d'exemplaire en jeu.",
    expansion: 'rising_sun'
};

export const sea_trade: CardDefinition = {
    id: 'sea_trade',
    name: 'Commerce Maritime',
    cost: 4,
    types: ['EVENT'],
    description: "+1 Carte par carte Action que vous avez en jeu. Écartez jusqu'à autant de cartes de votre main.",
    expansion: 'rising_sun'
};
