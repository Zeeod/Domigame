import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Cornucopia & Guilds 2nd edition (2024): the 8 new Kingdom cards and the 6 Rewards (from Joust).
 */

export const carnival: CardDefinition = {
    id: 'carnival', name: 'Carnaval', cost: 5, types: ['ACTION'], expansion: 'cornucopia',
    description: 'Dévoilez les 4 cartes du dessus de votre pioche. Prenez en main une carte de chaque nom différent dévoilé et défaussez le reste.',
    effects: [{ type: 'CARNIVAL' }] as any
};

export const farmhands: CardDefinition = {
    id: 'farmhands', name: 'Ouvriers agricoles', cost: 4, types: ['ACTION'], expansion: 'cornucopia',
    description: '+1 Carte, +2 Actions. Quand vous recevez cette carte, vous pouvez mettre de côté une carte Action ou Trésor de votre main, et la jouer au début de votre prochain tour.',
    effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }] as any,
    onGain: [{ type: 'FARMHANDS_ON_GAIN' }] as any
};

export const farrier: CardDefinition = {
    id: 'farrier', name: 'Maréchal-ferrant', cost: 2, types: ['ACTION'], expansion: 'guilds',
    description: '+1 Carte, +1 Action, +1 Achat. Surpaiement : +1 Carte à la fin de ce tour par 💰 surpayé.',
    effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }] as any,
    overpayEffects: [{ type: 'FARRIER_OVERPAY' }] as any
};

export const ferryman: CardDefinition = {
    id: 'ferryman', name: 'Passeur', cost: 3, types: ['ACTION'], expansion: 'guilds',
    description: '+2 Cartes, +1 Action. Défaussez une carte. Mise en place : choisissez une pile du Royaume inutilisée coûtant 3 ou 4 💰. Quand vous recevez cette carte, recevez une carte de cette pile.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD', min: 1, max: 1, message: 'Passeur : défaussez une carte' }
    ] as any,
    onGain: [{ type: 'FERRYMAN_ON_GAIN' }] as any
};

export const footpad: CardDefinition = {
    id: 'footpad', name: 'Détrousseur', cost: 5, types: ['ACTION', 'ATTACK'], expansion: 'guilds',
    description: '+2 Coffres. Chaque autre joueur défausse jusqu\'à avoir 3 cartes en main. Dans les parties utilisant cette carte, quand vous recevez une carte pendant une phase Action, +1 Carte.',
    effects: [
        { type: 'ADD_COFFERS', amount: 2 },
        { type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }] }
    ] as any
};

export const infirmary: CardDefinition = {
    id: 'infirmary', name: 'Infirmerie', cost: 3, types: ['ACTION'], expansion: 'guilds',
    description: '+1 Carte. Vous pouvez écarter une carte de votre main. Surpaiement : jouez cette carte une fois par 💰 surpayé.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Infirmerie : vous pouvez écarter une carte' }
    ] as any,
    overpayEffects: [{ type: 'INFIRMARY_OVERPAY' }] as any
};

export const joust: CardDefinition = {
    id: 'joust', name: 'Joute', cost: 5, types: ['ACTION'], expansion: 'cornucopia',
    description: '+1 Carte, +1 Action, +1 💰. Vous pouvez mettre de côté une Province de votre main pour recevoir la Récompense de votre choix en main. Défaussez la Province lors de l\'Ajustement.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'JOUST' }
    ] as any
};

export const shop: CardDefinition = {
    id: 'shop', name: 'Boutique', cost: 3, types: ['ACTION'], expansion: 'cornucopia',
    description: '+1 Carte, +1 💰. Vous pouvez jouer une carte Action de votre main dont vous n\'avez pas de copie en jeu.',
    effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }, { type: 'SHOP' }] as any
};

// ------------------------------------------------------------------ Rewards (not in the Supply)

export const coronet: CardDefinition = {
    id: 'coronet', name: 'Diadème', cost: 0, types: ['ACTION', 'TREASURE', 'REWARD'], expansion: 'cornucopia', isNonSupply: true,
    description: 'Vous pouvez jouer deux fois une carte Action (hors Récompense) de votre main. Vous pouvez jouer deux fois une carte Trésor (hors Récompense) de votre main. (Hors réserve.)',
    effects: [{ type: 'CORONET' }] as any
};

export const courser: CardDefinition = {
    id: 'courser', name: 'Coursier', cost: 0, types: ['ACTION', 'REWARD'], expansion: 'cornucopia', isNonSupply: true,
    description: 'Choisissez deux options différentes : +2 Cartes ; +2 Actions ; +2 💰 ; recevez 4 Argents. (Hors réserve.)',
    effects: [{ type: 'COURSER' }] as any
};

export const demesne: CardDefinition = {
    id: 'demesne', name: 'Domaine seigneurial', cost: 0, types: ['ACTION', 'VICTORY', 'REWARD'], expansion: 'cornucopia', isNonSupply: true,
    description: '+2 Actions, +2 Achats. Recevez un Or. Vaut 1 PV par Or que vous possédez. (Hors réserve.)',
    effects: [{ type: 'ADD_ACTIONS', amount: 2 }, { type: 'ADD_BUYS', amount: 2 }, { type: 'GAIN_CARD', cardId: 'gold' }] as any,
    dynamicVP: true,
    vpCalculator: (allCards) => allCards.filter((c: any) => c.id === 'gold').length
};

export const housecarl: CardDefinition = {
    id: 'housecarl', name: 'Huscarl', cost: 0, types: ['ACTION', 'REWARD'], expansion: 'cornucopia', isNonSupply: true,
    description: '+1 Carte par carte Action de nom différent que vous avez en jeu. (Hors réserve.)',
    effects: [{ type: 'HOUSECARL' }] as any
};

export const huge_turnip: CardDefinition = {
    id: 'huge_turnip', name: 'Navet géant', cost: 0, types: ['TREASURE', 'REWARD'], expansion: 'cornucopia', isNonSupply: true,
    description: '+2 Coffres. +1 💰 par Coffre que vous avez. (Hors réserve.)',
    treasureValue: 0,
    effects: [{ type: 'HUGE_TURNIP' }] as any
};

export const renown: CardDefinition = {
    id: 'renown', name: 'Renommée', cost: 0, types: ['TREASURE', 'REWARD'], expansion: 'cornucopia', isNonSupply: true,
    description: '+1 Achat. Ce tour-ci, les cartes coûtent 2 💰 de moins. (Hors réserve.)',
    treasureValue: 0,
    effects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_COST_REDUCTION', amount: 2 }] as any
};
