import { CardDefinition } from '../../types/CardDefinition.js';

export const envoy: CardDefinition = {
    id: 'envoy',
    name: 'Délégué',
    cost: 4,
    types: ['ACTION'],
    description: "Révélez les 5 premières cartes de votre pioche. L'adversaire à votre gauche choisit l'une d'entre elles que vous défaussez. Prenez les autres en main.",
    effects: [
        { type: 'REVEAL_CARDS', amount: 5, source: 'deck', destination: 'aside' },
        {
            type: 'OTHER_PLAYERS_EFFECT',
            effect: {
                type: 'CHOOSE_FROM_ZONE',
                sourceZone: 'aside',
                destination: 'discardPile',
                min: 1,
                max: 1,
                message: "Choisissez une carte à défausser pour l'adversaire",
                effects: [{ type: 'MOVE_CARDS', source: 'aside', destination: 'hand', count: 'ALL' }]
            }
        }
    ],
    expansion: 'promos'
};

export const prince: CardDefinition = {
    id: 'prince',
    name: 'Prince',
    cost: 8,
    types: ['ACTION', 'COMMAND'],
    description: "Écartez cette carte. Écartez une carte Action de votre main coûtant jusqu'à 4 💰. Au début de chacun de vos tours, jouez la carte Action écartée. Quand cette carte Action écartée quitte le jeu, défaussez le Prince.",
    effects: [
        {
            type: 'SELECT_AND_APPLY',
            source: 'hand',
            filter: { cardTypes: ['ACTION'], maxCost: 4 },
            destination: 'aside',
            sourceCardDestination: 'aside', // Move Prince itself to aside
            message: 'Choisissez une action à mettre de côté avec le Prince',
            next: [
                { type: 'REGISTER_TRIGGER', trigger: 'START_ACTION_PHASE', isPermanent: true, effects: [{ type: 'PLAY_THIS_CARD' }] }
            ]
        } as any
    ],
    expansion: 'promos'
};

// Summon will be moved to events.ts as it is an Event card.

export const dismantling: CardDefinition = {
    id: 'dismantling',
    name: 'Démanteler',
    cost: 4,
    types: ['ACTION'],
    description: "Écartez une carte de votre main. S'il s'agit d'une carte coûtant 1 💰 ou plus, recevez une carte coûtant moins que celle écartée, et un Or.",
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            destination: 'trash',
            message: 'Choisissez une carte à démanteler',
            effects: [
                {
                    type: 'CONDITION',
                    condition: 'LAST_SELECTED_COST_AT_LEAST',
                    value: 1,
                    trueEffects: [
                        { type: 'GAIN_CARD_PLUS_COST', costBonus: -1, destination: 'discardPile' },
                        { type: 'GAIN_CARD', cardId: 'gold' }
                    ]
                }
            ]
        }
    ],
    expansion: 'promos'
};

export const captain: CardDefinition = {
    id: 'captain',
    name: 'Capitaine',
    cost: 6,
    types: ['ACTION', 'DURATION', 'COMMAND'],
    description: "Jouez une carte Action de la Réserve coûtant jusqu'à 4 💰 qui n'est pas une carte Durée, en laissant la carte là-bas. Au début de votre prochain tour, faites de même.",
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'supply',
            filter: { cardTypes: ['ACTION'], excludeTypes: ['DURATION'], maxCost: 4 },
            message: "Capitaine : choisissez une carte Action (coût <= 4) à jouer",
            effects: [{ type: 'PLAY_THIS_CARD' }]
        }
    ],
    durationEffects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'supply',
            filter: { cardTypes: ['ACTION'], excludeTypes: ['DURATION'], maxCost: 4 },
            message: "Capitaine (Tour suivant) : choisissez une carte Action (coût <= 4) à jouer",
            effects: [{ type: 'PLAY_THIS_CARD' }]
        }
    ],
    expansion: 'promos'
};

export const church: CardDefinition = {
    id: 'church',
    name: 'Église',
    cost: 3,
    types: ['ACTION', 'DURATION'],
    description: "+1 Achat. Jusqu'à 3 cartes de votre main sont mises de côté. À la fin de votre phase d'Achat, vous pouvez écarter n'importe quel nombre de cartes de votre main. Au début de votre prochain tour, reprenez les cartes mises de côté en main.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', min: 0, max: 3, destination: 'aside', message: 'Mettre de côté pour le prochain tour' }
    ],
    onCleanup: [{ type: 'SELECT_AND_APPLY', source: 'hand', action: 'TRASH', max: 10, message: 'Écarter des cartes de la main ?' }],
    durationEffects: [{ type: 'MOVE_CARDS', source: 'aside', destination: 'hand' }],
    expansion: 'promos'
};

export const marchland: CardDefinition = {
    id: 'marchland',
    name: 'Frontière',
    cost: 5,
    types: ['ACTION', 'VICTORY'],
    description: "2 PV. +1 Action. Choisissez soit : +3 Cartes ; ou défaussez votre main pour +2 💰 par carte Victoire que vous avez en main (au moins 2 💰).",
    victoryPoints: 2,
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un bonus :',
            options: [
                { label: '+3 Cartes', effects: [{ type: 'DRAW', amount: 3 }] },
                {
                    label: 'Bonus PV en main',
                    effects: [
                        { type: 'ADD_MONEY', amount: { type: 'DYNAMIC', metric: 'VICTORY_CARDS_IN_HAND', multiplier: 2 } as any },
                        { type: 'DISCARD_HAND' }
                    ]
                }
            ]
        }
    ],
    expansion: 'promos'
};

export const black_market: CardDefinition = {
    id: 'black_market',
    name: 'Marché Noir',
    cost: 3,
    types: ['ACTION'],
    description: "+2 💰. Vous pouvez regarder les 3 premières cartes de la pioche du Marché Noir. Vous pouvez en acheter une. Remettez les autres sous la pioche du Marché Noir.",
    effects: [
        {
            type: 'SEQUENCE',
            effects: [
                { type: 'ADD_MONEY', amount: 2 },
                { type: 'REVEAL_CARDS', amount: 3, source: 'blackMarketDeck' as any, destination: 'blackMarketRevealed' as any },
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'blackMarketRevealed' as any,
                    destination: 'discardPile',
                    message: 'Choisissez une carte à acheter',
                    min: 0,
                    max: 1,
                    optional: true,
                    effects: [
                        { type: 'BUY_LAST_SELECTED' as any }
                    ]
                } as any,
                { type: 'MOVE_CARDS', source: 'blackMarketRevealed' as any, destination: 'blackMarketDeck' as any, count: 'ALL', toBottom: true }
            ]
        }
    ],
    expansion: 'promos'
};
