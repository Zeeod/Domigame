/**
 * GreedyBot - Heuristic-based bot
 * 
 * Uses simple priority rules:
 * - Always buy Province if possible
 * - Buy Gold > Silver > Copper
 * - Play all Action cards
 * - Play all Treasures
 */

import { GameState } from '../engine/GameState.js';
import { GameAction } from '../types/GameAction.js';
import { BotInterface, registerBot } from './BotInterface.js';
import { RulesValidator } from '../engine/RulesValidator.js';
import { CardRegistry } from '../cards/index.js';
import { PromptType } from '../engine/prompts/Prompt.js';

export class GreedyBot implements BotInterface {
    readonly name = 'GreedyBot';

    // Priority order for buying
    private readonly buyPriority = [
        'province',
        'gold',
        'wharf',
        'duchy',
        'rats',
        'fortress',
        'market',
        'laboratory',
        'festival',
        'smithy',
        'village',
        'silver',
    ];

    chooseAction(state: GameState, playerId: string): GameAction {
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return { type: 'END_PHASE' };
        }

        // Handle pending choice
        if (state.pendingDecision && state.pendingDecision.playerId === playerId) {
            return this.resolveChoice(state, playerId);
        }

        // ACTION phase: Play action cards then End Phase
        if (state.phase === 'ACTION') {
            if (player.actions > 0) {
                const actionCards = player.hand.filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def?.types.includes('ACTION');
                });

