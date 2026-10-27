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
import { endPossessionTurn } from '../Possession.js';
import { EventBus } from '../EventBus.js';
import { getMat, peekMat } from '../Mats.js';

export class CleanupEffectHandler {
    /**
     * Choices made just before the hand is discarded (Allies — Coastal Haven). A hook that
     * returns true has queued its choice followed by a { type: 'CLEANUP_RESUME' } effect.
     */
    static beforeHandDiscard: ((state: GameState, player: PlayerState) => boolean)[] = [];

    /** Cards that stay in play this Clean-up (Plunder — Journey). */
    static keepInPlay: ((state: GameState, player: PlayerState, card: any) => boolean)[] = [];

    /**
     * Start the cleanup process for a player
     */
    public static handlePerformCleanup(state: GameState, player: PlayerState): EffectResult {
        // Recursion guard
        if (state.effectStack.some(e => (e.effect as any)?.type === 'FINALIZE_CLEANUP')) {
            return { state, needsChoice: false };
        }
        for (const hook of CleanupEffectHandler.beforeHandDiscard) {
            if (hook(state, player)) return { state, needsChoice: false };
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
            if (keepIds.includes(card.instanceId) || CleanupEffectHandler.keepInPlay.some(f => f(state, player, card))) {
                toKeep.push(card);
            } else if (card.princedBy) {
                // Prince: set aside again instead of being discarded
                getMat(player, 'prince').push(card);
            } else {
                if (card.isResolved) delete card.isResolved;
                if (card.durationTurns !== undefined) delete card.durationTurns;
                toDiscard.push(card);
            }
        });

        // Stack is LIFO: push the draw and the turn change first, so that effects of cards
        // discarded from play (Alchemist, Herbalist, Tireless...) happen before them.
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

        // Cards discarded from play this Clean-up (Alchemist checks for a Potion, Herbalist picks a Treasure)
        state.cleanupDiscardedFromPlay = toDiscard.map(c => c.instanceId);
        EventBus.emit(state, { type: 'PLAY_DISCARDED', playerId: player.id, context: { cards: toDiscard } });

