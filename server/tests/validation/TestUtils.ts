
import { describe, expect, test } from 'vitest';
import { GameState, createGameState, LogEntry, getCurrentPlayer } from '../../../shared/engine/GameState';
import { PlayerState, createPlayerState, resetTurnResources } from '../../../shared/engine/PlayerState';
import { EffectEngine } from '../../../shared/engine/EffectEngine';
import { createCardInstance, CardInstance } from '../../../shared/engine/CardInstance';
import { CardRegistry } from '../../../shared/cards/index';
import { PromptType } from '../../../shared/engine/prompts/Prompt';
import { ActionResolver } from '../../../shared/engine/ActionResolver';
import { CleanupEffectHandler } from '../../../shared/engine/effects/CleanupEffectHandler';
import { TriggerEffectHandler } from '../../../shared/engine/effects/TriggerEffectHandler';
import { PhaseEngine } from '../../../shared/engine/PhaseEngine';
import { GameLogStore } from '../../../shared/engine/GameLogStore';
import { Logger } from '../../../shared/engine/Logger.js';
import { GainEffectHandler } from '../../../shared/engine/effects/GainEffectHandler.js';
import { DurationManager } from '../../../shared/engine/DurationManager';
import { PhaseTriggerAdapter } from '../../../shared/engine/PhaseTriggerAdapter';
import { registerDefaultPhases } from '../../../shared/engine/registerCorePhases';

// Load ALL cards
import '../../../shared/cards/index';

registerDefaultPhases();
PhaseTriggerAdapter.register();

export class TestEngine {
    state: GameState;
    activePlayerId: string;

    constructor() {
        this.state = createGameState('test_seed');
        PhaseEngine.initTurnPipeline(this.state);
        // Setup Supply (Required for Gain effects)
        const basicCards = ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse'];
        const kingdomCards = [
            'village', 'smithy', 'market', 'militia', 'cellar', 'chapel', 'moat', 'harbinger', 'merchant', 'vassal', 'poacher',
            'bandit', 'sentry', 'artisan', 'bureaucrat', 'gardens', 'moneylender', 'remodel', 'throne_room', 'library', 'mine',
            'council_room', 'festival', 'laboratory', 'workshop', 'witch',
            // Seaside
            'island', 'native_village', 'lookout', 'salvager', 'sea_witch', 'haven', 'warehouse', 'navigator', 'pirate_ship', 'fishing_village', 'caravan', 'wharf', 'merchant_ship', 'tactician', 'lighthouse', 'ghost_ship', 'outpost', 'ambassador', 'embargo', 'pearl_diver', 'cutpurse', 'bazaar', 'smugglers', 'treasury',
            // Adventures Part 1
            'amulet', 'caravan_guard', 'dungeon', 'gear', 'guide', 'hireling', 'lost_city', 'magpie', 'messenger', 'miser',
            // Empires Part 1
            'archive', 'capital', 'catapult', 'rocks', 'chariot_race', 'city_quarter', 'crown', 'enchantress', 'engineer', 'farmers_market', 'forum', 'gladiator', 'fortune', 'groundskeeper',
            // Prosperity 2nd Edition
            'mint', 'magnate', 'city', 'workers_village', 'vault', 'kings_court', 'expand', 'watchtower', 'tiara', 'war_chest',
            // Intrigue 2nd Edition
            'patrol', 'shanty_town', 'steward', 'swindler', 'mining_village', 'secret_passage', 'courtier', 'lurker', 'diplomat', 'mill', 'replace', 'nobles'
        ];
        [...basicCards, ...kingdomCards].forEach(id => {
            if (!this.state.supply[id]) {
                this.state.supply[id] = {
                    cardId: id,
                    count: 10,
                    cards: [],
                    tokens: {}
                };
            }
        });

        // Setup 2 players with proper names
        const p1 = createPlayerState('Player1', 'Player 1');
        const p2 = createPlayerState('Player2', 'Player 2');
        this.state.players.push(p1, p2);
        this.state.turnNumber = 1;
        this.state.players.forEach((p: PlayerState) => {
            p.deck = [];
            p.discardPile = [];
            p.hand = [];
            p.playArea = [];
            resetTurnResources(p); // Initialize Actions/Buys
        });
        this.activePlayerId = p1.id;
        this.state.currentPlayerIndex = 0;
        this.state.phase = 'ACTION' as any;
    }

