import { CardDefinition } from '../../types/CardDefinition.js';

export const abundance: CardDefinition = {
    id: 'abundance',
    name: 'Abondance',
    cost: 5,
    types: ['ACTION'],
    description: "+3 💰. Si toutes les cartes de votre main ont des noms différents, +1 Achat.",
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'ABUNDANCE_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const buried_treasure: CardDefinition = {
    id: 'buried_treasure',
    name: 'Trésor Enfoui',
    cost: 5,
    types: ['TREASURE'],
    treasureValue: 0,
    description: "Quand vous recevez cette carte, vous pouvez la jouer. Si vous le faites, alors quand vous la défaussez du jeu, vous pouvez la mettre sur votre pioche.",
    onGain: [{ type: 'CHOOSE_OPTION', message: 'Jouer le Trésor Enfoui ?', options: [{ label: 'Oui', effects: [{ type: 'PLAY_THIS_CARD' }] }, { label: 'Non', effects: [] }] }],
    onCleanup: [{ type: 'CHOOSE_OPTION', message: 'Mettre sur votre pioche ?', options: [{ label: 'Oui', effects: [{ type: 'TOPDECK_THIS' as any }] }, { label: 'Non', effects: [] }] }],
    expansion: 'plunder'
};

export const cabin_boy: CardDefinition = {
    id: 'cabin_boy',
    name: 'Mousse',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Action. +2 💰. Quand vous recevez cette carte, mettez-la de côté. Au début de votre prochain tour, jouez-la.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 }
    ],
    onGain: [{ type: 'CABIN_BOY_EFFECT' as any }],
    expansion: 'plunder'
};

export const crew: CardDefinition = {
    id: 'crew',
    name: 'Équipage',
    cost: 5,
    types: ['ACTION', 'DURATION'],
    description: "+3 Cartes. À la fin de ce tour, remettez cette carte sur votre pioche.",
    effects: [{ type: 'DRAW', amount: 3 }],
    onCleanup: [{ type: 'TOPDECK_THIS' as any }],
    expansion: 'plunder'
};

export const crucible: CardDefinition = {
    id: 'crucible',
    name: 'Creuset',
    cost: 4,
    types: ['TREASURE'],
    treasureValue: 2,
    description: "2 💰. Quand vous jouez cette carte, vous pouvez écarter une carte de votre main pour +1 Faveur.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'CHOOSE_OPTION', message: 'Écarter une carte pour +1 Faveur ?', options: [{ label: 'Oui', effects: [{ type: 'SELECT_AND_APPLY', source: 'hand', action: 'TRASH' as any, next: { type: 'ADD_FAVORS', amount: 1 } }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'plunder'
};

export const cutthroat: CardDefinition = {
    id: 'cutthroat',
    name: 'Coupe-jarret',
    cost: 5,
    types: ['ACTION', 'DURATION', 'ATTACK'],
    description: "+5 💰. Jusqu'à votre prochain tour, quand chaque autre joueur reçoit une carte coûtant 3 💰 ou plus, il reçoit une Malédiction et vous recevez un Butin. Défaussez cette carte pendant votre phase de nettoyage.",
    effects: [{ type: 'CUTTHROAT_ATTACK' as any }],
    expansion: 'plunder'
};

export const enlarge: CardDefinition = {
    id: 'enlarge',
    name: 'Agrandir',
    cost: 5,
    types: ['ACTION', 'DURATION'],
    description: "Au début de votre prochain tour, écartez une carte de votre main pour en recevoir une coûtant jusqu'à 2 💰 de plus.",
    durationEffects: [{ type: 'SELECT_AND_APPLY', source: 'hand', action: 'TRASH' as any, next: { type: 'GAIN_RELATIVE_COST' as any, amount: 2 } }],
    expansion: 'plunder'
};

export const figurine: CardDefinition = {
    id: 'figurine',
    name: 'Figurine',
    cost: 4,
    types: ['TREASURE'],
    treasureValue: 2,
    description: "2 💰. Quand vous recevez cette carte, +1 Action.",
    effects: [{ type: 'ADD_MONEY', amount: 2 }],
    onGain: [{ type: 'ADD_ACTIONS', amount: 1 }],
    expansion: 'plunder'
};

