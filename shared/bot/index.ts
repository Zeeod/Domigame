/**
 * Bot module exports
 */

export type { BotInterface, BotType } from './BotInterface.js';
export { createBot, registerBot, getAvailableBots } from './BotInterface.js';
export { RandomBot } from './RandomBot.js';
export { GreedyBot } from './GreedyBot.js';
