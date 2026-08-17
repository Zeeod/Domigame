import { GameState, PlayerState, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EconomyEngine } from '../EconomyEngine.js';

export class ConditionEffectHandler {
    static handleCondition(state: GameState, player: PlayerState, effect: any, ctx: any = {}): EffectResult {
        const success = this.evaluateCondition(state, player, effect);
        const nextEffects = success ? effect.trueEffects : effect.falseEffects;

        if (nextEffects && nextEffects.length > 0) {
            const effectObjs = nextEffects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e,
                context: { sourceCardInstanceId: ctx.sourceCardInstanceId }
            }));
            state.effectStack.push(...effectObjs.reverse());
        }

        return { state, needsChoice: false };
    }

    private static evaluateCondition(state: GameState, player: PlayerState, effect: any): boolean {
        switch (effect.condition) {
            case 'HAND_SIZE':
                return this.compare(player.hand.length, effect.comparator, effect.value);
            case 'ALL_CARDS_UNIQUE_IN_HAND': {
                const cardNames = player.hand.map(c => c.id);
                const uniqueNames = new Set(cardNames);
                return uniqueNames.size === cardNames.length;
            }
            case 'ACTIONS_PLAYED':
                return this.compare(player.actionsPlayed || 0, effect.comparator, effect.value);
            case 'PHASE':
                return state.phase === effect.value;
            case 'CARDS_IN_PLAY_COUNT': {
                let cards = player.playArea;
                if (effect.filter) {
                    cards = cards.filter(c => {
                        const def = CardRegistry.get(c.id);
                        if (!def) return false;
                        if (effect.filter.cardTypes) {
                            return effect.filter.cardTypes.some((t: string) => def.types.includes(t.toUpperCase() as any));
                        }
                        if (effect.filter.cardIds) {
                            return effect.filter.cardIds.includes(c.id);
                        }
                        return true;
                    });
                }
                return this.compare(cards.length, effect.comparator, effect.value);
            }
            case 'DISCARD_COUNT': {
                let cards = player.discardPile;
                if (effect.filter) {
                    cards = cards.filter(c => {
                        const def = CardRegistry.get(c.id);
                        if (!def) return false;
                        if (effect.filter.cardTypes) {
                            return effect.filter.cardTypes.some((t: string) => def.types.includes(t.toUpperCase() as any));
                        }
                        return true;
                    });
                } else if (state.lastDecisionResults?.cards) {
                    // Legacy behavior for manual discards
                    return this.compare(state.lastDecisionResults.cards.length, effect.comparator, effect.value);
                }
                return this.compare(cards.length, effect.comparator, effect.value);
            }
            case 'COFFERS':
                return this.compare(player.tokens.coffers || 0, effect.comparator, effect.value);
            case 'VILLAGERS':
                return this.compare(player.tokens.villagers || 0, effect.comparator, effect.value);
            case 'FIRST_TIME_PLAYED_THIS_TURN':
                // actionsPlayed is incremented just before effects are executed, so 1 means it's the first one.
                return (player.actionsPlayed || 0) <= 1;
            case 'FIRST_TIME_THIS_TURN_GLOBAL': {
                const flag = effect.value;
                if (player.turnFlags[flag]) return false;
                player.turnFlags[flag] = true; // Side effect: set the flag if it was false
                return true;
            }
            case 'NO_ACTIONS_IN_HAND': {
                const hasAction = player.hand.some(c => {
                    const def = CardRegistry.get(c.id);
                    return def && def.types.includes('ACTION');
                });
                return !hasAction;
            }
            case 'LAST_TRASHED_MIN_COST': {
                if (!state.lastTrashedCard) return false;
                const cost = EconomyEngine.getCardCost(state, player.id, state.lastTrashedCard.id);
                return cost >= (effect.value ?? 0);
            }
            case 'LAST_TRASHED_HAS_TYPE': {
                if (!state.lastTrashedCard) return false;
                const def = CardRegistry.get(state.lastTrashedCard.id);
                return def?.types.includes(effect.value?.toUpperCase()) || false;
            }
            case 'EMPTY_PILES':
                const emptyCount = Object.values(state.supply).filter(p => p.count <= 0).length;
                return this.compare(emptyCount, effect.comparator, effect.value);
            case 'DECK_SIZE':
                return this.compare(player.deck.length + player.discardPile.length, effect.comparator, effect.value);
            case 'EXILE_NEW_CARD': {
                if (!state.lastDecisionResults?.cards || state.lastDecisionResults.cards.length === 0) return false;
                const card = state.lastDecisionResults.cards[0];
                const count = (player.exileMat || []).filter(c => c.id === card.id).length;
                // If count is 1, it means this was the first one (since it was just added)
                return count === 1;
            }
            case 'IS_OTHER_PLAYERS_TURN': {
                const currentPlayer = state.players[state.currentPlayerIndex];
                return currentPlayer.id !== player.id;
            }
            case 'PILE_HAS_VP': {
                const pileId = effect.pileId || 'farmers_market';
                const pile = state.supply[pileId];
                return (pile?.tokens?.['vp'] || 0) > 0;
            }
            case 'IS_VICTORY': {
                const card = state.lastGainedCard || state.lastDecisionResults?.cards?.[0];
                if (!card) return false;
                const def = CardRegistry.get(card.id);
                return def?.types.includes('VICTORY') || false;
            }
            case 'IS_ACTION': {
                const card = state.lastGainedCard || state.lastDecisionResults?.cards?.[0];
                if (!card) return false;
                const def = CardRegistry.get(card.id);
                return def?.types.includes('ACTION') || false;
            }
            case 'IS_TREASURE': {
                const card = state.lastGainedCard || state.lastDecisionResults?.cards?.[0];
                if (!card) return false;
                const def = CardRegistry.get(card.id);
                return def?.types.includes('TREASURE') || false;
            }
            default:
                console.warn(`Condition ${effect.condition} not implemented.`);
                return false;
        }
    }

    private static compare(val: number, op: string, target: any): boolean {
        const t = (typeof target === 'number') ? target : parseInt(target);
        if (isNaN(t)) return false;

        switch (op) {
            case '>=': return val >= t;
            case '<=': return val <= t;
            case '>': return val > t;
            case '<': return val < t;
            case '==':
            case '=': return val === t;
            case '!=': return val !== t;
            default: return val === t;
        }
    }
}
