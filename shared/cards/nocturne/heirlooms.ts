import { CardDefinition } from '../../types/CardDefinition.js';

/** Nocturne — the 7 Heirlooms (they replace a starting Copper). */
const hl = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'nocturne', isNonSupply: true, isSubCard: true, description, treasureValue: 0, effects, ...extra
} as any);

export const HauntedMirror = hl('haunted_mirror', 'Miroir hanté', 0, ['TREASURE', 'HEIRLOOM'],
    '1 💰. Quand vous écartez cette carte, vous pouvez défausser une Action pour recevoir un Fantôme de sa pile.',
    [{ type: 'ADD_MONEY', amount: 1 }], { onTrash: [{ type: 'HAUNTED_MIRROR' }] });
export const MagicLamp = hl('magic_lamp', 'Lampe magique', 0, ['TREASURE', 'HEIRLOOM'],
    '1 💰. Quand vous jouez cette carte, si vous avez au moins 6 cartes en jeu dont vous n\'avez qu\'un exemplaire, écartez-la. Si vous le faites, recevez 3 Vœux.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'MAGIC_LAMP' }]);
export const Goat = hl('goat', 'Chèvre', 2, ['TREASURE', 'HEIRLOOM'],
    '1 💰. Quand vous jouez cette carte, vous pouvez écarter une carte de votre main.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Chèvre : vous pouvez écarter une carte' }]);
export const Pasture = hl('pasture', 'Pâturage', 2, ['TREASURE', 'VICTORY', 'HEIRLOOM'],
    '1 💰. Vaut 1 PV par Domaine que vous possédez.',
    [{ type: 'ADD_MONEY', amount: 1 }], { dynamicVP: true, vpCalculator: (all: any[]) => all.filter((c: any) => c.id === 'estate').length });
export const Pouch = hl('pouch', 'Bourse', 2, ['TREASURE', 'HEIRLOOM'], '1 💰. +1 Achat.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }]);
export const CursedGold = hl('cursed_gold', 'Or maudit', 4, ['TREASURE', 'HEIRLOOM'], '3 💰. Quand vous jouez cette carte, recevez une Malédiction.',
    [{ type: 'ADD_MONEY', amount: 3 }, { type: 'GAIN_CARD', cardId: 'curse' }]);
export const LuckyCoin = hl('lucky_coin', 'Pièce porte-bonheur', 4, ['TREASURE', 'HEIRLOOM'], '1 💰. Quand vous jouez cette carte, recevez un Argent.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'GAIN_CARD', cardId: 'silver' }]);
