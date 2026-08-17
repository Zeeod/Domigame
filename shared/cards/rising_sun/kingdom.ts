import { CardDefinition } from '../../types/CardDefinition.js';

export const alley: CardDefinition = {
    id: 'alley',
    name: 'Allée',
    cost: 4,
    types: ['ACTION', 'SHADOW'],
    description: "+1 Carte. +1 Action. Défaussez une carte. Vous pouvez jouer cette carte quand vous piochez une carte.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD', amount: 1 }
    ],
    expansion: 'rising_sun'
};

export const aristocrat: CardDefinition = {
    id: 'aristocrat',
    name: 'Aristocrate',
    cost: 4,
    types: ['ACTION', 'SHADOW'],
    description: "Si vous avez 1 ou 5 Aristocrates en jeu : +3 Actions. 2 ou 6 : +3 Cartes. 3 ou 7 : +3 Achats. 4 ou 8 : +3 Actions. Vous pouvez jouer cette carte quand vous piochez une carte.",
    effects: [{ type: 'ARISTOCRAT_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const artist: CardDefinition = {
    id: 'artist',
    name: 'Artiste',
    cost: 8,
    types: ['ACTION'],
    description: "+1 Action. +1 Carte pour chaque carte dont vous avez exactement un exemplaire en jeu.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ARTIST_EFFECT' as any }
    ],
    expansion: 'rising_sun'
};

export const change: CardDefinition = {
    id: 'change',
    name: 'Changement',
    cost: 4,
    types: ['ACTION'],
    description: "Si vous avez des 💰 en main, écartez une carte de votre main. Recevez une carte coûtant plus que celle écartée, 💰 égal à la différence de coût.",
    effects: [{ type: 'CHANGE_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const craftsman: CardDefinition = {
    id: 'craftsman',
    name: 'Artisan (Soleil Levant)',
    cost: 3,
    types: ['ACTION'],
    description: "+2 💰. Recevez une carte coûtant jusqu'à 3 💰.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'GAIN_CARD', maxCost: 3 }
    ],
    expansion: 'rising_sun'
};

export const daimyo: CardDefinition = {
    id: 'daimyo',
    name: 'Daimyo',
    cost: 6,
    types: ['ACTION', 'COMMAND'],
    description: "+1 Carte. +1 Action. La prochaine fois que vous jouez une Action non-Command ce tour-ci, rejouez-la.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_PLAY' as any, effects: [{ type: 'DAIMYO_EFFECT' as any }] }
    ],
    expansion: 'rising_sun'
};

export const fishmonger: CardDefinition = {
    id: 'fishmonger',
    name: 'Poissonnier',
    cost: 2,
    types: ['ACTION', 'SHADOW'],
    description: "+1 Achat. +1 💰. Vous pouvez jouer cette carte quand vous piochez une carte.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    expansion: 'rising_sun'
};

export const gold_mine: CardDefinition = {
    id: 'gold_mine',
    name: 'Mine d\'Or',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Carte. +1 Achat. Vous pouvez recevoir un Or et +4 💰.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'CHOOSE_OPTION', message: 'Recevoir un Or et +4 💰 ?', options: [{ label: 'Oui', effects: [{ type: 'GAIN_CARD', cardId: 'gold' }, { type: 'ADD_MONEY', amount: 4 }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'rising_sun'
};

export const imperial_envoy: CardDefinition = {
    id: 'imperial_envoy',
    name: 'Émissaire Impérial',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Action. +1 💰. Regardez les 4 cartes du haut de votre pioche. Écartez-en une, défaussez-en une, mettez-en une dans votre main et une sur votre pioche.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'IMPERIAL_ENVOY_EFFECT' as any }
    ],
    expansion: 'rising_sun'
};

export const kitsune: CardDefinition = {
    id: 'kitsune',
    name: 'Kitsune',
    cost: 5,
    types: ['ACTION', 'ATTACK', 'OMEN'],
    description: "+1 Soleil. Choisissez deux options différentes : +2 Actions ; +2 💰 ; chaque autre joueur reçoit une Malédiction ; recevez un Argent.",
    effects: [
        { type: 'REMOVE_SUN_TOKEN' },
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez 2 bonus différents :',
            minChoices: 2,
            maxChoices: 2,
            options: [
                { label: '+2 Actions', effects: [{ type: 'ADD_ACTIONS', amount: 2 }] },
                { label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                { label: 'Attaque (Malédiction)', effects: [{ type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] }] },
                { label: 'Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }] }
            ]
        }
    ],
    expansion: 'rising_sun'
};

export const litter: CardDefinition = {
    id: 'litter',
    name: 'Portée',
    cost: 5,
    types: ['ACTION'],
    description: "+2 Cartes. +2 Actions.",
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    expansion: 'rising_sun'
};

export const mountain_shrine: CardDefinition = {
    id: 'mountain_shrine',
    name: 'Sanctuaire de Montagne',
    cost: 5,
    types: ['ACTION', 'OMEN'],
    description: "+1 Soleil. Vous pouvez écarter une carte de votre main. S'il y a des Action dans le rebut, +2 Cartes. +2 💰.",
    effects: [
        { type: 'REMOVE_SUN_TOKEN' },
        { type: 'SELECT_AND_APPLY', source: 'hand', max: 1, action: 'TRASH' as any, optional: true },
        { type: 'MOUNTAIN_SHRINE_EFFECT' as any }
    ],
    expansion: 'rising_sun'
};

export const ninja: CardDefinition = {
    id: 'ninja',
    name: 'Ninja',
    cost: 4,
    types: ['ACTION', 'SHADOW', 'ATTACK'],
    description: "+1 Carte. Chaque autre joueur défausse jusqu'à n'avoir que 3 cartes en main. Vous pouvez jouer cette carte quand vous piochez une carte.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }] }
    ],
    expansion: 'rising_sun'
};

export const poet: CardDefinition = {
    id: 'poet',
    name: 'Poète',
    cost: 4,
    types: ['ACTION', 'OMEN'],
    description: "+1 Soleil. +1 Carte. +1 Action. Révélez la carte du haut de votre pioche. Si c'est une Action, mettez-la dans votre main.",
    effects: [
        { type: 'REMOVE_SUN_TOKEN' },
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_TOP_DECK' as any, next: [{ type: 'CHOOSE_FROM_REVEALED', min: 0, max: 1, filter: { cardTypes: ['ACTION'] }, destination: 'hand' }] }
    ],
    expansion: 'rising_sun'
};

export const rice: CardDefinition = {
    id: 'rice',
    name: 'Riz',
    cost: 7,
    types: ['TREASURE'],
    description: "+1 Buy. +1 💰 pour chaque type différent parmi les cartes que vous avez en jeu.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: { type: 'COUNT_UNIQUE_TYPES_IN_PLAY' } as any }
    ],
    expansion: 'rising_sun'
};

