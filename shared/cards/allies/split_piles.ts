import { CardDefinition } from '../../types/CardDefinition.js';

// ============================================================================
// Augurs (Augures)
// ============================================================================

export const herb_gatherer: CardDefinition = {
    id: 'herb_gatherer',
    name: 'Cueilleuse d\'herbes',
    cost: 3,
    types: ['ACTION', 'AUGUR'],
    description: "+1 Achat. Vous pouvez mettre une carte de votre défausse sur votre pioche. Quand vous défaussez cette carte du jeu, vous pouvez écarter un Trésor du jeu. Vous pouvez retourner les Augures.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'TOPDECK_FROM_DISCARD' as any, isOptional: true },
        { type: 'CHOOSE_OPTION', message: 'Retourner les Augures ?', options: [{ label: 'Oui', effects: [{ type: 'ROTATE_PILE', pileId: 'augurs' }] }, { label: 'Non', effects: [] }] }
    ],
    onCleanup: [{ type: 'CHOOSE_OPTION', message: 'Écarter un Trésor du jeu ?', options: [{ label: 'Oui', effects: [{ type: 'TRASH', source: 'playArea', filter: { cardTypes: ['TREASURE'] } }] }, { label: 'Non', effects: [] }] }],
    expansion: 'allies',
    isSubCard: true
};

