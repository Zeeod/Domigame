/**
 * ActionResolver - Applies validated actions to game state
 *
 * ASSUMES input is valid (validated by RulesValidator).
 * Mutates state and triggers effects.
 */

import { produce, setAutoFreeze } from 'immer';
setAutoFreeze(false);

import { GameState, getCurrentPlayer } from './GameState.js';
import { LogPayload, LogEventType } from '../types/Log.js';
import { GameAction, ChoosePayload } from '../types/GameAction.js';
import { EffectEngine } from './EffectEngine.js';
import { TriggerEffectHandler } from './effects/TriggerEffectHandler.js';
import { CardRegistry } from '../cards/index.js';
import { mapActor, gainRecipient } from './Possession.js';
import { activeOverrides } from './KingdomRules.js';
import { createCardInstance } from './CardInstance.js';
import { EconomyEngine } from './EconomyEngine.js';
import { TurnMachine } from './TurnMachine.js';
import { resetTurnResources } from './PlayerState.js';
import { Logger } from './Logger.js';
import { EffectUtils } from './EffectUtils.js';
import { LandscapeRegistry } from '../cards/landscapes/index.js';
import { PhaseEngine } from './PhaseEngine.js';
import { DurationManager } from './DurationManager.js';
import { SupplyGenerator } from './SupplyGenerator.js';

// Bootstrap: register all expansion modules (cost modifiers, hooks, phases)
import './registerExpansions.js';
import { markPlayed } from './Play.js';
import { debugLog } from './debug.js';

// ============================================================================
// Resolution Result
// ============================================================================

export interface ActionResult {
    success: boolean;
    state: GameState;
    error?: string;
}

// ============================================================================
// ActionResolver
// ============================================================================

export class ActionResolver {
    /**
     * Apply a validated action to the game state
     * Uses Immer to ensure immutability and handle structural sharing.
     */
    static resolve(state: GameState, playerId: string, action: GameAction): ActionResult {
        return CardRegistry.withGameOverrides(activeOverrides(state), () =>
            this.resolveWithRules(state, mapActor(state, playerId, action) ?? playerId, action));
    }

    private static resolveWithRules(state: GameState, playerId: string, action: GameAction): ActionResult {
        debugLog(`[ActionResolver] resolve: type=${action.type}, playerId=${playerId}`);
        let actionResult: any = { success: false };

        const nextState = produce(state, draft => {
            try {
                switch (action.type) {
                    case 'TOGGLE_READY':
                        actionResult = this.resolveToggleReady(draft as GameState, playerId);
                        break;

                    case 'PLAY_CARD':
                        actionResult = this.resolvePlayCard(draft as GameState, playerId, action.cardInstanceId, action.wayId);
                        break;

                    case 'BUY_CARD':
                        actionResult = this.resolveBuyCard(draft as GameState, playerId, action.cardId, (action as any).overpay);
                        break;

                    case 'BUY_PROJECT':
                        actionResult = this.resolveBuyProject(draft as GameState, playerId, action.projectId);
                        break;

                    case 'END_PHASE':
                        actionResult = this.resolveEndPhase(draft as GameState, playerId);
                        break;

                    case 'CHOOSE':
                        actionResult = this.resolveChoice(draft as GameState, playerId, action.choiceId, action.payload);
                        break;

                    case 'PLAY_ALL_TREASURES':
                        actionResult = this.resolvePlayAllTreasures(draft as GameState, playerId);
                        break;

                    case 'ACKNOWLEDGE_REVEAL':
                        draft.revealedCards = null;
                        actionResult = { success: true };
                        break;

                    case 'PAY_DEBT':
                        actionResult = this.resolvePayDebt(draft as GameState, playerId, action.amount);
                        break;

                    case 'SPEND_COFFERS':
                        actionResult = this.resolveSpendCoffers(draft as GameState, playerId, (action as any).amount);
                        break;

                    case 'SPEND_VILLAGERS':
                        actionResult = this.resolveSpendVillagers(draft as GameState, playerId, (action as any).amount);
                        break;

                    case 'BUY_EVENT' as any:
                    case 'BUY_LANDSCAPE' as any:
                        actionResult = this.resolveBuyLandscape(draft as GameState, playerId, (action as any).landscapeId || (action as any).cardId);
                        break;

                    case 'ACTIVATE_LANDSCAPE':
                        actionResult = this.resolveActivateLandscape(draft as GameState, playerId, (action as any).landscapeId);
                        break;

                    default:
                        actionResult = { success: false, error: `Type d'action inconnu: ${action.type}` };
                }

                // Ensure any pending effects are processed (e.g. from phase transitions like CLEANUP)
                if (actionResult.success) {
                    EffectEngine.processStack(draft as GameState);
                }

                // If the action failed, do not return state here to avoid Immer error
                if (!actionResult.success) {
                    return;
                }
            } catch (error: any) {
                console.error(`[ActionResolver] CRITICAL_ACTION_ERROR:`, error);
                actionResult = { success: false, error: `Critical error: ${error.message}` };
                return;
            }
        });

        // If the action failed, return the original unmutated state
        if (!actionResult.success) {
            return {
                success: false,
                error: actionResult.error,
                state: state
            };
        }

        return {
            success: true,
            state: nextState as GameState
        };
    }

