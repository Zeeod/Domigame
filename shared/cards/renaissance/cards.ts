
import { CardDefinition } from '../../types/CardDefinition.js';

export const BorderGuard: CardDefinition = {
    id: 'border_guard',
    name: 'Garde-Frontière',
    types: ['ACTION'],
    cost: 2,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "+1 Action. Révélez les 2 cartes du dessus de votre deck. Mettez-en une dans votre main et défaussez l'autre. Si vous avez les deux : soit 1 Lanterne, soit 1 Cor.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        // Logic for reveal/choose/artifact
    ]
};

export const CargoShip: CardDefinition = {
    id: 'cargo_ship',
    name: 'Navire Marchand',
    types: ['ACTION', 'DURATION'],
    cost: 3,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "+2 Pièces. Une fois durant ce tour, quand vous gagnez une carte, vous pouvez la mettre de côté face visible (sur cette carte). Au début de votre prochain tour, mettez la carte mise de côté dans votre main.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
        // Effect logic
    ],
    durationTurns: 1
};

export const Hideout: CardDefinition = {
    id: 'hideout',
    name: 'Cachette',
    types: ['ACTION'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "+1 Carte, +2 Actions. Écartez une carte de votre main. Si c'est une carte Victoire, gagnez une Malédiction.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        // Trash logic
    ]
};

export const Improve: CardDefinition = {
    id: 'improve',
    name: 'Amélioration',
    types: ['ACTION'],
    cost: 3,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "+2 Pièces. Au début de votre phase de nettoyage, vous pouvez écarter cette carte. Si vous le faites, gagnez une carte Action coûtant exactement 1 Pièce de plus.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        // Cleanup trigger
    ]
};

export const Inventor: CardDefinition = {
    id: 'inventor',
    name: 'Inventeur',
    types: ['ACTION'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Gagnez une carte coûtant jusqu'à 4 Pièces. Les cartes coûtent 1 Pièce de moins ce tour-ci (limité à 0).",
    effects: [
        {
            type: 'GAIN_CARD_FROM_SUPPLY',
            maxCost: 4,
            allowedTypes: ['ACTION', 'TREASURE', 'VICTORY'],
            destination: 'discardPile'
        },
        { type: 'ADD_COST_REDUCTION', amount: 1 }
    ]
};

export const Priest: CardDefinition = {
    id: 'priest',
    name: 'Prêtre',
    types: ['ACTION'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "+2 Pièces. Écartez une carte de votre main. Pour le reste de ce tour, quand vous écartez une carte, +2 Pièces.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        // Trash + global effect
    ]
};

export const Research: CardDefinition = {
    id: 'research',
    name: 'Recherche',
    types: ['ACTION', 'DURATION'],
    cost: 4,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "+1 Action. Écartez une carte de votre main. Par pièce qu'elle coûte, mettez de côté une carte de votre deck face cachée. Au début de votre prochain tour, mettez ces cartes dans votre main.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        // Trash + duration logic
    ],
    durationTurns: 1
};

export const Scepter: CardDefinition = {
    id: 'scepter',
    name: 'Sceptre',
    types: ['TREASURE'],
    cost: 5,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Quand vous jouez cette carte, choisissez : +2 Pièces ; ou rejouez une carte Action jouée à ce tour qui est encore en jeu.",
    treasureValue: 0, // Special choice
    effects: [
        // Choice
    ]
};

export const Sculptor: CardDefinition = {
    id: 'sculptor',
    name: 'Sculpteur',
    types: ['ACTION'],
    cost: 5,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Gagnez une carte coûtant jusqu'à 4 Pièces dans votre main. Si c'est un Trésor, +1 Villageois.",
    effects: [
        // Gain logic + condition
    ]
};
