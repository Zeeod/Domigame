export * from './cards.js';
export * from './horse.js';
export * from './ways.js';
export * from './events.js';

import * as cards from './cards.js';
import * as horse from './horse.js';
import * as ways from './ways.js';
import * as events from './events.js';

export const MenagerieCards = { ...cards, ...horse, ...ways, ...events };