                if (actionCards.length > 0) {
                    const cardToPlay = this.chooseActionToPlay(player, actionCards);
                    if (cardToPlay) {
                        const action: GameAction = { type: 'PLAY_CARD', cardInstanceId: cardToPlay.instanceId };

                        if (RulesValidator.validate(state, playerId, action).valid) {
                            return action;
                        }
                    }
                }
            }

            // If no actions to play, end phase to move to Buy
            return { type: 'END_PHASE' };
        }

        // BUY phase: Play treasures FIRST
        if (state.phase === 'BUY') {
            const hasTreasure = player.hand.some(c => {
                const def = CardRegistry.get(c.id);
                return def?.types.includes('TREASURE');
            });

            if (hasTreasure) {
                const action: GameAction = { type: 'PLAY_ALL_TREASURES' };
                if (RulesValidator.validate(state, playerId, action).valid) {
                    return action;
                }
            }

            // BUY phase: Buy best affordable card
            if (player.buys > 0) {
                const cardToBuy = this.chooseBuy(state, player);
                if (cardToBuy) {
                    const action: GameAction = { type: 'BUY_CARD', cardId: cardToBuy };
                    if (RulesValidator.validate(state, playerId, action).valid) {
                        return action;
                    }
                }
            }

            // End phase
            return { type: 'END_PHASE' };
        }

        return { type: 'END_PHASE' };
    }

    resolveChoice(state: GameState, playerId: string): GameAction {
        const choice = state.pendingDecision;
        if (!choice) return { type: 'END_PHASE' };

        const player = state.players.find(p => p.id === playerId);
        if (!player) return { type: 'END_PHASE' };

        // 1. Identify source card
        const sourceCardId = (choice.context as any)?.sourceCardId || this.guessSourceFromMessage(choice.message);

        // 2. Dispatch to specific card strategy if available
        if (sourceCardId && this.strategies[sourceCardId]) {
            const action = this.strategies[sourceCardId](this, state, player, choice);
            if (action) return action;
        }

        // 3. Fallback: Generic Logic
        return this.genericFallback(state, player, choice);
    }

    private guessSourceFromMessage(msg?: string): string | undefined {
        if (!msg) return undefined;
        const lower = msg.toLowerCase();
        if (lower.includes('intendant')) return 'steward';
        if (lower.includes('pion')) return 'pawn';
        if (lower.includes('nobles')) return 'nobles';
        if (lower.includes('torturer') || lower.includes('bourreau')) return 'torturer';
        if (lower.includes('ambassador') || lower.includes('ambassadeur')) return 'ambassador';
        return undefined;
    }

    // ========================================================================
    // Card Strategies
    // ========================================================================

    private strategies: Record<string, (bot: GreedyBot, state: GameState, player: any, choice: any) => GameAction | null> = {

        // --- Seaside ---

        'nativeVillage': (_bot, _state, player, choice) => {
            // Option 0: Set Aside (Push)
            // Option 1: Take all (Pull)
            if (choice.type !== PromptType.SELECT_OPTION) return null;

            const mat = player.mats['nativeVillage'] || [];
            // If mat has cards and we can make a big turn, take them. 
            // Simple heuristic: If > 2 cards, take them.
            if (mat.length >= 2) {
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: 1 } };
            }
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: 0 } };
        },

        'navigator': (bot, _state, player, choice) => {
            // Option 0: Discard all
            // Option 1: Reorder (Keep)
            if (choice.type !== PromptType.SELECT_OPTION) return null;

            // Cards should be in 'aside' zone usually.
            const cards = player.aside || [];
            if (cards.length === 0) return null; // Can't see them?

            // Calc average value
            let totalValue = 0;
            let actionCount = 0;
            for (const c of cards) {
                totalValue += bot.evaluateCard(c.id);
                const def = CardRegistry.get(c.id);
                if (def?.types.includes('ACTION')) actionCount++;
            }
            const avg = totalValue / cards.length;

            // Discard if poor quality (mostly copper/green) and no actions
            if (avg < 2 && actionCount === 0) {
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: 0 } };
            }

            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: 1 } };
        },

        'lookout': (bot, _state, player, choice) => {
            // Three steps: Trash, Discard, Reorder(implicit)
            // Decision 1: Trash (CHOOSE_FROM_ZONE)
            if (choice.message.includes('ÉCARTER') || choice.message.includes('TRASH')) {
                // Trash the WORST card
                const cards: any[] = choice.constraints?.sourceZone === 'aside' ? player.aside : [];
                if (cards.length === 0) return null; // Fallback

                const sorted = bot.sortParams(cards); // Worst first
                const toTrash = sorted[0];
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [toTrash.instanceId] } };
            }

            // Decision 2: Discard (CHOOSE_FROM_ZONE)
            if (choice.message.includes('DÉFAUSSER') || choice.message.includes('DISCARD')) {
                // Discard the remaining WORST card
                const cards: any[] = choice.constraints?.sourceZone === 'aside' ? player.aside : [];
                if (cards.length === 0) return null;

                const sorted = bot.sortParams(cards);
                const toDiscard = sorted[0];
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [toDiscard.instanceId] } };
            }

            return null;
        },

        'salvager': (bot, _state, player, choice) => {
            // Trash a card from hand for value
            // Priority: Curse > Estate(if early) > Copper > High Value Naaah
            // Actually Salvager gives coin = cost. 
            // Trashing Curse (0) gives 0 coin. Trashing Copper (0) gives 0.
            // Trashing Estate (2) gives 2 coin.

            // Strategy: Trash Curse always (cleanup). Trash Estate if we need money.
            // If late game, maybe don't trash Estate? 
            // GreedyBot simplifies: Burn bad cards.

            const hand = player.hand;
            const curse = hand.find((c: any) => c.id === 'curse');
            if (curse) return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [curse.instanceId] } };

            const estate = hand.find((c: any) => c.id === 'estate');
            if (estate) return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [estate.instanceId] } };

            const copper = hand.find((c: any) => c.id === 'copper');
            if (copper) return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [copper.instanceId] } };

            // Default: Trash cheapest card
            const sorted = bot.sortParams(hand);
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [sorted[0].instanceId] } };
        },

        'treasure_map': (_bot, _state, player, choice) => {
            // Always Trash if we have 2!
            // The prompt asks to trash "this and another". 
            // If we are here, we played one. Does the bot SDK expose the 'played' card logic? 
            // The constraint effectively handles it. We just need to select the cards.
            // If we have another T-Map in hand, SELECT IT.
            const tmaps = player.hand.filter((c: any) => c.id === 'treasure_map');
            if (tmaps.length > 0) {
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [tmaps[0].instanceId] } };
            }
            return null; // Fallback
        },

        'ambassador': (_bot, _state, player, choice) => {
            // Return up to 2 cards to supply.
            // Ideally return Curse, or Copper, or Estate.
            // Check constraints: min 0, max 2.
            const badCards = player.hand.filter((c: any) => ['curse', 'copper', 'estate'].includes(c.id));
            // Prefer duplicates to attack opponents? 
            // Ambassador rule: Return 1 or 2 copies of same card.
            // So we must group by ID.

            const groups: Record<string, any[]> = {};
            badCards.forEach((c: any) => {
                if (!groups[c.id]) groups[c.id] = [];
                groups[c.id].push(c);
            });

            // Pick group with max count
            let bestId = null;
            let maxCount = 0;
            for (const id in groups) {
                if (groups[id].length > maxCount) {
                    maxCount = groups[id].length;
                    bestId = id;
                }
            }

            if (bestId && maxCount > 0) {
                const returnCount = Math.min(2, maxCount);
                const toReturn = groups[bestId].slice(0, returnCount).map((c: any) => c.instanceId);
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: toReturn } };
            }

            // Return nothing
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: [] } };
        },

        // --- Intrigue / Base Extensions ---

        'pawn': (_bot, _state, _player, choice) => {
            // +1 Action, +1 Card, +1 Buy, +1 Money
            // Always pick +1 Card, +1 Action if possible to cycle.
            if (choice.type !== PromptType.SELECT_OPTION) return null;
            const options = choice.options || [];

            // Simple greedy: +1 Card is usually best. +1 Action if we have actions.
            options.findIndex((o: any) => o.label === '+1 Action');
            const cardIdx = options.findIndex((o: any) => o.label === '+1 Carte');
            const moneyIdx = options.findIndex((o: any) => o.label === '+1 💰');

            // If this is the first choice (count 2 usually, need to pick 1)
            // ... wait, Pawn prompt is usually "Choose 2". Does `Prompt` allow multi-select options?
            // My implementation of Pawn uses `CHOOSE_OPTION` with `count: 2`.
            // But the bot interface `SELECT_OPTION` implies picking an `optionIndex`. If `count` > 1, 
            // the engine might expect sequential or array payload.
            // Current strict typing says `optionIndex: number`. 
            // If engine supports array `optionIndices`, I should use that.
            // Let's assume standard engine calls bot repeatedly for each choice OR bot sends array if supported.
            // Checking `GameAction`: `payload: { type: 'OPTION', optionIndex: number }`.
            // It seems current bot interface only supports SINGLE option selection per action?
            // If so, multi-select might be broken for bots or handled as multiple steps.
            // Assuming multiple steps or single choice for now. 

            if (cardIdx !== -1) return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: cardIdx } };
            if (moneyIdx !== -1) return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: moneyIdx } };
            return null;
        },

        'torturer': (_bot, _state, player, choice) => {
            // Discard 2 OR Gain Curse
            // Option 0: Discard 2
            // Option 1: Gain Curse
            // Discard 2 is usually better unless hand is empty or all Gold.
            if (choice.type !== PromptType.SELECT_OPTION) return null;

            if (player.hand.length >= 2) {
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: 0 } };
            }
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: 1 } };
        },

        'steward': (_bot, _state, player, choice) => {
            if (choice.type !== PromptType.SELECT_OPTION) return null;
            const options = choice.options || [];

            // Trash if we have junk
            const junk = player.hand.filter((c: any) => ['curse', 'estate', 'copper'].includes(c.id));
            if (junk.length >= 2) {
                const trashIdx = options.findIndex((o: any) => o.label.includes('Écarter'));
                if (trashIdx !== -1) return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: trashIdx } };
            }

            // Else +2 Cards
            const drawIdx = options.findIndex((o: any) => o.label.includes('+2 Cartes'));
            if (drawIdx !== -1) return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: drawIdx } };

            return null;
        }

    };

    // ========================================================================
    // Helpers
    // ========================================================================

    private evaluateCard(cardId: string): number {
        switch (cardId) {
            case 'province': return 8;
            case 'gold': return 6;
            case 'duchy': return 2; // Less than silver usually
            case 'silver': return 3;
            case 'copper': return 1;
            case 'curse': return -1;
            case 'estate': return 0;
            default: return 3; // Average action value
        }
    }

    // Sorts cards from WORST to BEST
    private sortParams(cards: any[]): any[] {
        return [...cards].sort((a, b) => this.evaluateCard(a.id) - this.evaluateCard(b.id));
    }

    private genericFallback(state: GameState, player: any, choice: any): GameAction {
        // ... (Existing Logic simplified) ...

        // Handle CHOOSE_CARDS
        if (choice.type === PromptType.CHOOSE_CARDS) {
            // Supply Logic
            if (choice.constraints?.sourceZone === 'supply') {
                const maxCost = choice.constraints.filter?.maxCost ?? 99;
                for (const cardId of this.buyPriority) {
                    const pile = state.supply[cardId];
                    if (!pile || pile.count <= 0) continue;
                    const def = CardRegistry.get(cardId);
                    if (!def || def.cost > maxCost) continue;
                    return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'SUPPLY', cardId } };
                }
                return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'SUPPLY', cardId: 'silver' } };
            }

            // Hand/Discard Logic
            const min = choice.constraints?.min ?? 0;
            const sorted = this.sortParams(player.hand);
            // Default: Select first N (worst)
            const selected = sorted.slice(0, min).map(c => c.instanceId);
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CARDS', cardInstanceIds: selected } };
        }

        // Handle YES/NO
        if (choice.type === PromptType.YES_NO) {
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', choice: 'YES' } };
        }

        // Handle SELECT_OPTION (Default: First)
        if (choice.type === PromptType.SELECT_OPTION) {
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'OPTION', optionIndex: 0 } };
        }

        // Handle CONFIRM
        if (choice.type === PromptType.CONFIRM) {
            return { type: 'CHOOSE', choiceId: choice.id, payload: { type: 'CONFIRM' } };
        }

        return { type: 'END_PHASE' };
    }

    private chooseActionToPlay(player: any, availableActions: any[]): any {
        // 1. If actions low (< 2), prioritize Villages (+Actions)
        if (player.actions < 2) {
            const villages = availableActions.filter(c => {
                const def = CardRegistry.get(c.id);
                // Check if card gives +2 Actions or more
                // Simplified check: effect type ADD_ACTIONS and amount >= 2
                return def?.effects?.some((e: any) => e.type === 'ADD_ACTIONS' && e.amount >= 2);
            });
            if (villages.length > 0) return villages[0];
        }

        // 2. If we have actions, prioritize Draw (+Cards)
        if (player.actions > 0) {
            const drawers = availableActions.filter(c => {
                const def = CardRegistry.get(c.id);
                return def?.effects?.some((e: any) => e.type === 'DRAW');
            });
            if (drawers.length > 0) {
                // Sort by draw amount descending
                return drawers.sort((a, b) => {
                    const defA = CardRegistry.get(a.id);
                    const defB = CardRegistry.get(b.id);
                    const drawA = (defA?.effects?.find((e: any) => e.type === 'DRAW') as any)?.amount || 0;
                    const drawB = (defB?.effects?.find((e: any) => e.type === 'DRAW') as any)?.amount || 0;
                    return drawB - drawA;
                })[0];
            }
        }

        // 3. Fallback: High Cost Actions (Terminal)
        return availableActions.sort((a, b) => {
            const defA = CardRegistry.get(a.id);
            const defB = CardRegistry.get(b.id);
            return (defB?.cost || 0) - (defA?.cost || 0);
        })[0];
    }

    private chooseBuy(state: GameState, player: any): string | null {
        // Calculate Deck Stats (Big Money logic)
        const stats = this.calculateDeckStats(player);
        const deckAvg = stats.totalValue / stats.totalCards;

        // Big Money Thresholds
        // If average value is high (> 1.2), we want Gold/Province
        // If average value is low, we might want Silver or Engine pieces

        // 1. Always buy Province if affordable
        if (player.coins >= 8 && state.supply['province']?.count > 0) return 'province';

        // 2. Buy Duchy if late game (Province < 4)
        if (state.supply['province']?.count <= 4 && player.coins >= 5 && state.supply['duchy']?.count > 0) return 'duchy';

        // 3. Dynamic Logic
        if (deckAvg > 1.2) {
            // High density: Go for Gold
            if (player.coins >= 6 && state.supply['gold']?.count > 0) return 'gold';
            if (player.coins >= 5 && state.supply['market']?.count > 0) return 'market'; // Engine piece
        } else {
            // Low density: Fix it with Silver or good actions
            if (player.coins >= 3 && state.supply['silver']?.count > 0) return 'silver';
        }

        // 4. Fallback to existing priority list
        for (const cardId of this.buyPriority) {
            const pile = state.supply[cardId];
            if (!pile || pile.count <= 0) continue;
            const def = CardRegistry.get(cardId);
            if (!def || def.cost > player.coins) continue;
            return cardId;
        }

        // 5. Estate Logic (Endgame Hail Mary)
        if (state.supply['province']?.count <= 2 && player.coins >= 2 && state.supply['estate']?.count > 0) {
            return 'estate';
        }

        return null;
    }

    private calculateDeckStats(player: any): { totalValue: number, totalCards: number } {
        const allCards = [
            ...player.hand,
            ...player.discardPile,
            ...player.deck,
            ...player.playArea
        ];

        let totalValue = 0;
        for (const c of allCards) {
            const def = CardRegistry.get(c.id);
            totalValue += def?.treasureValue || 0;
        }

        return { totalValue, totalCards: allCards.length };
    }
}

// Register the bot
registerBot('greedy', () => new GreedyBot());
