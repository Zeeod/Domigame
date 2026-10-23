import { CardDefinition } from '../../types/CardDefinition.js';

/** Nocturne — the 12 Boons (official texts). */
const boon = (id: string, name: string, description: string, effects: any[]): CardDefinition => ({
    id, name, cost: 0, types: ['BOON'], expansion: 'nocturne', isNonSupply: true, description, effects
} as any);

export const TheEarthsGift = boon('the_earths_gift', 'Don de la terre', 'Vous pouvez défausser un Trésor pour recevoir une carte coûtant jusqu\'à 4 💰.',
    [{ type: 'DISCARD', min: 0, max: 1, filter: { cardTypes: ['TREASURE'] }, message: 'Don de la terre : défausser un Trésor pour une carte jusqu\'à 4 💰 ?', onSuccess: [{ type: 'GAIN_CARD', maxCost: 4 }] }]);
export const TheFieldsGift = boon('the_fields_gift', 'Don des champs', '+1 Action, +1 💰. (Gardez-le jusqu\'à l\'Ajustement.)',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }]);
export const TheFlamesGift = boon('the_flames_gift', 'Don des flammes', 'Vous pouvez écarter une carte de votre main.',
    [{ type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Don des flammes : vous pouvez écarter une carte' }]);
export const TheForestsGift = boon('the_forests_gift', 'Don de la forêt', '+1 Achat, +1 💰. (Gardez-le jusqu\'à l\'Ajustement.)',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }]);
export const TheMoonsGift = boon('the_moons_gift', 'Don de la lune', 'Regardez votre défausse. Vous pouvez en placer une carte sur votre pioche.', [{ type: 'MOONS_GIFT' }]);
export const TheMountainsGift = boon('the_mountains_gift', 'Don de la montagne', 'Recevez un Argent.', [{ type: 'GAIN_CARD', cardId: 'silver' }]);
export const TheRiversGift = boon('the_rivers_gift', 'Don de la rivière', '+1 Carte à la fin de ce tour. (Gardez-le jusqu\'à l\'Ajustement.)', [{ type: 'ADD_NEXT_TURN_DRAW', amount: 1 }]);
export const TheSeasGift = boon('the_seas_gift', 'Don de la mer', '+1 Carte.', [{ type: 'DRAW', amount: 1 }]);
export const TheSkysGift = boon('the_skys_gift', 'Don du ciel', 'Vous pouvez défausser 3 cartes pour recevoir un Or.', [{ type: 'SKYS_GIFT' }]);
export const TheSunsGift = boon('the_suns_gift', 'Don du soleil', 'Regardez les 4 cartes du dessus de votre pioche. Défaussez-en autant que vous voulez et remettez les autres dans l\'ordre de votre choix.', [{ type: 'SUNS_GIFT' }]);
export const TheSwampsGift = boon('the_swamps_gift', 'Don du marais', 'Recevez un Feu follet de sa pile.', [{ type: 'GAIN_CARD', cardId: 'will_o_wisp' }]);
export const TheWindsGift = boon('the_winds_gift', 'Don du vent', '+2 Cartes. Défaussez 2 cartes.',
    [{ type: 'DRAW', amount: 2 }, { type: 'DISCARD', min: 2, max: 2, message: 'Don du vent : défaussez 2 cartes' }]);

export const ALL_BOONS = [TheEarthsGift, TheFieldsGift, TheFlamesGift, TheForestsGift, TheMoonsGift, TheMountainsGift,
    TheRiversGift, TheSeasGift, TheSkysGift, TheSunsGift, TheSwampsGift, TheWindsGift];