    getPlayer(id: string = this.activePlayerId): PlayerState {
        return this.state.players.find((p: PlayerState) => p.id === id)!;
    }

    findPlayer(nameOrId: string): PlayerState {
        return this.state.players.find(p => p.id === nameOrId || p.name === nameOrId)!;
    }

    setHand(pOrCardIds: PlayerState | string | string[], cardIds?: string[]) {
        const isFirstArgArray = Array.isArray(pOrCardIds);
        const player = isFirstArgArray ? this.getPlayer(this.activePlayerId) :
            (typeof pOrCardIds === 'string' ? this.getPlayer(pOrCardIds) : pOrCardIds as PlayerState);
        const cards = isFirstArgArray ? (pOrCardIds as string[]) : cardIds || [];
        player.hand = cards.map(id => createCardInstance(id));
    }

    setDeck(pOrCardIds: PlayerState | string | string[], cardIds?: string[]) {
        const isFirstArgArray = Array.isArray(pOrCardIds);
        const player = isFirstArgArray ? this.getPlayer(this.activePlayerId) :
            (typeof pOrCardIds === 'string' ? this.getPlayer(pOrCardIds) : pOrCardIds as PlayerState);
        const cards = isFirstArgArray ? (pOrCardIds as string[]) : cardIds || [];
        player.deck = cards.map(id => createCardInstance(id));
    }

    setDiscard(pOrCardIds: PlayerState | string | string[], cardIds?: string[]) {
        const isFirstArgArray = Array.isArray(pOrCardIds);
        const player = isFirstArgArray ? this.getPlayer(this.activePlayerId) :
            (typeof pOrCardIds === 'string' ? this.getPlayer(pOrCardIds) : pOrCardIds as PlayerState);
        const cards = isFirstArgArray ? (pOrCardIds as string[]) : cardIds || [];
        player.discardPile = cards.map(id => createCardInstance(id));
    }

    setPlayArea(pOrCardIds: PlayerState | string | string[], cardIds?: string[]) {
        const isFirstArgArray = Array.isArray(pOrCardIds);
        const player = isFirstArgArray ? this.getPlayer(this.activePlayerId) :
            (typeof pOrCardIds === 'string' ? this.getPlayer(pOrCardIds) : pOrCardIds as PlayerState);
        const cards = isFirstArgArray ? (pOrCardIds as string[]) : cardIds || [];
        player.playArea = cards.map(id => createCardInstance(id));
    }

    createCard(id: string) {
        return createCardInstance(id);
    }

    addCardToHand(cardId: string, playerId: string = this.activePlayerId) {
        const p = this.getPlayer(playerId);
        p.hand.push(createCardInstance(cardId));
    }

    playCard(cardId: string, decisionPayload?: any, playerId: string = this.activePlayerId) {
        const p = this.getPlayer(playerId);

        // Find card
        const idx = p.hand.findIndex(c => c.id === cardId);
        if (idx === -1) {
            console.log(`[DEBUG] playCard: ${cardId} not found in hand.`);
            console.log(`[DEBUG] Hand contents:`, p.hand.map(c => c.id));
            throw new Error(`Card ${cardId} not found in hand. Hand: ${p.hand.map(c => c.id).join(', ')}`);
        }

        const card = p.hand[idx];
        const cardDef = CardRegistry.get(cardId);
        if (!cardDef) throw new Error(`Card Def ${cardId} not found`);

        this.state.lastDecisionResults = undefined;

        // Move to play (simulated)
        p.hand.splice(idx, 1);
        p.playArea.push(card);

        // Deduct Action Cost
        if (cardDef.types.includes('ACTION')) {
            p.actions -= 1;
        }

        // Add treasure value for Treasures (Capital, etc)
        const isTreasure = cardDef.types.includes('TREASURE');
        if (isTreasure) {
            const val = cardDef.treasureValue || 0;
            p.coins += val;
        }

        // Manually push log
        GameLogStore.addLog(this.state.id, {
            id: 'log_' + Date.now(),
            timestamp: Date.now(),
            activePlayerId: this.activePlayerId,
            turnNumber: this.state.turnNumber,
            message: `${p.name} joue un(e) ${cardDef.name || cardId}`
        } as any);

        // Track turnPlayed for Duration logic
        card.turnPlayed = this.state.turnNumber;

        // Initialize duration turns if applicable
        if (cardDef.durationTurns !== undefined || cardDef.types.includes('DURATION')) {
            card.durationTurns = cardDef.durationTurns;

            if (cardDef.types.includes('DURATION')) {
                DurationManager.register(this.state, {
                    cardInstanceId: card.instanceId,
                    cardId: card.id,
                    playerId: this.activePlayerId,
                    turnsRemaining: cardDef.isPermanentDuration ? 'PERMANENT' : (cardDef.durationTurns || 1),
                    effects: cardDef.durationEffects || []
                });
            }
        }

        // Apply
        let effectsToApply = defToArray(cardDef.effects || []);
        if (cardDef.types.includes('ACTION') && this.state.activeEnchantresses && this.state.activeEnchantresses.length > 0) {
            const othersPlayed = this.state.activeEnchantresses.some(id => id !== this.activePlayerId);
            if (othersPlayed && !this.state.enchantressAffectedPlayers?.includes(this.activePlayerId)) {
                this.state.enchantressAffectedPlayers = [...(this.state.enchantressAffectedPlayers || []), this.activePlayerId];
                effectsToApply = [
                    { type: 'DRAW', amount: 1 },
                    { type: 'ADD_ACTIONS', amount: 1 }
                ];
            }
        }
        EffectEngine.applyEffects(this.state, this.activePlayerId, effectsToApply, false, card.instanceId);

        // Handle Immediate Decision if provided
        if (decisionPayload && this.state.pendingDecision) {
            this.respondToDecision(decisionPayload);
        }
    }

