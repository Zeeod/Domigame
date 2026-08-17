import { GameState, EffectResult, EffectStep } from './GameState.js';
import { EffectHandlerRegistry } from './EffectHandlerRegistry.js';
import { AttackEffectHandler } from './effects/AttackEffectHandler.js';
import { EffectManager } from './EffectManager.js';
import { EffectUtils } from './EffectUtils.js';
import { GainEffectHandler } from './effects/GainEffectHandler.js';
import { TriggerEffectHandler } from './effects/TriggerEffectHandler.js';
import { CardRegistry } from '../cards/index.js';

/**
 * EffectEngine - Core engine for resolving card effects and game rules
 */
export class EffectEngine {

    /**
     * Apply a list of effects for a player
     */
    public static applyEffects(state: GameState, playerId: string, effects: any[], suppressLog: boolean = false, sourceCardInstanceId?: string): EffectResult {
        this.pushEffectsToStack(state, playerId, effects, suppressLog, sourceCardInstanceId);
        return this.processStack(state);
    }

    /**
     * Push multiple effects to the stack
     */
    public static pushEffectsToStack(state: GameState, playerId: string, effects: any[], suppressLog: boolean = false, sourceCardInstanceId?: string): void {
        const items: EffectStep[] = effects.map(e => ({
            type: 'EFFECT',
            playerId,
            effect: e,
            context: { suppressLog, sourceCardInstanceId }
        }));

        // Push in reverse order for stack (last-in, first-out)
        state.effectStack.push(...items.reverse());
    }

    /**
     * Main loop to process the effect stack
     */
    public static processStack(state: GameState): EffectResult {
        let iterations = 0;
        const MAX_ITERATIONS = 5000;

        console.log(`[EffectEngine] processStack: stack size=${state.effectStack.length}`);

        while (state.effectStack.length > 0 && !state.pendingDecision) {
            iterations++;
            if (iterations > MAX_ITERATIONS) {
                console.error('EffectEngine: Max stack iterations reached. Aborting stack.');
                state.effectStack = [];
                return { state, needsChoice: false };
            }

            const item = state.effectStack.pop();
            if (!item) continue;

            console.log(`[EffectEngine] processing item: type=${item.type}, effect=${(item.effect as any)?.type}`);
            const result = this.processStackItem(state, item);
            if (result.needsChoice) {
                console.log(`[EffectEngine] item needs choice: ${(item.effect as any)?.type}`);
                return result;
            }
        }

        console.log(`[EffectEngine] processStack finished. remaining=${state.effectStack.length}`);
        return { state, needsChoice: !!state.pendingDecision };
    }

    /**
     * Process a single item from the stack
     */
    private static processStackItem(state: GameState, item: EffectStep): EffectResult {
        if (item.type === 'EFFECT') {
            return this.applyEffect(state, item.playerId, item.effect, item.context);
        }
        return { state, needsChoice: false };
    }

    /**
     * Dispatch a single effect to its handler
     */
    public static applyEffect(state: GameState, playerId: string, effect: any, context: any = {}): EffectResult {
        const type = effect.type;

        // Internal engine effects
        if (type === 'SYSTEM_ORDER_TRIGGERS') {
            const player = state.players.find(p => p.id === playerId);
            if (player) {
                return EffectManager.handleOrderTriggers(state, player, effect.triggers, effect.message);
            }
            return { state, needsChoice: false };
        }

        if (type === 'RESOLVE_ATTACK') {
            const player = state.players.find(p => p.id === playerId);
            if (player) {
                return AttackEffectHandler.resolveAttack(state, player, effect.attackEffect || effect.effect || effect, context);
            }
            return { state, needsChoice: false };
        }

        const player = state.players.find(p => p.id === playerId);
        if (!player) return { state, needsChoice: false };

        // Try the registry first
        const sourceInstanceId = context?.sourceCardInstanceId || effect.sourceCardInstanceId;
        const sourceCardId = context?.sourceCardId || (sourceInstanceId ? (player.hand.find(c => c.instanceId === sourceInstanceId)?.id || player.playArea.find(c => c.instanceId === sourceInstanceId)?.id || player.aside.find(c => c.instanceId === sourceInstanceId)?.id) : undefined);

        const result = EffectHandlerRegistry.resolve(state, player, effect, {
            sourceCardInstanceId: sourceInstanceId,
            sourceCardId: sourceCardId,
            suppressLog: context?.suppressLog || false,
            attackerId: context?.attackerId,
            boughtCardId: context?.boughtCardId,
            boughtCost: context?.boughtCost,
            isAttack: context?.isAttack,
            ...context
        });

        if (result !== undefined) {
            return result;
        }

        // Not in registry
        EffectUtils.log(state, `Effect type '${effect.type}' not registered.`, playerId);
        return { state, needsChoice: false };
    }

