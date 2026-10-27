import { CardDefinition } from '../../types/CardDefinition.js';

/** Plunder — the 15 Events (official texts). Rules: engine/expansions/PlunderRules.ts. */
const ev = (id: string, name: string, cost: number, description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, types: ['EVENT'], cost, description, expansion: 'plunder', effects, ...extra
} as any);
const BUY = { type: 'ADD_BUYS', amount: 1 };

export const bury = ev('bury', 'Enterrement', 1, '+1 Achat. Placez une carte de votre défausse sous votre pioche.', [BUY, { type: 'BURY' }]);
export const avoid = ev('avoid', 'Esquive', 2, '+1 Achat. La prochaine fois que vous mélangez ce tour-ci, choisissez jusqu\'à 3 de ces cartes à placer dans votre défausse.',
    [BUY, { type: 'SHUFFLE_RULE', rule: 'avoid' }]);
export const deliver = ev('deliver', 'Livraison', 2, '+1 Achat. Ce tour-ci, chaque fois que vous recevez une carte, mettez-la de côté et prenez-la en main à la fin du tour.',
    [BUY, { type: 'DELIVER' }]);
export const peril = ev('peril', 'Péril', 2, '+1 Achat. Vous pouvez écarter une carte Action de votre main pour recevoir un Butin.',
    [BUY, { type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { cardTypes: ['ACTION'] }, message: 'Péril : écarter une Action pour un Butin ?', onSuccess: [{ type: 'GAIN_LOOT' }] }]);
export const rush = ev('rush', 'Ruée', 2, '+1 Achat. La prochaine fois que vous recevez une carte Action ce tour-ci, jouez-la.', [BUY, { type: 'RUSH' }]);
export const foray = ev('foray', 'Raid', 3, 'Défaussez 3 cartes en les dévoilant. Si elles ont 3 noms différents, recevez un Butin.',
    [{ type: 'FORAY' }]);
export const launch = ev('launch', 'Lancement', 3, 'Une fois par tour : retournez à votre phase Action. +1 Carte, +1 Action et +1 Achat.',
    [{ type: 'CHANGE_PHASE', phase: 'ACTION' }, { type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, BUY], { oncePerTurn: true });
export const mirror = ev('mirror', 'Miroir', 3, '+1 Achat. La prochaine fois que vous recevez une carte Action ce tour-ci, recevez-en un exemplaire.', [BUY, { type: 'MIRROR' }]);
export const prepare = ev('prepare', 'Préparatifs', 3, 'Mettez votre main de côté face visible. Au début de votre prochain tour, jouez-en les Actions et Trésors dans l\'ordre de votre choix, puis défaussez le reste.',
    [{ type: 'PREPARE' }]);
export const scrounge = ev('scrounge', 'Récupération', 3, 'Choisissez : écartez une carte de votre main ; ou recevez un Domaine depuis le rebut et, si vous le faites, recevez une carte coûtant jusqu\'à 5 💰.',
    [{ type: 'SCROUNGE' }]);
export const journey = ev('journey', 'Voyage', 4, 'Une fois par tour : si le tour précédent n\'était pas le vôtre, vous ne défaussez pas les cartes en jeu pendant l\'Ajustement de ce tour, et vous jouez un tour supplémentaire après celui-ci.',
    [{ type: 'JOURNEY' }], { oncePerTurn: true });
export const maelstrom = ev('maelstrom', 'Maelström', 4, 'Écartez 3 cartes de votre main. Chaque autre joueur ayant 5 cartes ou plus en main en écarte une.',
    [{ type: 'TRASH', min: 3, max: 3, from: 'hand', message: 'Maelström : écartez 3 cartes' }, { type: 'MAELSTROM' }]);
export const looting = ev('looting', 'Pillage', 6, 'Recevez un Butin.', [{ type: 'GAIN_LOOT' }]);
export const invasion = ev('invasion', 'Invasion', 10, 'Vous pouvez jouer une Attaque de votre main. Recevez un Duché. Recevez une carte Action sur votre pioche. Recevez un Butin ; jouez-le.',
    [{ type: 'MAY_PLAY_FROM_HAND', filter: { cardTypes: ['ATTACK'] }, message: 'Invasion : jouer une Attaque de votre main ?' }, { type: 'INVASION' }]);
export const prosper = ev('prosper', 'Prospérité', 10, 'Recevez un Butin, plus autant de Trésors de noms différents que vous voulez.', [{ type: 'GAIN_LOOT' }, { type: 'PROSPER' }]);