    respondToDecision(payload: any) {
        if (!this.state.pendingDecision) throw new Error("No pending decision");
        // Normalize: tests use 'cardIds' but the engine expects 'cardInstanceIds'
        if (payload.type === 'CARDS' && payload.cardIds && !payload.cardInstanceIds) {
            payload.cardInstanceIds = payload.cardIds;
        }
        EffectEngine.resolveDecision(this.state, this.state.pendingDecision.playerId, payload);

        // Process any subsequent effects until next decision or empty stack
        while (this.state.effectStack.length > 0 && !this.state.pendingDecision) {
            EffectEngine.processStack(this.state);
        }
    }

    respondWithSupply(cardId: string) {
        this.respondToDecision({ type: 'CARD', cardId });
    }

    processStack() {
        EffectEngine.processStack(this.state);
    }

    respondWithCards(cardIds: string[]) {
        if (this.state.pendingDecision?.type !== PromptType.CHOOSE_CARDS) {
            throw new Error(`Expected CHOOSE_CARDS, got ${this.state.pendingDecision?.type}`);
        }
        const p = this.getPlayer(this.state.pendingDecision.playerId);
        const source = p.hand;
        const selectedIds: string[] = [];

        for (const targetId of cardIds) {
            const c = source.find((c: any) => c.id === targetId && !selectedIds.includes(c.instanceId));
            if (c) selectedIds.push(c.instanceId);
        }

        this.respondToDecision({
            type: 'CARDS',
            cardIds: selectedIds
        });
    }

    chooseOption(index: number) {
        if (!this.state.pendingDecision) {
            throw new Error(`Expected pending decision, got none.`);
        }
        if (this.state.pendingDecision.type !== PromptType.SELECT_OPTION && (this.state.pendingDecision.type as string) !== 'CHOICE') {
            throw new Error(`Expected SELECT_OPTION, got ${this.state.pendingDecision.type}`);
        }
        const options = this.state.pendingDecision.options || this.state.pendingDecision.context?.options;
        if (!options || !options[index]) {
            throw new Error(`Option index ${index} out of bounds`);
        }
        const val = options[index].value !== undefined ? options[index].value : { optionIndex: index };
        this.respondToDecision(val);
    }

    chooseCards(instanceIds: string[]) {
        if (!this.state.pendingDecision) {
            throw new Error(`Expected pending decision, got none.`);
        }
        this.respondToDecision({
            type: 'CARDS',
            cardIds: instanceIds
        });
    }

    advanceTurn() {
        // Transition to CLEANUP phase if not already there
        if (this.state.phase !== 'CLEANUP') {
            this.state.phase = 'CLEANUP';
            const player = getCurrentPlayer(this.state);
            CleanupEffectHandler.handlePerformCleanup(this.state, player);
        }

        // Process any stacked effects (FINALIZE_CLEANUP, DRAW, START_NEXT_TURN, etc.)
        let iter = 0;
        while (this.state.effectStack.length > 0 && !this.state.pendingDecision) {
            EffectEngine.processStack(this.state);
        }

        const newPlayer = getCurrentPlayer(this.state);
        this.activePlayerId = newPlayer.id;
    }