        // "This turn, when you discard … from play" effects registered during the turn (Scheme)
        const pending = (state.discardFromPlayEffects || []).filter(e => e.playerId === player.id && e.turn === state.turnNumber);
        state.discardFromPlayEffects = [];
        for (const e of pending.reverse()) {
            state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: e.effect });
        }

        for (const card of toDiscard) {
            const def = CardRegistry.get(card.id);
            if (def) {
                // Plunder — Reckless: when you discard it from play, return it to its pile
                if ((card as any).reckless) {
                    delete (card as any).reckless;
                    state.effectStack.push({
                        type: 'EFFECT', playerId: player.id,
                        effect: { type: 'RETURN_TO_PILE' } as any,
                        context: { sourceCardInstanceId: card.instanceId }
                    });
                }

                // Adventures — Travellers: when discarded from play, may be exchanged for the next card
                if ((def as any).upgradesTo) {
                    state.effectStack.push({
                        type: 'EFFECT', playerId: player.id,
                        effect: { type: 'TRAVELLER_EXCHANGE', instanceId: card.instanceId, to: (def as any).upgradesTo } as any,
                        context: { sourceCardInstanceId: card.instanceId }
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

        return { state, needsChoice: false };
    }

    /**
     * Start the next player's turn
     */
    public static handleStartNextTurn(state: GameState): EffectResult {
        // "This turn" triggers end with the turn, fired or not
        if (state.triggers) {
            state.triggers = state.triggers.filter(t => t.expires !== 'END_OF_TURN');
        }

        const endingPlayerId = state.players[state.currentPlayerIndex]?.id;
        const endingPlayer = state.players[state.currentPlayerIndex];
        // Adventures — Save: the set-aside card goes into your hand at end of turn (after drawing)
        const saved = endingPlayer ? peekMat(endingPlayer, 'save') : [];
        if (endingPlayer && saved.length) endingPlayer.hand.push(...getMat(endingPlayer, 'save').splice(0));
        if (endingPlayer) EventBus.emit(state, { type: 'TURN_END', playerId: endingPlayer.id, context: {} });
        if (endingPlayer) {
            endingPlayer.gainedLastTurn = endingPlayer.gainedThisTurn || [];
            endingPlayer.gainedThisTurn = [];
        }
        // Turns count for the tie-breaker (a Possession turn is not the possessed player's own)
        if (endingPlayer && (state.currentExtraTurn as any)?.type !== 'POSSESSION') {
            endingPlayer.turnsTaken = (endingPlayer.turnsTaken || 0) + 1;
        }
        if ((state.currentExtraTurn as any)?.type === 'POSSESSION') endPossessionTurn(state, endingPlayer);

        // Renaissance — Fleet: after the game ends, an extra round of turns for players with Fleet
        if (!state.fleetRound && VictoryChecker.checkGameEnd(state).isGameOver && state.players.some(p => (p.projects || []).includes('fleet'))) {
            state.fleetRound = true;
            const i = state.currentPlayerIndex;
            const order = [...state.players.slice(i + 1), ...state.players.slice(0, i + 1)];
            state.extraTurns = order.filter(p => (p.projects || []).includes('fleet')).map(p => ({ playerId: p.id, type: 'EXTRA' as const }));
            this.log(state, '--- Tour de la Flotte ---');
        }
        const fleetPending = state.fleetRound && (state.extraTurns || []).length > 0;

        // The game ends at the end of a turn: check before starting the next one
        if (!fleetPending && VictoryChecker.checkGameEnd(state).isGameOver) {
            state.phase = 'GAME_OVER';
            state.isGameOver = true;
            this.calculateScores(state);
            return { state, needsChoice: false };
        }
        if (!state.currentExtraTurn) state.lastNormalTurnIndex = state.currentPlayerIndex;
        state.currentExtraTurn = null;

        if (state.extraTurns && state.extraTurns.length > 0) {
            const extraTurnInfo = state.extraTurns.shift();
            if (extraTurnInfo) {
                const idx = state.players.findIndex(p => p.id === extraTurnInfo.playerId);
                if (idx !== -1) {
                    state.currentPlayerIndex = idx;
                    state.currentExtraTurn = extraTurnInfo;
                    const label: Record<string, string> = { OUTPOST: 'Avant-poste', MISSION: 'Mission', VOYAGE: 'Voyage', POSSESSION: 'Possession' };
                    this.log(state, `--- Tour Supplémentaire${extraTurnInfo.type && label[extraTurnInfo.type] ? ` (${label[extraTurnInfo.type]})` : ''} ---`);
                }
            }
        } else {
            state.currentPlayerIndex = ((state.lastNormalTurnIndex ?? state.currentPlayerIndex) + 1) % state.players.length;
            // Allies — Lich: "skip a turn"
            for (let i = 0; i < state.players.length; i++) {
                const p = state.players[state.currentPlayerIndex] as any;
                if (!p.skipTurns) break;
                p.skipTurns--;
                this.log(state, `${p.name} passe son tour (Liche).`);
                state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            }
        }
        state.previousTurnPlayerId = endingPlayerId;
        state.cardsPlayedFromHandThisTurn = 0;

        // "Until your next turn" triggers end when their owner's turn starts
        const startingPlayerId = state.players[state.currentPlayerIndex]?.id;
        if (state.triggers && startingPlayerId) {
            state.triggers = state.triggers.filter(t => !(t.expires === 'START_OF_NEXT_TURN' && t.playerId === startingPlayerId)
                && t.expiresOnTurnOf !== startingPlayerId);
        }

        state.turnNumber++;

        // Triggers will be cleared individually as they execute

        // Initialize dynamic phase pipeline
        PhaseEngine.initTurnPipeline(state);
        state.phase = 'ACTION';

        const nextPlayer = getCurrentPlayer(state);
        if (nextPlayer) {
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

            if (state.activeEnchantresses?.includes(nextPlayer.id)) {
                state.activeEnchantresses = state.activeEnchantresses.filter(id => id !== nextPlayer.id);
            }
            state.enchantressAffectedPlayers = state.enchantressAffectedPlayers?.filter(id => id !== nextPlayer.id);

            // Resolve Start of Turn Triggers (Durations, Projects, etc.)
            const triggers: any[] = [];

            EventBus.emit(state, { type: 'TURN_START', playerId: nextPlayer.id, context: {} });

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
                
            }

            // 4. Resolve simultaneously
            if (triggers.length > 0) {
                EffectManager.resolveTriggers(state, nextPlayer, triggers, "Début du tour : choisissez l'ordre des effets");
            }

            this.log(state, '---- Phase Action ----');

            // Note: Auto-advance checking is handled by PhaseEngine or callers of the stack resolution
        }

        return { state, needsChoice: false };
    }

    private static calculateScores(state: GameState): void {
        const { scores, winnerIds } = VictoryChecker.ranking(state);
        for (const s of scores) {
            const p = state.players.find(pl => pl.id === s.playerId);
            if (p) p.score = s.score;
        }
        state.winnerId = winnerIds[0] ?? null;
        state.gameResults = scores.map(s => {
            const player = state.players.find(p => p.id === s.playerId)!;
            return {
                playerId: player.id,
                name: player.name,
                color: player.color,
                score: s.score,
                isWinner: winnerIds.includes(player.id)
            };
        });

        if (winnerIds.length > 1) {
            const names = winnerIds.map(id => state.players.find(p => p.id === id)?.name).join(' et ');
            this.log(state, `Partie terminée ! Victoire partagée : ${names} !`);
            for (const s of scores) this.log(state, `${s.playerName}: ${s.score} points`);
            return;
        }
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
