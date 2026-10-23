import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Empires — the 13 Events (official texts). Non-generic effects: expansions/Empires.ts.
 */
const ev = (id: string, name: string, cost: number, debtCost: number, description: string, effects: any[]): CardDefinition => ({
    id, name, types: ['EVENT'], cost, ...(debtCost ? { debtCost } : {}), description, expansion: 'empires', effects
} as any);

export const advance = ev('advance', 'Avancée', 0, 0,
    'Vous pouvez écarter une carte Action de votre main. Si vous le faites, recevez une carte Action coûtant jusqu\'à 6 💰.', [{ type: 'ADVANCE' }]);

export const annex = ev('annex', 'Annexion', 0, 8,
    'Regardez votre défausse. Mélangez-la dans votre pioche sauf jusqu\'à 5 cartes de votre choix. Recevez un Duché.', [{ type: 'ANNEX' }]);

export const banquet = ev('banquet', 'Banquet', 3, 0,
    'Recevez 2 Cuivres et une carte non-Victoire coûtant jusqu\'à 5 💰.',
    [{ type: 'GAIN_CARD', cardId: 'copper' }, { type: 'GAIN_CARD', cardId: 'copper' }, { type: 'GAIN_CARD', maxCost: 5, nonVictory: true, message: 'Banquet : recevez une carte non-Victoire coûtant jusqu\'à 5 💰' }]);

export const conquest = ev('conquest', 'Conquête', 6, 0,
    'Recevez 2 Argents. +1 🛡️ par Argent reçu ce tour-ci.', [{ type: 'CONQUEST' }]);

export const delve = ev('delve', 'Fouille', 2, 0, '+1 Achat. Recevez un Argent.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'GAIN_CARD', cardId: 'silver' }]);

export const dominate = ev('dominate', 'Domination', 14, 0, 'Recevez une Province. Si vous le faites, +9 🛡️.', [{ type: 'DOMINATE' }]);

export const donate = ev('donate', 'Don', 0, 8,
    'À la fin de votre tour, prenez en main votre pioche et votre défausse, écartez-en autant de cartes que vous voulez, puis mélangez votre main dans votre pioche et piochez 5 cartes.',
    [{ type: 'DONATE' }]);

export const ritual = ev('ritual', 'Rituel', 4, 0,
    'Recevez une Malédiction. Si vous le faites, écartez une carte de votre main. +1 🛡️ par 💰 de son coût.', [{ type: 'RITUAL' }]);

export const saltTheEarth = ev('salt_the_earth', 'Saler la terre', 4, 0,
    '+1 🛡️. Écartez une carte Victoire de la réserve.', [{ type: 'SALT_THE_EARTH' }]);

export const tax = ev('tax', 'Taxe', 2, 0,
    'Ajoutez 2 Dette sur une pile de la réserve. Mise en place : 1 Dette sur chaque pile de la réserve. Quand un joueur achète une carte, il prend la Dette de sa pile.',
    [{ type: 'TAX' }]);

export const triumph = ev('triumph', 'Triomphe', 0, 5,
    'Recevez un Domaine. Si vous le faites, +1 🛡️ par carte reçue ce tour-ci.', [{ type: 'TRIUMPH' }]);

export const wedding = ev('wedding', 'Mariage', 4, 3, '+1 🛡️. Recevez un Or.',
    [{ type: 'ADD_VICTORY_TOKENS', amount: 1 }, { type: 'GAIN_CARD', cardId: 'gold' }]);

export const windfall = ev('windfall', 'Aubaine', 5, 0,
    'Si votre pioche et votre défausse sont vides, recevez 3 Ors.', [{ type: 'WINDFALL' }]);
