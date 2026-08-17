import { CardDefinition } from '../../types/CardDefinition.js';

export const barbarian: CardDefinition = {
    id: 'barbarian',
    name: 'Barbare',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    description: "Chaque autre joueur écarte la carte du haut de son deck. S'il s'agit d'une carte coûtant 3 💰 ou plus, il reçoit une carte moins chère partageant un type avec elle ; sinon, il reçoit une Malédiction.",
    effects: [
        { type: 'ATTACK', attackEffects: [{ type: 'BARBARIAN_ATTACK' as any }] }
    ],
    expansion: 'allies'
};

export const bauble: CardDefinition = {
    id: 'bauble',
    name: 'Babiole',
    cost: 2,
    types: ['TREASURE', 'LIAISON'],
    treasureValue: 0,
    description: "Choisissez deux options différentes : +1 Achat ; +1 💰 ; +1 Faveur ; ce tour-ci, quand vous recevez une carte, vous pouvez la mettre sur votre deck.",
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez deux options différentes :',
            min: 2,
            max: 2,
            options: [
                { label: '+1 Achat', effects: [{ type: 'ADD_BUYS', amount: 1 }] },
                { label: '+1 💰', effects: [{ type: 'ADD_MONEY', amount: 1 }] },
                { label: '+1 Faveur', effects: [{ type: 'ADD_FAVORS', amount: 1 }] },
                { label: 'Prochaine carte sur le deck', effects: [{ type: 'NEXT_GAIN_TO_DECK' as any }] }
            ]
        }
    ],
    expansion: 'allies'
};

export const broker: CardDefinition = {
    id: 'broker',
    name: 'Courtier',
    cost: 4,
    types: ['ACTION', 'LIAISON'],
    description: "Écartez une carte de votre main. Choisissez une option parmi : +1 Carte par 1 💰 de son coût ; +1 Action par 1 💰 de son coût ; +1 💰 par 1 💰 de son coût ; ou +1 Faveur par 1 💰 de son coût.",
    effects: [
        {
            type: 'SELECT_AND_APPLY',
            source: 'hand',
            action: 'TRASH' as any,
            message: 'Écartez une carte pour des bonus',
            min: 1,
            max: 1,
            next: {
                type: 'CHOOSE_OPTION',
                message: 'Choisissez un bonus par 💰 du coût :',
                options: [
                    { label: '+1 Carte / 💰', effects: [{ type: 'DRAW_PER_COST' as any }] },
                    { label: '+1 Action / 💰', effects: [{ type: 'ADD_ACTIONS_PER_COST' as any }] },
                    { label: '+1 💰 / 💰', effects: [{ type: 'ADD_MONEY_PER_COST' as any }] },
                    { label: '+1 Faveur / 💰', effects: [{ type: 'ADD_FAVORS_PER_COST' as any }] }
                ]
            }
        }
    ],
    expansion: 'allies'
};

export const capital_city: CardDefinition = {
    id: 'capital_city',
    name: 'Capitale',
    cost: 5,
    types: ['ACTION', 'DURATION'],
    description: "+1 Carte. +2 Actions. Payez 2 💰 au début de votre prochain tour. Si vous le faites, +2 Cartes.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    durationEffects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Payer 2 💰 pour +2 Cartes ?',
            options: [
                {
                    label: 'Oui (-2 💰, +2 Cartes)',
                    effects: [
                        { type: 'SPEND_MONEY' as any, amount: 2 },
                        { type: 'DRAW', amount: 2 }
                    ]
                },
                { label: 'Non', effects: [] }
            ]
        }
    ],
    expansion: 'allies'
};

export const carpenter: CardDefinition = {
    id: 'carpenter',
    name: 'Charpentier',
    cost: 4,
    types: ['ACTION'],
    description: "Si aucune pile de la Réserve n'est vide, +1 Action et recevez une carte coûtant jusqu'à 4 💰. Sinon, écartez une carte de votre main et recevez une carte coûtant jusqu'à 2 💰 de plus.",
    effects: [{ type: 'CARPENTER_EFFECT' as any }],
    expansion: 'allies'
};

export const contract: CardDefinition = {
    id: 'contract',
    name: 'Contrat',
    cost: 5,
    types: ['TREASURE', 'LIAISON', 'DURATION'],
    treasureValue: 2,
    description: "2 💰. +1 Faveur. Vous pouvez mettre cette carte de côté. Si vous le faites, au début de votre prochain tour, jouez-la.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_FAVORS', amount: 1 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Mettre de côté pour rejouer au prochain tour ?',
            options: [
                { label: 'Oui', effects: [{ type: 'SET_ASIDE_THIS' as any }] },
                { label: 'Non', effects: [] }
            ]
        }
    ],
    expansion: 'allies'
};

export const courier: CardDefinition = {
    id: 'courier',
    name: 'Messager',
    cost: 4,
    types: ['ACTION'],
    description: "+1 💰. Défaussez la carte du haut de votre pioche. Vous pouvez jouer une Action ou un Trésor de votre pile de défausse (autre qu'un Messager).",
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'DISCARD', amount: 1, source: 'deck' },
        { type: 'COURIER_EFFECT' as any }
    ],
    expansion: 'allies'
};

