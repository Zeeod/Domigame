
import { CardDefinition } from '../../types/CardDefinition.js';




export * from './alchemist.js';
export * from './apothecary.js';
export * from './apprentice.js';
export * from './familiar.js';
export * from './golem.js';
export * from './herbalist.js';
export * from './philosophers_stone.js';
export * from './possession.js';
export * from './scrying_pool.js';
export * from './transmute.js';
export * from './university.js';
export * from './vineyard.js';

export const Potion: CardDefinition = {
    id: 'potion',
    name: 'Potion',
    types: ['TREASURE'],
    cost: 4,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "Une Potion.",
    potionValue: 1,
};

