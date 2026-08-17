
import { CardDefinition } from '../../types/CardDefinition.js';

export const Academy: CardDefinition = {
    id: 'academy',
    name: 'Académie',
    types: ['PROJECT'],
    cost: 5,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Quand vous gagnez une carte Action, +1 Villageois.",
    effects: []
};

export const Barracks: CardDefinition = {
    id: 'barracks',
    name: 'Caserne',
    types: ['PROJECT'],
    cost: 6,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre tour : +1 Action.",
    effects: []
};

export const Canal: CardDefinition = {
    id: 'canal',
    name: 'Canal',
    types: ['PROJECT'],
    cost: 7,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Pendant vos tours, les cartes coûtent 1 Pièce de moins (minimum 0).",
    effects: []
};

export const Capitalism: CardDefinition = {
    id: 'capitalism',
    name: 'Capitalisme',
    types: ['PROJECT'],
    cost: 5,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Pendant vos tours, les Actions avec 💰 dans leurs effets sont aussi des Trésors.",
    effects: []
};

export const Citadel: CardDefinition = {
    id: 'citadel',
    name: 'Citadelle',
    types: ['PROJECT'],
    cost: 8,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "La première fois que vous jouez une Action à chaque tour, rejouez-la après.",
    effects: []
};

export const CropRotation: CardDefinition = {
    id: 'crop_rotation',
    name: 'Assolement',
    types: ['PROJECT'],
    cost: 6,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre tour : si vous défaussez une carte Victoire, +2 Cartes.",
    effects: []
};

export const Exploration: CardDefinition = {
    id: 'exploration',
    name: 'Exploration',
    types: ['PROJECT'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "À la fin de votre phase Achat, si vous n'avez pas acheté de cartes : +1 Coffre, +1 Villageois.",
    effects: []
};

export const Fair: CardDefinition = {
    id: 'fair',
    name: 'Foire',
    types: ['PROJECT'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre tour : +1 Achat.",
    effects: []
};

export const Fleet: CardDefinition = {
    id: 'fleet',
    name: 'Flotte',
    types: ['PROJECT'],
    cost: 5,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Après la fin de la partie, il y a un tour de Flotte supplémentaire pour chaque joueur avec ce Projet.",
    effects: []
};

export const Guildhall: CardDefinition = {
    id: 'guildhall',
    name: 'Hôtel des Guildes',
    types: ['PROJECT'],
    cost: 5,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Quand vous gagnez un Trésor, +1 Coffre.",
    effects: []
};

export const Innovation: CardDefinition = {
    id: 'innovation',
    name: 'Innovation',
    types: ['PROJECT'],
    cost: 6,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "La première fois que vous gagnez une Action à chaque tour, vous pouvez la mettre de côté. Si vous le faites, jouez-la.",
    effects: []
};

export const Pageant: CardDefinition = {
    id: 'pageant',
    name: 'Spectacle',
    types: ['PROJECT'],
    cost: 3,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "À la fin de votre phase Achat, vous pouvez payer 1 Or pour +1 Coffre.",
    effects: []
};

export const Piazza: CardDefinition = {
    id: 'piazza',
    name: 'Place Publique',
    types: ['PROJECT'],
    cost: 2,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre tour, révélez la carte du dessus de votre deck. Si c'est une Action, jouez-la.",
    effects: []
};

export const RoadNetwork: CardDefinition = {
    id: 'road_network',
    name: 'Réseau Routier',
    types: ['PROJECT'],
    cost: 5,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Quand un autre joueur gagne une carte Victoire, +1 Carte.",
    effects: []
};

export const Sewers: CardDefinition = {
    id: 'sewers',
    name: 'Égouts',
    types: ['PROJECT'],
    cost: 3,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Quand vous écartez une carte autre que depuis les Égouts, vous pouvez écarter une carte de votre main.",
    effects: []
};

export const Silos: CardDefinition = {
    id: 'silos',
    name: 'Silos',
    types: ['PROJECT'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre tour : défaussez un nombre de Cuivres, piochez ce même montant.",
    effects: []
};

export const SinisterPlot: CardDefinition = {
    id: 'sinister_plot',
    name: 'Complot Sinistre',
    types: ['PROJECT'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre tour : ajoutez un jeton ici, ou retirez vos jetons pour +1 Carte par jeton.",
    effects: []
};

export const StarChart: CardDefinition = {
    id: 'star_chart',
    name: 'Carte des Étoiles',
    types: ['PROJECT'],
    cost: 3,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Quand vous mélangez, vous pouvez prendre une carte de votre défausse et la placer sur votre deck.",
    effects: []
};