    // ========================================================================
    // Action Handlers
    // ========================================================================

    private static resolveToggleReady(state: GameState, playerId: string): ActionResult {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return { success: false, state, error: 'Player not found' };

        player.isReady = !player.isReady;
        this.log(state, `${player.name} est ${player.isReady ? 'prêt' : 'pas prêt'}`, player.id);

        // Check if all players are ready
        if (state.players.every(p => p.isReady) && state.players.length >= 2) {
            this.startGame(state);
        }

        return { success: true, state };
    }

    private static resolvePlayCard(state: GameState, _playerId: string, cardInstanceId: string, wayId?: string): ActionResult {
        const player = getCurrentPlayer(state);
        if (!player) {
            debugLog('[ActionResolver] FAILED: No current player');
            return { success: false, state, error: 'No current player' };
        }
        debugLog(`[ActionResolver] resolvePlayCard: player=${player.name}, card=${cardInstanceId}, way=${wayId}`);

        // Find and move card
        const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) return { success: false, state, error: 'Card not found' };

        const card = player.hand[cardIndex];
        if (card.shy) {
            return { success: false, state, error: "Cette carte est timide et ne peut pas être jouée ce tour-ci." };
        }

        const cardDef = CardRegistry.get(card.id);
        if (!cardDef) return { success: false, state, error: 'Unknown card' };

        const isTreasure = cardDef.types.includes('TREASURE');

        const isEnlightenmentFulfilled = state.activeProphecyId === 'enlightenment' &&
            state.landscapeState['enlightenment']?.tokens?.sun === 0;

        const isNight = cardDef.types.includes('NIGHT');
        const isAction = cardDef.types.includes('ACTION');

        // 1. Playing a Treasure (that is not also an Action) in the Action phase starts the Buy phase.
        // Exception: Enlightenment makes Treasures Actions in Action phase
        if (isTreasure && !isAction && state.phase === 'ACTION' && !isEnlightenmentFulfilled) {
            TurnMachine.endActionPhase(state);
        }

        // Phase restrictions — a card with several types may be played in the phase of any of them
        // (Crown: Action in the Action phase, Treasure in the Buy phase; Werewolf: Action or Night).
        if (state.phase === 'ACTION') {
            if (!isAction && !(isTreasure && isEnlightenmentFulfilled)) return { success: false, state, error: 'Cannot play this card in Action phase' };
        } else if (state.phase === 'BUY') {
            if (!isTreasure) return { success: false, state, error: 'Can only play Treasures in Buy phase' };
        } else if (state.phase === 'NIGHT') {
            if (!isNight) return { success: false, state, error: 'Can only play Night cards in Night phase' };
        }

        // 2. Log the card play
        let msg = '';
        if (wayId) {
            const wayDef = LandscapeRegistry.get(wayId);
            msg = `${player.name} joue ${cardDef.name} en tant que ${wayDef ? wayDef.name : wayId}`;
        } else {
            // Unify logging: if the card has a treasure value, show it in the play log
            // and we will suppress the individual ADD_MONEY effect log.
            const treasureValue = cardDef.treasureValue || 0;
            if (treasureValue > 0 && cardDef.types.includes('TREASURE')) {
                msg = `${player.name} joue ${cardDef.name} (+${treasureValue} 💰)`;
            } else {
                msg = `${player.name} joue ${cardDef.name}`;
            }
        }

        this.logEvent(state, {
            actionType: 'PLAY_CARD',
            activePlayerId: player.id,
            sourceCard: cardDef.id,
            message: msg,
            payload: { cardId: cardDef.id, wayId }
        });


        // 3. Execute core play logic (triggers effects) and capture modified state
        state = this.executePlayCard(state, player.id, cardInstanceId, wayId);

        // Auto-skip Action phase if no actions left in hand
        TurnMachine.checkAutoEndActionPhase(state);

        // Auto-end Night phase if no Night cards left
        if (state.phase === 'NIGHT') {
            TurnMachine.checkAutoEndNightPhase(state);
        }

