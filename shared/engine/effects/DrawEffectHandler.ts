import { GameState, PlayerState, CardInstance, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';
import { PromptType } from '../prompts/Prompt.js';
import { EffectDefinition } from '../../types/EffectDefinition.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';

export class DrawEffectHandler {
    public static handleDraw(state: GameState, player: PlayerState, amountInput: any, _suppressLog: boolean = false): EffectResult {
        // Fix: logic to extract 'amount' if the input is an EffectDefinition
        const rawAmount = (amountInput && typeof amountInput === 'object' && 'amount' in amountInput)
            ? amountInput.amount
            : amountInput;

        const amount = EffectUtils.getAmount(state, player, rawAmount);
        const drawnCards: CardInstance[] = [];

        for (let i = 0; i < amount; i++) {
            if (player.deck.length === 0) {
                if (player.discardPile.length === 0) {
                    console.log('[DrawEffectHandler] Empty deck and discard, stopping draw');
                    break;
                }
                EffectUtils.log(state, `${player.name} mélange sa pioche.`, player.id);
                player.deck = EffectUtils.shuffle(player.discardPile, state);
                player.discardPile = [];
                console.log('[DrawEffectHandler] Shuffled discard into deck', { newDeckSize: player.deck.length });
            }
            const card = player.deck.shift();
            if (card) {
                player.hand.push(card);
                drawnCards.push(card);
            } else {
                console.log('[DrawEffectHandler] Deck shift returned undefined despite length > 0');
            }
        }

        console.log('[DrawEffectHandler] Draw complete', {
            drawnCount: drawnCards.length,
            finalHand: player.hand.length
        });

        if (drawnCards.length > 0) {
            const cardNames = drawnCards.map(c => CardRegistry.get(c.id)?.name || c.id).join(', ');
            const msg = `${player.name} pioche ${drawnCards.length} carte${drawnCards.length > 1 ? 's' : ''}.`;

            EffectUtils.logEvent(state, {
                actionType: 'DRAW',
                activePlayerId: player.id,
                message: msg,
                payload: { amount: drawnCards.length, targetIds: drawnCards.map(c => c.id) }
            });

            EffectUtils.log(state, msg, player.id, `Vous piochez ${drawnCards.length} carte${drawnCards.length > 1 ? 's' : ''} : ${cardNames}.`, {
                type: 'DRAW', cardIds: drawnCards.map(c => c.id), forPlayerId: player.id
            });

            // Rising Sun: Shadow cards check
            TriggerEffectHandler.handleOnDrawTriggers(state, player, drawnCards);
        }
        return { state, needsChoice: false };
    }

    public static handleDrawUntilHandSize(state: GameState, player: PlayerState, effect: any, _playerId: string, _suppressLog: boolean = false): EffectResult {
        const targetSize = effect.targetHandSize || effect.targetSize || 7;
        if (player.hand.length >= targetSize) {
            // Discard aside cards if any (from Library/Watchtower logic)
            if (player.aside.length > 0) {
                player.discardPile.push(...player.aside);
                player.aside = [];
            }
            return { state, needsChoice: false };
        }

        const { cards } = this.handleDrawCardsToLimbo(state, player, 1);
        if (cards.length === 0) {
            if (player.aside.length > 0) {
                player.discardPile.push(...player.aside);
                player.aside = [];
            }
            return { state, needsChoice: false };
        }

        const card = cards[0];
        const def = CardRegistry.get(card.id);

        if (effect.maySkipActions && def?.types.includes('ACTION')) {
            player.aside.push(card);
            state.pendingDecision = {
                id: `draw_until_${Date.now()}`,
                playerId: player.id,
                type: 'YES_NO' as any,
                message: `Voulez-vous mettre de côté ${def.name} ?`,
                context: {
                    specialAction: 'LIBRARY_DECISION',
                    cardInstanceId: card.instanceId,
                    targetSize
                }
            };
            return { state, needsChoice: true };
        } else {
            player.hand.push(card);
            EffectUtils.log(state, `${player.name} pioche ${def?.name || card.id}.`, player.id);

            // Rising Sun: Shadow cards check
            import('./TriggerEffectHandler.js').then(m => {
                m.TriggerEffectHandler.handleOnDrawTriggers(state, player, [card]);
            });

            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: { type: 'DRAW_UNTIL_HAND_SIZE', ...effect } as any
            });
            return { state, needsChoice: false };
        }
    }

    public static handleDrawTreasures(state: GameState, player: PlayerState, effect: any): EffectResult {
        const count = effect.amount || 1;
        const revealed: CardInstance[] = [];
        const treasures: CardInstance[] = [];

        while (treasures.length < count && (player.deck.length > 0 || player.discardPile.length > 0)) {
            const { cards } = this.handleDrawCardsToLimbo(state, player, 1);
            if (cards.length === 0) break;
            const card = cards[0];
            const def = CardRegistry.get(card.id);

            EffectUtils.revealCards(state, [card], 'ALL', 'Effet Pioche Trésor', true, false);

            if (def?.types.includes('TREASURE')) {
                treasures.push(card);
            } else {
                revealed.push(card);
            }
        }

        player.hand.push(...treasures);
        player.discardPile.push(...revealed);

        EffectUtils.log(state, `${player.name} ajoute ${treasures.length} Trésor(s) à sa main.`, player.id);
        return { state, needsChoice: false };
    }

    public static handleDrawCardsToLimbo(state: GameState, player: PlayerState, amount: number): { cards: CardInstance[], state: GameState } {
        return EffectUtils.handleDrawCardsToLimbo(state, player, amount);
    }

    public static handlePeekBottom(state: GameState, player: PlayerState): EffectResult {
        if (player.deck.length === 0 && player.discardPile.length > 0) {
            player.deck = EffectUtils.shuffle(player.discardPile, state);
            player.discardPile = [];
            EffectUtils.log(state, `${player.name} mélange sa défausse.`, player.id);
        }

        if (player.deck.length === 0) {
            EffectUtils.log(state, `${player.name} regarde le fond de sa pioche (vide).`, player.id);
            return { state, needsChoice: false };
        }

        const bottomCard = player.deck[player.deck.length - 1];
        const bottomCardDef = CardRegistry.get(bottomCard.id);

        EffectUtils.log(state, `${player.name} regarde la carte du fond de sa pioche.`, player.id);

        state.pendingDecision = {
            id: Math.random().toString(36).substring(7),
            playerId: player.id,
            type: PromptType.YES_NO,
            message: `Carte du fond : ${bottomCardDef?.name}. La mettre sur le dessus ?`,
            context: {
                action: 'PEEK_BOTTOM_RESPONSE',
                cardInstanceId: bottomCard.instanceId
            }
        };

        return { state, needsChoice: true };
    }

    public static handlePeekTopDeck(state: GameState, player: PlayerState, effect: any): EffectResult {
        if (player.deck.length === 0 && player.discardPile.length > 0) {
            player.deck = EffectUtils.shuffle(player.discardPile, state);
            player.discardPile = [];
        }

        if (player.deck.length === 0) {
            EffectUtils.log(state, `${player.name} ne peut pas regarder le dessus de sa pioche (vide).`, player.id);
            return { state, needsChoice: false };
        }

        const topCard = player.deck[0];
        const def = CardRegistry.get(topCard.id);

        EffectUtils.log(state, `${player.name} regarde la carte du dessus de sa pioche.`, player.id);

        state.pendingDecision = {
            id: `peek_top_${Date.now()}`,
            playerId: player.id,
            type: PromptType.SELECT_OPTION,
            message: effect.message || `Carte du dessus : ${def?.name}`,
            context: {
                options: effect.options,
                specialAction: 'PEEK_TOP_DECISION'
            }
        };

        return { state, needsChoice: true };
    }

    public static handleRevealUntil(state: GameState, player: PlayerState, effect: EffectDefinition): EffectResult {
        const revEffect = effect as any;
        const revealed: CardInstance[] = [];
        const matches: CardInstance[] = [];
        const targetCount = revEffect.amount || revEffect.count || 1;
        const limit = revEffect.limit || 50;
        const destZone = revEffect.destination || 'hand';
        const failDestZone = revEffect.failDestination || 'discardPile';
        const filter = revEffect.condition || revEffect.filter || (revEffect.types ? { cardTypes: revEffect.types } : {});

        while (matches.length < targetCount && revealed.length < limit) {
            const { cards } = this.handleDrawCardsToLimbo(state, player, 1);
            if (cards.length === 0) break;
            const card = cards[0];
            revealed.push(card);

            const isMatch = this.matchesFilter(card, filter);
            if (isMatch) {
                matches.push(card);
            }
        }

        if (revealed.length > 0) {
            EffectUtils.revealCards(state, revealed, 'ALL', 'Révélation', true, true);

            revealed.forEach(c => {
                const isMatch = matches.some(m => m.instanceId === c.instanceId);
                const zone = isMatch ? destZone : failDestZone;

                // Move from limbo (where handleDrawCardsToLimbo put it)
                EffectUtils.removeCardFromPlayer(state, player, c.instanceId);
                EffectUtils.addCardToZone(player, c, zone, state, 'TOP');

                // Apply effects
                const subEffects = isMatch ? revEffect.onMatch : revEffect.onFail;
                if (subEffects) {
                    state.effectStack.push({
                        type: 'EFFECT',
                        playerId: player.id,
                        effect: subEffects,
                        context: { sourceCardInstanceId: c.instanceId }
                    });
                }
            });

            const matchNames = matches.map(c => CardRegistry.get(c.id)?.name || c.id).join(', ');
            if (matches.length > 0) {
                EffectUtils.log(state, `${player.name} révèle ${revealed.length} carte(s) et trouve ${matches.length} correspondance(s) : ${matchNames}.`, player.id);
            } else {
                EffectUtils.log(state, `${player.name} révèle ${revealed.length} carte(s) mais ne trouve aucune correspondance.`, player.id);
            }
        }

        return { state, needsChoice: false };
    }

    public static handleRevealCardsEffect(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean = false): EffectResult {
        const revEffect = effect as any;
        const amount = EffectUtils.getAmount(state, player, revEffect.amount);
        const source = revEffect.source || 'deck';
        const dest = revEffect.destination || 'limbo';
        const filter = revEffect.filter || {};

        let cards: CardInstance[] = [];
        if (source === 'deck') {
            const res = this.handleDrawCardsToLimbo(state, player, amount);
            cards = res.cards;
        } else if (source === 'hand') {
            // Keep in hand but "reveal" them
            cards = player.hand.slice(0, amount);
        } else if (source === 'limbo') {
            cards = player.limbo.slice(0, amount);
        } else if (source === 'blackMarketDeck') {
            cards = (state.blackMarketDeck || []).splice(0, amount);
        }

        if (cards.length === 0) return { state, needsChoice: false };

        if (!revEffect.private) {
            EffectUtils.revealCards(state, cards, 'ALL', 'Révélation', true, true);
        }

        cards.forEach(c => {
            const hasFilter = filter && Object.keys(filter).length > 0;
            const isMatch = this.matchesFilter(c, filter);
            const targetZone = (hasFilter && !isMatch) ? (revEffect.failDestination || 'limbo') : dest;

            // Move if targetZone is specified and different from source
            if (targetZone !== source) {
                if (source === 'blackMarketDeck') {
                    // Already spliced from state.blackMarketDeck above, but let's be safe
                    EffectUtils.removeCardFromGame(state, c.instanceId);
                } else {
                    EffectUtils.removeCardFromPlayer(state, player, c.instanceId);
                }
                EffectUtils.addCardToZone(player, c, targetZone, state);
            }

            // Apply effects
            const subEffects = isMatch ? revEffect.onMatches : revEffect.onRest;
            if (subEffects) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: subEffects,
                    context: { sourceCardInstanceId: c.instanceId }
                });
            }
        });

        if (!suppressLog && !revEffect.private) {
            const names = cards.map(c => CardRegistry.get(c.id)?.name || c.id).join(', ');
            EffectUtils.log(state, `${player.name} révèle ${cards.length} carte(s) : ${names}.`, player.id);
        }

        return { state, needsChoice: false };
    }

    private static matchesFilter(card: CardInstance, filter: any): boolean {
        if (!filter) return true;
        const def = CardRegistry.get(card.id);
        if (!def) return false;

        if (filter.cardIds && !filter.cardIds.includes(card.id)) return false;
        if (filter.cardTypes) {
            const types = Array.isArray(filter.cardTypes) ? filter.cardTypes : [filter.cardTypes];
            if (!types.some((t: string) => def.types.includes(t.toUpperCase() as any))) return false;
        }
        if (filter.excludeIds && filter.excludeIds.includes(card.id)) return false;
        if (filter.excludeTypes) {
            const types = Array.isArray(filter.excludeTypes) ? filter.excludeTypes : [filter.excludeTypes];
            if (types.some((t: string) => def.types.includes(t.toUpperCase() as any))) return false;
        }
        if (filter.minCost !== undefined && (def.cost || 0) < filter.minCost) return false;
        if (filter.maxCost !== undefined && (def.cost || 0) > filter.maxCost) return false;
        if (filter.exactCost !== undefined) {
            const costs = Array.isArray(filter.exactCost) ? filter.exactCost : [filter.exactCost];
            if (!costs.includes(def.cost || 0)) return false;
        }
        if (filter.hasPotion !== undefined) {
            const needsPotion = !!def.potionCost;
            if (needsPotion !== filter.hasPotion) return false;
        }

        return true;
    }

    public static handleRevealAndPutInHand(state: GameState, player: PlayerState, effect: any): EffectResult {
        // Keep for legacy until refactored in cards
        return this.handleRevealCardsEffect(state, player, {
            type: 'REVEAL_CARDS',
            amount: effect.amount || effect.count,
            filter: effect.filter,
            destination: 'hand',
            onRest: effect.onOthers === 'DECK'
                ? [{ type: 'MOVE_CARDS', source: 'limbo', destination: 'deck', position: 'TOP' }]
                : [{ type: 'MOVE_CARDS', source: 'limbo', destination: 'discardPile' }]
        }, false);
    }

    public static handleRevealTopDeck(state: GameState, player: PlayerState, effect: any): EffectResult {
        if (player.deck.length === 0) {
            if (player.discardPile.length === 0) return { state, needsChoice: false };
            player.deck = EffectUtils.shuffle(player.discardPile, state);
            player.discardPile = [];
        }
        if (player.deck.length === 0) return { state, needsChoice: false };

        const topCard = player.deck[0];
        const def = CardRegistry.get(topCard.id);
        EffectUtils.log(state, `${player.name} révèle ${def?.name || topCard.id} du dessus de sa pioche.`, player.id);

        if (def?.types.includes('TREASURE')) {
            if (effect.onTreasure) {
                const card = player.deck.shift()!;
                player.hand.push(card);
                EffectUtils.log(state, `${player.name} ajoute ${def.name} à sa main.`, player.id);
            }
        }
        if (def?.types.includes('ACTION') || def?.types.includes('VICTORY')) {
            if (effect.onActionOrVictory) {
                const subEffects = effect.onActionOrVictory.map((e: any) => ({
                    type: 'EFFECT' as const,
                    playerId: player.id,
                    effect: e
                }));
                state.effectStack.push(...subEffects.reverse());
            }
        }
        return { state, needsChoice: false };
    }
}