export const emissary: CardDefinition = {
    id: 'emissary',
    name: 'Émissaire',
    cost: 5,
    types: ['ACTION', 'LIAISON'],
    description: "+3 Cartes. Vous pouvez mélanger votre pile de défausse dans votre pioche. Si vous le faites, +1 Action et +2 Faveurs.",
    effects: [
        { type: 'DRAW', amount: 3 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Mélanger la défausse dans la pioche ?',
            options: [
                {
                    label: 'Oui (+1 Action, +2 Faveurs)',
                    effects: [
                        { type: 'SHUFFLE_DISCARD_INTO_DECK' as any },
                        { type: 'ADD_ACTIONS', amount: 1 },
                        { type: 'ADD_FAVORS', amount: 2 }
                    ]
                },
                { label: 'Non', effects: [] }
            ]
        }
    ],
    expansion: 'allies'
};

export const galleria: CardDefinition = {
    id: 'galleria',
    name: 'Galerie',
    cost: 5,
    types: ['ACTION'],
    description: "+3 💰. Ce tour-ci, quand vous recevez une carte coûtant 3 💰 ou 4 💰, +1 Achat.",
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', filter: { minCost: 3, maxCost: 4 }, effects: [{ type: 'ADD_BUYS', amount: 1 }] }
    ],
    expansion: 'allies'
};

export const guildmaster: CardDefinition = {
    id: 'guildmaster',
    name: 'Maître de guilde',
    cost: 5,
    types: ['ACTION', 'LIAISON'],
    description: "+3 💰. Ce tour-ci, quand vous recevez une carte, +1 Faveur.",
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', effects: [{ type: 'ADD_FAVORS', amount: 1 }] }
    ],
    expansion: 'allies'
};

export const highwayman: CardDefinition = {
    id: 'highwayman',
    name: 'Bandit de grand chemin',
    cost: 5,
    types: ['ACTION', 'DURATION', 'ATTACK'],
    description: "Au début de votre prochain tour, défaussez cette carte de votre jeu et +3 Cartes. Jusque-là, le premier Trésor que chaque autre joueur joue à chacun de ses tours ne fait rien.",
    effects: [{ type: 'HIGHWAYMAN_ATTACK' as any }],
    durationEffects: [
        { type: 'DRAW', amount: 3 }
    ],
    expansion: 'allies'
};

export const hunter: CardDefinition = {
    id: 'hunter',
    name: 'Chasseur',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Action. Révélez les 3 cartes du haut de votre pioche. Parmi celles-ci, ajoutez à votre main une Action, un Trésor et une Victoire. Défaussez le reste.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'HUNTER_EFFECT' as any }
    ],
    expansion: 'allies'
};

export const importer: CardDefinition = {
    id: 'importer',
    name: 'Importateur',
    cost: 3,
    types: ['ACTION', 'DURATION'],
    description: "Au début de votre prochain tour, recevez une carte coûtant jusqu'à 5 💰. (Mise en place : chaque joueur reçoit +4 Faveurs).",
    effects: [], // Setup handled elsewhere
    durationEffects: [
        { type: 'GAIN_CARD', maxCost: 5 }
    ],
    expansion: 'allies'
};

export const innkeeper: CardDefinition = {
    id: 'innkeeper',
    name: 'Aubergiste',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Action. Choisissez soit : +1 Carte, ou +3 Cartes puis défaussez 3 cartes, ou +5 Cartes puis défaussez 6 cartes.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus de pioche :',
            options: [
                { label: '+1 Carte', effects: [{ type: 'DRAW', amount: 1 }] },
                {
                    label: '+3 Cartes, défaussez 3',
                    effects: [
                        { type: 'DRAW', amount: 3 },
                        { type: 'DISCARD', amount: 3, source: 'hand' }
                    ]
                },
                {
                    label: '+5 Cartes, défaussez 6',
                    effects: [
                        { type: 'DRAW', amount: 5 },
                        { type: 'DISCARD', amount: 6, source: 'hand' }
                    ]
                }
            ]
        }
    ],
    expansion: 'allies'
};

export const marquis: CardDefinition = {
    id: 'marquis',
    name: 'Marquis',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Achat. +1 Carte par carte dans votre main. Défaussez jusqu'à 10 cartes de votre main.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'DRAW', amount: { type: 'COUNT_CARDS_IN_HAND' } as any },
        { type: 'DISCARD', amount: 10, source: 'hand', isOptional: true }
    ],
    expansion: 'allies'
};

export const merchant_camp: CardDefinition = {
    id: 'merchant_camp',
    name: 'Campement de marchands',
    cost: 3,
    types: ['ACTION'],
    description: "+2 Actions. +1 💰. Quand vous défaussez cette carte de votre jeu, vous pouvez la mettre sur votre pioche.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    onCleanup: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Mettre le Campement de marchands sur votre pioche ?',
            options: [
                { label: 'Oui', effects: [{ type: 'TOPDECK_THIS' as any }] },
                { label: 'Non', effects: [] }
            ]
        }
    ],
    expansion: 'allies'
};

