import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Empires — the 21 Landmarks (official texts). Rules: expansions/Empires.ts (VP pools, hooks, scoring).
 */
const lm = (id: string, name: string, description: string): CardDefinition => ({
    id, name, types: ['LANDMARK'], cost: 0, description, expansion: 'empires'
} as any);

export const aqueduct = lm('aqueduct', 'Aqueduc', 'Quand vous recevez un Trésor, déplacez 1 🛡️ de sa pile vers ici. Quand vous recevez une carte Victoire, prenez les 🛡️ d\'ici. Mise en place : 8 🛡️ sur les piles d\'Argent et d\'Or.');
export const arena = lm('arena', 'Arène', 'Au début de votre phase Achat, vous pouvez défausser une carte Action. Si vous le faites, prenez 2 🛡️ d\'ici. Mise en place : 6 🛡️ par joueur ici.');
export const banditFort = lm('bandit_fort', 'Fort des bandits', 'Au décompte, -2 PV pour chaque Argent et chaque Or que vous possédez.');
export const basilica = lm('basilica', 'Basilique', 'Quand vous achetez une carte, s\'il vous reste 2 💰 ou plus, prenez 2 🛡️ d\'ici. Mise en place : 6 🛡️ par joueur ici.');
export const baths = lm('baths', 'Thermes', 'Quand vous terminez votre tour sans avoir reçu de carte, prenez 2 🛡️ d\'ici. Mise en place : 6 🛡️ par joueur ici.');
export const battlefield = lm('battlefield', 'Champ de bataille', 'Quand vous recevez une carte Victoire, prenez 2 🛡️ d\'ici. Mise en place : 6 🛡️ par joueur ici.');
export const colonnade = lm('colonnade', 'Colonnade', 'Quand vous achetez une carte Action, si vous en avez une copie en jeu, prenez 2 🛡️ d\'ici. Mise en place : 6 🛡️ par joueur ici.');
export const defiledShrine = lm('defiled_shrine', 'Sanctuaire profané', 'Quand vous recevez une Action, déplacez 1 🛡️ de sa pile vers ici. Quand vous achetez une Malédiction, prenez les 🛡️ d\'ici. Mise en place : 2 🛡️ sur chaque pile Action hors Rassemblement.');
export const fountain = lm('fountain', 'Fontaine', 'Au décompte, 15 PV si vous avez au moins 10 Cuivres.');
export const keep = lm('keep', 'Donjon', 'Au décompte, 5 PV par Trésor de nom différent dont vous avez autant ou plus de copies que chaque autre joueur.');
export const labyrinth = lm('labyrinth', 'Labyrinthe', 'Quand vous recevez une 2e carte pendant l\'un de vos tours, prenez 2 🛡️ d\'ici. Mise en place : 6 🛡️ par joueur ici.');
export const mountainPass = lm('mountain_pass', 'Col de montagne', 'Quand vous êtes le premier joueur à recevoir une Province, après ce tour chaque joueur enchérit une fois, jusqu\'à 40 Dette, en finissant par vous. Le plus offrant reçoit +8 🛡️ et prend la Dette enchérie.');
export const museum = lm('museum', 'Musée', 'Au décompte, 2 PV par carte de nom différent que vous possédez.');
export const obelisk = lm('obelisk', 'Obélisque', 'Au décompte, 2 PV par carte que vous possédez de la pile choisie. Mise en place : choisissez une pile Action de la réserve au hasard.');
export const orchard = lm('orchard', 'Verger', 'Au décompte, 4 PV par carte Action de nom différent dont vous avez 3 exemplaires ou plus.');
export const palace = lm('palace', 'Palais', 'Au décompte, 3 PV par série Cuivre - Argent - Or que vous possédez.');
export const tomb = lm('tomb', 'Tombeau', 'Quand vous écartez une carte, +1 🛡️.');
export const tower = lm('tower', 'Tour', 'Au décompte, 1 PV par carte non-Victoire que vous possédez provenant d\'une pile vide de la réserve.');
export const triumphalArch = lm('triumphal_arch', 'Arc de triomphe', 'Au décompte, 3 PV par exemplaire de votre 2e carte Action la plus nombreuse (en cas d\'égalité, elle compte).');
export const wall = lm('wall', 'Mur', 'Au décompte, -1 PV par carte que vous possédez au-delà de la 15e.');
export const wolfDen = lm('wolf_den', 'Tanière du loup', 'Au décompte, -3 PV par carte dont vous n\'avez qu\'un seul exemplaire.');