    /**
     * Resolve a player decision and resume stack processing
     */
    public static resolveDecision(state: GameState, playerId: string, payload: any): EffectResult {
        const decision = state.pendingDecision;
        if (!decision || decision.playerId !== playerId) {
            return { state, needsChoice: !!state.pendingDecision };
        }

        // Special handling for UPDATE_SELECTION (doesn't clear decision)
        if (payload.type === 'UPDATE_SELECTION') {
            const player = state.players.find(p => p.id === playerId);
            if (player) {
                player.currentSelection = payload.selectedIds || [];
            }
            return { state, needsChoice: true };
        }

        // Clear decision
        state.pendingDecision = null;

        // Populate lastDecisionResults for general card decisions
        if (payload.type === 'CARDS' || payload.cardIds || payload.cardInstanceIds || payload.cards || payload.cardId) {
            let cards = payload.cards || [];
            if (cards.length === 0 && (payload.cardIds || payload.cardInstanceIds)) {
                const ids = payload.cardIds || payload.cardInstanceIds;
                const player = state.players.find(p => p.id === playerId);
                if (player) {
                    cards = ids.map((id: string) => {
                        const card = player.hand.find(c => c.instanceId === id) || 
                                     player.playArea.find(c => c.instanceId === id) ||
                                     player.discardPile.find(c => c.instanceId === id) ||
                                     player.aside.find(c => c.instanceId === id);
                        return { instanceId: id, id: card?.id || 'unknown' };
                    });
                }
            } else if (cards.length === 0 && payload.cardId) {
                cards = [{ instanceId: payload.cardId, id: payload.cardId }];
            }
            state.lastDecisionResults = { cards };
        }

        // Routing for special actions defined in context
        const specialAction = decision.context?.specialAction;
        if (specialAction === 'ORDER_TRIGGERS') {
            const player = state.players.find(p => p.id === playerId);
            if (player) {
                EffectManager.onOrderTriggerDecision(state, player, parseInt(payload.value), decision.context.remainingTriggers);
            }
        } else if (specialAction === 'SENTRY_INTERACTION') {
            this.handleSentryDecision(state, playerId, payload, decision.context);
        } else if (specialAction === 'SELECT_AND_APPLY') {
            this.handleSelectAndApplyDecision(state, playerId, payload, decision);
        } else if (specialAction === 'ZONE_CHOICE') {
            this.handleZoneChoiceDecision(state, playerId, payload, decision);
        } else if (specialAction === 'SET_ASIDE_LINKED') {
            this.handleSetAsideLinkedDecision(state, playerId, payload, decision);
        } else if (specialAction === 'MOVE_TO_MAT') {
            this.handleMoveToMatDecision(state, playerId, payload, decision);
        } else if (specialAction === 'GAINER') {
            this.handleGainerDecision(state, playerId, payload, decision);
        } else if (specialAction === 'CHOOSE_CARD_FOR_EFFECT') {
            this.handleGenericChoice(state, playerId, payload, decision);
        } else if (specialAction === 'TRASH') {
            // Route to handleChoiceDecision so that it pushes the TRASH effect back on the stack
            // and let handleTrash do the actual trashing and onSuccess/onTrash triggers!
            this.handleChoiceDecision(state, playerId, payload, decision);
        } else if (specialAction === 'DISCARD') {
            this.handleSelectAndApplyDecision(state, playerId, payload, decision);
        } else if (specialAction === 'DISCARD_THEN_DRAW') {
            this.handleDiscardThenDrawDecision(state, playerId, payload, decision);
        } else if (specialAction === 'REORDER') {
            this.handleReorderDecision(state, playerId, payload, decision);
        } else if (specialAction === 'LIBRARY_DECISION') {
            this.handleLibraryDecision(state, playerId, payload, decision);
        } else if (specialAction === 'PEEK_BOTTOM_RESPONSE') {
            this.handlePeekBottomResponse(state, playerId, payload, decision);
        } else if (specialAction === 'PEEK_TOP_DECISION') {
            this.handleChoiceDecision(state, playerId, payload, decision);
        } else if (decision.context?.type === 'SELECT_FROM_DISCARD' || specialAction === 'SELECT_FROM_DISCARD') {
            // Harbinger-style: move selected cards from discard to destination zone
            this.handleSelectFromDiscardDecision(state, playerId, payload, decision);
        } else if (specialAction === 'VASSAL_PLAY') {
            this.handleVassalPlayDecision(state, playerId, payload, decision);
        } else if (decision.type === 'CHOOSE_CARDS') {
            // Fallback for generic CHOOSE_CARDS without specialAction
            this.handleSelectAndApplyDecision(state, playerId, payload, decision);
        } else {
            this.handleChoiceDecision(state, playerId, payload, decision);
        }

        return this.processStack(state);
    }

