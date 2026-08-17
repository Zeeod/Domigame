/**
 * registerCoreEffects - Bootstrap registration of all core effect handlers
 * 
 * This module maps all existing effect types to their handler functions.
 * Called once at module load time to populate the EffectHandlerRegistry.
 * 
 * Extensions can register additional handlers after this.
 */

import { EffectHandlerRegistry } from './EffectHandlerRegistry.js';
import { BasicEffectHandler } from './effects/BasicEffectHandler.js';
import { DrawEffectHandler } from './effects/DrawEffectHandler.js';
import { ChoiceEffectHandler } from './effects/ChoiceEffectHandler.js';
import { TrashEffectHandler } from './effects/TrashEffectHandler.js';
import { GainEffectHandler } from './effects/GainEffectHandler.js';
import { AttackEffectHandler } from './effects/AttackEffectHandler.js';
import { ConditionEffectHandler } from './effects/ConditionEffectHandler.js';
import { DurationEffectHandler } from './effects/DurationEffectHandler.js';
import { TriggerEffectHandler } from './effects/TriggerEffectHandler.js';
import { ExpansionEffectHandler } from './effects/ExpansionEffectHandler.js';
import { ZoneEffectHandler } from './effects/ZoneEffectHandler.js';
import { CleanupEffectHandler } from './effects/CleanupEffectHandler.js';
import { ProphecyManager } from './ProphecyManager.js';
import { RisingSunEffectHandler } from './effects/RisingSunEffectHandler.js';
import { AlliesEffectHandler } from './effects/AlliesEffectHandler.js';
import { BoonsEffectHandler } from './effects/BoonsEffectHandler.js';
import { PlunderEffectHandler } from './effects/PlunderEffectHandler.js';
import { MenagerieEffectHandler } from './effects/MenagerieEffectHandler.js';
import { CardRegistry } from '../cards/index.js';
import { Logger } from './Logger.js';
import { DurationManager } from './DurationManager.js';
import { EffectUtils } from './EffectUtils.js';
import { EconomyEngine } from './EconomyEngine.js';