export const acolyte: CardDefinition = {
    id: 'acolyte',
    name: 'Acolyte',
    cost: 4,
    types: ['ACTION', 'AUGUR'],
    description: "Vous pouvez écarter une Action ou une Victoire de votre main pour en recevoir une coûtant jusqu'à 2 💰 de plus.",
    effects: [
        {
            type: 'SELECT_AND_APPLY', source: 'hand',
            action: 'TRASH' as any,
            filter: { cardTypes: ['ACTION', 'VICTORY'] },
            message: 'Écarter pour recevoir mieux', min: 1, max: 1, next: { type: 'GAIN_RELATIVE_COST' as any, amount: 2 }
        }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const sorceress: CardDefinition = {
    id: 'sorceress',
    name: 'Enchanteresse (Augure)',
    cost: 5,
    types: ['ACTION', 'ATTACK', 'AUGUR'],
    description: "+1 Carte. +1 Action. Nommez une carte. Révélez la carte du haut du deck de chaque autre joueur. S'il s'agit de la carte nommée, il reçoit une Malédiction.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'NAME_CARD' as any, next: { type: 'ATTACK', attackEffects: [{ type: 'SORCERESS_AUGUR_ATTACK' as any }] } }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const sibyl: CardDefinition = {
    id: 'sibyl',
    name: 'Sibylle',
    cost: 6,
    types: ['ACTION', 'AUGUR'],
    description: "+4 Cartes. +1 Action. Mettez une carte de votre main sur votre pioche, et une autre sous votre pioche.",
    effects: [
        { type: 'DRAW', amount: 4 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'TOPDECK_FROM_HAND' as any, amount: 1 },
        { type: 'BOTTOMDECK_FROM_HAND' as any, amount: 1 }
    ],
    expansion: 'allies',
    isSubCard: true
};

// ============================================================================
// Clashes (Combats)
// ============================================================================

export const battle_plan: CardDefinition = {
    id: 'battle_plan',
    name: 'Plan de bataille',
    cost: 3,
    types: ['ACTION', 'CLASH'],
    description: "+1 Carte. +1 Action. Vous pouvez révéler une carte Attaque de votre main pour +1 Carte. Vous pouvez retourner les Combats.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'CHOOSE_OPTION', message: 'Révéler une Attaque pour +1 Carte ?', options: [{ label: 'Oui', effects: [{ type: 'REVEAL_CARDS', amount: 1, source: 'hand', filter: { cardTypes: ['ATTACK'] }, next: [{ type: 'DRAW', amount: 1 }] }] }, { label: 'Non', effects: [] }] },
        { type: 'CHOOSE_OPTION', message: 'Retourner les Combats ?', options: [{ label: 'Oui', effects: [{ type: 'ROTATE_PILE', pileId: 'clashes' }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const archer: CardDefinition = {
    id: 'archer',
    name: 'Archer',
    cost: 4,
    types: ['ACTION', 'ATTACK', 'CLASH'],
    description: "+2 💰. Chaque autre joueur ayant 5 cartes ou plus en main en révèle sa main et en défausse toutes ses Action et ses Trésor.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ATTACK', attackEffects: [{ type: 'ARCHER_ATTACK' as any }] }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const warlord: CardDefinition = {
    id: 'warlord',
    name: 'Seigneur de guerre',
    cost: 5,
    types: ['ACTION', 'DURATION', 'CLASH'],
    description: "+1 Action. Jusqu'à votre prochain tour, les autres joueurs ne peuvent pas jouer d'Action dont ils ont déjà un exemplaire ou plus en jeu.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'WARLORD_EFFECT' as any }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const territory: CardDefinition = {
    id: 'territory',
    name: 'Territoire',
    cost: 6,
    types: ['VICTORY', 'CLASH'],
    description: "Vaut 1 PV par carte Victoire de nom différent que vous possédez. Quand vous recevez cette carte, recevez un Or par pile de la Réserve vide.",
    victoryPoints: 0, // Calculated dynamically
    onGain: [{ type: 'GAIN_GOLD_PER_EMPTY_PILES' as any }],
    expansion: 'allies',
    isSubCard: true
};

// ============================================================================
// Forts (Forts)
// ============================================================================

export const tent: CardDefinition = {
    id: 'tent',
    name: 'Tente',
    cost: 3,
    types: ['ACTION', 'FORT'],
    description: "+2 💰. Vous pouvez retourner les Forts. Quand vous défaussez cette carte du jeu, vous pouvez la mettre sur votre pioche.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'CHOOSE_OPTION', message: 'Retourner les Forts ?', options: [{ label: 'Oui', effects: [{ type: 'ROTATE_PILE', pileId: 'forts' }] }, { label: 'Non', effects: [] }] }
    ],
    onCleanup: [{ type: 'CHOOSE_OPTION', message: 'Mettre la Tente sur votre pioche ?', options: [{ label: 'Oui', effects: [{ type: 'TOPDECK_THIS' as any }] }, { label: 'Non', effects: [] }] }],
    expansion: 'allies',
    isSubCard: true
};

export const garrison: CardDefinition = {
    id: 'garrison',
    name: 'Garnison',
    cost: 4,
    types: ['ACTION', 'DURATION', 'FORT'],
    description: "+2 💰. Ce tour-ci, quand vous recevez une carte, ajoutez un jeton ici. Au début de votre prochain tour, retirez-les pour +1 Carte par jeton.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'REGISTER_TRIGGER' as any, trigger: 'ON_GAIN', effects: [{ type: 'ADD_TOKEN_TO_THIS' as any }] }
    ],
    durationEffects: [{ type: 'DRAW_PER_TOKEN_ON_THIS' as any }],
    expansion: 'allies',
    isSubCard: true
};

export const hill_fort: CardDefinition = {
    id: 'hill_fort',
    name: 'Fort de colline',
    cost: 5,
    types: ['ACTION', 'FORT'],
    description: "Recevez une carte coûtant jusqu'à 4 💰. Choisissez soit : +1 Carte, ou +1 Action et +1 💰.",
    effects: [
        { type: 'GAIN_CARD', maxCost: 4 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus :',
            options: [
                { label: '+1 Carte', effects: [{ type: 'DRAW', amount: 1 }] },
                { label: '+1 Action, +1 💰', effects: [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }] }
            ]
        }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const stronghold: CardDefinition = {
    id: 'stronghold',
    name: 'Forteresse (Fort)',
    cost: 6,
    types: ['ACTION', 'VICTORY', 'DURATION', 'FORT'],
    description: "2 PV. Choisissez soit : +3 💰 ; ou au début de votre prochain tour, +3 Cartes.",
    victoryPoints: 2,
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus :',
            options: [
                { label: '+3 💰', effects: [{ type: 'ADD_MONEY', amount: 3 }] },
                { label: '+3 Cartes au prochain tour', effects: [{ type: 'SCHEDULE_NEXT_TURN' as any, effects: [{ type: 'DRAW', amount: 3 }] }] }
            ]
        }
    ],
    expansion: 'allies',
    isSubCard: true
};

// ============================================================================
// Odysseys (Odyssées)
// ============================================================================

export const old_map: CardDefinition = {
    id: 'old_map',
    name: 'Vieille carte',
    cost: 3,
    types: ['ACTION', 'ODYSSEY'],
    description: "+1 Carte. +1 Action. Défaussez une carte. +1 Carte. Vous pouvez retourner les Odyssées.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD', amount: 1, source: 'hand' },
        { type: 'DRAW', amount: 1 },
        { type: 'CHOOSE_OPTION', message: 'Retourner les Odyssées ?', options: [{ label: 'Oui', effects: [{ type: 'ROTATE_PILE', pileId: 'odysseys' }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const voyage: CardDefinition = {
    id: 'voyage',
    name: 'Voyage',
    cost: 4,
    types: ['ACTION', 'DURATION', 'ODYSSEY'],
    description: "+1 Action. Prenez un tour supplémentaire après celui-ci, durant lequel vous ne pouvez jouer que 3 cartes.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SCHEDULE_EXTRA_TURN' as any, cardLimit: 3 }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const sunken_treasure: CardDefinition = {
    id: 'sunken_treasure',
    name: 'Trésor englouti',
    cost: 5,
    types: ['TREASURE', 'ODYSSEY'],
    treasureValue: 0,
    description: "Recevez une carte Action dont vous n'avez aucun exemplaire en jeu.",
    effects: [
        { type: 'GAIN_CARD_NOT_IN_PLAY' as any, filter: { cardTypes: ['ACTION'] } }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const distant_shore: CardDefinition = {
    id: 'distant_shore',
    name: 'Rive lointaine',
    cost: 6,
    types: ['ACTION', 'VICTORY', 'ODYSSEY'],
    description: "2 PV. +2 Cartes. +1 Action. Recevez un Domaine.",
    victoryPoints: 2,
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'estate' }
    ],
    expansion: 'allies',
    isSubCard: true
};

// ============================================================================
// Townsfolk (Citadins)
// ============================================================================

export const town_crier: CardDefinition = {
    id: 'town_crier',
    name: 'Crieur public',
    cost: 2,
    types: ['ACTION', 'TOWNSFOLK'],
    description: "Choisissez soit : +2 💰 ; ou recevez un Argent ; ou +1 Carte et +1 Action. Vous pouvez retourner les Citadins.",
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus :',
            options: [
                { label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                { label: 'Recevoir un Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }] },
                { label: '+1 Carte, +1 Action', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }] }
            ]
        },
        { type: 'CHOOSE_OPTION', message: 'Retourner les Citadins ?', options: [{ label: 'Oui', effects: [{ type: 'ROTATE_PILE', pileId: 'townsfolk' }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const blacksmith: CardDefinition = {
    id: 'town_blacksmith',
    name: 'Forgeron (Citadin)',
    cost: 3,
    types: ['ACTION', 'TOWNSFOLK'],
    description: "Choisissez soit : Piochez jusqu'à avoir 6 cartes en main ; ou +1 Carte et +1 Action.",
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus :',
            options: [
                { label: 'Piocher jusqu\'à 6', effects: [{ type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 }] },
                { label: '+1 Carte, +1 Action', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }] }
            ]
        }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const miller: CardDefinition = {
    id: 'miller',
    name: 'Meunier',
    cost: 4,
    types: ['ACTION', 'TOWNSFOLK'],
    description: "+1 Action. Regardez les 4 cartes du haut de votre pioche. Ajoutez-en une à votre main et défaussez le reste.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SELECT_FROM_TOPDECK' as any, amount: 4, count: 1, destination: 'hand' }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const elder: CardDefinition = {
    id: 'elder',
    name: 'Ancien',
    cost: 5,
    types: ['ACTION', 'TOWNSFOLK'],
    description: "+2 💰. Vous pouvez jouer une Action de votre main. S'il s'agit d'une carte vous proposant un choix de bonus, vous pouvez en choisir deux (différents) au lieu d'un.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ELDER_EFFECT' as any }
    ],
    expansion: 'allies',
    isSubCard: true
};

// ============================================================================
// Wizards (Sorciers)
// ============================================================================

export const student: CardDefinition = {
    id: 'student',
    name: 'Étudiant',
    cost: 3,
    types: ['ACTION', 'WIZARD', 'LIAISON'],
    description: "+1 Action. Vous pouvez retourner les Sorciers. Écartez une carte de votre main. S'il s'agit d'un Trésor, +1 Faveur et mettez cette carte sur votre pioche.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'CHOOSE_OPTION', message: 'Retourner les Sorciers ?', options: [{ label: 'Oui', effects: [{ type: 'ROTATE_PILE', pileId: 'wizards' }] }, { label: 'Non', effects: [] }] },
        { type: 'STUDENT_EFFECT' as any }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const conjurer: CardDefinition = {
    id: 'conjurer',
    name: 'Illusionniste',
    cost: 4,
    types: ['ACTION', 'DURATION', 'WIZARD'],
    description: "Recevez une carte coûtant jusqu'à 4 💰. Au début de votre prochain tour, mettez cette carte dans votre main.",
    effects: [
        { type: 'GAIN_CARD', maxCost: 4 }
    ],
    durationEffects: [{ type: 'MOVE_THIS_TO_HAND' as any }],
    expansion: 'allies',
    isSubCard: true
};

export const sorcerer_wizard: CardDefinition = {
    id: 'sorcerer_wizard',
    name: 'Sorcier (Sorciers)',
    cost: 5,
    types: ['ACTION', 'ATTACK', 'WIZARD'],
    description: "+1 Carte. +1 Action. Chaque autre joueur nomme une carte, puis révèle la carte du haut de son deck. S'il s'est trompé, il reçoit une Malédiction.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ATTACK', attackEffects: [{ type: 'SORCERER_WIZARD_ATTACK' as any }] }
    ],
    expansion: 'allies',
    isSubCard: true
};

export const lich: CardDefinition = {
    id: 'lich',
    name: 'Liche',
    cost: 6,
    types: ['ACTION', 'WIZARD'],
    description: "+6 Cartes. +2 Actions. Passez votre prochain tour. Quand vous écartez cette carte, défaussez-la et recevez une carte coûtant moins cher de la pile de défausse.",
    effects: [
        { type: 'DRAW', amount: 6 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'SKIP_NEXT_TURN' as any }
    ],
    onTrash: [{ type: 'LICH_TRASH_EFFECT' as any }],
    expansion: 'allies',
    isSubCard: true
};
