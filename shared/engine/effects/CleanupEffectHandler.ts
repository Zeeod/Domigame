import { GameState, PlayerState, EffectResult, getCurrentPlayer } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { DurationManager } from '../DurationManager.js';
import { VictoryChecker } from '../VictoryChecker.js';
import { PhaseEngine } from '../PhaseEngine.js';
import { LandscapeRegistry } from '../../cards/landscapes/index.js';
import { LandscapeManager } from '../LandscapeManager.js';
import { Logger } from '../Logger.js';
import { resetTurnResources } from '../PlayerState.js';
import { ZoneManager } from '../ZoneManager.js';
import { EffectManager } from '../EffectManager.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';
import { ProphecyManager } from '../ProphecyManager.js';

export class CleanupEffectHandler {
    /**
     * Start the cleanup process for a player
     */
    public static handlePerformCleanup(state: GameState, player: PlayerState): EffectResult {
        // Recursion guard
        if (state.effectStack.some(e => (e.effect as any)?.type === 'FINALIZE_CLEANUP')) {
            return { state, needsChoice: false };
        }

        // 1. Move Hand to Discard with triggers
        if (player.hand.length > 0) {
            const handCards = [...player.hand];
            player.discardPile.push(...player.hand);
            player.hand = [];

            // Trigger ON_DISCARD for cards in hand
            handCards.forEach(card => {
                TriggerEffectHandler.scanForTriggers(state, player, 'ON_DISCARD' as any, { cardId: card.id, instanceId: card.instanceId });
            });
        }

        // 2. Prepare Finalize effect
        state.effectStack.push({
            type: 'EFFECT',
            playerId: player.id,
            effect: { type: 'FINALIZE_CLEANUP' } as any
        });

        // 3. Trigger ON_CLEANUP triggers (from cards in play and dynamic triggers)
        const cleanupTriggers = TriggerEffectHandler.scanForTriggers(state, player, 'ON_CLEANUP' as any);
        if (cleanupTriggers.length > 0) {
            EffectManager.resolveTriggers(state, player, cleanupTriggers, "Effets de fin de tour");
            
            const executedIndices = cleanupTriggers.filter(t => (t as any).once && (t as any).originalIndex !== undefined).map(t => (t as any).originalIndex);
            if (executedIndices.length > 0 && state.triggers) {
                state.triggers = state.triggers.filter((_, i) => !executedIndices.includes(i));
            }
        }

        // 4. Legacy onCleanup (if any)
        for (const c of player.playArea) {
            const def = CardRegistry.get(c.id);
            if (def?.onCleanup) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: { type: 'RECURSIVE_APPLY', effects: def.onCleanup } as any,
                    context: { sourceCardInstanceId: c.instanceId }
                });
            }
        }

        return { state, needsChoice: false };
    }

    /**
     * Finalize the cleanup process (discarding played cards, drawing new hand)
     */
    public static handleFinalizeCleanup(state: GameState, player: PlayerState): EffectResult {
        const toDiscard: any[] = [];
        const toKeep: any[] = [];

        const keepIds = DurationManager.processCleanup(state, player);

        player.playArea.forEach(card => {
            if (keepIds.includes(card.instanceId)) {
                toKeep.push(card);
            } else {
                if (card.isResolved) delete card.isResolved;
                if (card.durationTurns !== undefined) delete card.durationTurns;
                toDiscard.push(card);
            }
        });

        for (const card of toDiscard) {
            const def = CardRegistry.get(card.id);
            if (def) {
                // Plunder: Tireless Trait
                const pile = state.supply[card.id];
                if (pile && pile.traits?.includes('tireless')) {
                    state.effectStack.push({
                        type: 'EFFECT',
                        playerId: player.id,
                        effect: {
                            type: 'SELECT_OPTION',
                            message: `Infatigable : Voulez-vous mettre votre ${def.name} sur votre deck ?`,
                            options: [
                                { label: 'Oui', effects: [{ type: 'MOVE_TO_ZONE', sourceCardInstanceId: card.instanceId, destination: 'deck' }] },
                                { label: 'Non', effects: [] }
                            ]
                        } as any,
                        context: { sourceCardId: 'tireless', sourceCardInstanceId: card.instanceId }
                    });
                }

                // Handle card's own onDiscard when discarded from play (e.g. Capital)
                if (def.onDiscard) {
                    const effectItems = (Array.isArray(def.onDiscard) ? def.onDiscard : [def.onDiscard]).map((e: any) => ({
                        type: 'EFFECT' as const,
                        playerId: player.id,
                        effect: e,
                        context: { sourceCardInstanceId: card.instanceId, sourceCardId: card.id }
                    }));
                    state.effectStack.push(...effectItems.reverse());
                }

                // Potential triggers for ON_DISCARD_FROM_PLAY (Prophecy: Panic)
                const triggers = TriggerEffectHandler.scanForTriggers(state, player, 'ON_DISCARD_FROM_PLAY' as any, { cardId: card.id, instanceId: card.instanceId });
                if (triggers.length > 0) {
                    EffectManager.resolveTriggers(state, player, triggers, `Effets sur défausse de ${def.name}`);
                }
            }
        }

        player.discardPile.push(...toDiscard);
        player.playArea = toKeep;

        const isOutpostTurn = state.extraTurns && state.extraTurns.length > 0 &&
            state.extraTurns[0].playerId === player.id &&
            state.extraTurns[0].type === 'OUTPOST';

        let drawCount = isOutpostTurn ? 3 : 5;
        if (player.artifacts?.includes('flag')) {
            drawCount += 1;
        }
        if (player.nextTurnDraw) {
            drawCount += player.nextTurnDraw;
            player.nextTurnDraw = 0;
        }

        // Move DRAW and turn transition to the stack
        state.effectStack.push({
            type: 'EFFECT',
            playerId: player.id,
            effect: { type: 'START_NEXT_TURN' } as any
        });

        state.effectStack.push({
            type: 'EFFECT',
            playerId: player.id,
            effect: { type: 'DRAW', amount: drawCount } as any,
            context: { suppressLog: true }
        });

        return { state, needsChoice: false };
    }

    /**
     * Start the next player's turn
     */
    public static handleStartNextTurn(state: GameState): EffectResult {
        if (state.extraTurns && state.extraTurns.length > 0) {
            const extraTurnInfo = state.extraTurns.shift();
            if (extraTurnInfo) {
                const idx = state.players.findIndex(p => p.id === extraTurnInfo.playerId);
                if (idx !== -1) {
                    state.currentPlayerIndex = idx;
                    this.log(state, extraTurnInfo.type === 'OUTPOST' ? `--- Tour Supplémentaire (Avant-poste) ---` : `--- Tour Supplémentaire ---`);
                }
            }
        } else {
            const oldIdx = state.currentPlayerIndex;
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

        }

        state.turnNumber++;

        // Triggers will be cleared individually as they execute

        // Initialize dynamic phase pipeline
        PhaseEngine.initTurnPipeline(state);
        state.phase = 'ACTION';

        const nextPlayer = getCurrentPlayer(state);
        if (nextPlayer) {
            // Plunder: Reset shy flag on all cards of the next player
            const zones = [nextPlayer.hand, nextPlayer.deck, nextPlayer.discardPile, nextPlayer.playArea];
            zones.forEach(zone => {
                zone.forEach(c => { if (c.shy) c.shy = undefined; });
            });
            // Also check mats if they exist
            if (nextPlayer.islandMat) nextPlayer.islandMat.forEach(c => { if (c.shy) c.shy = undefined; });
            if (nextPlayer.tavernMat) nextPlayer.tavernMat.forEach(c => { if (c.shy) c.shy = undefined; });
            if (nextPlayer.exileMat) nextPlayer.exileMat.forEach(c => { if (c.shy) c.shy = undefined; });
            if (nextPlayer.mats) {
                for (const k in nextPlayer.mats) {
                    nextPlayer.mats[k].forEach(c => { if (c.shy) c.shy = undefined; });
                }
            }

            nextPlayer.turnNumber++;
            resetTurnResources(nextPlayer);
            const msg = `Tour ${nextPlayer.turnNumber} - ${nextPlayer.name}`;

            this.logEvent(state, {
                actionType: 'TURN_START' as any,
                activePlayerId: nextPlayer.id,
                message: msg,
                payload: { index: nextPlayer.turnNumber }
            });

            this.log(state, msg);

            // Prophecy check for TURN_START (e.g. Sickness)
            ProphecyManager.checkFulfillment(state, 'TURN_START', {});

            if (state.activeEnchantresses?.includes(nextPlayer.id)) {
                state.activeEnchantresses = state.activeEnchantresses.filter(id => id !== nextPlayer.id);
            }
            state.enchantressAffectedPlayers = state.enchantressAffectedPlayers?.filter(id => id !== nextPlayer.id);

            // Resolve Start of Turn Triggers (Durations, Projects, etc.)
            const triggers: any[] = [];

            // 1. Duration Effects
            const durationTriggers = DurationManager.getStartOfTurnTriggers(state, nextPlayer);
            if (durationTriggers.length > 0) {
                triggers.push(...durationTriggers);
            }

            // 2. Project Effects
            const activeProjects = nextPlayer.projects || [];
            if (activeProjects.length > 0) {
                activeProjects.forEach(pid => {
                    const def = CardRegistry.get(pid);
                    if (def?.onTurnStart) {
                        triggers.push({
                            id: `project_${pid}_${state.turnNumber}`,
                            sourceId: pid,
                            sourceType: 'PROJECT',
                            description: `Projet: ${def.name}`,
                            effects: def.onTurnStart,
                            context: { sourceId: pid }
                        });
                    }
                });
            }

            // 3. Dynamic Triggers (e.g. Prophecies)
            const dynamicTriggers = TriggerEffectHandler.scanForTriggers(state, nextPlayer, 'START_TURN');
            if (dynamicTriggers.length > 0) {
                triggers.push(...dynamicTriggers);
                
                const executedIndices = dynamicTriggers.filter(t => (t as any).once && (t as any).originalIndex !== undefined).map(t => (t as any).originalIndex);
                if (executedIndices.length > 0 && state.triggers) {
                    state.triggers = state.triggers.filter((_, i) => !executedIndices.includes(i));
                }
            }

            // 4. Resolve simultaneously
            if (triggers.length > 0) {
                EffectManager.resolveTriggers(state, nextPlayer, triggers, "Début du tour : choisissez l'ordre des effets");
            }

            this.log(state, '---- Phase Action ----');

            // Note: Auto-advance checking is handled by PhaseEngine or callers of the stack resolution
        }

        // Check Victory
        const victoryResult = VictoryChecker.checkGameEnd(state);
        if (victoryResult.isGameOver) {
            state.phase = 'GAME_OVER';
            state.isGameOver = true;
            this.calculateScores(state);
        }

        return { state, needsChoice: false };
    }

    private static calculateScores(state: GameState): void {
        const scores: { playerId: string; score: number }[] = [];

        // Apply Landscape effects for everyone first
        const activeLandscapes = LandscapeManager.getActiveLandscapes(state);
        for (const landscapeId of activeLandscapes) {
            const def = LandscapeRegistry.get(landscapeId);
            if (def && def.onScore) {
                // ...
            }
        }

        for (const player of state.players) {
            let score = player.vpTokens || 0;
            const allCards = ZoneManager.getAllCards(player);

            const totalCardCount = allCards.length;
            for (const card of allCards) {
                const def = CardRegistry.get(card.id);
                if (!def) continue;

                if (def.vpCalculator) {
                    score += def.vpCalculator(allCards, (id) => CardRegistry.get(id));
                } else if (def.dynamicVP) {
                    if (card.id === 'gardens') score += Math.floor(totalCardCount / 10);
                } else if (card.id === 'duke') {
                    score += allCards.filter(c => c.id === 'duchy').length;
                } else if (def.victoryPoints) {
                    score += def.victoryPoints;
                }
            }
            player.score = score;
            scores.push({ playerId: player.id, score });
        }

        scores.sort((a, b) => b.score - a.score);
        state.winnerId = scores[0]?.playerId ?? null;
        state.gameResults = scores.map(s => {
            const player = state.players.find(p => p.id === s.playerId)!;
            return {
                playerId: player.id,
                name: player.name,
                color: player.color,
                score: s.score,
                isWinner: player.id === state.winnerId
            };
        });

        const winner = state.players.find(p => p.id === state.winnerId);
        this.log(state, `Partie terminée! Victoire de ${winner?.name}!`);
        for (const s of scores) {
            const p = state.players.find(pl => pl.id === s.playerId);
            this.log(state, `${p?.name}: ${s.score} points`);
        }
    }

    private static log(state: GameState, message: string): void {
        Logger.log(state, message, null);
    }

    private static logEvent(state: GameState, params: any) {
        Logger.logEvent(state, params);
    }
}