export function registerCoreEffects(): void {

    // ========================================================================
    // Basic Resource Effects
    // ========================================================================

    EffectHandlerRegistry.register('DRAW', (state, player, effect, ctx) =>
        DrawEffectHandler.handleDraw(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_ACTIONS', (state, player, effect, ctx) =>
        BasicEffectHandler.handleAddActions(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_BUYS', (state, player, effect, ctx) =>
        BasicEffectHandler.handleAddBuys(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_COINS', (state, player, effect, ctx) =>
        BasicEffectHandler.handleAddMoney(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_MONEY', (state, player, effect, ctx) =>
        BasicEffectHandler.handleAddMoney(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_POTION', (state, player, effect, ctx) =>
        BasicEffectHandler.handleAddPotions(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_COFFERS', (state, player, effect, _ctx) =>
        BasicEffectHandler.handleAddCoffers(state, player, effect)
    );

    EffectHandlerRegistry.register('ADD_VILLAGERS', (state, player, effect, _ctx) =>
        BasicEffectHandler.handleAddVillagers(state, player, effect)
    );

    EffectHandlerRegistry.register('ADD_VP', (state, player, effect, ctx) =>
        BasicEffectHandler.handleAddVictoryTokens(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_VICTORY_TOKENS', (state, player, effect, ctx) =>
        BasicEffectHandler.handleAddVictoryTokens(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('TAKE_DEBT', (state, player, effect, _ctx) =>
        BasicEffectHandler.handleTakeDebt(state, player, effect)
    );

    EffectHandlerRegistry.register('PAY_DEBT', (state, player, effect, _ctx) =>
        BasicEffectHandler.handlePayDebt(state, player, effect)
    );

    EffectHandlerRegistry.register('MODIFY_TOKEN', (state, player, effect, ctx) =>
        BasicEffectHandler.handleModifyToken(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('ADD_COST_REDUCTION', (state, player, effect, _ctx) =>
        BasicEffectHandler.handleAddCostReduction(state, player, effect)
    );

    EffectHandlerRegistry.register('MODIFY_RESOURCE', (state, player, effect, ctx) =>
        BasicEffectHandler.handleModifyResource(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('GAIN_STATS_BY_COST', (state, player, effect, _ctx) =>
        BasicEffectHandler.handleGainStatsByCost(state, player, effect)
    );

    EffectHandlerRegistry.register('SENTRY_INTERACTION', (state, player, effect, ctx) => {
        state.pendingDecision = {
            id: `sentry_${Date.now()}`,
            playerId: player.id,
            type: 'SENTRY_INTERACTION',
            message: (effect as any).message || 'Sentry',
            constraints: { sourceZone: 'limbo', min: 0, max: player.limbo.length },
            context: {
                ...ctx,
                specialAction: 'SENTRY_INTERACTION',
                cards: player.limbo.map(c => ({ id: c.id, instanceId: c.instanceId }))
            }
        };
        return { state, needsChoice: true };
    });

    // ========================================================================
    // Draw & Reveal Effects
    // ========================================================================

    EffectHandlerRegistry.register('OTHER_PLAYERS_EFFECT', (state, player, effect, ctx) => {
        const otherPlayers = state.players.filter(p => p.id !== player.id);
        const effectToApply = (effect as any).effect;
        console.log('DEBUG: OTHER_PLAYERS_EFFECT', { player: player.id, otherCount: otherPlayers.length, hasEffect: !!effectToApply });
        if (!effectToApply) return { state, needsChoice: false };

        const stackItems = otherPlayers.map(p => ({
            type: 'EFFECT' as const,
            playerId: p.id,
            effect: effectToApply,
            context: { ...ctx, sourcePlayerId: player.id }
        }));

        console.log('DEBUG: OTHER_PLAYERS_EFFECT pushing to stack', { count: stackItems.length });
        state.effectStack.push(...stackItems.reverse());
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('ALL_OTHERS_DRAW', (state, player, effect, ctx) => {
        const otherPlayers = state.players.filter(p => p.id !== player.id);
        const amount = (effect as any).amount || 1;
        const stackItems = otherPlayers.map(p => ({
            type: 'EFFECT' as const,
            playerId: p.id,
            effect: { type: 'DRAW', amount } as any,
            context: { ...ctx, sourcePlayerId: player.id }
        }));
        state.effectStack.push(...stackItems.reverse());
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('PLAY_ACTION_TWICE', (state, player, _effect, ctx) => {
        return handlePlayActionMultiple(state, player, 2, ctx);
    });

    EffectHandlerRegistry.register('PLAY_ACTION_MULTIPLE', (state, player, effect, ctx) => {
        const multiplier = (effect as any).multiplier || (effect as any).times || 2;
        return handlePlayActionMultiple(state, player, multiplier, ctx);
    });

    EffectHandlerRegistry.register('PLAY_ACTION_TWICE_AND_GAIN_COPY', (state, player, _effect, ctx) => {
        const chooseEffect = {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: 0,
            max: 1,
            filter: { cardTypes: ['ACTION'] },
            message: 'Choisissez une carte Action à jouer 2 fois et gagner une copie',
            destination: 'playArea',
            effects: [
                { type: 'PLAY_ACTION_TWICE' },
                { type: 'GAIN_COPY_OF_TARGET' }
            ],
            optional: true
        };
        return ChoiceEffectHandler.handleChooseFromZone(state, player, chooseEffect, ctx);
    });

    EffectHandlerRegistry.register('DRAW_UNTIL_HAND_SIZE', (state, player, effect, ctx) =>
        DrawEffectHandler.handleDrawUntilHandSize(state, player, effect, player.id, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('DRAW_TREASURES', (state, player, effect, _ctx) =>
        DrawEffectHandler.handleDrawTreasures(state, player, effect)
    );

    EffectHandlerRegistry.register('REVEAL_UNTIL_TREASURES', (state, player, effect) =>
        DrawEffectHandler.handleRevealUntil(state, player, {
            ...effect,
            condition: { cardTypes: ['TREASURE'] }
        } as any)
    );

    EffectHandlerRegistry.register('PEEK_TOP_DECK', (state, player, effect) =>
        DrawEffectHandler.handlePeekTopDeck(state, player, effect)
    );

    EffectHandlerRegistry.register('PEEK_BOTTOM', (state, player) =>
        DrawEffectHandler.handlePeekBottom(state, player)
    );

    EffectHandlerRegistry.register('REVEAL_UNTIL', (state, player, effect) =>
        DrawEffectHandler.handleRevealUntil(state, player, effect)
    );

    EffectHandlerRegistry.register('REVEAL_CARDS', (state, player, effect, ctx) =>
        DrawEffectHandler.handleRevealCardsEffect(state, player, effect, ctx.suppressLog || false)
    );

    EffectHandlerRegistry.register('REVEAL_AND_PUT_IN_HAND', (state, player, effect, _ctx) =>
        DrawEffectHandler.handleRevealAndPutInHand(state, player, effect)
    );

    EffectHandlerRegistry.register('REVEAL_TOP_DECK', (state, player, effect, _ctx) =>
        DrawEffectHandler.handleRevealTopDeck(state, player, effect)
    );

    // ========================================================================
    // Choice Effects
    // ========================================================================

    EffectHandlerRegistry.register('SELECT_OPTION', (state, player, effect, ctx) =>
        ChoiceEffectHandler.handleChooseOption(state, player, effect, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('CHOOSE_OPTION', (state, player, effect, ctx) =>
        ChoiceEffectHandler.handleChooseOption(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('REORDER', (state, player, effect, _ctx) =>
        ChoiceEffectHandler.handleReorder(state, player, effect)
    );

    EffectHandlerRegistry.register('CHOOSE_FROM_ZONE', (state, player, effect, ctx) =>
        ChoiceEffectHandler.handleChooseFromZone(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('CHOOSE_CARDS', (state, player, effect, ctx) =>
        ChoiceEffectHandler.handleChooseFromZone(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('SELECT_FROM_DISCARD', (state, player, effect, ctx) =>
        ChoiceEffectHandler.handleSelectFromDiscard(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('BUY_LAST_SELECTED', (state, player, effect, ctx) =>
        ExpansionEffectHandler.handleBuyLastSelected(state, player, effect, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('SELECT_AND_APPLY', (state, player, effect, _ctx) =>
        ChoiceEffectHandler.handleSelectAndApply(state, player, effect)
    );

    EffectHandlerRegistry.register('RECRUITER_EFFECT', (state, player, effect, _ctx) =>
        ExpansionEffectHandler.handleRecruiterEffect(state, player, effect)
    );

    EffectHandlerRegistry.register('TAKE_ARTIFACT', (state, player, effect, _ctx) =>
        ExpansionEffectHandler.handleTakeArtifact(state, player, effect)
    );

    EffectHandlerRegistry.register('GAIN_LOOT', (state, player, effect, _ctx) =>
        ExpansionEffectHandler.handleGainLoot(state, player, effect)
    );

    // ========================================================================
    // Trash & Discard Effects
    // ========================================================================

    EffectHandlerRegistry.register('TRASH', (state, player, effect, ctx) =>
        TrashEffectHandler.handleTrash(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('TRASH_SELF', (state, player, _effect, ctx) =>
        TrashEffectHandler.handleTrashSelf(state, player, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('DISCARD', (state, player, effect, ctx) =>
        TrashEffectHandler.handleDiscard(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('DISCARD_TO_HAND_SIZE', (state, player, effect, _ctx) =>
        TrashEffectHandler.handleDiscardToHandSize(state, player, effect)
    );

    EffectHandlerRegistry.register('DISCARD_THEN_DRAW', (state, player, effect, _ctx) =>
        TrashEffectHandler.handleDiscardThenDraw(state, player, effect)
    );

    EffectHandlerRegistry.register('TRASH_ACTION_GAIN_UP_TO_3_MORE', (state, player, effect, _ctx) =>
        TrashEffectHandler.handleTrashActionGainUpTo3More(state, player, effect)
    );

    // ========================================================================
    // Gain Effects
    // ========================================================================

    EffectHandlerRegistry.register('GAIN_CARD', (state, player, effect, ctx) =>
        GainEffectHandler.handleGainCard(state, player, effect, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('GAIN_THIS_CARD', (state, player, effect, ctx) =>
        GainEffectHandler.handleGainThisCard(state, player, effect, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('GAIN_CARD_PLUS_COST', (state, player, effect, _ctx) =>
        GainEffectHandler.handleGainCardPlusCost(state, player, effect)
    );

    EffectHandlerRegistry.register('GAIN_CARD_EXACT_COST', (state, player, effect, _ctx) =>
        GainEffectHandler.handleGainCardExactCost(state, player, effect)
    );

    EffectHandlerRegistry.register('GAIN_COPY_OF_TARGET', (state, player, effect, _ctx) =>
        GainEffectHandler.handleGainCopyOfTarget(state, player, effect)
    );

    EffectHandlerRegistry.register('GAIN_FROM_TRASH', (state, player, effect, _ctx) =>
        GainEffectHandler.handleGainFromTrash(state, player, effect)
    );

    EffectHandlerRegistry.register('GAIN_SELECTED_FROM_TRASH', (state, player, effect, _ctx) =>
        GainEffectHandler.handleGainSelectedFromTrash(state, player, effect)
    );

    EffectHandlerRegistry.register('MOVE_GAINED_TO_HAND', (state, player, effect, _ctx) =>
        GainEffectHandler.handleMoveGainedToHand(state, player, effect)
    );

    EffectHandlerRegistry.register('MOVE_GAINED_CARD', (state, player, effect, _ctx) =>
        GainEffectHandler.handleMoveGainedToHand(state, player, effect)
    );

    // ========================================================================
    // Attack Effects
    // ========================================================================

    EffectHandlerRegistry.register('ATTACK', (state, player, effect, ctx) =>
        AttackEffectHandler.handleAttack(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('RESOLVE_ATTACK', (state, player, effect, ctx) =>
        AttackEffectHandler.resolveAttack(state, player, effect, ctx)
    );

    // ========================================================================
    // Condition Effects
    // ========================================================================

    EffectHandlerRegistry.register('CONDITION', (state, player, effect, ctx) =>
        ConditionEffectHandler.handleCondition(state, player, effect, ctx)
    );

    // ========================================================================
    // Duration Effects
    // ========================================================================

    EffectHandlerRegistry.register('SET_ASIDE_LINKED', (state, player, effect, ctx) =>
        DurationEffectHandler.handleSetAsideLinked(state, player, effect, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('RETURN_LINKED_CARDS', (state, player, _effect, ctx) =>
        DurationEffectHandler.handleReturnLinkedCards(state, player, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('SEA_CHART_CHECK', (state, player, _effect, _ctx) =>
        DurationEffectHandler.handleSeaChartCheck(state, player)
    );

    // ========================================================================
    // Trigger Effects
    // ========================================================================

    EffectHandlerRegistry.register('REGISTER_TRIGGER', (state, player, effect, ctx) =>
        TriggerEffectHandler.handleRegisterTrigger(state, player, effect, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('REMOVE_SUN_TOKEN', (state, _player, _effect, _ctx) => {
        ProphecyManager.removeSunToken(state);
        return { state, needsChoice: false };
    });

    // ========================================================================
    // Zone Effects
    // ========================================================================

    EffectHandlerRegistry.register('DISCARD_TOP_DECK', (state, player, _effect, _ctx) =>
        ZoneEffectHandler.handleDiscardTopDeck(state, player)
    );

    EffectHandlerRegistry.register('TOPDECK_THIS', (state, player, _effect, ctx) =>
        ZoneEffectHandler.handleTopdeckThis(state, player, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('DISCARD_HAND', (state, player, _effect, _ctx) =>
        ZoneEffectHandler.handleDiscardHand(state, player)
    );

    EffectHandlerRegistry.register('MOVE_CARDS', (state, player, effect, _ctx) =>
        ZoneEffectHandler.handleMoveCards(state, player, effect)
    );
    
    EffectHandlerRegistry.register('MOVE_TO_ZONE', (state, player, effect, ctx) =>
        ZoneEffectHandler.handleMoveToZone(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('ROTATE_PILE', (state, _player, effect, _ctx) =>
        ZoneEffectHandler.handleRotatePile(state, effect)
    );

    EffectHandlerRegistry.register('MOVE_TO_MAT', (state, player, effect, ctx) =>
        ZoneEffectHandler.handleMoveToMat(state, player, effect, ctx)
    );

    EffectHandlerRegistry.register('TAKE_FROM_MAT', (state, player, effect, _ctx) =>
        ZoneEffectHandler.handleTakeFromMat(state, player, effect)
    );

    EffectHandlerRegistry.register('PLAY_FROM_MAT', (state, player, effect, _ctx) =>
        ZoneEffectHandler.handlePlayFromMat(state, player, effect)
    );

    // ========================================================================
    // System & Phase Effects
    // ========================================================================

    EffectHandlerRegistry.register('FINALIZE_CLEANUP', (state, player, _effect, _ctx) =>
        CleanupEffectHandler.handleFinalizeCleanup(state, player)
    );

    EffectHandlerRegistry.register('START_NEXT_TURN', (state, _player, _effect, _ctx) =>
        CleanupEffectHandler.handleStartNextTurn(state)
    );

    EffectHandlerRegistry.register('RECURSIVE_APPLY', (state, player, effect, ctx) => {
        const eff = effect as any;
        if (eff.effects) {
            const nested = eff.effects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e,
                context: { sourceCardInstanceId: ctx.sourceCardInstanceId, suppressLog: ctx.suppressLog }
            }));
            state.effectStack.push(...nested.reverse());
        }
        return { state, needsChoice: false };
    });

    // ========================================================================
    // Phase 1 Primitives — Shared across Plunder, Allies, Rising Sun
    // ========================================================================

    // PLAY_TARGET: Play a card from hand (used by Daimyo, Gondola, Mining Road, Sauna, etc.)
    EffectHandlerRegistry.register('PLAY_TARGET', (state, player, effect, ctx) => {
        const eff = effect as any;
        const filter = eff.filter;
        const optional = eff.optional !== false;

        // Find eligible cards in hand
        let candidates = [...player.hand];
        if (filter) {
            if (filter.cardTypes) {
                candidates = candidates.filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def && filter.cardTypes.some((t: string) => def.types.includes(t as any));
                });
            }
            if (filter.cardIds) {
                candidates = candidates.filter(c => filter.cardIds.includes(c.id));
            }
            if (filter.excludeTypes) {
                candidates = candidates.filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def && !filter.excludeTypes.some((t: string) => def.types.includes(t as any));
                });
            }
        }

        if (candidates.length === 0) {
            return { state, needsChoice: false };
        }

        // Create a choice for the player
        state.pendingDecision = {
            playerId: player.id,
            type: 'SELECT_CARD',
            message: eff.message || 'Choisissez une carte à jouer',
            cards: candidates.map(c => c.instanceId),
            minCards: optional ? 0 : 1,
            maxCards: 1,
            context: {
                effectType: 'PLAY_TARGET',
                sourceZone: 'hand',
                sourceCardInstanceId: ctx.sourceCardInstanceId,
                onSelect: [{ type: 'PLAY_SELECTED_CARD' }]
            }
        } as any;
        return { state, needsChoice: true };
    });

    // PLAY_SELECTED_CARD: Internal effect to play a selected card from hand
    EffectHandlerRegistry.register('PLAY_SELECTED_CARD', (state, player, effect, ctx) => {
        const cardInstanceId = (ctx as any).selectedCardInstanceId || (effect as any).cardInstanceId;
        if (!cardInstanceId) return { state, needsChoice: false };

        const cardIndex = player.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) return { state, needsChoice: false };

        const card = player.hand.splice(cardIndex, 1)[0];
        card.turnPlayed = state.turnNumber;
        player.playArea.push(card);

        const cardDef = CardRegistry.get(card.id);
        if (!cardDef) return { state, needsChoice: false };

        Logger.log(state, `${player.name} joue ${cardDef.name} (via un effet).`);

        // Apply card effects through the stack
        if (cardDef.effects && cardDef.effects.length > 0) {
            const effectItems = cardDef.effects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e,
                context: { sourceCardInstanceId: card.instanceId }
            }));
            state.effectStack.push(...effectItems.reverse());
        }

        // Trigger ON_PLAY
        TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);

        return { state, needsChoice: false };
    });

    // GAIN_RELATIVE_COST: Gain a card based on last trashed card's cost + bonus
    EffectHandlerRegistry.register('GAIN_RELATIVE_COST', (state, player, effect, _ctx) => {
        const eff = effect as any;
        const lastTrashed = (state as any).lastTrashedCard;
        if (!lastTrashed) return { state, needsChoice: false };

        const trashedDef = CardRegistry.get(lastTrashed.id);
        if (!trashedDef) return { state, needsChoice: false };

        const baseCost = EconomyEngine.getCardCost(state, player.id, lastTrashed.id);
        const maxCost = baseCost + (eff.amount || 0);

        // Push a GAIN_CARD effect with the computed max cost
        state.effectStack.push({
            type: 'EFFECT',
            playerId: player.id,
            effect: {
                type: 'GAIN_CARD',
                maxCost,
                cardTypes: eff.cardTypes,
                destination: eff.destination || 'discardPile'
            }
        });

        return { state, needsChoice: false };
    });

    // SET_ASIDE_THIS: Move the source card from play to aside
    EffectHandlerRegistry.register('SET_ASIDE_THIS', (state, player, _effect, ctx) => {
        const cardInstanceId = ctx.sourceCardInstanceId;
        if (!cardInstanceId) return { state, needsChoice: false };

        const cardIndex = player.playArea.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) return { state, needsChoice: false };

        const card = player.playArea.splice(cardIndex, 1)[0];
        player.aside.push(card);

        const cardDef = CardRegistry.get(card.id);
        Logger.log(state, `${player.name} met ${cardDef?.name || card.id} de côté.`);

        return { state, needsChoice: false };
    });

    // TOPDECK_FROM_HAND: Choose a card from hand and put it on deck
    EffectHandlerRegistry.register('TOPDECK_FROM_HAND', (state, player, effect, ctx) => {
        const eff = effect as any;
        // Delegate to CHOOSE_FROM_ZONE with destination: 'deck'
        const chooseEffect = {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: eff.min || 1,
            max: eff.max || 1,
            destination: 'deck',
            message: eff.message || 'Mettez une carte sur votre pioche',
            filter: eff.filter
        };
        return ChoiceEffectHandler.handleChooseFromZone(state, player, chooseEffect, ctx);
    });

    // TOPDECK_FROM_DISCARD: Choose a card from discard and put it on deck
    EffectHandlerRegistry.register('TOPDECK_FROM_DISCARD', (state, player, effect, ctx) => {
        const eff = effect as any;
        const chooseEffect = {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'discardPile',
            min: eff.min || 1,
            max: eff.max || 1,
            destination: 'deck',
            message: eff.message || 'Mettez une carte de la défausse sur votre pioche',
            filter: eff.filter
        };
        return ChoiceEffectHandler.handleChooseFromZone(state, player, chooseEffect, ctx);
    });

    // REVEAL_HAND: Log all cards in a player's hand (for Cutpurse fallback etc.)
    EffectHandlerRegistry.register('REVEAL_HAND', (state, player) => {
        const cardNames = player.hand.map(c => CardRegistry.get(c.id)?.name || c.id).join(', ');
        Logger.log(state, `${player.name} révèle sa main : ${cardNames || '(vide)'}`);
        EffectUtils.revealCards(state, player.hand, 'ALL', `Main de ${player.name}`);
        return { state, needsChoice: false };
    });

    // RETURN_TO_SUPPLY: Return a card from play to its supply pile
    EffectHandlerRegistry.register('RETURN_TO_SUPPLY', (state, player, effect, ctx) => {
        const eff = effect as any;
        const cardInstanceId = ctx.sourceCardInstanceId || (eff as any).cardInstanceId;
        const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
        if (card) {
            const pile = state.supply[card.id];
            if (pile) {
                pile.count++;
                Logger.log(state, `${player.name} remet ${CardRegistry.get(card.id)?.name || card.id} dans la réserve.`);
            }
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('RETURN_TO_PILE', (state, player, effect, ctx) => {
        const eff = effect as any;
        const cardInstanceId = ctx.sourceCardInstanceId || (eff as any).cardInstanceId;
        const card = EffectUtils.removeCardFromPlayer(state, player, cardInstanceId);
        if (card) {
            // Check supply or non-supply
            const pile = state.supply[card.id] || state.nonSupply[card.id];
            if (pile) {
                pile.count++;
                Logger.log(state, `${player.name} remet ${CardRegistry.get(card.id)?.name || card.id} sur sa pile.`);
            }
        }
        return { state, needsChoice: false };
    });

    // MAY_TRASH_FOR_BONUS: Optional trash from hand; if done, apply bonus effects
    EffectHandlerRegistry.register('MAY_TRASH_FOR_BONUS', (state, player, effect, ctx) => {
        const eff = effect as any;
        const min = eff.min || 1;
        const max = eff.max || min;
        const filter = eff.filter;

        // Check if player has enough cards matching filter
        let candidates = [...player.hand];
        if (filter) {
            candidates = EffectUtils.filterCards(candidates, filter);
        }

        if (candidates.length < min) {
            // Can't meet minimum — skip
            return { state, needsChoice: false };
        }

        // Create optional trash choice
        state.pendingDecision = {
            playerId: player.id,
            type: 'SELECT_CARD',
            message: eff.message || `Vous pouvez écarter ${min === max ? min : `${min}-${max}`} carte(s) de votre main`,
            cards: candidates.map(c => c.instanceId),
            minCards: 0, // Always optional (MAY)
            maxCards: max,
            context: {
                effectType: 'MAY_TRASH_FOR_BONUS',
                sourceZone: 'hand',
                requiredMin: min,
                bonusEffects: eff.bonus || [],
                sourceCardInstanceId: ctx.sourceCardInstanceId
            }
        } as any;
        return { state, needsChoice: true };
    });

    // SHUFFLE_DISCARD_INTO_DECK: Shuffle discard pile into deck
    EffectHandlerRegistry.register('SHUFFLE_DISCARD_INTO_DECK', (state, player) => {
        player.deck.push(...player.discardPile);
        player.discardPile = [];
        player.deck = EffectUtils.shuffle(player.deck, state);
        Logger.log(state, `${player.name} mélange sa défausse dans sa pioche.`);
        return { state, needsChoice: false };
    });

    // SPEND_MONEY: Deduct coins from a player
    EffectHandlerRegistry.register('SPEND_MONEY', (state, player, effect) => {
        const amount = (effect as any).amount || 0;
        player.coins = Math.max(0, player.coins - amount);
        Logger.log(state, `${player.name} dépense ${amount} 💰.`);
        return { state, needsChoice: false };
    });

    // ADD_FAVORS: Add favor tokens
    EffectHandlerRegistry.register('ADD_FAVORS', (state, player, effect) => {
        const amount = (effect as any).amount || 0;
        player.favors = (player.favors || 0) + amount;
        Logger.log(state, `${player.name} reçoit +${amount} Faveur(s).`);
        return { state, needsChoice: false };
    });

    // DISCARD_DOWN_TO: Force discard down to N cards in hand
    EffectHandlerRegistry.register('DISCARD_DOWN_TO', (state, player, effect, _ctx) => {
        const target = (effect as any).amount !== undefined ? (effect as any).amount : ((effect as any).targetSize || 3);
        while (player.hand.length > target) {
            const card = player.hand.pop();
            if (card) player.discardPile.push(card);
        }
        return { state, needsChoice: false };
    });

    // NEXT_GAIN_TO_DECK: Next gained card goes on top of deck (register trigger)
    EffectHandlerRegistry.register('NEXT_GAIN_TO_DECK', (state, player) => {
        const trigger = {
            type: 'REGISTER_TRIGGER',
            trigger: 'ON_GAIN',
            duration: 'ONCE',
            effects: [{ type: 'MOVE_GAINED_TO_HAND', destination: 'deck' }]
        };
        return TriggerEffectHandler.handleRegisterTrigger(state, player, trigger);
    });

    // PLAY_THIS_CARD: Play the gained card (for Buried Treasure onGain)
    EffectHandlerRegistry.register('PLAY_THIS_CARD', (state, player, _effect, ctx) => {
        const cardInstanceId = ctx.sourceCardInstanceId;
        if (!cardInstanceId) return { state, needsChoice: false };

        // Find in discard pile (most likely location after gain)
        const idx = player.discardPile.findIndex(c => c.instanceId === cardInstanceId);
        if (idx === -1) return { state, needsChoice: false };

        const card = player.discardPile.splice(idx, 1)[0];
        card.turnPlayed = state.turnNumber;
        player.playArea.push(card);

        const cardDef = CardRegistry.get(card.id);
        if (!cardDef) return { state, needsChoice: false };

        Logger.log(state, `${player.name} joue ${cardDef.name} immédiatement.`);

        if (cardDef.effects && cardDef.effects.length > 0) {
            const effectItems = cardDef.effects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e,
                context: { sourceCardInstanceId: card.instanceId, sourceCardId: card.id }
            }));
            state.effectStack.push(...effectItems.reverse());
        }

        if (cardDef.types.includes('DURATION') && cardDef.durationEffects) {
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'DURATION',
                    effects: cardDef.durationEffects,
                    turns: 1
                } as any,
                context: { sourceCardInstanceId: card.instanceId, sourceCardId: card.id }
            });
        }

        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('MOVE_TO_TAVERN_MAT', (state, player, effect, ctx) =>
        ZoneEffectHandler.handleMoveToMat(state, player, { ...effect, mat: 'tavern' }, ctx)
    );

    EffectHandlerRegistry.register('DISCARD_TO_DECK', (state, player, _effect, _ctx) =>
        ZoneEffectHandler.handleDiscardToDeck(state, player)
    );

    EffectHandlerRegistry.register('ADD_NEXT_TURN_DRAW', (state, player, effect, _ctx) => {
        const amount = effect.amount || 1;
        player.nextTurnDraw = (player.nextTurnDraw || 0) + amount;
        Logger.log(state, `${player.name} piochera +${amount} cartes au prochain tour.`, player.id);
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('CHECK_PREVIOUS_TURN', (state, player, effect, _ctx) =>
        ExpansionEffectHandler.handleCheckPreviousTurn(state, player, effect)
    );

    EffectHandlerRegistry.register('DISCARD_HAND', (state, player, effect, _ctx) =>
        TrashEffectHandler.handleDiscard(state, player, { ...effect, forceAll: true })
    );

    EffectHandlerRegistry.register('REVEAL_HAND', (state, player, _effect, _ctx) => {
        state.revealedCards = { cards: [...player.hand], visibleTo: 'ALL', cause: 'REVEAL_HAND' };
        Logger.log(state, `${player.name} révèle sa main : ${player.hand.map(c => c.id).join(', ')}`, player.id);
        return { state, needsChoice: false };
    });

    // Poor House: -1 coin per Treasure in hand (minimum 0)
    EffectHandlerRegistry.register('SUBTRACT_MONEY_PER_TREASURE_IN_HAND', (state, player, _effect, _ctx) => {
        const treasureCount = player.hand.filter(c => {
            const def = CardRegistry.get(c.id);
            return def?.types?.includes('TREASURE');
        }).length;
        const reduction = Math.min(player.coins, treasureCount);
        player.coins = Math.max(0, player.coins - reduction);
        if (reduction > 0) {
            Logger.log(state, `${player.name} perd ${reduction} 💰 (Hospice, ${treasureCount} Trésor(s) en main).`, player.id);
        }
        return { state, needsChoice: false };
    });

    // Forager: +1 coin per unique Treasure name in trash
    EffectHandlerRegistry.register('ADD_MONEY_PER_UNIQUE_TREASURE_IN_TRASH', (state, player, _effect, _ctx) => {
        const uniqueTreasureNames = new Set(
            state.trash
                .filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def?.types?.includes('TREASURE');
                })
                .map(c => c.id)
        );
        const bonus = uniqueTreasureNames.size;
        player.coins += bonus;
        Logger.log(state, `${player.name} gagne +${bonus} 💰 (Glaneuse, ${bonus} Trésor(s) unique(s) dans le Rebut).`, player.id);
        return { state, needsChoice: false };
    });

    // Vassal: discard top card of deck; if Action, player may play it
    EffectHandlerRegistry.register('VASSAL_EFFECT', (state, player, _effect, ctx) => {
        if (player.deck.length === 0) {
            if (player.discardPile.length === 0) return { state, needsChoice: false };
            player.deck = EffectUtils.shuffle(player.discardPile, state);
            player.discardPile = [];
        }

        const topCard = player.deck.shift();
        if (!topCard) return { state, needsChoice: false };

        const cardDef = CardRegistry.get(topCard.id);
        const isAction = cardDef?.types?.includes('ACTION');

        EffectUtils.log(state, `${player.name} révèle et défausse ${cardDef?.name || topCard.id} (Vassal).`, player.id);

        if (!isAction) {
            player.discardPile.push(topCard);
            return { state, needsChoice: false };
        }

        // Put in aside and prompt player if they want to play it
        player.aside.push(topCard);
        state.pendingDecision = {
            id: `vassal_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: `Vassal : Voulez-vous jouer ${cardDef?.name || topCard.id} ?`,
            constraints: { min: 0, max: 1, sourceZone: 'aside' },
            context: {
                specialAction: 'VASSAL_PLAY',
                cardInstanceId: topCard.instanceId,
                cardId: topCard.id,
                sourceCardInstanceId: ctx.sourceCardInstanceId
            },
            optional: true
        };
        return { state, needsChoice: true };
    });

    // Messenger: Discard entire deck
    EffectHandlerRegistry.register('DECK_TO_DISCARD', (state, player, _effect, _ctx) => {
        player.discardPile.push(...player.deck);
        player.deck = [];
        EffectUtils.log(state, `${player.name} défausse toute sa pioche (Messager).`, player.id);
        return { state, needsChoice: false };
    });

    // Miser: Put a Copper from hand onto Tavern mat
    EffectHandlerRegistry.register('PUT_COPPER_ON_TAVERN', (state, player, _effect, _ctx) => {
        const copperIdx = player.hand.findIndex(c => c.id === 'copper');
        if (copperIdx !== -1) {
            const copper = player.hand.splice(copperIdx, 1)[0];
            if (!player.mats) player.mats = {};
            if (!player.mats.tavern) player.mats.tavern = [];
            player.mats.tavern.push(copper);
            player.tavernMat = player.mats.tavern;
            EffectUtils.log(state, `${player.name} place un Cuivre sur son plateau Taverne (Avare).`, player.id);
        }
        return { state, needsChoice: false };
    });

    // Miser: +1 coin per Copper on Tavern mat
    EffectHandlerRegistry.register('ADD_MONEY_PER_COPPER_ON_TAVERN', (state, player, _effect, _ctx) => {
        const copperCount = ((player.mats?.tavern || player.tavernMat) || []).filter(c => c.id === 'copper').length;
        player.coins += copperCount;
        EffectUtils.log(state, `${player.name} obtient +${copperCount} 💰 (Avare, ${copperCount} Cuivre(s) sur Taverne).`, player.id);
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('FINALIZE_CLEANUP', (state, player, _effect, _ctx) =>
        CleanupEffectHandler.handleFinalizeCleanup(state, player)
    );

    EffectHandlerRegistry.register('DURATION', (state, player, effect, ctx) => {
        const eff = effect as any;
        DurationManager.register(state, {
            cardInstanceId: ctx.sourceCardInstanceId!,
            cardId: ctx.sourceCardId || (eff.cardId as string),
            playerId: player.id,
            turnsRemaining: eff.turns || 1,
            effects: eff.effects || []
        });
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('START_NEXT_TURN', (state, _player, _effect, _ctx) =>
        CleanupEffectHandler.handleStartNextTurn(state)
    );

    EffectHandlerRegistry.register('MOVE_CARDS', (state, player, effect, _ctx) =>
        ZoneEffectHandler.handleMoveCards(state, player, effect)
    );

    EffectHandlerRegistry.register('TRASH_SELF', (state, player, _effect, ctx) =>
        ZoneEffectHandler.handleTrashSelf(state, player, ctx.sourceCardInstanceId)
    );

    EffectHandlerRegistry.register('SEQUENCE', (state, player, effect, ctx) => {
        if (effect.effects && effect.effects.length > 0) {
            const effectItems = effect.effects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e,
                context: ctx
            }));
            state.effectStack.push(...effectItems.reverse());
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('MOVE_TO_POSITION', (state, player, effect, _ctx) => {
        const from = effect.from || 'discardPile';
        const position = effect.position || 'TOP';
        const card = effect.cardInstanceId
            ? EffectUtils.removeCardFromPlayer(state, player, effect.cardInstanceId)
            : (state.lastGainedCard ? EffectUtils.removeCardFromPlayer(state, player, state.lastGainedCard.instanceId) : player.discardPile.pop());
        if (card) {
            EffectUtils.addCardToZone(player, card, 'deck', state, position);
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('REGISTER_ENCHANTRESS', (state, player, _effect, _ctx) => {
        if (!state.activeEnchantresses) state.activeEnchantresses = [];
        if (!state.activeEnchantresses.includes(player.id)) {
            state.activeEnchantresses.push(player.id);
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('PLAY_ACTION_TWICE', (state, player, _effect, ctx) =>
        handlePlayActionMultiple(state, player, 2, ctx)
    );

    EffectHandlerRegistry.register('PLAY_ACTION_THRICE', (state, player, _effect, ctx) =>
        handlePlayActionMultiple(state, player, 3, ctx)
    );

    EffectHandlerRegistry.register('PLAY_TARGET', (state, player, effect, ctx) => {
        if (effect.sourceZone === 'aside') {
            const asideActions = player.aside.filter(c => {
                const def = CardRegistry.get(c.id);
                return def?.types.includes('ACTION');
            });
            for (const c of asideActions) {
                const card = EffectUtils.removeCardFromPlayer(state, player, c.instanceId);
                if (card) {
                    player.playArea.push(card);
                    const def = CardRegistry.get(card.id);
                    if (def?.effects) {
                        const effectItems = def.effects.map((e: any) => ({
                            type: 'EFFECT' as const,
                            playerId: player.id,
                            effect: e,
                            context: { sourceCardInstanceId: card.instanceId, sourceCardId: card.id }
                        }));
                        state.effectStack.push(...effectItems.reverse());
                    }
                }
            }
            return { state, needsChoice: false };
        }
        return handlePlayActionMultiple(state, player, effect.times || 2, ctx);
    });

    EffectHandlerRegistry.register('ADD_CARDS_PER_ACTION_IN_PLAY', (state, player, effect, _ctx) => {
        const actionCount = player.playArea.filter(c => {
            const def = CardRegistry.get(c.id);
            return def?.types.includes('ACTION');
        }).length;
        const multiplier = effect.multiplier || 1;
        const amount = actionCount * multiplier;
        if (amount > 0) {
            DrawEffectHandler.handleDraw(state, player, amount);
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('ADD_VP_TOKENS', (state, player, effect, _ctx) => {
        const amount = effect.amount || 1;
        if (!player.tokens) player.tokens = {};
        player.tokens.vp = (player.tokens.vp || 0) + amount;
        player.vpTokens = player.tokens.vp;
        Logger.log(state, `${player.name} gagne +${amount} jeton(s) PV.`, player.id);
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('TAKE_VP_FROM_PILE', (state, player, effect, _ctx) => {
        const pileId = effect.pileId || 'farmers_market';
        const pile = state.supply[pileId];
        const count = pile?.tokens?.['vp'] || 0;
        if (count > 0) {
            pile.tokens!['vp'] = 0;
            if (!player.tokens) player.tokens = {};
            player.tokens.vp = (player.tokens.vp || 0) + count;
            player.vpTokens = player.tokens.vp;
            Logger.log(state, `${player.name} prend ${count} jeton(s) PV sur la pile ${pileId}.`, player.id);
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('GATHER_VP', (state, player, effect, _ctx) => {
        const pileId = effect.pileId || 'farmers_market';
        const amount = effect.amount || 1;
        const pile = state.supply[pileId];
        if (pile) {
            if (!pile.tokens) pile.tokens = {};
            pile.tokens['vp'] = (pile.tokens['vp'] || 0) + amount;
            Logger.log(state, `+${amount} jeton PV ajouté à la pile ${pileId}.`, player.id);
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('REVEAL_TOP_OF_DECK', (state, player, effect, ctx) => {
        if (player.deck.length === 0 && player.discardPile.length > 0) {
            player.deck = EffectUtils.shuffle(player.discardPile, state);
            player.discardPile = [];
        }
        if (player.deck.length === 0) return { state, needsChoice: false };
        const topCard = player.deck[0];
        EffectUtils.log(state, `${player.name} révèle ${CardRegistry.get(topCard.id)?.name || topCard.id} du dessus de sa pioche.`, player.id);
        if (effect.next) {
            const nextEffects = Array.isArray(effect.next) ? effect.next : [effect.next];
            const effectItems = nextEffects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e,
                context: { ...ctx, revealedCardId: topCard.id }
            }));
            state.effectStack.push(...effectItems.reverse());
        }
        return { state, needsChoice: false };
    });

    EffectHandlerRegistry.register('COMPARE_TOP_OF_DECK_WITH_NEIGHBOR', (state, player, effect, _ctx) => {
        const playerIndex = state.players.findIndex(p => p.id === player.id);
        const neighborIndex = (playerIndex + 1) % state.players.length;
        const neighbor = state.players[neighborIndex];

        if (neighbor.deck.length === 0 && neighbor.discardPile.length > 0) {
            neighbor.deck = EffectUtils.shuffle(neighbor.discardPile, state);
            neighbor.discardPile = [];
        }

        const myCard = player.deck[0];
        const neighborCard = neighbor.deck[0];

        const myCost = myCard ? (CardRegistry.get(myCard.id)?.cost || 0) : 0;
        const neighborCost = neighborCard ? (CardRegistry.get(neighborCard.id)?.cost || 0) : 0;

        if (myCost > neighborCost) {
            if (effect.onTrue) {
                const subEffects = effect.onTrue.map((e: any) => ({
                    type: 'EFFECT' as const,
                    playerId: player.id,
                    effect: e
                }));
                state.effectStack.push(...subEffects.reverse());
            }
        } else {
            if (effect.onFalse) {
                const subEffects = effect.onFalse.map((e: any) => ({
                    type: 'EFFECT' as const,
                    playerId: player.id,
                    effect: e
                }));
                state.effectStack.push(...subEffects.reverse());
            }
        }
        return { state, needsChoice: false };
    });

    RisingSunEffectHandler.register();
    AlliesEffectHandler.register();
    BoonsEffectHandler.register();
    PlunderEffectHandler.register();
    MenagerieEffectHandler.register();

}

function handlePlayActionMultiple(state: any, player: any, multiplier: number, ctx: any) {
    let selectedCard = state.lastDecisionResults?.cards?.[0];
    if (!selectedCard && ctx?.sourceCardInstanceId) {
        selectedCard = player.playArea.find((c: any) => c.instanceId === ctx.sourceCardInstanceId)
                    || player.hand.find((c: any) => c.instanceId === ctx.sourceCardInstanceId);
    }
    if (!selectedCard) {
        console.log('[handlePlayActionMultiple] No card selected for multiple play');
        return { state, needsChoice: false };
    }

    const cardDef = CardRegistry.get(selectedCard.id);
    if (!cardDef) return { state, needsChoice: false };

    // Move to playArea if still in hand
    const fromHand = EffectUtils.removeCardFromPlayer(state, player, selectedCard.instanceId);
    if (fromHand && !player.playArea.some((c: any) => c.instanceId === selectedCard.instanceId)) {
        player.playArea.push(fromHand);
    }

    Logger.log(state, `${player.name} joue ${cardDef.name} ${multiplier} fois.`);

    // If treasure with value and no custom effects, grant money * multiplier
    if (cardDef.treasureValue && (!cardDef.effects || cardDef.effects.length === 0)) {
        player.coins += (cardDef.treasureValue * multiplier);
    }

    if (cardDef.effects && cardDef.effects.length > 0) {
        for (let i = 0; i < multiplier; i++) {
            const effectItems = cardDef.effects.map((e: any) => ({
                type: 'EFFECT' as const,
                playerId: player.id,
                effect: e as any,
                context: { sourceCardInstanceId: selectedCard.instanceId, sourceCardId: selectedCard.id }
            }));
            state.effectStack.push(...effectItems.reverse());

            if (cardDef.types.includes('DURATION') && cardDef.durationEffects) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: {
                        type: 'DURATION',
                        effects: cardDef.durationEffects,
                        turns: 1
                    } as any,
                    context: { sourceCardInstanceId: selectedCard.instanceId, sourceCardId: selectedCard.id }
                });
            }

            TriggerEffectHandler.handleOnPlayTriggers(state, player, selectedCard.id, selectedCard.instanceId);
        }
    }

    return { state, needsChoice: false };
}

// Auto-register on import
registerCoreEffects();