export const rice_broker: CardDefinition = {
    id: 'rice_broker',
    name: 'Courtier en Riz',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Action. Écartez une carte de votre main. Si c'est un Trésor, +2 Actions. Si c'est une Action, +2 Cartes.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'RICE_BROKER_EFFECT' as any }
    ],
    expansion: 'rising_sun'
};

export const river_shrine: CardDefinition = {
    id: 'river_shrine',
    name: 'Sanctuaire de Rivière',
    cost: 3,
    types: ['ACTION'],
    description: "Écartez jusqu'à 2 cartes de votre main. Si vous n'avez reçu aucune carte ce tour-ci, recevez une carte coûtant jusqu'à 4 💰.",
    effects: [
        { type: 'SELECT_AND_APPLY', source: 'hand', max: 2, action: 'TRASH' as any },
        { type: 'RIVER_SHRINE_EFFECT' as any }
    ],
    expansion: 'rising_sun'
};

export const riverboat: CardDefinition = {
    id: 'riverboat',
    name: 'Bateau de Rivière',
    cost: 3,
    types: ['ACTION', 'DURATION'],
    description: "Au début de votre prochain tour, jouez la carte mise de côté. Mettez de côté une Action non-Command coûtant jusqu'à 5 💰 de la Réserve.",
    effects: [
        { type: 'GAIN_CARD', maxCost: 5, cardTypes: ['ACTION'], destination: 'aside', onSuccess: [{ type: 'REGISTER_TRIGGER', trigger: 'START_TURN', effects: [{ type: 'PLAY_TARGET' as any }] }] }
    ],
    expansion: 'rising_sun'
};