        return { success: true, state };
    }

    /**
     * Internal core logic for playing a card.
     * Handles zone moving, resource updates, Merchant logic, and effects.
     * Does NOT handle phase transitions or logging (caller should handle logging).
     * @param logTreasurePlay - Whether to log the card play (used for PLAY_ALL_TREASURES)
     * @returns Modified GameState
     */
    private static executePlayCard(state: GameState, playerId: string, cardInstanceId: string, wayId?: string, logTreasurePlay?: boolean): GameState {
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            debugLog(`[ActionResolver] executePlayCard FAILED: Player ${playerId} not found`);
            return state;
        }

        const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) {
            debugLog(`[ActionResolver] executePlayCard FAILED: Card ${cardInstanceId} not in hand of ${player.name}. Hand:`, player.hand.map(c => c.instanceId));
            return state;
        }

        const card = player.hand.splice(cardIndex, 1)[0];
        markPlayed(state, player, card); // turnPlayed + per-card play count
        player.playArea.push(card);
        state.cardsPlayedFromHandThisTurn = (state.cardsPlayedFromHandThisTurn || 0) + 1;

        const cardDef = CardRegistry.get(card.id);
        if (!cardDef) return state;

        const isEnlightenmentFulfilled = state.activeProphecyId === 'enlightenment' &&
            state.landscapeState['enlightenment']?.tokens?.sun === 0;

        // Log treasure play if requested (for PLAY_ALL_TREASURES)
        if (logTreasurePlay) {
            const treasureValue = cardDef.treasureValue || 0;
            const msg = (treasureValue > 0 && cardDef.types.includes('TREASURE'))
                ? `${player.name} joue ${cardDef.name} (+${treasureValue} 💰)`
                : `${player.name} joue ${cardDef.name}`;
            this.logEvent(state, { actionType: 'PLAY_CARD', activePlayerId: player.id, sourceCard: cardDef.id, message: msg, payload: { cardId: cardDef.id } });
        }


        // Initialize duration turns if applicable
        if (cardDef.durationTurns !== undefined || cardDef.types.includes('DURATION')) {
            card.durationTurns = cardDef.durationTurns;

            if (cardDef.types.includes('DURATION')) {
                DurationManager.register(state, {
                    cardInstanceId: card.instanceId,
                    cardId: card.id,
                    playerId: playerId,
                    turnsRemaining: cardDef.isPermanentDuration ? 'PERMANENT' : (cardDef.durationTurns || 1),
                    effects: cardDef.durationEffects || []
                });
            }
        }

        // Pay action cost — only when played as an Action, i.e. in the Action phase
        // (Crown played as a Treasure in the Buy phase, or Werewolf in the Night phase, cost nothing)
        if (state.phase === 'ACTION' && (cardDef.types.includes('ACTION') || (isEnlightenmentFulfilled && cardDef.types.includes('TREASURE')))) {
            player.actions--;
            player.actionsPlayed++;
        }

        // Track card play counts
        if (cardDef.id === 'silver') {
            player.silversPlayed++;
        }

        // Apply card effects (or Way effects)
        let finalEffects = cardDef.effects;

        // --- ENLIGHTENMENT (Rising Sun) ---
        if (isEnlightenmentFulfilled && cardDef.types.includes('TREASURE') && state.phase === 'ACTION') {
            // "Instead of following its instructions, +1 Card and +1 Action"
            finalEffects = [
                { type: 'DRAW', amount: 1 },
                { type: 'ADD_ACTIONS', amount: 1 }
            ] as any;
            this.log(state, `${player.name} joue ${cardDef.name} via Illumination : +1 Carte, +1 Action.`, player.id);
        }
        else if (wayId) {
            const wayDef = LandscapeRegistry.get(wayId);
            debugLog(`[ActionResolver] wayId=${wayId}, wayDef=${wayDef?.name}, onPlay=${!!wayDef?.onPlay}`);
            if (wayDef && wayDef.onPlay) {
                if (wayId === 'way_of_the_chameleon') {
                    debugLog(`[ActionResolver] CHAMELEON SWAP for ${cardDef.id}`);
                    // Chameleon: swap +Cards and +Coins in the card's native effects
                    finalEffects = (cardDef.effects || []).map(e => {
                        debugLog(`[ActionResolver] Swapping effect: ${e.type}`);
                        if (e.type === 'DRAW') return { ...e, type: 'ADD_MONEY' } as any;
                        if ((e.type as string) === 'ADD_MONEY' || (e.type as string) === 'ADD_COINS') return { ...e, type: 'DRAW' } as any;
                        return e;
                    }) as any[];
                    this.log(state, `${player.name} utilise la Voie du Caméléon sur ${cardDef.name}.`, player.id);
                } else {
                    finalEffects = wayDef.onPlay;
                    this.log(state, `${player.name} utilise la ${wayDef.name}.`, player.id);
                }
            } else {
                debugLog(`[ActionResolver] wayId=${wayId} has NO onPlay or wayDef is missing!`);
            }
        }

        const isBasicTreasure = ['copper', 'silver', 'gold'].includes(cardDef.id);

        // --- ENCHANTRESS (Empires) ---
        if (!isBasicTreasure && cardDef.types.includes('ACTION') && state.activeEnchantresses && state.activeEnchantresses.length > 0) {
            // Check if others played Enchantress
            const othersPlayedEnchantress = state.activeEnchantresses.some(id => id !== playerId);
            if (othersPlayedEnchantress) {
                // Check if this player was already affected this turn
                if (!state.enchantressAffectedPlayers?.includes(playerId)) {
                    // Mark as affected
                    state.enchantressAffectedPlayers = [...(state.enchantressAffectedPlayers || []), playerId];
                    // Replace effects
                    finalEffects = [
                        { type: 'DRAW', amount: 1 },
                        { type: 'ADD_ACTIONS', amount: 1 }
                    ];
                    this.log(state, `${player.name} subit l'Enchanteresse : +1 Carte, +1 Action à la place des effets habituels (Way ignoré).`, player.id);
                }
            }
        }

        // Queue the card's effects, then the "when you play" triggers on top of them (they happen
        // first: Urchin "you may first trash this", Corsair…), then resolve.
        // "Directly after resolving an Action" (Coin of the Realm, Royal Carriage): queued under its effects
        if (cardDef.types.includes('ACTION')) {
            state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'AFTER_ACTION', cardId: card.id, cardInstanceId: card.instanceId } as any, context: {} });
        }
        if (finalEffects) {
            // Suppress effect log if this is a treasure card that already logged its value
            const shouldSuppress = !wayId && (cardDef.treasureValue || 0) > 0 && cardDef.types.includes('TREASURE');
            EffectEngine.pushEffectsToStack(state, player.id, finalEffects, shouldSuppress, cardInstanceId);
        }
        const onPlayResult = TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
        state = onPlayResult.state;
        state = EffectEngine.processStack(state).state;

        // Add treasure/potion values
        if (cardDef.potionValue) {
            player.potions += cardDef.potionValue;
            this.log(state, `${player.name} gagne +${cardDef.potionValue} Potion(s).`, player.id);
        }

        return state;
    }

    /** Buy with a chosen overpay amount (answer to the "overpay?" question). */
    static buyWithOverpay(state: GameState, playerId: string, cardId: string, overpay: number): ActionResult {
        return this.resolveBuyCard(state, playerId, cardId, overpay);
    }

    private static resolveBuyCard(state: GameState, _playerId: string, cardId: string, overpay?: number): ActionResult {
        const player = getCurrentPlayer(state);
        if (!player) return { success: false, state, error: 'No current player' };

        const cardDef = CardRegistry.get(cardId);
        if (!cardDef) return { success: false, state, error: 'Unknown card' };

        const pile = state.supply[cardId];
        if (!pile) {
            if (state.landscapes.includes(cardId)) {
                return this.resolveBuyLandscape(state, player.id, cardId);
            }
            return { success: false, state, error: 'No supply pile' };
        }

        const isFlourishingTradeFulfilled = state.activeProphecyId === 'flourishing_trade' &&
            state.landscapeState['flourishing_trade']?.tokens?.sun === 0;

        // Rule: Cannot buy if you have debt
        if (player.debt > 0) {
            return { success: false, state, error: "Vous devez rembourser votre dette avant de pouvoir acheter d'autres cartes" };
        }

        // Flourishing Trade: Actions as Buys
        const availableBuys = player.buys + (isFlourishingTradeFulfilled ? player.actions : 0);
        if (availableBuys <= 0) {
            return { success: false, state, error: "Plus d'achats disponibles" };
        }

        // Guilds — overpay: ask how much to overpay when there is something left to overpay with
        const overpayDef = CardRegistry.get(cardId);
        if (overpayDef?.overpayEffects && overpay === undefined) {
            const extra = player.coins - EconomyEngine.getCardCost(state, player.id, cardId);
            if (extra > 0) {
                state.pendingDecision = {
                    id: `overpay_${Date.now()}`,
                    playerId: player.id,
                    type: 'SELECT_OPTION',
                    message: `Surpayer ${overpayDef.name} ?`,
                    options: Array.from({ length: extra + 1 }, (_, n) => ({
                        label: n === 0 ? 'Ne pas surpayer' : `Surpayer ${n} 💰`,
                        effects: [{ type: 'BUY_WITH_OVERPAY', cardId, amount: n }]
                    })),
                    context: {}
                } as any;
                return { success: true, state };
            }
        }
        const overpaid = overpayDef?.overpayEffects ? Math.max(0, Math.min(overpay || 0, player.coins - EconomyEngine.getCardCost(state, player.id, cardId))) : 0;

        // DETECT MIXED PILE
        let cardToGainId = cardId;
        let cardToGainInstance: any = null;

        if (pile.isMixed && pile.cards && pile.cards.length > 0) {
            // Take the actual top card instance from the pile
            cardToGainInstance = pile.cards.pop();
            cardToGainId = cardToGainInstance.id;
        } else {
            // Standard pile: Create new instance from cardId
            cardToGainInstance = createCardInstance(cardId);
        }

        const actualCardDef = CardRegistry.get(cardToGainId);
        if (!actualCardDef) return { success: false, state, error: 'Unknown card in pile' };

        // Deduct resources
        const cardCost = EconomyEngine.getCardCost(state, player.id, cardToGainId);
        const potionCost = actualCardDef.potionCost || 0;

        if (player.coins < cardCost) return { success: false, state, error: 'Not enough coins' };
        if (potionCost > 0 && player.potions < potionCost) return { success: false, state, error: 'Not enough potions' };

        player.coins -= cardCost + overpaid;
        player.potions -= potionCost;

        // Empires: Debt
        if (actualCardDef.debtCost) {
            player.debt += actualCardDef.debtCost;
            player.tokens.debt = (player.tokens.debt || 0) + actualCardDef.debtCost;
        }

        if (player.buys > 0) {
            player.buys--;
        } else if (isFlourishingTradeFulfilled && player.actions > 0) {
            player.actions--;
            this.log(state, `${player.name} dépense une Action comme Achat (Commerce Florissant).`, player.id);
        }

        pile.count--;

        // Store for triggers (Haggler, Merchant Guild)
        state.lastBoughtCardId = cardToGainId;
        player.cardsBoughtThisTurn = (player.cardsBoughtThisTurn || 0) + 1;
        state.lastBoughtCost = cardCost;

        // Trigger ON_BUY effects (e.g. Hoard, Haggler) - Before gain
        TriggerEffectHandler.handleOnBuyTriggers(state, player, cardToGainId);

        // Gain card (Possession: the controller gains it instead)
        const gainer = gainRecipient(state, player);
        gainer.discardPile.push(cardToGainInstance);
        state.lastGainedCard = cardToGainInstance;

        // Trigger ON_GAIN effects (e.g. Cemetery, Cache, Ill-Gotten Gains)
        const gainResult = TriggerEffectHandler.triggerOnGainEffects(state, gainer, cardToGainInstance);
        state = gainResult.state;

        // Overpay abilities happen when the card is gained
        if (overpaid > 0 && actualCardDef.overpayEffects) {
            this.log(state, `${player.name} surpaie de ${overpaid} 💰.`, player.id);
            const effects = actualCardDef.overpayEffects;
            for (let i = effects.length - 1; i >= 0; i--) {
                state.effectStack.push({
                    type: 'EFFECT', playerId: gainer.id, effect: effects[i] as any,
                    context: { overpaid, sourceCardInstanceId: cardToGainInstance.instanceId }
                });
            }
        }

        // Seaside: Track VP bought
        if (actualCardDef.types.includes('VICTORY')) {
            player.boughtVictoryCard = true;
        }

        // Seaside: Embargo Tokens
        if (pile.tokens && pile.tokens['embargo'] > 0) {
            const curseCount = pile.tokens['embargo'];
            this.log(state, `${player.name} subit l'Embargo et reçoit ${curseCount} Malédiction(s) !`, player.id);

            const cursePile = state.supply['curse'];
            if (cursePile && cursePile.count > 0) {
                // Gain curses ONE BY ONE to respect pile limits
                for (let i = 0; i < curseCount; i++) {
                    if (cursePile.count > 0) {
                        cursePile.count--;
                        const curseCard = createCardInstance('curse');
                        player.discardPile.push(curseCard);
                        this.log(state, `${player.name} reçoit une Malédiction (Embargo).`, player.id);
                    }
                }
            }
        }

        // Process all queued effects (ON_BUY, ON_GAIN, etc.)
        const processResult = EffectEngine.processStack(state);
        state = processResult.state;

        const msg = `${player.name} achète et reçoit ${actualCardDef.name}.`;
        this.logEvent(state, {
            actionType: 'GAIN_CARD',
            activePlayerId: player.id,
            message: msg,
            payload: { cardId: cardToGainId, destZone: 'discardPile' }
        });

        this.log(state, msg, player.id);

        // Auto-end turn if no buys remaining AND no pending effects/decisions
        if (player.buys === 0 && !state.pendingDecision && state.effectStack.length === 0) {
            TurnMachine.endBuyPhaseToNight(state);
        }

        return { success: true, state };
    }

    private static resolveBuyProject(state: GameState, playerId: string, projectId: string): ActionResult {
        const player = getCurrentPlayer(state);
        if (!player) return { success: false, state, error: 'No current player' };

        const def = CardRegistry.get(projectId);
        if (!def) return { success: false, state, error: 'Unknown project' };

        // Double check validation (redundant but safe)
        if (state.phase !== 'BUY') return { success: false, state, error: "Phase invalide" };
        if (player.buys <= 0) return { success: false, state, error: "Plus d'achats disponibles" };
        if (player.projects.includes(projectId)) return { success: false, state, error: "Projet déjà possédé" };
        if (player.debt > 0) return { success: false, state, error: "Dette non payée" };

        const cost = EconomyEngine.getCardCost(state, playerId, projectId);
        if (player.coins < cost) return { success: false, state, error: "Fonds insuffisants" };

        // Apply
        player.coins -= cost;
        player.buys--;
        player.projects.push(projectId);

        this.log(state, `${player.name} achète le projet ${def.name}.`, player.id);

        // Handle onBuy effects for Projects (if any)
        if (def.onBuy) {
            EffectEngine.applyEffects(state, player.id, def.onBuy);
        }

        // Auto-end turn if no buys remaining AND no pending effects/decisions
        if (player.buys === 0 && !state.pendingDecision && state.effectStack.length === 0) {
            TurnMachine.endBuyPhaseToNight(state);
        }

        return { success: true, state };

    }

    private static resolveActivateLandscape(state: GameState, playerId: string, landscapeId: string): ActionResult {
        const player = getCurrentPlayer(state);
        if (player.id !== playerId) return { success: false, state, error: 'Not your turn' };

        const def = LandscapeRegistry.get(landscapeId);
        if (!def) return { success: false, state, error: 'Unknown landscape' };

        // Pay Favors
        const favors = (def as any).favorCost || 0;
        if (favors > 0) {
            if (player.favors < favors) return { success: false, state, error: 'Not enough favors' };
            player.favors -= favors;
            this.log(state, `${player.name} dépense ${favors} faveur(s) pour utiliser ${def.name}.`, player.id);
        }

        // Apply Effects (onPlay usually stores the main ability for Allies?)
        // Or onActivate?
        // Let's use onPlay for "Usage".
        EffectEngine.applyEffects(state, player.id, def.onPlay || [], false, undefined);

        return { success: true, state };
    }

    private static resolveBuyLandscape(state: GameState, playerId: string, landscapeId: string): ActionResult {
        const player = getCurrentPlayer(state);
        if (player.id !== playerId) return { success: false, state, error: 'Not your turn' };

        const def = LandscapeRegistry.get(landscapeId);
        if (!def) return { success: false, state, error: 'Unknown landscape' };

        if (state.phase !== 'BUY') {
            console.error(`[ActionResolver] Buy Landscape Failed: ${state.phase} != BUY`);
            return { success: false, state, error: 'Not in Buy phase' };
        }
        if (player.buys < 1) {
            console.error(`[ActionResolver] Buy Landscape Failed: No buys (${player.buys})`);
            return { success: false, state, error: 'No buys remaining' };
        }

        // Events don't have cost reduction from Bridge generally (Cards only)
        // Unless specific effects say "Events cost X less".
        // For now, use raw cost.
        let coinCost = def.cost?.coin || 0;
        let debtCost = def.cost?.debt || 0;
        let potionCost = def.cost?.potion || 0;

        if (player.coins < coinCost) return { success: false, state, error: 'Not enough coins' };
        if (debtCost > 0 && player.debt > 0) return { success: false, state, error: 'Must pay off debt first' };

        // Deduct resources
        player.coins -= coinCost;
        if (debtCost) {
            player.debt += debtCost;
            player.tokens.debt = (player.tokens.debt || 0) + debtCost;
        }
        if (potionCost) {
            if (player.potions < potionCost) return { success: false, state, error: 'Not enough potions' };
            player.potions -= potionCost;
        }

        player.buys--;
        (player.eventsThisTurn = player.eventsThisTurn || []).push(landscapeId);
        if ((def as any).oncePerGame) ((player as any).eventsOnce = (player as any).eventsOnce || []).push(landscapeId);

        this.log(state, `${player.name} achète l'aménagement ${def.name}.`, player.id);

        // Handle Projects: Permanent addition
        if (def.types.includes('PROJECT')) {
            if (!player.projects.includes(landscapeId)) {
                player.projects.push(landscapeId);
            } else {
                return { success: false, state, error: 'Project already owned' };
            }
        }

        // Execute Effects immediately (Events & on-buy for Projects)
        const effects = def.onBuy || (def as any).effects || [];
        EffectEngine.applyEffects(state, player.id, effects, false, undefined);

        // Auto-end turn check
        if (player.buys === 0 && !state.pendingDecision && state.effectStack.length === 0) {
            TurnMachine.endBuyPhaseToNight(state);
        }

        return { success: true, state };
    }

    private static resolveSpendCoffers(state: GameState, playerId: string, amount: number): ActionResult {
        const player = getCurrentPlayer(state);
        if (player.id !== playerId) return { success: false, state, error: 'Not your turn' };
        if (state.phase !== 'BUY') return { success: false, state, error: 'Can only spend coffers in Buy phase' };

        if (player.coffers < amount) return { success: false, state, error: 'Not enough coffers' };
        player.coffers -= amount;
        player.coins += amount;
        this.log(state, `${player.name} dépense ${amount} Coffre(s) pour +${amount} 💰.`, player.id);
        return { success: true, state };
    }

    private static resolveSpendVillagers(state: GameState, playerId: string, amount: number): ActionResult {
        const player = getCurrentPlayer(state);
        if (player.id !== playerId) return { success: false, state, error: 'Not your turn' };
        if (state.phase !== 'ACTION') return { success: false, state, error: 'Can only spend villagers in Action phase' };

        if (player.villagers < amount) return { success: false, state, error: 'Not enough villagers' };
        player.villagers -= amount;
        player.actions += amount;
        this.log(state, `${player.name} dépense ${amount} Villageois pour +${amount} Action(s).`, player.id);
        return { success: true, state };
    }


    private static resolvePayDebt(state: GameState, playerId: string, amount: number): ActionResult {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return { success: false, state, error: 'Player not found' };
        player.debt -= amount;
        player.tokens.debt = (player.tokens.debt || 0) - amount;
        player.coins -= amount;
        this.log(state, `${player.name} rembourse ${amount} 💰 de sa dette (reste: ${player.debt} dette(s))`, player.id);
        return { success: true, state };
    }

    private static resolveEndPhase(state: GameState, _playerId: string): ActionResult {
        const player = getCurrentPlayer(state);
        if (!player) return { success: false, state, error: 'No current player' };

        debugLog(`[ActionResolver] resolveEndPhase: currentPhase=${state.phase}`);
        if (state.phase === 'ACTION') {
            TurnMachine.endActionPhase(state);
        } else if (state.phase === 'BUY') {
            TurnMachine.endBuyPhaseToNight(state);
        } else if (state.phase === 'NIGHT') {
            TurnMachine.endNightPhase(state);
        }
        debugLog(`[ActionResolver] resolveEndPhase: nextPhase=${state.phase}`);

        return { success: true, state };
    }

    private static resolveChoice(
        state: GameState,
        playerId: string,
        _choiceId: string,
        payload: ChoosePayload
    ): ActionResult {
        // Clear reveals when a choice is made
        state.revealedCards = null;

        const player = state.players.find(p => p.id === playerId);
        this.logEvent(state, {
            actionType: 'EFFECT_CHOICE',
            activePlayerId: playerId,
            message: `${player?.name || playerId} a fait un choix.`,
            payload: { choice: payload }
        });

        debugLog('DEBUG: ActionResolver calling resolveDecision', { playerId, type: payload.type });
        const result = EffectEngine.resolveDecision(state, playerId, payload);

        // After resolving a choice, check if we should auto-skip to BUY phase
        TurnMachine.checkAutoEndActionPhase(result.state);

        return { success: true, state: result.state };
    }

    private static resolvePlayAllTreasures(state: GameState, playerId: string): ActionResult {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return { success: false, state, error: 'Player not found' };

        // Auto transition to BUY Phase if needed (ORDER MATTERS: Log must come before card plays)
        if (state.phase === 'ACTION') {
            TurnMachine.endActionPhase(state);
        }

        if (state.phase !== 'BUY') return { success: false, state, error: 'Can only play all treasures in Buy phase' };

        let treasures = player.hand.filter(c => {
            const def = CardRegistry.get(c.id);
            return def && def.types.includes('TREASURE');
        });

        // Voyage: only a limited number of cards may be played from hand this turn
        const limit = state.currentExtraTurn?.playerId === playerId ? state.currentExtraTurn.cardLimit : undefined;
        if (limit !== undefined) {
            treasures = treasures.slice(0, Math.max(0, limit - (state.cardsPlayedFromHandThisTurn || 0)));
        }

        if (treasures.length === 0) return { success: true, state };

        // Play them all
        // Process one by one to trigger effects
        // But logging "Play All" is cleaner usually.
        // For Dominion rules, order matters if they have effects.
        // Basic Treasures (Copper, Silver, Gold) can be batched.
        // Special Treasures should be played individually? 
        // "Play All Treasures" usually implies playing them in any order you choose?
        // Or verifying order? 
        // Standard online implementations usually just auto-play basics.
        // Let's iterate.

        // Sort: Specials first? Or just order in hand? 
        // Order in hand matters if the user sorted them.
        // Let's preserve order.

        // Create a copy of hand IDs to iterate safely while modifying hand
        const treasureIds = treasures.map(c => c.instanceId);

        // Count treasures by type for batched logging
        const treasureCounts = new Map<string, number>();
        for (const t of treasures) {
            treasureCounts.set(t.id, (treasureCounts.get(t.id) || 0) + 1);
        }

        // Log all treasure plays as aggregated entries (1 log per treasure type)
        for (const [cardId, count] of treasureCounts.entries()) {
            const cardDef = CardRegistry.get(cardId);
            if (!cardDef) continue;

            const treasureValue = cardDef.treasureValue || 0;
            const totalValue = treasureValue * count;
            const msg = (treasureValue > 0 && cardDef.types.includes('TREASURE'))
                ? `${player.name} joue ${count} ${cardDef.name}${count > 1 ? 's' : ''} (+${totalValue} 💰)`
                : `${player.name} joue ${count} ${cardDef.name}${count > 1 ? 's' : ''}`;
            this.logEvent(state, { actionType: 'PLAY_CARD', activePlayerId: player.id, sourceCard: cardDef.id, message: msg, payload: { cardId: cardDef.id } });
        }

        // Execute each treasure (without logging since we already logged)
        for (const tid of treasureIds) {
            // Find card in hand
            const card = player.hand.find(c => c.instanceId === tid);
            if (!card) continue;

            const cardDef = CardRegistry.get(card.id);
            if (!cardDef) continue;

            // Execute the play without logging (logTreasurePlay = false)
            state = this.executePlayCard(state, playerId, tid, undefined, false);
        }

        return { success: true, state };
    }

    public static startGame(state: GameState): void {
        this.log(state, '---- Début de la partie ----');
        this.log(state, 'Tous les joueurs sont prêts ! La partie commence.');
 
        // Plunder: Assign traits to kingdom piles
        SupplyGenerator.assignTraits(state);

        // Initialize dynamic phase pipeline for the first turn BEFORE drawing (triggers might happen)
        PhaseEngine.initTurnPipeline(state);
        state.phase = 'ACTION';
        state.turnNumber = 1;

        // Setup phase: Each player shuffles starting cards and draws 5
        for (const player of state.players) {
            // Ensure resources are reset for everyone (clean state)
            resetTurnResources(player);

            // Move all starting cards from hand to deck then shuffle
            player.deck = [...player.hand];
            player.hand = [];
            player.discardPile = [];

            // Shuffle
            player.deck = EffectUtils.shuffle(player.deck, state);

            // Shaman Setup: Each player trashes an Estate
            if (state.supply['shaman'] || state.kingdomCards?.includes('shaman')) {
                const estateIdx = player.deck.findIndex(c => c.id === 'estate');
                if (estateIdx !== -1) {
                    const trashed = player.deck.splice(estateIdx, 1)[0];
                    state.trash.push(trashed);
                    this.log(state, `${player.name} écarte un Domaine (Mise en place : Chamane).`, player.id);
                }
            }

            // Draw 5 cards
            EffectUtils.drawCards(state, player, 5);
        }

        // Current player 0
        const firstPlayer = state.players[0];
        this.log(state, `Tour 1 - ${firstPlayer.name}`);
        this.logEvent(state, {
            actionType: 'TURN_START',
            activePlayerId: firstPlayer.id,
            message: `Tour 1 - ${firstPlayer.name}`,
            payload: { index: 1 }
        });

        // Ensure first player has resources (resetTurnResources already called above for all, but let's be explicit for first player)
        resetTurnResources(firstPlayer);
    }

    // ========================================================================
    // Logging Helpers
    // ========================================================================

    private static log(state: GameState, message: string, playerId?: string, privatePlayerId?: string, privateData?: any): void {
        Logger.log(state, message, playerId, privatePlayerId, privateData);
    }

    private static logEvent(state: GameState, params: {
        actionType: LogEventType;
        activePlayerId?: string;
        sourceCard?: string;
        sourceEffect?: string;
        payload: LogPayload;
        message: string;
    }) {
        Logger.logEvent(state, params);
    }

}