    endActionPhase() {
        PhaseEngine.advancePhase(this.state);
        while (this.state.effectStack.length > 0 && !this.state.pendingDecision) {
            EffectEngine.processStack(this.state);
        }
    }

    verifyCardInZone(playerId: string, cardId: string, zone: 'hand' | 'deck' | 'discardPile' | 'playArea') {
        const p = this.getPlayer(playerId);
        const targetZone = p[zone] as CardInstance[];
        expect(targetZone.some(c => c.id === cardId)).toBe(true);
    }

    handleChoice(choice: any) {
        if (typeof choice === 'number') {
            this.respondToDecision({ choiceIndex: choice });
            return;
        }
        if (!this.state.pendingDecision) {
            throw new Error(`No pending decision for choice: ${choice}`);
        }

        const decision = this.state.pendingDecision;
        const type = decision.type;
        const typeStr = type as string;

        if (Array.isArray(choice)) {
            if (typeStr === 'SINGLE_CARD_SELECT' || typeStr === 'MULTI_CARD_SELECT' || typeStr === 'CARDS' || typeStr === 'CHOOSE_CARDS' || typeStr === 'ZONE_SEARCH') {
                this.respondToDecision({
                    type: 'CARDS',
                    cardIds: choice
                });
            } else if (type === PromptType.SELECT_OPTION || typeStr === 'CHOICE' || typeStr === 'SELECT_OPTION') {
                this.chooseOption(Number(choice[0]));
            } else {
                throw new Error(`Unsupported decision type ${type} for array choice`);
            }
            return;
        }

        // Single string choice
        if (typeStr === 'SINGLE_CARD_SELECT' || typeStr === 'MULTI_CARD_SELECT' || typeStr === 'CHOOSE_CARDS' || typeStr === 'SELECT_CARDS' || typeStr === 'ZONE_SEARCH' || typeStr === 'CARDS') {
            const p = this.getPlayer(decision.playerId);
            const sourceZoneStr = (decision.constraints?.sourceZone || 'HAND').toUpperCase();

            if (sourceZoneStr === 'SUPPLY' || (typeStr as string) === 'CHOOSE_CARD_FROM_SUPPLY' || (typeStr as string) === 'GAIN_CARD') {
                this.respondToDecision({ type: 'CARD', cardId: choice });
                return;
            }

            let zone: CardInstance[] = p.hand;
            if (sourceZoneStr === 'ASIDE') zone = p.aside;
            else if (sourceZoneStr === 'DISCARD' || sourceZoneStr === 'DISCARDPILE') zone = p.discardPile;
            else if (sourceZoneStr === 'TRASH') zone = this.state.trash;
            else if (sourceZoneStr === 'PLAY_AREA') zone = p.playArea;

            const card = zone.find(c => c.id === choice);
            if (card) {
                this.respondToDecision({ type: 'CARDS', cardIds: [card.instanceId] });
            } else {
                const cardByInst = zone.find(c => c.instanceId === choice);
                if (cardByInst) {
                    this.respondToDecision({ type: 'CARDS', cardIds: [cardByInst.instanceId] });
                } else {
                    throw new Error(`Card ${choice} not found in ${sourceZoneStr} for choice`);
                }
            }
        } else if (typeStr === 'CHOOSE_CARD_FROM_SUPPLY' || typeStr === 'CARD_SELECT' || typeStr === 'GAIN_CARD') {
            this.respondToDecision({ type: 'CARD', cardId: choice });
        } else if (type === PromptType.SELECT_OPTION || typeStr === 'CHOICE' || typeStr === 'SELECT_OPTION') {
            const options = decision.options || decision.context?.options || [];
            const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const choiceNorm = normalize(String(choice));
            const idx = options.findIndex((o: any) => normalize(o.label || '').includes(choiceNorm));
            if (idx !== -1) {
                this.chooseOption(idx);
            } else {
                const n = parseInt(choice as string);
                if (!isNaN(n)) this.chooseOption(n);
                else throw new Error(`Option ${choice} not found in options: ${options.map((o: any) => o.label).join(', ')}`);
            }
        } else {
            throw new Error(`Unsupported decision type ${type} for handleChoice(${choice})`);
        }
    }