export const ronin: CardDefinition = {
    id: 'ronin',
    name: 'Ronin',
    cost: 5,
    types: ['ACTION', 'SHADOW'],
    description: "Piochez jusqu'à avoir 7 cartes en main. Vous pouvez jouer cette carte quand vous piochez une carte.",
    effects: [{ type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 7 }],
    expansion: 'rising_sun'
};

export const root_cellar: CardDefinition = {
    id: 'root_cellar',
    name: 'Cave à Légumes',
    cost: 3,
    types: ['ACTION'],
    description: "+3 Cartes. +1 Action. +2 💰.",
    effects: [
        { type: 'DRAW', amount: 3 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 }
    ],
    expansion: 'rising_sun'
};

export const rustic_village: CardDefinition = {
    id: 'rustic_village',
    name: 'Village Rustique',
    cost: 4,
    types: ['ACTION', 'OMEN'],
    description: "+1 Soleil. +1 Carte. +2 Actions. Vous pouvez défausser 2 cartes pour +1 Carte.",
    effects: [
        { type: 'REMOVE_SUN_TOKEN' },
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'CHOOSE_OPTION', message: 'Défausser 2 cartes pour +1 Carte ?', options: [{ label: 'Oui', effects: [{ type: 'DISCARD', amount: 2 }, { type: 'DRAW', amount: 1 }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'rising_sun'
};

export const samurai: CardDefinition = {
    id: 'samurai',
    name: 'Samouraï',
    cost: 6,
    types: ['ACTION'],
    description: "Chaque autre joueur défausse jusqu'à n'avoir que 3 cartes en main. Au début de chacun de vos tours pour le reste de la partie, +1 💰.",
    effects: [
        { type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }] },
        { type: 'REGISTER_TRIGGER', trigger: 'START_TURN', effects: [{ type: 'ADD_MONEY', amount: 1 }], duration: 'PERMANENT' }
    ],
    expansion: 'rising_sun'
};

export const snake_witch: CardDefinition = {
    id: 'snake_witch',
    name: 'Sorcière aux Serpents',
    cost: 2,
    types: ['ACTION', 'ATTACK'],
    description: "+1 Carte. +1 Action. Si vous n'avez aucun exemplaire en double en main, révélez votre main et chaque autre joueur reçoit une Malédiction.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SNAKE_WITCH_ATTACK' as any }
    ],
    expansion: 'rising_sun'
};

export const tanuki: CardDefinition = {
    id: 'tanuki',
    name: 'Tanuki',
    cost: 5,
    types: ['ACTION', 'SHADOW'],
    description: "Écartez une carte de votre main. Recevez une carte coûtant jusqu'à 2 💰 de plus. Vous pouvez jouer cette carte quand vous piochez une carte.",
    effects: [
        { type: 'SELECT_AND_APPLY', source: 'hand', max: 1, action: 'TRASH' as any, next: { type: 'GAIN_RELATIVE_COST' as any, amount: 2 } }
    ],
    expansion: 'rising_sun'
};

export const tea_house: CardDefinition = {
    id: 'tea_house',
    name: 'Maison de Thé',
    cost: 5,
    types: ['ACTION', 'OMEN'],
    description: "+1 Soleil. +1 Carte. +1 Action. +2 💰.",
    effects: [
        { type: 'REMOVE_SUN_TOKEN' },
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 }
    ],
    expansion: 'rising_sun'
};
