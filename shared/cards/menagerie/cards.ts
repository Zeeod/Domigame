
import { CardDefinition } from '../../types/CardDefinition.js';

export const AnimalFair: CardDefinition = {
    id: 'animal_fair',
    name: 'Foire aux Animaux',
    types: ['ACTION'],
    cost: 7,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+4 Pièces. +1 Achat par pile de réserve vide.",
    effects: [
        { type: 'ADD_MONEY', amount: 4 },
        { type: 'ADD_BUYS_PER_EMPTY_PILES' as any }
    ]
};

export const Barge: CardDefinition = {
    id: 'barge',
    name: 'Péniche',
    types: ['ACTION', 'DURATION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Soit maintenant, soit au début de votre prochain tour : +3 Cartes et +1 Achat.",
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Quand recevoir le bonus ?',
            options: [
                { label: 'Maintenant', effects: [{ type: 'DRAW', amount: 3 }, { type: 'ADD_BUYS', amount: 1 }] },
                { label: 'Prochain tour', effects: [] }
            ]
        }
    ],
    durationTurns: 1,
    durationEffects: [
        { type: 'DRAW', amount: 3 },
        { type: 'ADD_BUYS', amount: 1 }
    ]
};

export const BlackCat: CardDefinition = {
    id: 'black_cat',
    name: 'Chat Noir',
    types: ['ACTION', 'ATTACK', 'REACTION'],
    cost: 2,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+2 Cartes. Si c'est le tour d'un autre joueur, chaque autre joueur reçoit une Malédiction.",
    effects: [
        { type: 'DRAW', amount: 2 },
        {
            type: 'CONDITION',
            condition: 'IS_OTHER_PLAYERS_TURN' as any,
            trueEffects: [
                {
                    type: 'ATTACK',
                    attackEffects: [
                        { type: 'GAIN_CARD', cardId: 'curse' }
                    ]
                }
            ],
            falseEffects: []
        }
    ],
    isReaction: true,
    reactionTrigger: 'GAIN'
};

export const BountyHunter: CardDefinition = {
    id: 'bounty_hunter',
    name: 'Chasseur de Primes',
    types: ['ACTION'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Action. Exilez une carte de votre main. Si vous n'aviez pas de copie de cette carte en Exil : +3 Pièces.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            destination: 'exile',
            message: 'Exilez une carte de votre main',
            min: 1, max: 1,
            onSuccess: [
                {
                    type: 'CONDITION',
                    condition: 'EXILE_NEW_CARD' as any,
                    trueEffects: [{ type: 'ADD_MONEY', amount: 3 }],
                    falseEffects: []
                }
            ]
        } as any
    ]
};

export const CamelTrain: CardDefinition = {
    id: 'camel_train',
    name: 'Train de Chameaux',
    types: ['ACTION'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Exilez une carte non-Victoire de la Réserve.",
    effects: [
        {
            type: 'GAIN_CARD',
            destination: 'exile',
            filter: { notTypes: ['VICTORY'] },
            maxCost: 99,
            message: 'Exilez une carte non-Victoire de la Réserve'
        } as any
    ]
};

export const Cardinal: CardDefinition = {
    id: 'cardinal',
    name: 'Cardinal',
    types: ['ACTION', 'ATTACK'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+2 Pièces. Chaque autre joueur révèle les 2 cartes du dessus de son deck, en exile une coûtant 3-6 Pièces et défausse le reste.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'REVEAL_CARDS',
                    amount: 2,
                    source: 'deck',
                    destination: 'limbo'
                },
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'limbo',
                    destination: 'exile',
                    max: 1,
                    optional: true,
                    filter: { minCost: 3, maxCost: 6 },
                    message: 'Exilez une carte coûtant 3-6 Pièces'
                },
                {
                    type: 'MOVE_CARDS',
                    source: 'limbo',
                    destination: 'discardPile',
                    count: 'ALL'
                }
            ]
        }
    ]
};

export const Cavalry: CardDefinition = {
    id: 'cavalry',
    name: 'Cavalerie',
    types: ['ACTION'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez 2 Chevaux.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'horse' },
        { type: 'GAIN_CARD', cardId: 'horse' }
    ]
};

export const Coven: CardDefinition = {
    id: 'coven',
    name: 'Assemblée',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Action, +2 Pièces. Chaque autre joueur exile une Malédiction de la Réserve. S'il ne peut pas, il défausse ses Malédictions exilées.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'EXILE_CURSE' as any }
            ]
        }
    ]
};

export const Destrier: CardDefinition = {
    id: 'destrier',
    name: 'Destrier',
    types: ['ACTION'],
    cost: 6,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+2 Cartes, +1 Action. Coûte 1 Pièce de moins par carte gagnée ce tour-ci.",
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    costModifier: 'DESTRIER' as any
};

