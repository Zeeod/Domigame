import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Rising Sun — the 15 Prophecies (official texts, 2024 rulebook).
 * One is used when the Kingdom has an Omen; its text only applies once the last Sun token is removed.
 * Rules: engine/expansions/RisingSunCards.ts.
 */
const p = (id: string, name: string, description: string): CardDefinition => ({
    id, name, cost: 0, types: ['PROPHECY'], description, effects: [], expansion: 'rising_sun'
} as any);

export const approaching_army = p('approaching_army', 'Armée en approche',
    'Après avoir joué une carte Attaque, +1 💰. Mise en place : ajoutez une pile Royaume Attaque à la Réserve.');
export const biding_time = p('biding_time', 'Attendre son heure',
    'Au début de votre Ajustement, mettez votre main de côté face cachée. Au début de votre prochain tour, prenez ces cartes en main.');
export const bureaucracy = p('bureaucracy_prophecy', 'Bureaucratie', 'Quand vous recevez une carte qui ne coûte pas 0 💰, recevez un Cuivre.');
export const divine_wind = p('divine_wind', 'Vent divin',
    'Quand vous retirez le dernier Soleil, retirez toutes les piles Royaume de la Réserve et installez 10 nouvelles piles aléatoires.');
export const enlightenment = p('enlightenment', 'Illumination',
    'Les Trésors sont aussi des Actions. Quand vous jouez un Trésor pendant une phase Action, au lieu de suivre ses instructions, +1 Carte et +1 Action.');
export const flourishing_trade = p('flourishing_trade', 'Commerce florissant',
    'Les cartes coûtent 1 💰 de moins. Vous pouvez utiliser des Actions comme des Achats.');
export const good_harvest = p('good_harvest', 'Bonne récolte',
    'La première fois que vous jouez chaque Trésor de nom différent à chaque tour, d\'abord, +1 Achat et +1 💰.');
export const great_leader = p('great_leader', 'Grand chef', 'Après chaque carte Action que vous jouez, +1 Action.');
export const growth = p('growth', 'Croissance', 'Quand vous recevez un Trésor, recevez une carte moins chère.');
export const harsh_winter = p('harsh_winter', 'Hiver rigoureux',
    'Quand vous recevez une carte pendant votre tour, s\'il y a des Dettes sur sa pile, prenez-les ; sinon, placez 2 Dettes sur sa pile.');
export const kind_emperor = p('kind_emperor', 'Empereur bienveillant',
    'Au début de votre tour, et quand vous retirez le dernier Soleil : recevez une carte Action en main.');
export const panic = p('panic', 'Panique',
    'Quand vous jouez un Trésor, +2 Achats, et quand vous en défaussez un de votre zone de jeu, remettez-le dans sa pile.');
export const progress = p('progress', 'Progrès', 'Quand vous recevez une carte, placez-la sur votre pioche.');
export const rapid_expansion = p('rapid_expansion', 'Expansion rapide',
    'Quand vous recevez une carte Action ou Trésor, mettez-la de côté et jouez-la au début de votre prochain tour.');
export const sickness = p('sickness', 'Maladie',
    'Au début de votre tour, choisissez : recevez une Malédiction sur votre pioche ; ou défaussez 3 cartes.');

export const PROPHECY_IDS = ['approaching_army', 'biding_time', 'bureaucracy_prophecy', 'divine_wind', 'enlightenment', 'flourishing_trade', 'good_harvest',
    'great_leader', 'growth', 'harsh_winter', 'kind_emperor', 'panic', 'progress', 'rapid_expansion', 'sickness'];
