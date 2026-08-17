import { BotInterface } from './BotInterface.js';
import { GameState } from '../engine/GameState.js';
import { GameAction } from '../types/GameAction.js';
import { CardRegistry } from '../cards/index.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import { DeckEvaluator } from './DeckEvaluator.js';

// MCTS Node
class MCTSNode {
    state: GameState;
    action?: GameAction; // Action taken to reach this state (undefined for root)
    parent?: MCTSNode;
    children: MCTSNode[] = [];
    wins: number = 0;
    visits: number = 0;
    untriedActions: GameAction[] = [];
    playerId: string;

    constructor(state: GameState, playerId: string, parent?: MCTSNode, action?: GameAction) {
        this.state = state;
        this.playerId = playerId;
        this.parent = parent;
        this.action = action;
    }

    isFullyExpanded(): boolean {
        return this.untriedActions.length === 0 && this.children.length > 0;
    }

    getUCT(c: number = 1.41): number {
        if (this.visits === 0) return Infinity;
        return (this.wins / this.visits) + c * Math.sqrt(Math.log(this.parent!.visits) / this.visits);
    }
}

export class SmartBot implements BotInterface {
    readonly name = 'smart';
    private simulationDepth = 20;
    private computationBudgetMs = 300; // Increased for better decision making
    private c = 1.41; // Exploration constant

    chooseAction(state: GameState, playerId: string): GameAction {
        const root = new MCTSNode(state, playerId); // No need to clone, state is immutable

        root.untriedActions = this.getValidActions(root.state, playerId);

        // If only 1 action (End Phase), just return it
        if (root.untriedActions.length === 1) {
            return root.untriedActions[0];
        }

        // Standard MCTS Loop
        const endTime = Date.now() + this.computationBudgetMs;

        let iterations = 0;
        while (Date.now() < endTime) {
            const node = this.select(root);
            const child = this.expand(node);
            const score = this.simulate(child);
            this.backpropagate(child, score);
            iterations++;
        }

        // Return best child action (most visited)
        if (root.children.length === 0) {
            console.warn('[SmartBot] No children expanded? returning END_PHASE');
            return { type: 'END_PHASE' };
        }

        const bestChild = root.children.reduce((best, node) =>
            node.visits > best.visits ? node : best
            , root.children[0]);

        if (true) { // Forced logging for debugging - keeping it
            // console.log(`[SmartBot] MCTS Complete. Iterations: ${iterations}`);
        }

        return bestChild?.action || { type: 'END_PHASE' };
    }

    resolveChoice(state: GameState, playerId: string): GameAction {
        const decision = state.pendingDecision;
        if (!decision) return { type: 'END_PHASE' }; // Should not happen

        if (decision.playerId !== playerId) {
            console.error(`[SmartBot] Asked to resolve choice for ${decision.playerId} but bot is ${playerId}`);
        }

        switch (decision.type) {
            case 'CHOOSE_CARDS':
                const min = decision.constraints?.min || 0;
                const source = decision.constraints?.sourceZone || 'HAND';

                // Simple heuristic: Pick first available cards up to min
                // TODO: Evaluate best discard/trash/gain
                const player = state.players.find(p => p.id === playerId);
                if (!player) return { type: 'END_PHASE' }; // Error

                let availableCards: string[] = [];
                if (source === 'HAND') {
                    availableCards = player.hand.map(c => c.instanceId);
                } else if (source === 'discardPile') {
                    availableCards = player.discardPile.map(c => c.instanceId);
                }
                // Supply handling etc.

                const count = min;
                const selected = availableCards.slice(0, count);

                return {
                    type: 'CHOOSE',
                    choiceId: decision.id,
                    payload: {
                        type: 'CARDS',
                        cardInstanceIds: selected
                    }
                };

            case 'SELECT_OPTION':
                // Pick first option
                return {
                    type: 'CHOOSE',
                    choiceId: decision.id,
                    payload: {
                        type: 'OPTION',
                        optionIndex: 0
                    }
                };

            case 'REVEAL':
                return {
                    type: 'ACKNOWLEDGE_REVEAL',
                    choiceId: decision.id, // Not used but checking type
                } as any;

            default:
                // Fallback for unknown decision types - try to pass if possible
                if (decision.optional) {
                    return {
                        type: 'CHOOSE',
                        choiceId: decision.id,
                        payload: { type: 'PASS' }
                    };
                }
                // Try to pick something?
                return {
                    type: 'CHOOSE',
                    choiceId: decision.id,
                    payload: { type: 'PASS' } // Hope it works
                };
        }
    }