export const first_mate: CardDefinition = {
    id: 'first_mate',
    name: 'Maître d\'équipage',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Action. Vous pouvez jouer n'importe quel nombre de cartes Action de votre main coûtant jusqu'à 3 💰.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'FIRST_MATE_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const flagship: CardDefinition = {
    id: 'flagship',
    name: 'Vaisseau Amiral',
    cost: 5,
    types: ['ACTION', 'DURATION'],
    description: "+2 Actions. La prochaine fois que vous jouez une carte Action ce tour-ci ou à votre prochain tour, rejouez-la.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'FLAGSHIP_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const fortune_hunter: CardDefinition = {
    id: 'fortune_hunter',
    name: 'Chasseur de Fortune',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Achat. +2 💰. Regardez les 3 cartes du haut de votre pioche. Vous pouvez en écarter une. Remettez le reste sur votre pioche dans l'ordre de votre choix.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'FORTUNE_HUNTER_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const frigate: CardDefinition = {
    id: 'frigate',
    name: 'Frégate',
    cost: 5,
    types: ['ACTION', 'DURATION', 'ATTACK'],
    description: "+2 💰. Jusqu'à votre prochain tour, après qu'un autre joueur a joué une Action à son tour, s'il a au moins 4 cartes en main, il défausse jusqu'à n'en avoir que 3.",
    effects: [{ type: 'FRIGATE_ATTACK' as any }],
    expansion: 'plunder'
};

export const gondola: CardDefinition = {
    id: 'gondola',
    name: 'Gondole',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Action. Quand vous recevez cette carte, vous pouvez jouer une Action de votre main.",
    effects: [{ type: 'ADD_ACTIONS', amount: 1 }],
    onGain: [{ type: 'CHOOSE_OPTION', message: 'Jouer une Action de votre main ?', options: [{ label: 'Oui', effects: [{ type: 'PLAY_TARGET' as any, filter: { cardTypes: ['ACTION'] } }] }, { label: 'Non', effects: [] }] }],
    expansion: 'plunder'
};

export const grotto: CardDefinition = {
    id: 'grotto',
    name: 'Grotte',
    cost: 2,
    types: ['ACTION', 'DURATION'],
    description: "+1 Action. Mettez de côté jusqu'à 3 cartes de votre main. Au début de votre prochain tour, défaussez ces cartes et +1 Carte pour chacune.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', min: 0, max: 3, destination: 'aside', message: 'Mettre de côté pour le prochain tour' }
    ],
    durationEffects: [
        { type: 'DISCARD', source: 'aside', forceAll: true, drawAfter: true }
    ],
    expansion: 'plunder'
};

export const harbor_village: CardDefinition = {
    id: 'harbor_village',
    name: 'Village de Port',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Carte. +1 Action. La première fois que vous recevez +💰 d'un effet ce tour-ci, +1 Action.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'HARBOR_VILLAGE_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const jewelled_egg: CardDefinition = {
    id: 'jewelled_egg',
    name: 'Œuf Bijou',
    cost: 2,
    types: ['TREASURE'],
    treasureValue: 0,
    description: "Quand vous écartez cette carte, recevez un Butin.",
    onTrash: [{ type: 'GAIN_LOOT' as any }],
    expansion: 'plunder'
};

export const kings_cache: CardDefinition = {
    id: 'kings_cache',
    name: 'Cache Royale',
    cost: 7,
    types: ['ACTION'],
    description: "Jouez une carte Trésor de votre main 3 fois.",
    effects: [{ type: 'PLAY_ACTION_THRICE', context: 'treasure' } as any],
    expansion: 'plunder'
};

export const landing_party: CardDefinition = {
    id: 'landing_party',
    name: 'Détachement',
    cost: 4,
    types: ['ACTION', 'DURATION'],
    description: "+2 Cartes. +1 Action. Quand vous défaussez cette carte du jeu, si aucune pile de la Réserve n'est vide, vous pouvez la mettre sur votre pioche.",
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    onCleanup: [{ type: 'CONDITION', condition: 'IF_EMPTY_PILES' as any, value: 0, trueEffects: [{ type: 'TOPDECK_THIS' as any }], falseEffects: [] }],
    expansion: 'plunder'
};

export const longship: CardDefinition = {
    id: 'longship',
    name: 'Drakkar',
    cost: 4,
    types: ['ACTION', 'DURATION'],
    description: "+1 Achat. Jusqu'à votre prochain tour, les autres joueurs ne peuvent pas jouer d'Actions coûtant 4 💰 ou plus.",
    effects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'LONGSHIP_EFFECT' as any }],
    expansion: 'plunder'
};