    /**
     * Handles SELECT_AND_APPLY and similar CHOOSE_CARDS decisions
     */
    private static handleSelectAndApplyDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        let selectedCards = payload.cards || [];

        // Support simple ID arrays from tests or legacy payloads
        if (selectedCards.length === 0 && (payload.cardIds || payload.cardInstanceIds)) {
            const ids = payload.cardIds || payload.cardInstanceIds;
            selectedCards = ids.map((id: string) => {
                // Try to find the instance in player zones to get the card ID if only instanceId is provided
                const card = player.hand.find(c => c.instanceId === id) || 
                             player.playArea.find(c => c.instanceId === id) ||
                             player.discardPile.find(c => c.instanceId === id) ||
                             player.aside.find(c => c.instanceId === id);
                return { instanceId: id, id: card?.id || 'unknown' };
            });
        }

        const action = context.action;
        const destination = context.destination;

        if (action === 'DISCARD') {
            (state as any).lastDiscardedCount = selectedCards.length;
        }

        // Collect all effects to be applied to selected cards
        const perCardEffects = context.effects || [];

        for (const selectedCard of selectedCards) {
            const card = EffectUtils.removeCardFromPlayer(state, player, selectedCard.instanceId);
            if (!card) {
                continue;
            }

            if (action === 'DISCARD') {
                player.discardPile.push(card);
            } else if (action === 'TRASH') {
                state.trash.push(card);
                state.lastTrashedCard = card;
            } else if (action === 'MOVE' && destination) {
                EffectUtils.addCardToZone(player, card, destination, state);
            } else {
                // Default fallback based on destination if action is missing
                const dest = destination || context.sourceCardDestination;
                if (dest) {
                    EffectUtils.addCardToZone(player, card, dest, state);
                } else {
                    // No action/destination? Put it back where it was or discard?
                    // Usually it stays where it was. But if it was removed, we must put it somewhere.
                    // For now, put it in discard if we removed it and don't know where it goes.
                    player.discardPile.push(card);
                }
            }

            if (perCardEffects.length > 0) {
                this.pushEffectsToStack(state, playerId, perCardEffects, true, selectedCard.instanceId);
            }
        }

        // Apply 'next' or 'onSuccess' effects pipeline
        const next = context.next || context.onSuccess;
        const failure = context.onFailure;
        
        const requiredCount = context.requiredCount;
        const success = (requiredCount !== undefined) ? (selectedCards.length === requiredCount) : (selectedCards.length > 0);

