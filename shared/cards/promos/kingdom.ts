import { CardDefinition } from '../../types/CardDefinition.js';

export const envoy: CardDefinition = {
    id: 'envoy',
    name: 'Délégué',
    cost: 4,
    types: ['ACTION'],
    description: "Révélez les 5 premières cartes de votre pioche. L'adversaire à votre gauche choisit l'une d'entre elles que vous défaussez. Prenez les autres en main.",
    effects: [
        { type: 'REVEAL_CARDS', amount: 5, source: 'deck', destination: 'limbo' },
        // The player to your left picks one to discard; the rest go to your hand
        { type: 'OPPONENT_CHOOSES_DISCARD', count: 1, restTo: 'hand' } as any
    ],
    expansion: 'promos'
};

export const prince: CardDefinition = {
    id: 'prince',
    name: 'Prince',
    cost: 8,
    types: ['ACTION'],
    description: "Vous pouvez mettre cette carte de côté. Dans ce cas, mettez de côté une carte Action de votre main coûtant jusqu'à 4 💰. Au début de chacun de vos tours, jouez cette Action, en la remettant de côté quand vous la défaussez de votre zone de jeu.",
    effects: [{ type: 'PRINCE' } as any],
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
    description: "Maintenant et au début de votre prochain tour : jouez une carte Action de la réserve coûtant jusqu'à 4 💰 qui n'est ni une Durée ni un Ordre, en la laissant là.",
    effects: [{ type: 'PLAY_FROM_SUPPLY', maxCost: 4 } as any],
    durationEffects: [{ type: 'PLAY_FROM_SUPPLY', maxCost: 4 } as any],
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
    description: "+2 💰. Révélez les 3 cartes du dessus de la pioche du Marché Noir. Vous pouvez en acheter une immédiatement. Remettez les autres sous la pioche du Marché Noir.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'BLACK_MARKET' } as any
    ],
    expansion: 'promos'
};