export const mapmaker: CardDefinition = {
    id: 'mapmaker',
    name: 'Cartographe',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Carte. +1 Action. Regardez les 4 cartes du haut de votre pioche. Défaussez-en n'importe quel nombre et remettez le reste sur votre pioche dans l'ordre de votre choix. Si vous avez défaussé au moins une Action, +1 Achat.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'MAPMAKER_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const maroon: CardDefinition = {
    id: 'maroon',
    name: 'Abandonner',
    cost: 4,
    types: ['ACTION'],
    description: "Écartez une carte de votre main pour +1 💰 et +1 Action par 💰 de son coût.",
    effects: [{ type: 'MAROON_EFFECT' as any }],
    expansion: 'plunder'
};

export const mining_road: CardDefinition = {
    id: 'mining_road',
    name: 'Route Minière',
    cost: 4,
    types: ['ACTION'],
    description: "+2 Actions. Vous pouvez jouer un Trésor de votre main. Quand vous recevez cette carte, vous pouvez en recevoir une autre coûtant jusqu'à 4 💰.",
    effects: [{ type: 'ADD_ACTIONS', amount: 2 }, { type: 'PLAY_TARGET' as any, filter: { cardTypes: ['TREASURE'] }, optional: true }],
    onGain: [{ type: 'GAIN_CARD', maxCost: 4 }],
    expansion: 'plunder'
};

export const pendant: CardDefinition = {
    id: 'pendant',
    name: 'Pendentif',
    cost: 5,
    types: ['TREASURE'],
    treasureValue: 0,
    description: "💰 par carte Action que vous avez en jeu possédant un nom différent de celles déjà comptées.",
    effects: [{ type: 'PENDANT_EFFECT' as any }],
    expansion: 'plunder'
};

export const pickaxe: CardDefinition = {
    id: 'pickaxe',
    name: 'Pioche',
    cost: 4,
    types: ['TREASURE'],
    treasureValue: 1,
    description: "1 💰. Quand vous jouez cette carte, vous pouvez écarter un Trésor de votre main pour en recevoir un coûtant jusqu'à 3 💰 de plus.",
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'CHOOSE_OPTION', message: 'Écarter un Trésor pour en recevoir un nouveau ?', options: [{ label: 'Oui', effects: [{ type: 'SELECT_AND_APPLY', source: 'hand', filter: { cardTypes: ['TREASURE'] }, action: 'TRASH' as any, next: { type: 'GAIN_RELATIVE_COST' as any, amount: 3, cardTypes: ['TREASURE'] } }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'plunder'
};

export const pilgrim: CardDefinition = {
    id: 'pilgrim',
    name: 'Pèlerin',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Action. Recevez une Action coûtant jusqu'à 4 💰 de la Réserve. Si vous avez déjà un exemplaire de cette carte en jeu, mettez-la dans votre main.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'PILGRIM_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const quartermaster: CardDefinition = {
    id: 'quartermaster',
    name: 'Quartier-Maître',
    cost: 5,
    types: ['ACTION', 'DURATION'],
    description: "Au début de chacun de vos prochains tours, recevez une Action ou un Trésor coûtant jusqu'à 4 💰 de la Réserve.",
    durationEffects: [{ type: 'GAIN_CARD', maxCost: 4, cardTypes: ['ACTION', 'TREASURE'] }],
    isPermanentDuration: true,
    expansion: 'plunder'
};

export const rope: CardDefinition = {
    id: 'rope',
    name: 'Corde',
    cost: 3,
    types: ['TREASURE', 'DURATION'],
    treasureValue: 1,
    description: "1 💰. +1 Achat. Au début de votre prochain tour, +1 Carte.",
    effects: [{ type: 'ADD_MONEY', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }],
    durationEffects: [{ type: 'DRAW', amount: 1 }],
    expansion: 'plunder'
};

export const sack_of_loot: CardDefinition = {
    id: 'sack_of_loot',
    name: 'Sac de Butin',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Achat. Recevez un Butin.",
    effects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'GAIN_LOOT' as any }],
    expansion: 'plunder'
};

export const search: CardDefinition = {
    id: 'search',
    name: 'Recherche',
    cost: 3,
    types: ['ACTION'],
    description: "+1 Action. Regardez les 4 cartes du haut de votre pioche. Mettez-en une sur votre pioche, une dans votre main, une dans votre défausse et écartez la dernière.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SEARCH_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const secluded_shrine: CardDefinition = {
    id: 'secluded_shrine',
    name: 'Sanctuaire Isolé',
    cost: 3,
    types: ['ACTION'],
    description: "+2 Actions. Vous pouvez écarter jusqu'à 2 cartes de votre main. Si vous le faites, +1 💰 par carte écartée.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'SELECT_AND_APPLY', source: 'hand', max: 2, action: 'TRASH' as any, next: { type: 'ADD_MONEY', amount: 1 } }
    ],
    expansion: 'plunder'
};

export const shaman: CardDefinition = {
    id: 'shaman',
    name: 'Chamane',
    cost: 2,
    types: ['ACTION'],
    description: "+1 Action. +1 💰. Vous pouvez écarter une carte de votre main. (Mise en place : chaque joueur écarte un Domaine. Au début de votre tour, vous pouvez gagner une carte du rebut coûtant jusqu'à 1 💰).",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'SELECT_AND_APPLY', source: 'hand', min: 0, max: 1, action: 'TRASH' as any },
        { type: 'SHAMAN_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const silver_mine: CardDefinition = {
    id: 'silver_mine',
    name: 'Mine d\'Argent',
    cost: 5,
    types: ['TREASURE'],
    treasureValue: 2,
    description: "2 💰. Quand vous recevez cette carte, recevez un Argent.",
    effects: [{ type: 'ADD_MONEY', amount: 2 }],
    onGain: [{ type: 'GAIN_CARD', cardId: 'silver' }],
    expansion: 'plunder'
};

export const siren: CardDefinition = {
    id: 'siren',
    name: 'Sirène',
    cost: 3,
    types: ['ACTION', 'ATTACK'],
    description: "+1 Action. Révélez les 4 cartes du haut de votre pioche. Prenez les Actions en main et défaussez le reste. Quand vous recevez cette carte, vous pouvez en écarter une de votre main.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_CARDS', amount: 4, source: 'deck', next: [{ type: 'CHOOSE_FROM_REVEALED', min: 0, max: 4, destination: 'hand', filter: { cardTypes: ['ACTION'] } } as any] }
    ],
    onGain: [{ type: 'SELECT_AND_APPLY', source: 'hand', max: 1, action: 'TRASH' as any }],
    expansion: 'plunder'
};

