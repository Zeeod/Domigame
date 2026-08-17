import { CardDefinition } from '../../types/CardDefinition.js';

export const BagOfGold: CardDefinition = {
    id: 'bag_of_gold',
    name: 'Sac d\'Or',
    cost: 0,
    types: ['ACTION', 'PRIZE'],
    expansion: 'cornucopia',
    set: 'Cornucopia',
    description: '+1 Action. Recevez un Or sur votre deck.',
    isNonSupply: true,
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' }
    ]
};

export const Diadem: CardDefinition = {
    id: 'diadem',
    name: 'Diadème',
    cost: 0,
    types: ['TREASURE', 'PRIZE'],
    expansion: 'cornucopia',
    set: 'Cornucopia',
    description: '2💰. Quand vous jouez cette carte, +1💰 pour chaque Action inutilisée.',
    treasureValue: 2,
    isNonSupply: true,
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_MONEY_PER_UNUSED_ACTION', amount: 1 }
    ]
};

export const Followers: CardDefinition = {
    id: 'followers',
    name: 'Disciples',
    cost: 0,
    types: ['ACTION', 'ATTACK', 'PRIZE'],
    expansion: 'cornucopia',
    set: 'Cornucopia',
    description: '+2 Cartes. Recevez un Domaine. Chaque autre joueur défausse jusqu\'à avoir 3 cartes en main et reçoit une Malédiction (Curse).',
    isNonSupply: true,
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'GAIN_CARD', cardId: 'estate' },
        {
            type: 'ATTACK', attackEffects: [
                { type: 'GAIN_CARD', cardId: 'curse' },
                { type: 'DISCARD_TO_HAND_SIZE', targetHandSize: 3 }
            ]
        }
    ]
};

export const Princess: CardDefinition = {
    id: 'princess',
    name: 'Princesse',
    cost: 0,
    types: ['ACTION', 'PRIZE'],
    expansion: 'cornucopia',
    set: 'Cornucopia',
    description: '+1 Achat. Tant que cette carte est en jeu, les cartes coûtent 2💰 de moins (mais pas moins de 0).',
    isNonSupply: true,
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_COST_REDUCTION', amount: 2 }
    ]
};

export const TrustySteed: CardDefinition = {
    id: 'trusty_steed',
    name: 'Destrier Fidèle',
    cost: 0,
    types: ['ACTION', 'PRIZE'],
    expansion: 'cornucopia',
    set: 'Cornucopia',
    description: 'Choisissez deux options : +2 Cartes ; +2 Actions ; +2💰 ; gagnez 4 Argents et mettez la pioche dans la défausse.',
    isNonSupply: true,
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez deux options',
            count: 2,
            different: true,
            options: [
                { label: '+2 Cartes', effects: [{ type: 'DRAW', amount: 2 }] },
                { label: '+2 Actions', effects: [{ type: 'ADD_ACTIONS', amount: 2 }] },
                { label: '+2 Pièces', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                {
                    label: 'Gagner 4 Argents & Défausser Deck',
                    effects: [
                        { type: 'GAIN_CARD', cardId: 'silver', count: 4, destination: 'discardPile' },
                        { type: 'DISCARD_DECK' }
                    ]
                }
            ]
        }
    ]
};

export const ALL_PRIZES = [BagOfGold, Diadem, Followers, Princess, TrustySteed];