    buyCard(cardId: string, playerId: string = this.activePlayerId) {
        const p = this.getPlayer(playerId);
        const cardDef = CardRegistry.get(cardId);
        if (!cardDef) throw new Error(`Card Def ${cardId} not found`);

        p.coins -= cardDef.cost;
        p.buys -= 1;

        TriggerEffectHandler.handleOnBuyTriggers(this.state, p, cardId);
        EffectEngine.processStack(this.state);
        this.gainCard(cardId, playerId);
    }

    gainCard(cardId: string, playerId: string = this.activePlayerId, destination: any = 'discardPile') {
        const p = this.getPlayer(playerId);
        const card = createCardInstance(cardId);
        
        // Manual placement for speed, but follow engine rules
        switch (destination) {
            case 'hand': p.hand.push(card); break;
            case 'deck': p.deck.unshift(card); break;
            default: p.discardPile.push(card); break;
        }

        // Track for cards like Smugglers
        this.state.lastGainedCard = card;
        const cardDef = CardRegistry.get(cardId);
        this.state.lastGainedCost = cardDef?.cost || 0;

        // Log for history (Smugglers query)
        Logger.logEvent(this.state, {
            actionType: 'GAIN_CARD',
            activePlayerId: playerId,
            message: `${p.name} gagne ${cardDef?.name || cardId}`,
            payload: { cardId }
        });

        if (cardDef && cardDef.onGain) {
            EffectEngine.applyEffects(this.state, playerId, defToArray(cardDef.onGain), false, card.instanceId);
        }

        TriggerEffectHandler.handleOnGainTriggers(this.state, p, card.id);

        while (this.state.effectStack.length > 0 && !this.state.pendingDecision) {
            EffectEngine.processStack(this.state);
        }
    }

    expectLog(fragment: string) {
        const logs = GameLogStore.getLogs(this.state.id).map((l: LogEntry) => l.message).join('\n');
        expect(logs).toContain(fragment);
    }

    drawCards(count: number) {
        const p = this.getPlayer(this.activePlayerId);
        for (let i = 0; i < count; i++) {
            if (p.deck.length === 0) {
                if (p.discardPile.length === 0) break;
                // Simplified shuffle: merge and clear discard
                p.deck = [...p.discardPile];
                p.discardPile = [];
            }
            const c = p.deck.shift();
            if (c) p.hand.push(c);
        }
    }

    expectState(fn: (state: GameState, player: PlayerState) => void) {
        try {
            fn(this.state, this.getPlayer());
        } catch (error) {
            console.log("FULL GAME LOGS ON FAILURE:\n" + GameLogStore.getLogs(this.state.id).map(l => `[${l.playerId || 'system'}] ${l.message}`).join('\n'));
            throw error;
        }
    }

    assertCleanState() {
        expect(this.state.pendingDecision).toBeNull();
    }
}

export function defToArray(effects: any): any[] {
    if (!effects) return [];
    return Array.isArray(effects) ? effects : [effects];
}

export function setupGame(cards: string[]): GameState {
    const state = createGameState('test-seed');
    state.players = [
        createPlayerState('p1', 'Player 1', '#ff0000'),
        createPlayerState('p2', 'Player 2', '#00ff00')
    ];
    state.players.forEach(p => {
        p.isReady = true;
        state.supply['copper'] = { cardId: 'copper', count: 60, cards: [] };
        state.supply['silver'] = { cardId: 'silver', count: 40, cards: [] };
        state.supply['gold'] = { cardId: 'gold', count: 30, cards: [] };
        state.supply['estate'] = { cardId: 'estate', count: 12, cards: [] };
        state.supply['duchy'] = { cardId: 'duchy', count: 12, cards: [] };
        state.supply['province'] = { cardId: 'province', count: 12, cards: [] };
        state.supply['curse'] = { cardId: 'curse', count: 10, cards: [] };
        cards.forEach(c => {
            state.supply[c] = { cardId: c, count: 10, cards: [] };
        });
    });
    ActionResolver.startGame(state);
    state.currentPlayerIndex = 0; // Force p1
    return state;
}

export { createCardInstance };
export function createPlayer(id: string, name: string, color: string = '#ffffff'): PlayerState {
    return createPlayerState(id, name, color);
}
