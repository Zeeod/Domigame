/**
 * RandomBot - Simplest bot implementation
 * 
 * Picks random valid actions. Useful for testing.
 */

import { GameState } from '../engine/GameState.js';
import { GameAction } from '../types/GameAction.js';
import { BotInterface, registerBot } from './BotInterface.js';
import { RulesValidator } from '../engine/RulesValidator.js';
import { CardRegistry } from '../cards/index.js';
import { PromptType } from '../engine/prompts/Prompt.js';

export class RandomBot implements BotInterface {
    readonly name = 'RandomBot';

    chooseAction(state: GameState, playerId: string): GameAction {
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return { type: 'END_PHASE' };
        }

        // If there's a pending choice, resolve it
        if (state.pendingDecision && state.pendingDecision.playerId === playerId) {
            return this.resolveChoice(state, playerId);
        }

        // Collect all valid actions
        const validActions: GameAction[] = [];

        // Check playable cards
        if (state.phase === 'ACTION' && player.actions > 0) {
            for (const card of player.hand) {
                const def = CardRegistry.get(card.id);
                if (def?.types.includes('ACTION')) {
                    const action: GameAction = { type: 'PLAY_CARD', cardInstanceId: card.instanceId };
                    if (RulesValidator.validate(state, playerId, action).valid) {
                        validActions.push(action);
                    }
                }
            }
        }

        // Check treasures (always play all treasures in BUY phase)
        if (state.phase === 'BUY' || state.phase === 'ACTION') {
            for (const card of player.hand) {
                const def = CardRegistry.get(card.id);
                if (def?.types.includes('TREASURE')) {
                    const action: GameAction = { type: 'PLAY_CARD', cardInstanceId: card.instanceId };
                    if (RulesValidator.validate(state, playerId, action).valid) {
                        validActions.push(action);
                    }
                }
            }
        }

        // Check buyable cards
        if (state.phase === 'BUY' && player.buys > 0) {
            for (const [cardId, pile] of Object.entries(state.supply)) {
                if (pile.count <= 0) continue;
                const def = CardRegistry.get(cardId);
                if (def && def.cost <= player.coins) {
                    const action: GameAction = { type: 'BUY_CARD', cardId };
                    if (RulesValidator.validate(state, playerId, action).valid) {
                        validActions.push(action);
                    }
                }
            }
        }

        // If no valid actions, end phase
        if (validActions.length === 0) {
            return { type: 'END_PHASE' };
        }

        // Pick random action
        const randomIndex = Math.floor(Math.random() * validActions.length);
        return validActions[randomIndex];
    }

    resolveChoice(state: GameState, playerId: string): GameAction {
        const choice = state.pendingDecision;
        if (!choice) {
            return { type: 'END_PHASE' };
        }

        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return { type: 'END_PHASE' };
        }

        if (choice.type === PromptType.CHOOSE_CARDS) {
            // SUPPLY Selection
            if (choice.constraints?.sourceZone === 'supply') {
                // Pick random affordable card from supply
                const maxCost = (choice as any).filter?.maxCost ?? 99;
                const affordableCards = Object.entries(state.supply)
                    .filter(([cardId, pile]) => {
                        if (pile.count <= 0) return false;
                        const def = CardRegistry.get(cardId);
                        if (!def) return false;
                        if (def.cost > maxCost) return false;
                        return true;
                    })
                    .map(([cardId]) => cardId);

                if (affordableCards.length === 0) {
                    // No valid choice, pick first available
                    const firstCard = Object.entries(state.supply).find(([_, p]) => p.count > 0)?.[0] ?? 'copper';
                    return {
                        type: 'CHOOSE',
                        choiceId: choice.id,
                        payload: { type: 'SUPPLY', cardId: firstCard }
                    };
                }

                const randomCard = affordableCards[Math.floor(Math.random() * affordableCards.length)];
                return {
                    type: 'CHOOSE',
                    choiceId: choice.id,
                    payload: { type: 'SUPPLY', cardId: randomCard }
                };
            }
            // HAND Selection
            else {
                // Pick random cards from hand
                const min = choice.constraints?.min ?? 0;
                const max = choice.constraints?.max ?? player.hand.length;
                const count = Math.min(max, Math.max(min, Math.floor(Math.random() * (max - min + 1)) + min));

                const shuffledHand = [...player.hand].sort(() => Math.random() - 0.5);
                const selectedIds = shuffledHand.slice(0, count).map(c => c.instanceId);

                return {
                    type: 'CHOOSE',
                    choiceId: choice.id,
                    payload: { type: 'CARDS', cardInstanceIds: selectedIds }
                };
            }
        } else if (choice.type === PromptType.SELECT_OPTION) {
            const options = choice.options ?? [];
            if (options.length > 0) {
                const randomIdx = Math.floor(Math.random() * options.length);
                return {
                    type: 'CHOOSE',
                    choiceId: choice.id,
                    payload: { type: 'OPTION', optionIndex: randomIdx }
                };
            } else {
                // Fallback
                return { type: 'END_PHASE' };
            }
        } else if (choice.type === PromptType.YES_NO) {
            return {
                type: 'CHOOSE',
                choiceId: choice.id,
                payload: { type: 'OPTION', choice: Math.random() > 0.5 ? 'YES' : 'NO' }
            };
        } else if (choice.type === PromptType.CONFIRM) {
            return {
                type: 'CHOOSE',
                choiceId: choice.id,
                payload: { type: 'CONFIRM' }
            };
        }


        return { type: 'END_PHASE' };
    }
}

// Register the bot
registerBot('random', () => new RandomBot());