    // --- MCTS Steps ---

    private select(node: MCTSNode): MCTSNode {
        while (node.isFullyExpanded() && node.children.length > 0) {
            node = node.children.reduce((best, child) =>
                child.getUCT(this.c) > best.getUCT(this.c) ? child : best
            );
        }
        return node;
    }

    private expand(node: MCTSNode): MCTSNode {
        if (node.untriedActions.length === 0) {
            return node;
        }

        const action = node.untriedActions.pop()!;
        let nextState = node.state; // ActionResolver returns NEW state

        try {
            const result = ActionResolver.resolve(node.state, node.playerId, action);
            if (result.success) {
                nextState = result.state;
            }
        } catch (e) {
            console.error('[SmartBot] Expansion Failed:', e);
        }

        const child = new MCTSNode(nextState, node.playerId, node, action);
        child.untriedActions = this.getValidActions(nextState, node.playerId);
        node.children.push(child);
        return child;
    }

    private simulate(node: MCTSNode): number {
        let currentState = node.state;
        let depth = 0;

        while (depth < this.simulationDepth) {
            if (this.isGameOver(currentState)) break;

            const validActions = this.getValidActions(currentState, node.playerId);
            if (validActions.length === 0) break;

            const randomAction = validActions[Math.floor(Math.random() * validActions.length)];
            try {
                const result = ActionResolver.resolve(currentState, node.playerId, randomAction);
                if (result.success) {
                    currentState = result.state;
                } else {
                    // If random action failed, just skip or break
                    break;
                }
            } catch (e) {
                break;
            }
            depth++;
        }

        return this.evaluateState(currentState, node.playerId);
    }

    private backpropagate(node: MCTSNode, score: number): void {
        while (node) {
            node.visits++;
            node.wins += score;
            node = node.parent!;
        }
    }

    // --- Helpers ---

    private getValidActions(state: GameState, playerId: string): GameAction[] {
        const actions: GameAction[] = [];
        const player = state.players.find(p => p.id === playerId);
        if (!player) return [];

        actions.push({ type: 'END_PHASE' });

        if (state.phase === 'ACTION') {
            const uniqueActions = new Set<string>();
            player.hand.forEach(c => {
                const def = CardRegistry.get(c.id);
                if (def && def.types.includes('ACTION') && !uniqueActions.has(c.id)) {
                    uniqueActions.add(c.id);
                    actions.push({ type: 'PLAY_CARD', cardInstanceId: c.instanceId });
                }
            });
        }
        else if (state.phase === 'BUY') {
            const hasTreasures = player.hand.some(c => {
                const def = CardRegistry.get(c.id);
                return def && def.types.includes('TREASURE');
            });
            if (hasTreasures) {
                actions.push({ type: 'PLAY_ALL_TREASURES' });
            }

            if (player.buys > 0) {
                for (const cardId in state.supply) {
                    const pile = state.supply[cardId];
                    const def = CardRegistry.get(cardId);
                    if (pile.count > 0 && def && def.cost <= player.coins) {
                        actions.push({ type: 'BUY_CARD', cardId });
                    }
                }
            }
        }

        return actions;
    }


    // ... (rest of the file)
    private evaluateState(state: GameState, playerId: string): number {
        // Delegate to DeckEvaluator for a robust heuristic
        const player = state.players.find(p => p.id === playerId);
        if (!player) return 0;
        return DeckEvaluator.evaluateDeck(state, player);
    }

    private isGameOver(state: GameState): boolean {
        if (state.supply['province']?.count === 0) return true;
        let emptyPiles = 0;
        for (const key in state.supply) {
            if (state.supply[key].count === 0) emptyPiles++;
        }
        return emptyPiles >= 3;
    }
}


// Register as 'smart' bot
import { registerBot } from './BotInterface.js';
registerBot('smart', () => new SmartBot());