export const Displace: CardDefinition = {
    id: 'displace',
    name: 'Déplacer',
    types: ['ACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Exilez une carte de votre main. Gagnez une carte de nom différent coûtant jusqu'à 2 Pièces de plus.",
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            destination: 'exile',
            message: 'Exilez une carte de votre main',
            min: 1, max: 1,
            onSuccess: [
                { type: 'GAIN_RELATIVE_COST' as any, amount: 2, excludeSameName: true }
            ]
        } as any
    ]
};

export const Falconer: CardDefinition = {
    id: 'falconer',
    name: 'Fauconnier',
    types: ['ACTION', 'REACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez une carte coûtant moins que celle-ci, ayant au moins un type parmi Action, Trésor, Victoire.",
    effects: [
        { type: 'GAIN_CARD', maxCost: 4, message: 'Gagnez une carte coûtant moins que Fauconnier' }
    ],
    isReaction: true,
    reactionTrigger: 'GAIN'
};

export const Fisherman: CardDefinition = {
    id: 'fisherman',
    name: 'Pêcheur',
    types: ['ACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Carte, +1 Action, +1 Pièce. Coûte 3 Pièces de moins si votre défausse est vide.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    costModifier: 'FISHERMAN' as any
};

export const Gatekeeper: CardDefinition = {
    id: 'gatekeeper',
    name: 'Portier',
    types: ['ACTION', 'DURATION', 'ATTACK'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Au début de votre prochain tour : +3 Pièces. Jusqu'alors, quand un autre joueur gagne une carte Action ou Trésor, il l'exile.",
    effects: [],
    durationTurns: 1,
    durationEffects: [
        { type: 'ADD_MONEY', amount: 3 }
    ]
};

export const Goatherd: CardDefinition = {
    id: 'goatherd',
    name: 'Chevrier',
    types: ['ACTION'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Action. Vous pouvez écarter une carte de votre main. +1 Carte par carte que le joueur à votre droite a écartée ce tour-ci.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Vous pouvez écarter une carte' },
        { type: 'DRAW_PER_OPPONENT_TRASH' as any }
    ]
};

export const Groom: CardDefinition = {
    id: 'groom',
    name: 'Palefrenier',
    types: ['ACTION'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez une carte coûtant jusqu'à 4 Pièces. Si c'est une Action, gagnez un Cheval. Si c'est un Trésor, gagnez un Argent. Si c'est une Victoire, +1 Carte et +1 Action.",
    effects: [
        { type: 'GAIN_CARD', maxCost: 4, message: "Gagnez une carte coûtant jusqu'à 4 Pièces" },
        { type: 'GROOM_BONUS' as any }
    ]
};

export const Hostelry: CardDefinition = {
    id: 'hostelry',
    name: 'Hôtellerie',
    types: ['ACTION'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Carte, +2 Actions. Quand vous gagnez cette carte, vous pouvez défausser des Trésors pour gagner autant de Chevaux.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    onGain: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'playArea',
            destination: 'discardPile',
            filter: { cardTypes: ['TREASURE'] },
            message: "Défaussez des Trésors pour gagner autant de Chevaux",
            optional: true,
            min: 0,
            max: 50,
            onSuccess: [
                { type: 'GAIN_HORSE_PER_DISCARDED' as any }
            ]
        } as any
    ]
};

export const HuntingLodge: CardDefinition = {
    id: 'hunting_lodge',
    name: 'Pavillon de Chasse',
    types: ['ACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Carte, +2 Actions. Vous pouvez défausser votre main pour +5 Cartes.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Défausser votre main pour +5 Cartes ?',
            options: [
                { label: 'Oui', effects: [{ type: 'DISCARD_HAND' as any }, { type: 'DRAW', amount: 5 }] },
                { label: 'Non', effects: [] }
            ]
        }
    ]
};

export const Kiln: CardDefinition = {
    id: 'kiln',
    name: 'Four',
    types: ['ACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+2 Pièces. La prochaine fois que vous jouez une carte ce tour-ci, vous pouvez d'abord gagner une copie de celle-ci.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_PLAY' as any, once: true, effects: [{ type: 'KILN_COPY' as any }] }
    ]
};

export const Livery: CardDefinition = {
    id: 'livery',
    name: 'Livrée',
    types: ['ACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+3 Pièces. Ce tour-ci, quand vous gagnez une carte coûtant 4 Pièces ou plus, gagnez un Cheval.",
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', filter: { minCost: 4 }, effects: [{ type: 'GAIN_CARD', cardId: 'horse' }] }
    ]
};

export const Mastermind: CardDefinition = {
    id: 'mastermind',
    name: 'Cerveau',
    types: ['ACTION', 'DURATION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Au début de votre prochain tour, vous pouvez jouer une carte Action de votre main trois fois.",
    effects: [],
    durationTurns: 1,
    durationEffects: [
        { type: 'PLAY_ACTION_FROM_HAND' as any, times: 3 }
    ]
};

export const Paddock: CardDefinition = {
    id: 'paddock',
    name: 'Paddock',
    types: ['ACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+2 Pièces. Gagnez 2 Chevaux. +1 Action par pile de réserve vide.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'GAIN_CARD', cardId: 'horse' },
        { type: 'GAIN_CARD', cardId: 'horse' },
        { type: 'ADD_ACTIONS_PER_EMPTY_PILES' as any }
    ]
};

export const Sanctuary: CardDefinition = {
    id: 'sanctuary',
    name: 'Sanctuaire',
    types: ['ACTION'],
    cost: 5,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Carte, +1 Action, +1 Achat. Vous pouvez exiler une carte de votre main.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            destination: 'exile',
            message: 'Vous pouvez exiler une carte',
            optional: true,
            min: 0, max: 1
        } as any
    ]
};

export const Scrap: CardDefinition = {
    id: 'scrap',
    name: 'Ferraille',
    types: ['ACTION'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Écartez une carte de votre main. Choisissez un nombre de bonus (parmi +1 Carte, +1 Action, +1 Achat, +1 Pièce, gagner un Argent, gagner un Cheval) égal au coût de la carte écartée.",
    effects: [
        { type: 'SCRAP_EFFECT' as any }
    ]
};

export const Sheepdog: CardDefinition = {
    id: 'sheepdog',
    name: 'Chien de Berger',
    types: ['ACTION', 'REACTION'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+2 Cartes. Réaction : quand vous gagnez une carte, vous pouvez jouer cette carte de votre main.",
    effects: [
        { type: 'DRAW', amount: 2 }
    ],
    isReaction: true,
    reactionTrigger: 'GAIN'
};

export const Sleigh: CardDefinition = {
    id: 'sleigh',
    name: 'Traîneau',
    types: ['ACTION', 'REACTION'],
    cost: 2,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Gagnez 2 Chevaux. Réaction : quand vous gagnez une carte, vous pouvez défausser celle-ci pour mettre la carte gagnée dans votre main ou sur votre deck.",
    effects: [
        { type: 'GAIN_CARD', cardId: 'horse' },
        { type: 'GAIN_CARD', cardId: 'horse' }
    ],
    isReaction: true,
    reactionTrigger: 'GAIN'
};

export const SnowyVillage: CardDefinition = {
    id: 'snowy_village',
    name: 'Village Enneigé',
    types: ['ACTION'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+1 Carte, +4 Actions, +1 Achat. Ignorez toute Action supplémentaire ce tour-ci.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 4 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'IGNORE_EXTRA_ACTIONS' as any }
    ]
};

export const Stockpile: CardDefinition = {
    id: 'stockpile',
    name: 'Stocks',
    types: ['TREASURE'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "3 Pièces, +1 Achat. Quand vous jouez cette carte, exilez-la.",
    treasureValue: 3,
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'EXILE_SELF' as any }
    ]
};

export const Supplies: CardDefinition = {
    id: 'supplies',
    name: 'Fournitures',
    types: ['TREASURE'],
    cost: 2,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "1 Pièce. Quand vous jouez cette carte, gagnez un Cheval sur votre deck.",
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'horse', destination: 'deck' }
    ]
};

export const VillageGreen: CardDefinition = {
    id: 'village_green',
    name: 'Vert Village',
    types: ['ACTION', 'DURATION', 'REACTION'],
    cost: 4,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "Soit maintenant, soit au début de votre prochain tour : +1 Carte et +2 Actions. Réaction : quand vous défaussez cette carte hors Cleanup, vous pouvez la jouer.",
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Quand recevoir le bonus ?',
            options: [
                { label: 'Maintenant', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }] },
                { label: 'Prochain tour', effects: [] }
            ]
        }
    ],
    durationTurns: 1,
    durationEffects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    isReaction: true,
    reactionTrigger: 'DISCARD' as any
};

export const Wayfarer: CardDefinition = {
    id: 'wayfarer',
    name: 'Voyageur',
    types: ['ACTION'],
    cost: 6,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+3 Cartes. Vous pouvez gagner un Argent. Coûte autant que la dernière carte gagnée ce tour-ci.",
    effects: [
        { type: 'DRAW', amount: 3 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Gagner un Argent ?',
            options: [
                { label: 'Oui', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }] },
                { label: 'Non', effects: [] }
            ]
        }
    ],
    costModifier: 'WAYFARER' as any
};