export const modify: CardDefinition = {
    id: 'modify',
    name: 'Modifier',
    cost: 5,
    types: ['ACTION'],
    description: "Écartez une carte de votre main. Choisissez soit : +1 Carte et +1 Action, ou recevez une carte coûtant jusqu'à 2 💰 de plus que la carte écartée.",
    effects: [
        {
            type: 'SELECT_AND_APPLY',
            source: 'hand',
            action: 'TRASH' as any,
            message: 'Écartez une carte',
            min: 1,
            max: 1,
            next: {
                type: 'CHOOSE_OPTION',
                message: 'Choisissez un bonus :',
                options: [
                    {
                        label: '+1 Carte, +1 Action',
                        effects: [
                            { type: 'DRAW', amount: 1 },
                            { type: 'ADD_ACTIONS', amount: 1 }
                        ]
                    },
                    {
                        label: 'Recevoir une carte (+2 💰)',
                        effects: [{ type: 'GAIN_RELATIVE_COST' as any, amount: 2 }]
                    }
                ]
            }
        }
    ],
    expansion: 'allies'
};

export const royal_galley: CardDefinition = {
    id: 'royal_galley',
    name: 'Galère Royale',
    cost: 4,
    types: ['ACTION', 'DURATION'],
    description: "+1 Carte. Vous pouvez jouer une carte Action non-Durée de votre main. Écartez-la. Si vous le faites, au début de votre prochain tour, jouez-la.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ROYAL_GALLEY_EFFECT' as any }
    ],
    expansion: 'allies'
};

export const sentinel: CardDefinition = {
    id: 'sentinel',
    name: 'Sentinelle',
    cost: 3,
    types: ['ACTION'],
    description: "Regardez les 5 cartes du haut de votre pioche. Vous pouvez en écarter jusqu'à 2. Remettez le reste sur votre pioche dans l'ordre de votre choix.",
    effects: [
        { type: 'SENTINEL_EFFECT' as any }
    ],
    expansion: 'allies'
};

export const skirmisher: CardDefinition = {
    id: 'skirmisher',
    name: 'Tirailleur',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    description: "+1 Carte. +1 Action. Ce tour-ci, quand vous recevez une carte Attaque, chaque autre joueur défausse jusqu'à n'avoir que 3 cartes en main.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', filter: { cardTypes: ['ATTACK'] }, effects: [{ type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }] }] }
    ],
    expansion: 'allies'
};

export const specialist: CardDefinition = {
    id: 'specialist',
    name: 'Spécialiste',
    cost: 5,
    types: ['ACTION'],
    description: "Vous pouvez jouer une Action ou un Trésor de votre main. Choisissez soit : rejouez-la, ou recevez-en une copie.",
    effects: [
        { type: 'SPECIALIST_EFFECT' as any }
    ],
    expansion: 'allies'
};

export const swap: CardDefinition = {
    id: 'swap',
    name: 'Échange',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Carte. +1 Action. Vous pouvez retourner une Action de votre main dans sa pile pour recevoir une carte Action différente coûtant jusqu'à 5 💰.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SWAP_EFFECT' as any }
    ],
    expansion: 'allies'
};

export const sycophant: CardDefinition = {
    id: 'sycophant',
    name: 'Sycophante',
    cost: 2,
    types: ['ACTION', 'LIAISON'],
    description: "+1 Action. Défaussez 3 cartes. Si vous en défaussez au moins une, +3 💰. Quand vous recevez ou écartez cette carte, +2 Faveurs.",
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SYCOPHANT_EFFECT' as any }
    ],
    onGain: [{ type: 'ADD_FAVORS', amount: 2 }],
    onTrash: [{ type: 'ADD_FAVORS', amount: 2 }],
    expansion: 'allies'
};

export const town: CardDefinition = {
    id: 'town',
    name: 'Ville',
    cost: 4,
    types: ['ACTION'],
    description: "Choisissez une option : +1 Carte et +2 Actions, ou +1 Achat et +2 💰.",
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus :',
            options: [
                {
                    label: '+1 Carte, +2 Actions',
                    effects: [
                        { type: 'DRAW', amount: 1 },
                        { type: 'ADD_ACTIONS', amount: 2 }
                    ]
                },
                {
                    label: '+1 Achat, +2 💰',
                    effects: [
                        { type: 'ADD_BUYS', amount: 1 },
                        { type: 'ADD_MONEY', amount: 2 }
                    ]
                }
            ]
        }
    ],
    expansion: 'allies'
};

export const underling: CardDefinition = {
    id: 'underling',
    name: 'Subalterne',
    cost: 3,
    types: ['ACTION', 'LIAISON'],
    description: "+1 Carte. +1 Action. +1 Faveur.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_FAVORS', amount: 1 }
    ],
    expansion: 'allies'
};
