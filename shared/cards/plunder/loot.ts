import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Plunder — the 15 Loots ($7 Treasure – Loot, not in the Supply; a shuffled pile of 2 of each).
 * Rules: engine/expansions/PlunderRules.ts.
 */
const loot = (id: string, name: string, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost: 7, types: ['TREASURE', ...types, 'LOOT'], description, effects, expansion: 'plunder', isNonSupply: true, treasureValue: 0, ...extra
} as any);
const $3 = { type: 'ADD_MONEY', amount: 3 };
const BUY = { type: 'ADD_BUYS', amount: 1 };

export const amphora = loot('amphora', 'Amphore', ['DURATION'], 'Maintenant ou au début de votre prochain tour : +1 Achat et +3 💰.',
    [{ type: 'NOW_OR_LATER', label: '+1 Achat et +3 💰', effects: [BUY, $3] }], { durationEffects: [BUY, $3] });
export const doubloons = loot('doubloons', 'Doublons', [], '3 💰. Quand vous recevez cette carte, recevez un Or.', [$3], { onGain: [{ type: 'GAIN_CARD', cardId: 'gold' }] });
export const endless_chalice = loot('endless_chalice', 'Calice sans fin', ['DURATION'], 'Maintenant et au début de chacun de vos tours pour le reste de la partie : 1 💰, +1 Achat.',
    [{ type: 'ADD_MONEY', amount: 1 }, BUY], { isPermanentDuration: true, durationEffects: [{ type: 'ADD_MONEY', amount: 1 }, BUY] });
export const figurehead = loot('figurehead', 'Figure de proue', ['DURATION'], '3 💰. Au début de votre prochain tour, +2 Cartes.', [$3], { durationEffects: [{ type: 'DRAW', amount: 2 }] });
export const hammer = loot('hammer', 'Marteau', [], '3 💰. Recevez une carte coûtant jusqu\'à 4 💰.', [$3, { type: 'GAIN_CARD', maxCost: 4, message: 'Marteau : recevez une carte coûtant jusqu\'à 4 💰' }]);
export const insignia = loot('insignia', 'Insigne', [], '3 💰. Ce tour-ci, quand vous recevez une carte, vous pouvez la placer sur votre pioche.',
    [$3, { type: 'GAINS_MAY_TOPDECK', source: 'Insigne' }]);
export const jewels = loot('jewels', 'Joyaux', ['DURATION'], '3 💰. +1 Achat. Au début de votre prochain tour, placez cette carte sous votre pioche.',
    [$3, BUY], { durationEffects: [{ type: 'BOTTOMDECK_SELF' }] });
export const orb = loot('orb', 'Orbe', [], 'Regardez votre défausse. Choisissez : jouez-y une carte Action ou Trésor ; ou +1 Achat et +3 💰.', [{ type: 'ORB' }]);
export const prize_goat = loot('prize_goat', 'Chèvre de concours', [], '3 💰. +1 Achat. Vous pouvez écarter une carte de votre main.',
    [$3, BUY, { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Chèvre de concours : vous pouvez écarter une carte' }]);
export const puzzle_box = loot('puzzle_box', 'Boîte à énigme', [], '3 💰. +1 Achat. Vous pouvez mettre de côté face cachée une carte de votre main. Prenez-la en main à la fin du tour.',
    [$3, BUY, { type: 'SET_ASIDE_UNTIL_END', message: 'Boîte à énigme : mettre de côté une carte jusqu\'à la fin du tour ?' }]);
export const sextant = loot('sextant', 'Sextant', [], '3 💰. +1 Achat. Regardez les 5 cartes du dessus de votre pioche. Défaussez-en autant que vous voulez et remettez le reste dans l\'ordre de votre choix.',
    [$3, BUY, { type: 'LOOK_DISCARD_REORDER', amount: 5, label: 'Sextant' }]);
export const shield = loot('shield', 'Bouclier', ['REACTION'], '3 💰. +1 Achat. Quand un autre joueur joue une Attaque, vous pouvez d\'abord dévoiler cette carte de votre main pour ne pas être affecté.',
    [$3, BUY], { isReaction: true, reactionTrigger: 'ATTACK', blocksAttack: true });
export const spell_scroll = loot('spell_scroll', 'Parchemin de sort', ['ACTION'], 'Écartez cette carte pour recevoir une carte moins chère. Si c\'est une carte Action ou Trésor, vous pouvez la jouer.',
    [{ type: 'SPELL_SCROLL' }]);
export const staff = loot('staff', 'Bâton', [], '3 💰. +1 Achat. Vous pouvez jouer une carte Action de votre main.',
    [$3, BUY, { type: 'MAY_PLAY_FROM_HAND', filter: { cardTypes: ['ACTION'] }, message: 'Bâton : jouer une Action de votre main ?' }]);
export const sword = loot('sword', 'Épée', ['ATTACK'], '3 💰. +1 Achat. Chaque autre joueur défausse jusqu\'à avoir 4 cartes en main.',
    [$3, BUY, { type: 'ATTACK', attackEffects: [{ type: 'DISCARD', targetSize: 4, message: 'Épée : défaussez jusqu\'à avoir 4 cartes en main' }] }]);

export const LOOT_IDS = ['amphora', 'doubloons', 'endless_chalice', 'figurehead', 'hammer', 'insignia', 'jewels', 'orb', 'prize_goat', 'puzzle_box', 'sextant', 'shield', 'spell_scroll', 'staff', 'sword'];

export const loot_pile: CardDefinition = {
    id: 'loot_pile', name: 'Butins', cost: 7, types: ['TREASURE'], expansion: 'plunder', isPile: true, isNonSupply: true,
    description: 'Une pile mélangée de 30 Butins (2 de chaque).',
    mixedPile: { type: 'SHUFFLED', cards: LOOT_IDS.flatMap(id => [id, id]) }
} as any;
