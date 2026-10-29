import { Logger } from '../Logger.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectEngine } from '../EffectEngine.js';
import { createCardInstance } from '../CardInstance.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { TriggerEffectHandler } from '../effects/TriggerEffectHandler.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { EffectUtils } from '../EffectUtils.js';
import { ExpansionModule } from '../ExpansionLoader.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { markPlayed, pushPlayEffects, playCardNow } from '../Play.js';
import { getMat, peekMat } from '../Mats.js';
import { GameState } from '../GameState.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { PlayerState } from '../PlayerState.js';

/** Can `player` afford `cardId` right now (coins, potions, no debt)? */
function canAfford(state: GameState, player: PlayerState, cardId: string): boolean {
    const def = CardRegistry.get(cardId);
    if (!def || (player.debt || 0) > 0) return false;
    const potions = (def as any).potionCost || 0;
    return EconomyEngine.getCardCost(state, player.id, cardId) <= player.coins && potions <= (player.potions || 0);
}

export const PromoModule: ExpansionModule = {
    id: 'promo',
    name: 'Promotional Cards',
    effectHandlers: [
        {
            // Church: set aside up to 3 cards from your hand face down (back to hand next turn)
            type: 'CHURCH',
            handler: (state, player, _effect, ctx) => {
                if (player.hand.length === 0) return { state, needsChoice: false };
                state.pendingDecision = {
                    id: `church_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Église : mettez de côté jusqu\'à 3 cartes de votre main',
                    constraints: { min: 0, max: Math.min(3, player.hand.length), sourceZone: 'hand' },
                    context: { specialAction: 'CHURCH_SET_ASIDE', churchId: ctx?.sourceCardInstanceId }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Church, next turn: put them into your hand, then you may trash a card from your hand
            type: 'CHURCH_RETURN',
            handler: (state, player, _effect, ctx) => {
                const mat = getMat(player, 'church');
                const mine = mat.filter(c => (c as any).setAsideBy === ctx?.sourceCardInstanceId);
                for (const c of mine) {
                    mat.splice(mat.indexOf(c), 1);
                    delete (c as any).setAsideBy;
                    player.hand.push(c);
                }
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Église : vous pouvez écarter une carte de votre main' } as any, context: {} });
                return { state, needsChoice: false };
            }
        },
        {
            // Dismantle: trash a card from your hand. If it costs $1 or more, gain a cheaper card and a Gold.
            type: 'DISMANTLE',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return { state, needsChoice: false };
                const c = EconomyEngine.getCardCost(state, player.id, t.id);
                if (c < 1) return { state, needsChoice: false };
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'GAIN_CARD', cardId: 'gold' } as any, context: {} });
                state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'GAIN_CARD', maxCost: c - 1, message: `Démantèlement : recevez une carte coûtant jusqu'à ${c - 1} 💰` } as any, context: {} });
                return { state, needsChoice: false };
            }
        },
        {
            // Governor: choose one; you get the version in parentheses: each player gets +1 (+3) Cards;
            // or each player gains a Silver (Gold); or each player may trash a card from their hand
            // and gain a card costing exactly $1 ($2) more.
            type: 'GOVERNOR',
            handler: (state, player) => {
                const each = (mine: any[], theirs: any[]) => {
                    const i = state.players.findIndex(p => p.id === player.id);
                    const order = [...state.players.slice(i), ...state.players.slice(0, i)];
                    // resolve in turn order starting with you: push in reverse
                    return order.reverse().map(p => ({ playerId: p.id, effects: p.id === player.id ? mine : theirs }));
                };
                const remodel = (n: number) => [{ type: 'TRASH', min: 0, max: 1, from: 'hand', message: `Gouverneur : vous pouvez écarter une carte pour en recevoir une coûtant exactement ${n} 💰 de plus`, onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: n, exact: true }] }];
                const choices = [
                    { label: 'Chacun pioche 1 carte (vous : 3)', plan: each([{ type: 'DRAW', amount: 3 }], [{ type: 'DRAW', amount: 1 }]) },
                    { label: 'Chacun reçoit un Argent (vous : un Or)', plan: each([{ type: 'GAIN_CARD', cardId: 'gold' }], [{ type: 'GAIN_CARD', cardId: 'silver' }]) },
                    { label: 'Chacun peut écarter une carte pour une à +1 💰 (vous : +2 💰)', plan: each(remodel(2), remodel(1)) },
                ];
                state.effectStack.push({
                    type: 'EFFECT', playerId: player.id,
                    effect: { type: 'SELECT_OPTION', message: 'Gouverneur : choisissez', options: choices.map(c => ({ label: c.label, effects: [{ type: 'RUN_FOR_PLAYERS', plan: c.plan }] })) } as any,
                    context: {}
                });
                return { state, needsChoice: false };
            }
        },
        {
            type: 'RUN_FOR_PLAYERS',
            handler: (state, _player, effect: any) => {
                for (const step of effect.plan as { playerId: string; effects: any[] }[]) {
                    for (let i = step.effects.length - 1; i >= 0; i--) {
                        state.effectStack.push({ type: 'EFFECT', playerId: step.playerId, effect: step.effects[i], context: {} });
                    }
                }
                return { state, needsChoice: false };
            }
        },
        {
            // Marchland (when gained): +1 Buy, and you may discard any number of cards for +$1 each
            type: 'MARCHLAND_ON_GAIN',
            handler: (state, player) => {
                player.buys += 1;
                state.effectStack.push({
                    type: 'EFFECT', playerId: player.id,
                    effect: { type: 'DISCARD', min: 0, max: 99, message: 'Frontière : défaussez autant de cartes que vous voulez (+1 💰 chacune)', onSuccess: [{ type: 'ADD_MONEY', amount: { type: 'COUNT_DISCARDED' } }] } as any,
                    context: {}
                });
                return { state, needsChoice: false };
            }
        },
        {
            // Walled Village: at the start of Clean-up, if you have this and no more than one other
            // Action card in play, you may put this onto your deck.
            type: 'WALLED_VILLAGE',
            handler: (state, player, _effect, ctx) => {
                const id = ctx?.sourceCardInstanceId;
                if (!id || !player.playArea.some(c => c.instanceId === id)) return { state, needsChoice: false };
                const actions = player.playArea.filter(c => CardRegistry.get(c.id)?.types.includes('ACTION')).length;
                if (actions > 2) return { state, needsChoice: false };
                state.effectStack.push({
                    type: 'EFFECT', playerId: player.id,
                    effect: { type: 'SELECT_OPTION', message: 'Village fortifié : le placer sur votre pioche ?', options: [
                        { label: 'Oui', effects: [{ type: 'TOPDECK_INSTANCE', instanceId: id }] },
                        { label: 'Non', effects: [] }
                    ] } as any,
                    context: {}
                });
                return { state, needsChoice: false };
            }
        },
        {
            // Summon: gain an Action card costing up to $4, set it aside; if you did, play it at the start of your next turn
            type: 'SUMMON',
            handler: (state, player) => {
                const choices = Object.keys(state.supply).filter(id => state.supply[id].count > 0
                    && EconomyEngine.supplyCardMatches(state, player.id, id, { maxCost: 4, cardTypes: ['ACTION'] }));
                if (!choices.length) return { state, needsChoice: false };
                state.pendingDecision = {
                    id: `summon_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Appel : recevez une carte Action coûtant jusqu\'à 4 💰 (jouée au début de votre prochain tour)',
                    constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { maxCost: 4, cardTypes: ['ACTION'], cardIds: choices } },
                    context: { specialAction: 'SUMMON_GAIN' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            /**
             * Black Market: reveal the top 3 cards of the Black Market deck; you may buy one
             * (paying its cost, without using a Buy); the rest go to the bottom of that deck.
             */
            type: 'BLACK_MARKET',
            handler: (state, player) => {
                // 2nd edition: reveal 3, play any number of Treasures, you may buy one of them
                const deck = (state.blackMarketDeck = state.blackMarketDeck || []);
                const revealed = deck.splice(0, 3);
                if (revealed.length === 0) {
                    Logger.log(state, 'La pioche du Marché Noir est vide.');
                    return { state, needsChoice: false };
                }
                state.blackMarketRevealed = revealed;
                EffectUtils.revealCards(state, revealed, 'ALL', 'Marché Noir');
                Logger.log(state, `Marché Noir : ${revealed.map(c => CardRegistry.get(c.id)?.name || c.id).join(', ')}.`, player.id);

                const treasures = player.hand.filter(c => CardRegistry.get(c.id)?.types.includes('TREASURE'));
                if (!treasures.length) {
                    state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'BLACK_MARKET_BUY' } as any, context: {} });
                    return { state, needsChoice: false };
                }
                state.pendingDecision = {
                    id: `black_market_treasures_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: `Marché Noir (${revealed.map(c => CardRegistry.get(c.id)?.name || c.id).join(', ')}) : jouez des Trésors avant d'acheter ?`,
                    constraints: { min: 0, max: treasures.length, sourceZone: 'hand' },
                    context: { specialAction: 'BLACK_MARKET_TREASURES', candidates: treasures.map(c => c.instanceId) }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            type: 'BLACK_MARKET_BUY',
            handler: (state, player) => {
                const deck = (state.blackMarketDeck = state.blackMarketDeck || []);
                const revealed = state.blackMarketRevealed || [];
                if (!revealed.length) return { state, needsChoice: false };
                const buyable = revealed.filter(c => canAfford(state, player, c.id));
                if (buyable.length === 0) {
                    deck.push(...revealed.splice(0));
                    Logger.log(state, `${player.name} ne peut acheter aucune des cartes du Marché Noir.`, player.id);
                    return { state, needsChoice: false };
                }

                state.pendingDecision = {
                    id: `black_market_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: 'Marché Noir : vous pouvez acheter une de ces cartes',
                    constraints: { min: 0, max: 1, sourceZone: 'blackMarket' as any },
                    context: {
                        specialAction: 'BLACK_MARKET',
                        cards: revealed.map(c => ({ id: c.id, instanceId: c.instanceId })),
                        buyable: buyable.map(c => c.instanceId),
                        // Shown greyed out in the interface when not affordable
                        candidates: buyable.map(c => c.instanceId)
                    }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            /** Captain: play a non-Duration, non-Command Action from the Supply costing up to 4, leaving it there. */
            type: 'PLAY_FROM_SUPPLY',
            handler: (state, player, effect) => {
                const e = effect as any;
                const maxCost = e.maxCost ?? 4;
                const candidates = Object.keys(state.supply).filter(id => {
                    const def = CardRegistry.get(id);
                    if (!def || state.supply[id].count <= 0) return false;
                    if (!def.types.includes('ACTION') || def.types.includes('DURATION') || def.types.includes('COMMAND')) return false;
                    return EconomyEngine.getCardCost(state, player.id, id) <= maxCost && !(def as any).potionCost && !(def as any).debtCost;
                });
                if (candidates.length === 0) return { state, needsChoice: false };

                state.pendingDecision = {
                    id: `play_from_supply_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: e.message || "Choisissez une carte Action de la réserve à jouer (elle y reste)",
                    constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { cardIds: candidates, maxCost } },
                    context: { specialAction: 'PLAY_FROM_SUPPLY', candidates }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            /**
             * Prince: you may set this aside. If you do, set aside an Action (not a Duration or
             * Command) from your hand costing up to 4. At the start of each of your turns, play
             * it, setting it aside again when you would discard it from play.
             */
            type: 'PRINCE',
            handler: (state, player, _effect, ctx) => {
                const princeId = ctx?.sourceCardInstanceId;
                const candidates = player.hand.filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def && def.types.includes('ACTION') && !def.types.includes('DURATION')
                        && !def.types.includes('COMMAND') && EconomyEngine.getCardCost(state, player.id, c.id) <= 4;
                });
                if (!princeId || candidates.length === 0) return { state, needsChoice: false };

                state.pendingDecision = {
                    id: `prince_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: "Prince : mettez de côté une Action coûtant jusqu'à 4 (ou aucune pour ne rien faire)",
                    constraints: { min: 0, max: 1, sourceZone: 'hand', filter: { cardIds: candidates.map(c => c.id) } },
                    context: { specialAction: 'PRINCE', princeId, candidates: candidates.map(c => c.instanceId) }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            /** Start of turn: play every card set aside with a Prince. */
            type: 'PRINCE_PLAY',
            handler: (state, player) => {
                const princed = peekMat(player, 'prince').filter(c => c.princedBy);
                for (const card of [...princed].reverse()) {
                    const mat = getMat(player, 'prince');
                    mat.splice(mat.indexOf(card), 1);
                    player.playArea.push(card);
                    markPlayed(state, player, card);
                    Logger.log(state, `${player.name} joue ${CardRegistry.get(card.id)?.name || card.id} (Prince).`, player.id);
                    pushPlayEffects(state, player, card);
                    TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
                }
                return { state, needsChoice: false };
            }
        }
    ],
    onLoad: () => {
        // Church: the chosen cards are set aside face down, linked to this Church
        EffectEngine.registerDecisionHandler('CHURCH_SET_ASIDE', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const ids = chosenInstanceIds(payload).slice(0, 3);
            const mat = getMat(player, 'church');
            for (const id of ids) {
                const idx = player.hand.findIndex(c => c.instanceId === id);
                if (idx === -1) continue;
                const card = player.hand.splice(idx, 1)[0];
                (card as any).setAsideBy = decision.context.churchId;
                mat.push(card);
            }
        });
        // Summon: gain the chosen card set aside; play it at the start of the next turn
        EffectEngine.registerDecisionHandler('SUMMON_GAIN', (state, playerId, payload) => {
            const player = state.players.find(p => p.id === playerId);
            const cardId: string | undefined = payload.cardId;
            if (!player || !cardId) return;
            GainEffectHandler.handleGainCard(state, player, { cardId, destination: 'aside' });
            const gained = state.lastGainedCard;
            if (!gained || gained.id !== cardId) return;
            (state.triggers = state.triggers || []).push({
                type: 'START_TURN', playerId: player.id, once: true,
                effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: gained.instanceId } as any],
                description: `Appel : jouer ${CardRegistry.get(cardId)?.name || cardId}`
            } as any);
        });
        EffectEngine.registerDecisionHandler('BLACK_MARKET_TREASURES', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            // The purchase comes after the Treasures played now
            state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'BLACK_MARKET_BUY' } as any, context: {} });
            const ids = chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id));
            for (const id of ids.reverse()) playCardNow(state, player, id);
        });

        EffectEngine.registerDecisionHandler('BLACK_MARKET', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const revealed = state.blackMarketRevealed || [];
            const chosenId = chosenInstanceIds(payload).find(id => decision.context.buyable.includes(id));
            const idx = chosenId ? revealed.findIndex(c => c.instanceId === chosenId) : -1;

            if (idx !== -1 && canAfford(state, player, revealed[idx].id)) {
                const card = revealed.splice(idx, 1)[0];
                player.coins -= EconomyEngine.getCardCost(state, player.id, card.id);
                player.potions = (player.potions || 0) - ((CardRegistry.get(card.id) as any)?.potionCost || 0);
                player.discardPile.push(card);
                state.lastGainedCard = card;
                Logger.log(state, `${player.name} achète ${CardRegistry.get(card.id)?.name || card.id} (Marché Noir).`, player.id);
                TriggerEffectHandler.handleOnBuyTriggers(state, player, card.id);
                TriggerEffectHandler.triggerOnGainEffects(state, player, card);
            }
            // The rest go to the bottom of the Black Market deck
            (state.blackMarketDeck = state.blackMarketDeck || []).push(...revealed.splice(0));
        });

        EffectEngine.registerDecisionHandler('PLAY_FROM_SUPPLY', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const cardId: string | undefined = payload.cardId || payload.cards?.[0]?.id || chosenInstanceIds(payload)[0];
            if (!cardId || !decision.context.candidates.includes(cardId)) return;
            // The card stays in the Supply: play a "phantom" copy that never enters a zone
            const phantom = createCardInstance(cardId);
            markPlayed(state, player, phantom);
            Logger.log(state, `${player.name} joue ${CardRegistry.get(cardId)?.name || cardId} depuis la réserve.`, player.id);
            pushPlayEffects(state, player, phantom);
            TriggerEffectHandler.handleOnPlayTriggers(state, player, phantom.id, phantom.instanceId);
        });

        EffectEngine.registerDecisionHandler('PRINCE', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const chosenId = chosenInstanceIds(payload).find(id => decision.context.candidates.includes(id));
            if (!chosenId) return; // Prince stays in play, nothing happens
            const prince = EffectUtils.removeCardFromPlayer(state, player, decision.context.princeId);
            const card = EffectUtils.removeCardFromPlayer(state, player, chosenId);
            if (!prince || !card) return;
            card.princedBy = prince.instanceId;
            getMat(player, 'prince').push(prince, card);
            Logger.log(state, `${player.name} met de côté ${CardRegistry.get(card.id)?.name || card.id} avec le Prince.`, player.id);
            // Play it at the start of each of your turns (one trigger plays all your Prince cards)
            state.triggers = state.triggers || [];
            const already = state.triggers.some(t => t.type === 'START_TURN' && t.playerId === player.id
                && (t.effects || []).some((e: any) => e.type === 'PRINCE_PLAY'));
            if (!already) {
                state.triggers.push({
                    type: 'START_TURN', playerId: player.id, once: false,
                    effects: [{ type: 'PRINCE_PLAY' } as any]
                });
            }
        });
    }
};