export const stowaway: CardDefinition = {
    id: 'stowaway',
    name: 'Passager Clandestin',
    cost: 3,
    types: ['ACTION'],
    description: "+1 Action. +2 Cartes. Si c'est la première fois que vous jouez cette carte ce tour-ci, défaussez une carte.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DRAW', amount: 2 },
        { type: 'CONDITION', condition: 'FIRST_TIME_PLAYED_THIS_TURN' as any, trueEffects: [{ type: 'DISCARD', amount: 1 }], falseEffects: [] }
    ],
    expansion: 'plunder'
};

export const swamp_shacks: CardDefinition = {
    id: 'swamp_shacks',
    name: 'Cabanes du Marais',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Carte. +1 Action. +1 💰 par 3 cartes que vous avez en jeu.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: { type: 'DIVIDE', amount: { type: 'COUNT_CARDS_IN_PLAY' }, divisor: 3 } as any }
    ],
    expansion: 'plunder'
};

export const taskmaster: CardDefinition = {
    id: 'taskmaster',
    name: 'Contremaître',
    cost: 4,
    types: ['ACTION', 'DURATION'],
    description: "+1 Carte. +1 Action. Au début de votre prochain tour, si vous avez reçu une carte coûtant exactement 5 💰 ce tour-ci, +1 Action et +1 💰.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    durationEffects: [{ type: 'TASKMASTER_EFFECT' as any }],
    expansion: 'plunder'
};

export const tools: CardDefinition = {
    id: 'tools',
    name: 'Outils',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Action. Recevez une carte Action coûtant jusqu'à 4 💰 de la Réserve. Si vous avez déjà un exemplaire de cette carte en jeu, mettez-la sur votre pioche.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'TOOLS_EFFECT' as any }
    ],
    expansion: 'plunder'
};

export const trickster: CardDefinition = {
    id: 'trickster',
    name: 'Farceur',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    description: "+2 Actions. Chaque autre joueur écarte la carte du haut de son deck. S'il s'agit d'une carte coûtant 3 💰 ou plus, il reçoit une copie ; sinon, il reçoit une Malédiction.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'TRICKSTER_ATTACK' as any }
    ],
    expansion: 'plunder'
};

export const wealthy_village: CardDefinition = {
    id: 'wealthy_village',
    name: 'Village Opulent',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Carte. +2 Actions. +1 💰 pour chaque Trésor que vous avez en jeu.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'ADD_MONEY', amount: { type: 'COUNT_CARDS_IN_PLAY', filter: { types: ['TREASURE'] } } as any }
    ],
    expansion: 'plunder'
};
