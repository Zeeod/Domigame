import { CardDefinition } from '../../types/CardDefinition.js';

const lootDescription = "(Cette carte fait partie de la pile de Butin de 30 Trésors).";

export const amphora: CardDefinition = {
    id: 'amphora',
    name: 'Amphore',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. +1 Faveur. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'ADD_FAVORS', amount: 1 }],
    expansion: 'plunder',
    isNonSupply: true
};

export const doubloons: CardDefinition = {
    id: 'doubloons',
    name: 'Doublons',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. +1 Or. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'GAIN_CARD', cardId: 'gold' }],
    expansion: 'plunder',
    isNonSupply: true
};

export const endless_chalice: CardDefinition = {
    id: 'endless_chalice',
    name: 'Calice Sans Fin',
    cost: 0,
    types: ['TREASURE', 'LOOT', 'DURATION'],
    treasureValue: 1,
    description: "Au début de chacun de vos prochains tours, +1 💰. " + lootDescription,
    durationEffects: [{ type: 'ADD_MONEY', amount: 1 }],
    isPermanentDuration: true,
    expansion: 'plunder',
    isNonSupply: true
};

export const figurehead: CardDefinition = {
    id: 'figurehead',
    name: 'Figure de Proue',
    cost: 0,
    types: ['TREASURE', 'LOOT', 'DURATION'],
    treasureValue: 0,
    description: "Au début de votre prochain tour, +2 Cartes. " + lootDescription,
    durationEffects: [{ type: 'DRAW', amount: 2 }],
    expansion: 'plunder',
    isNonSupply: true
};

export const hammer: CardDefinition = {
    id: 'hammer',
    name: 'Marteau',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. Vous pouvez écarter une carte de votre main coûtant jusqu'à 4 💰 de la Réserve. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'GAIN_CARD', maxCost: 4, optional: true } as any],
    expansion: 'plunder',
    isNonSupply: true
};

export const insignia: CardDefinition = {
    id: 'insignia',
    name: 'Insigne',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. Quand vous recevez cette carte, vous pouvez la mettre sur votre deck. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }],
    onGain: [{ type: 'CHOOSE_OPTION', message: 'Mettre sur votre deck ?', options: [{ label: 'Oui', effects: [{ type: 'TOPDECK_THIS' as any }] }, { label: 'Non', effects: [] }] }],
    expansion: 'plunder',
    isNonSupply: true
};

export const jewels: CardDefinition = {
    id: 'jewels',
    name: 'Joyaux',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. +1 Achat. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'ADD_BUYS', amount: 1 }],
    expansion: 'plunder',
    isNonSupply: true
};

export const orb: CardDefinition = {
    id: 'orb',
    name: 'Orbe',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. Vous pouvez mettre de côté une carte de votre main pour le prochain tour. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', max: 1, destination: 'aside' }],
    durationEffects: [{ type: 'MOVE_CARDS', source: 'aside', destination: 'hand' }],
    expansion: 'plunder',
    isNonSupply: true
};

export const prize_goat: CardDefinition = {
    id: 'prize_goat',
    name: 'Chèvre de Prix',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. +1 Action. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'ADD_ACTIONS', amount: 1 }],
    expansion: 'plunder',
    isNonSupply: true
};

export const puzzle_box: CardDefinition = {
    id: 'puzzle_box',
    name: 'Boîte de Puzzle',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. Vous pouvez mettre cette carte de côté pour la rejouer au prochain tour. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'CHOOSE_OPTION', message: 'Mettre de côté ?', options: [{ label: 'Oui', effects: [{ type: 'SET_ASIDE_THIS' as any }] }, { label: 'Non', effects: [] }] }],
    expansion: 'plunder',
    isNonSupply: true
};

export const sextant: CardDefinition = {
    id: 'sextant',
    name: 'Sextant',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. Regardez les 3 cartes du haut de votre pioche. Défaussez-en n'importe quel nombre. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'DISCARD', amount: 3, source: 'deck', isOptional: true }],
    expansion: 'plunder',
    isNonSupply: true
};

export const shield: CardDefinition = {
    id: 'shield',
    name: 'Bouclier',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. Cette carte peut bloquer les attaques. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }],
    isReaction: true,
    blocksAttack: true,
    expansion: 'plunder',
    isNonSupply: true
};

export const spell_scroll: CardDefinition = {
    id: 'spell_scroll',
    name: 'Parchemin Magique',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. Quand vous jouez cette carte, vous pouvez recevoir une Action coûtant jusqu'à 4 💰 de la Réserve. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'GAIN_CARD', maxCost: 4, cardTypes: ['ACTION'], optional: true } as any],
    expansion: 'plunder',
    isNonSupply: true
};

export const staff: CardDefinition = {
    id: 'staff',
    name: 'Bâton',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. +1 Achat. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'ADD_BUYS', amount: 1 }],
    expansion: 'plunder',
    isNonSupply: true
};

export const sword: CardDefinition = {
    id: 'sword',
    name: 'Épée',
    cost: 0,
    types: ['TREASURE', 'LOOT'],
    treasureValue: 3,
    description: "3 💰. +1 Action. " + lootDescription,
    effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'ADD_ACTIONS', amount: 1 }],
    expansion: 'plunder',
    isNonSupply: true
};

export const loot_pile: CardDefinition = {
    id: 'loot_pile',
    name: 'Butin',
    cost: 0,
    types: ['TREASURE'],
    description: "Une pile de 30 Trésors de Butin différents.",
    expansion: 'plunder',
    isPile: true,
    mixedPile: {
        type: 'SHUFFLED',
        cards: ['amphora', 'doubloons', 'endless_chalice', 'figurehead', 'hammer', 'insignia', 'jewels', 'orb', 'prize_goat', 'puzzle_box', 'sextant', 'shield', 'spell_scroll', 'staff', 'sword']
    }
};