        if (success && next) {
            this.pushEffectsToStack(state, playerId, Array.isArray(next) ? next : [next], true);
        } else if (!success && failure) {
            this.pushEffectsToStack(state, playerId, Array.isArray(failure) ? failure : [failure], true);
        }
    }

    /**
     * Handles GAINER decisions (selecting from supply)
     */
    private static handleGainerDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        let selectedCards = payload.cards || [];

        // Support simple ID arrays from tests or legacy payloads
        if (selectedCards.length === 0 && (payload.cardIds || payload.cardInstanceIds)) {
            const ids = payload.cardIds || payload.cardInstanceIds;
            selectedCards = ids.map((id: string) => {
                // If it's a card from supply, we should be able to get its base ID
                // The instance ID usually starts with the base ID
                const baseId = id.split('_')[0];
                return { instanceId: id, id: baseId };
            });
        }

        // Support simple cardId payload (from supply gain decisions)
        if (selectedCards.length === 0 && payload.cardId) {
            selectedCards = [{ instanceId: payload.cardId, id: payload.cardId }];
        }

        const selectedCard = selectedCards[0];
        if (!selectedCard) return;

        // Save result for subsequent effects (like GainCopy)
        state.lastDecisionResults = { cards: [selectedCard] };

        // Gain the card
        GainEffectHandler.handleGainCard(state, player, {
            type: 'GAIN_CARD',
            cardId: selectedCard.id,
            destination: context.destination
        }, context.sourceCardInstanceId);

        // Apply 'next' or 'onSuccess' or 'onGainEffects' effects pipeline
        const next = context.next || context.onSuccess || context.onGainEffects;
        if (next) {
            this.pushEffectsToStack(state, playerId, Array.isArray(next) ? next : [next], true);
        }
    }

    /**
     * Handles DISCARD_THEN_DRAW decisions (Cellar/Cave mechanic)
     */
    private static handleDiscardThenDrawDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        let selectedCards = payload.cards || [];

        // Support simple ID arrays from tests or legacy payloads
        if (selectedCards.length === 0 && (payload.cardIds || payload.cardInstanceIds)) {
            const ids = payload.cardIds || payload.cardInstanceIds;
            selectedCards = ids.map((id: string) => {
                const card = player.hand.find(c => c.instanceId === id);
                return { instanceId: id, id: card?.id || 'unknown' };
            });
        }

        for (const selectedCard of selectedCards) {
            const card = EffectUtils.removeCardFromPlayer(state, player, selectedCard.instanceId);
            if (card) {
                player.discardPile.push(card);
                EffectUtils.log(state, `${player.name} défausse ${CardRegistry.get(card.id)?.name || card.id}.`, player.id);
            }
        }

        if (selectedCards.length > 0) {
            this.pushEffectsToStack(state, playerId, [{ type: 'DRAW', amount: selectedCards.length }], true);
        }
    }

    /**
     * Handles Sentry decision (trash, discard, reorder back to deck)
     */
    private static handleSentryDecision(state: GameState, playerId: string, payload: any, context: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const trashIds: string[] = payload.trash || [];
        const discardIds: string[] = payload.discard || [];
        const reorderIds: string[] = payload.reorder || [];

        for (const id of trashIds) {
            const card = EffectUtils.removeCardFromPlayer(state, player, id);
            if (card) {
                state.trash.push(card);
                state.lastTrashedCard = card;
            }
        }

        for (const id of discardIds) {
            const card = EffectUtils.removeCardFromPlayer(state, player, id);
            if (card) {
                player.discardPile.push(card);
            }
        }

        // Must put back in reverse order since the user chose top-to-bottom
        for (const id of reorderIds.reverse()) {
            const card = EffectUtils.removeCardFromPlayer(state, player, id);
            if (card) {
                player.deck.unshift(card);
            }
        }
    }

    /**
     * Handles REORDER decisions (reordering cards onto deck or another zone)
     */
    private static handleReorderDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        const destination = context.destination || 'deck';

        let cardInstanceIds: string[] = payload.cardInstanceIds || payload.cardIds || payload.reorder || [];
        if (cardInstanceIds.length === 0 && payload.cards) {
            cardInstanceIds = payload.cards.map((c: any) => typeof c === 'string' ? c : c.instanceId);
        }

        // Put cards in destination zone (reverse so first element in array is top of deck)
        for (const id of [...cardInstanceIds].reverse()) {
            const card = EffectUtils.removeCardFromPlayer(state, player, id);
            if (card) {
                EffectUtils.addCardToZone(player, card, destination, state, 'TOP');
            }
        }
    }

    /**
     * Handles LIBRARY_DECISION (Library: yes=discard action, no=keep in hand)
     * The card was already placed in player.aside. 
     * YES = keep it in aside (discard it after drawing), NO = put it in hand now and continue.
     */
    private static handleLibraryDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        const cardInstanceId = context.cardInstanceId;
        const targetSize = context.targetSize || 7;

        // Determine player choice: YES means "set aside", NO means "keep in hand"
        const wantsToSetAside = payload.choice === 'YES' || payload.value === 'YES' || payload.yes === true;

        if (!wantsToSetAside) {
            // Player wants to keep the action card: move from aside to hand
            const cardIdx = player.aside.findIndex(c => c.instanceId === cardInstanceId);
            if (cardIdx !== -1) {
                const card = player.aside.splice(cardIdx, 1)[0];
                player.hand.push(card);
            }
        }
        // If wantsToSetAside, card stays in aside and will be discarded when drawing finishes

        // Continue the draw-until-hand-size loop
        if (player.hand.length < targetSize) {
            state.effectStack.push({
                type: 'EFFECT',
                playerId,
                effect: { type: 'DRAW_UNTIL_HAND_SIZE', targetSize, maySkipActions: true } as any
            });
        } else {
            // Done — discard aside cards
            player.discardPile.push(...player.aside);
            player.aside = [];
        }
    }

    /**
     * Handles PEEK_BOTTOM_RESPONSE (peek at bottom card, optionally topdeck it)
     */
    private static handlePeekBottomResponse(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        const cardInstanceId = context.cardInstanceId;
        const wantsToTopDeck = payload.choice === 'YES' || payload.value === 'YES' || payload.yes === true;

        if (wantsToTopDeck && cardInstanceId) {
            const cardIdx = player.deck.findIndex(c => c.instanceId === cardInstanceId);
            if (cardIdx !== -1) {
                const card = player.deck.splice(cardIdx, 1)[0];
                player.deck.unshift(card);
            }
        }
    }

    /**
     * Handles SELECT_FROM_DISCARD decisions (Harbinger: move selected cards from discard pile to deck)
     */
    private static handleSelectFromDiscardDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        const destination = context.destination || 'deck';

        let selectedIds: string[] = payload.cardInstanceIds || payload.cardIds || [];
        if (selectedIds.length === 0 && payload.cards) {
            selectedIds = payload.cards.map((c: any) => typeof c === 'string' ? c : c.instanceId);
        }

        // Optional — skip if no cards selected (Harbinger lets you not topdeck anything)
        for (const instanceId of selectedIds) {
            const idx = player.discardPile.findIndex(c => c.instanceId === instanceId);
            if (idx !== -1) {
                const card = player.discardPile.splice(idx, 1)[0];
                EffectUtils.addCardToZone(player, card, destination, state, 'TOP');
                EffectUtils.log(state, `${player.name} place ${CardRegistry.get(card.id)?.name || card.id} sur sa pioche.`, player.id);
            }
        }

        // Apply 'next' effects if any
        const next = context.next || context.onSuccess;
        if (next) {
            this.pushEffectsToStack(state, playerId, Array.isArray(next) ? next : [next], true);
        }
    }

    /**
     * Handles VASSAL_PLAY decisions (Vassal: discard top card of deck; if Action, optionally play it)
     */
    private static handleVassalPlayDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        const cardInstanceId = context.cardInstanceId;
        let selectedIds: string[] = payload.cardInstanceIds || payload.cardIds || [];
        if (selectedIds.length === 0 && payload.cards) {
            selectedIds = payload.cards.map((c: any) => typeof c === 'string' ? c : c.instanceId);
        }

        const cardIdx = player.aside.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIdx === -1) return;
        const card = player.aside.splice(cardIdx, 1)[0];

        const shouldPlay = selectedIds.includes(cardInstanceId) || payload.choice === 'YES' || payload.value === 'YES' || payload.yes === true;

        if (shouldPlay) {
            player.playArea.push(card);
            const cardDef = CardRegistry.get(card.id);
            if (cardDef) {
                EffectUtils.log(state, `${player.name} joue ${cardDef.name} via Vassal.`, player.id);
                if (cardDef.effects && cardDef.effects.length > 0) {
                    const effectItems = cardDef.effects.map((e: any) => ({
                        type: 'EFFECT' as const,
                        playerId: player.id,
                        effect: e as any,
                        context: { sourceCardInstanceId: card.instanceId, sourceCardId: card.id }
                    }));
                    state.effectStack.push(...effectItems.reverse());
                }
                TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
            }
        } else {
            player.discardPile.push(card);
            EffectUtils.log(state, `${player.name} défausse ${CardRegistry.get(card.id)?.name || card.id}.`, player.id);
        }
    }

    /**
     * Handles MOVE_TO_MAT decisions (moving cards to a mat, e.g. Island)
     */
    private static handleMoveToMatDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        const matName = context.matName;
        if (!matName) return;

        let selectedCards = payload.cards || [];
        if (selectedCards.length === 0 && (payload.cardIds || payload.cardInstanceIds)) {
            const ids = payload.cardIds || payload.cardInstanceIds;
            selectedCards = ids.map((id: string) => {
                const card = player.hand.find(c => c.instanceId === id) || 
                             player.playArea.find(c => c.instanceId === id) ||
                             player.discardPile.find(c => c.instanceId === id) ||
                             player.aside.find(c => c.instanceId === id);
                return { instanceId: id, id: card?.id || 'unknown' };
            });
        }

        if (!player.mats) player.mats = {};
        if (!player.mats[matName]) player.mats[matName] = [];

        // Sync legacy alias arrays to mats[matName] (same reference)
        if (matName === 'island') player.islandMat = player.mats[matName];
        if (matName === 'tavern') player.tavernMat = player.mats[matName];
        if (matName === 'exile') player.exileMat = player.mats[matName];

        // NOTE: The source card (for targets === 'BOTH') was already moved to the mat
        // by ZoneEffectHandler.handleMoveToMat BEFORE the choice prompt was displayed.
        // We only process the player-selected cards here.

        for (const selectedCard of selectedCards) {
            const card = EffectUtils.removeCardFromPlayer(state, player, selectedCard.instanceId);
            if (card) {
                player.mats[matName].push(card);
                EffectUtils.log(state, `${player.name} place ${CardRegistry.get(card.id)?.name || card.id} sur son plateau ${matName}.`, player.id);
            }
        }
    }

    private static handleZoneChoiceDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        let selectedCards = payload.cards || [];

        // Support simple ID arrays from tests or legacy payloads
        if (selectedCards.length === 0 && (payload.cardIds || payload.cardInstanceIds)) {
            const ids = payload.cardIds || payload.cardInstanceIds;
            selectedCards = ids.map((id: string) => {
                const card = player.hand.find(c => c.instanceId === id) || 
                             player.playArea.find(c => c.instanceId === id) ||
                             player.discardPile.find(c => c.instanceId === id) ||
                             player.aside.find(c => c.instanceId === id);
                return { instanceId: id, id: card?.id || 'unknown' };
            });
        }
        if (selectedCards.length === 0 && payload.cardId) {
            selectedCards = [{ instanceId: payload.cardId, id: payload.cardId }];
        }

        const action = context.action;
        const destination = context.destination;
        const perCardEffects = context.effects || [];

        if (action === 'DISCARD') {
            (state as any).lastDiscardedCount = selectedCards.length;
        }

        // Save selection in state.lastDecisionResults BEFORE performing any moving,
        // so targetCardInstanceId etc can resolve correctly.
        state.lastDecisionResults = { cards: selectedCards };

        const isFromSupply = (context.sourceZone || decision.constraints?.sourceZone || '').toLowerCase() === 'supply';

        for (const selectedCard of selectedCards) {
            if (isFromSupply) {
                GainEffectHandler.handleGainCard(state, player, {
                    type: 'GAIN_CARD',
                    cardId: selectedCard.id,
                    destination: destination || 'discardPile'
                }, context.sourceCardInstanceId);
            } else if (action) {
                const card = EffectUtils.removeCardFromPlayer(state, player, selectedCard.instanceId);
                if (card) {
                    if (action === 'DISCARD') {
                        player.discardPile.push(card);
                    } else if (action === 'TRASH') {
                        state.trash.push(card);
                        state.lastTrashedCard = card;
                    } else if (action === 'MOVE' && destination) {
                        EffectUtils.addCardToZone(player, card, destination, state);
                    }
                }
            } else if (destination) {
                // If destination is defined but action is not, we still move it
                const card = EffectUtils.removeCardFromPlayer(state, player, selectedCard.instanceId);
                if (card) {
                    EffectUtils.addCardToZone(player, card, destination, state);
                }
            }

            if (perCardEffects.length > 0) {
                this.pushEffectsToStack(state, playerId, perCardEffects, true, selectedCard.instanceId);
            }
        }

        // Apply 'next' or 'onSuccess' effects pipeline
        const next = context.next || context.onSuccess;
        const failure = context.onFailure;
        
        const requiredCount = context.requiredCount;
        const success = (requiredCount !== undefined) ? (selectedCards.length === requiredCount) : (selectedCards.length > 0);

        if (success && next) {
            this.pushEffectsToStack(state, playerId, Array.isArray(next) ? next : [next], true);
        } else if (!success && failure) {
            this.pushEffectsToStack(state, playerId, Array.isArray(failure) ? failure : [failure], true);
        }
    }

    private static handleSetAsideLinkedDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        const context = decision.context || {};
        const sourceCardInstanceId = context.sourceCardInstanceId;
        if (!sourceCardInstanceId) return;

        const sourceCard = player.playArea.find(c => c.instanceId === sourceCardInstanceId) ||
                           player.hand.find(c => c.instanceId === sourceCardInstanceId);
        if (!sourceCard) return;

        let selectedCards = payload.cards || [];
        if (selectedCards.length === 0 && (payload.cardIds || payload.cardInstanceIds)) {
            const ids = payload.cardIds || payload.cardInstanceIds;
            selectedCards = ids.map((id: string) => {
                const card = player.hand.find(c => c.instanceId === id) || 
                             player.playArea.find(c => c.instanceId === id) ||
                             player.discardPile.find(c => c.instanceId === id) ||
                             player.aside.find(c => c.instanceId === id);
                return card; // Keep full card instance
            }).filter((c: any) => c !== undefined);
        }

        if (selectedCards.length === 0) return;

        if (!sourceCard.linkedCards) sourceCard.linkedCards = [];

        for (const card of selectedCards) {
            // Remove from hand or whichever zone it is in
            const removed = EffectUtils.removeCardFromPlayer(state, player, card.instanceId);
            if (removed) {
                player.aside.push(removed);
                sourceCard.linkedCards.push(removed);
                EffectUtils.log(state, `${player.name} met ${CardRegistry.get(removed.id)?.name || removed.id} de côté via ${CardRegistry.get(sourceCard.id)?.name || sourceCard.id}.`, player.id);
            }
        }
    }

    /**
     * Generic choice handler for individual card selections
     */
    private static handleGenericChoice(state: GameState, playerId: string, payload: any, decision: any): void {
        const context = decision.context || {};
        const selectedCard = payload.cards?.[0];

        if (selectedCard) {
            context.selectedCardInstanceId = selectedCard.instanceId;
            context.selectedCardId = selectedCard.id;
        }

        if (context.onSelect) {
            this.pushEffectsToStack(state, playerId, context.onSelect, true);
        }
    }

    /**
     * Generic decision handling for choice effects (legacy support)
     */
    private static handleChoiceDecision(state: GameState, playerId: string, payload: any, decision: any): void {
        const context = decision.context || {};
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        let effectsToPush: any[] = [];

        // Normalize option decision handling for OPTION, CHOICE or undefined types
        const options = decision.options || context.options;
        const isOptionType = payload.type === 'OPTION' || payload.type === 'CHOICE' || payload.type === undefined || typeof payload === 'number';
        if (isOptionType && options) {
            const index = typeof payload === 'number' ? payload
                        : payload.index !== undefined ? payload.index 
                        : payload.optionIndex !== undefined ? payload.optionIndex 
                        : payload.choiceIndex;
            if (index !== undefined) {
                const selectedOption = options[index];
                if (selectedOption && selectedOption.effects) {
                    effectsToPush.push(...selectedOption.effects);
                }
            }
        }

        // Support multi-option decision handling (e.g. Pawn)
        const isMultiOption = payload.type === 'OPTIONS' || payload.type === 'MULTI_CHOICE';
        if (isMultiOption && options) {
            const indices = payload.optionIndices || payload.choices || [];
            if (Array.isArray(indices)) {
                for (const index of indices) {
                    const selectedOption = decision.options[index];
                    if (selectedOption && selectedOption.effects) {
                        effectsToPush.push(...selectedOption.effects);
                    }
                }
            }
        }

        // Handle 'next' effects pipeline
        if (context.next) {
            const nextEffects = Array.isArray(context.next) ? context.next : [context.next];
            effectsToPush.push(...nextEffects.map((e: any) => ({ ...e, choice: payload })));
        }

        if (effectsToPush.length > 0) {
            this.pushEffectsToStack(state, playerId, effectsToPush, true, context.sourceCardInstanceId);
        }
    }
}
