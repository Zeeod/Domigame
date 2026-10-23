/**
 * Adventures Expansion Module
 *
 * - Tokens: +1 Card / +1 Action / +1 Buy / +$1 / -$2 cost / Trashing on piles; -1 Card, -$1, Journey
 * - Reserve cards (Tavern mat, "call"), Travellers (exchange), Inheritance (Estate token)
 * - Kingdom cards and Events whose effects are not generic
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EffectEngine } from '../EffectEngine.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { EffectManager } from '../EffectManager.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { TriggerEffectHandler } from '../effects/TriggerEffectHandler.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow } from '../Play.js';
import { getMat } from '../Mats.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const def = (id: string) => CardRegistry.get(id);
const isType = (id: string, t: string) => !!def(id)?.types.includes(t as any);
const nameOf = (id: string) => def(id)?.name || id;
const costOf = (state: GameState, player: PlayerState, id: string) => EconomyEngine.getCardCost(state, player.id, id);

function push(state: GameState, playerId: string, effect: any, context: any = {}) {
    state.effectStack.push({ type: 'EFFECT', playerId, effect, context });
}
function pushAll(state: GameState, playerId: string, effects: any[], context: any = {}) {
    for (let i = effects.length - 1; i >= 0; i--) push(state, playerId, effects[i], context);
}
function options(message: string, opts: { label: string; effects: any[] }[]) {
    return { type: 'SELECT_OPTION', message, options: opts };
}
function takeTop(state: GameState, player: PlayerState): CardInstance | undefined {
    if (player.deck.length === 0) EffectUtils.reshuffleDiscard(state, player);
    return player.deck.shift();
}
function others(state: GameState, player: PlayerState): PlayerState[] {
    const i = state.players.findIndex(p => p.id === player.id);
    return [...state.players.slice(i + 1), ...state.players.slice(0, i)];
}
/** The Supply pile a card belongs to (split piles included). */
function pileOf(state: GameState, cardId: string): string | undefined {
    if (state.supply[cardId]) return cardId;
    return Object.keys(state.supply).find(k => state.supply[k].cards?.some(c => c.id === cardId));
}

export const TOKEN_LABELS: Record<string, string> = {
    plus1Card: '+1 Carte', plus1Action: '+1 Action', plus1Buy: '+1 Achat', plus1Coin: '+1 💰',
    minus2Cost: '-2 💰 de coût', trashing: 'Écart',
};

/** Ask the player to put one of their tokens on an Action Supply pile. */
function moveToken(state: GameState, player: PlayerState, token: string, exclude: string[] = []) {
    const piles = Object.keys(state.supply).filter(id => state.supply[id].count > 0 && isType(id, 'ACTION') && !exclude.includes(id));
    if (!piles.length) return done(state);
    state.pendingDecision = {
        id: `move_token_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
        message: `Placez votre jeton ${TOKEN_LABELS[token] || token} sur une pile Action de la réserve`,
        constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { cardIds: piles } },
        context: { specialAction: 'MOVE_TOKEN', token, piles }
    } as any;
    return { state, needsChoice: true };
}

export const AdventuresModule: ExpansionModule = {
    id: 'adventures',
    name: 'Aventures',

    costModifiers: [
        {
            // -$2 token: on your turns, cards from that pile cost $2 less
            id: 'adventures:minus2cost',
            priority: 55,
            modifier: (state, _playerId, cardId, cost) => {
                const current = state.players[state.currentPlayerIndex];
                const pile = current?.advTokens?.minus2Cost;
                return pile && pileOf(state, cardId) === pile ? cost - 2 : cost;
            }
        },
        {
            // Bridge Troll: while this is in play, cards cost $1 less on your turns
            id: 'adventures:bridge_troll',
            priority: 56,
            modifier: (state, _playerId, _cardId, cost) => {
                const current = state.players[state.currentPlayerIndex];
                const n = current?.playArea.filter(c => c.id === 'bridge_troll').length || 0;
                return cost - n;
            }
        }
    ],

    eventHooks: [
        {
            // Pile tokens (+1 Card, +1 Action, +1 Buy, +$1) and Champion when you play a card
            id: 'adventures:on_play',
            event: 'CARD_PLAYED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player) return;
                const cardId: string = event.context.cardId;
                const pile = pileOf(state, cardId);
                const tok = player.advTokens || {};
                const bonus: any[] = [];
                if (pile && tok.plus1Card === pile) bonus.push({ type: 'DRAW', amount: 1 });
                if (pile && tok.plus1Action === pile) bonus.push({ type: 'ADD_ACTIONS', amount: 1 });
                if (pile && tok.plus1Buy === pile) bonus.push({ type: 'ADD_BUYS', amount: 1 });
                if (pile && tok.plus1Coin === pile) bonus.push({ type: 'ADD_MONEY', amount: 1 });
                // Champion: "for the rest of the game, when you play an Action, +1 Action"
                if (isType(cardId, 'ACTION')) {
                    const n = player.playArea.filter(c => c.id === 'champion' && c.instanceId !== event.context.cardInstanceId).length;
                    for (let i = 0; i < n; i++) bonus.push({ type: 'ADD_ACTIONS', amount: 1 });
                }
                if (bonus.length) pushAll(state, player.id, bonus);
            }
        },
        {
            // Trashing token: when you buy a card from that pile, you may trash a card from your hand
            id: 'adventures:on_buy',
            event: 'CARD_BOUGHT',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player?.advTokens?.trashing) return;
                if (pileOf(state, event.context.boughtCardId) !== player.advTokens.trashing || !player.hand.length) return;
                push(state, player.id, { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Jeton Écart : vous pouvez écarter une carte de votre main' });
            }
        }
    ],

    effectHandlers: [
        // ---------------------------------------------------------------- tokens
        { type: 'MOVE_TOKEN', handler: (state, player, effect: any) => moveToken(state, player, effect.token) },
        {
            type: 'TAKE_MINUS_COIN_TOKEN',
            handler: (state, player) => { player.minusCoinToken = true; EffectUtils.log(state, `${player.name} prend son jeton -1 💰.`, player.id); return done(state); }
        },
        {
            type: 'PUT_MINUS_CARD_TOKEN',
            handler: (state, player) => { player.minusCardToken = true; EffectUtils.log(state, `${player.name} place son jeton -1 Carte sur sa pioche.`, player.id); return done(state); }
        },
        {
            // Turn your Journey token over (it starts face up), then onFaceUp / onFaceDown
            type: 'FLIP_JOURNEY_TOKEN',
            handler: (state, player, effect: any) => {
                player.journeyFaceDown = !player.journeyFaceDown;
                const up = !player.journeyFaceDown;
                EffectUtils.log(state, `${player.name} retourne son jeton Voyage (${up ? 'face visible' : 'face cachée'}).`, player.id);
                const list = up ? effect.onFaceUp : effect.onFaceDown;
                if (list?.length) pushAll(state, player.id, list);
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Reserve, Travellers
        {
            // Call a Reserve card: from the Tavern mat into play (or straight to the discard pile: Wine Merchant)
            type: 'CALL_RESERVE',
            handler: (state, player, effect: any) => {
                const mat = getMat(player, 'tavern');
                const idx = mat.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                const card = mat.splice(idx, 1)[0];
                if (effect.to === 'discard') player.discardPile.push(card); else player.playArea.push(card);
                EffectUtils.log(state, `${player.name} appelle ${nameOf(card.id)}.`, player.id);
                return done(state);
            }
        },
        {
            // "Directly after resolving an Action": offer the Reserve calls (Coin of the Realm, Royal Carriage)
            type: 'AFTER_ACTION',
            handler: (state, player, effect: any) => {
                const triggers = TriggerEffectHandler.scanForTriggers(state, player, 'AFTER_ACTION', { cardId: effect.cardId, cardInstanceId: effect.cardInstanceId });
                if (triggers.length) EffectManager.resolveTriggers(state, player, triggers, 'Après une Action : appeler une Réserve ?');
                return done(state);
            }
        },
        {
            // Royal Carriage: replay the Action, if it's still in play (and not a Command)
            type: 'REPLAY_ACTION',
            handler: (state, player, effect: any, ctx: any) => {
                const id = effect.callContext?.cardInstanceId ?? ctx?.cardInstanceId;
                const card = player.playArea.find(c => c.instanceId === id);
                if (card && !isType(card.id, 'COMMAND')) push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: id });
                return done(state);
            }
        },
        {
            // Duplicate: gain a copy of the card just gained
            type: 'GAIN_COPY_OF_GAINED',
            handler: (state, player, effect: any, ctx: any) => {
                const id = effect.callContext?.gainedCardId ?? ctx?.gainedCardId;
                if (id && state.supply[id]) push(state, player.id, { type: 'GAIN_CARD', cardId: id });
                return done(state);
            }
        },
        {
            // Traveller: when discarded from play, you may exchange it for the next card
            type: 'TRAVELLER_EXCHANGE',
            handler: (state, player, effect: any) => {
                const card = player.discardPile.find(c => c.instanceId === effect.instanceId);
                const target = state.nonSupply?.[effect.to] || state.supply[effect.to];
                if (!card || !target || target.count <= 0) return done(state);
                push(state, player.id, options(`Échanger ${nameOf(card.id)} contre ${nameOf(effect.to)} ?`, [
                    { label: 'Échanger', effects: [{ type: 'DO_EXCHANGE', instanceId: card.instanceId, to: effect.to }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'DO_EXCHANGE',
            handler: (state, player, effect: any) => {
                const idx = player.discardPile.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                const newCard = GainEffectHandler.takeFromPile(state, effect.to);
                if (!newCard) return done(state);
                const old = player.discardPile.splice(idx, 1)[0];
                const back = state.supply[old.id] || state.nonSupply?.[old.id];
                if (back) back.count++;
                player.discardPile.push(newCard);
                EffectUtils.log(state, `${player.name} échange ${nameOf(old.id)} contre ${nameOf(newCard.id)}.`, player.id);
                return done(state);
            }
        },
        {
            // Teacher: move your +1 Card, +1 Action, +1 Buy or +$1 token to an Action pile you have no tokens on
            type: 'TEACHER',
            handler: (state, player) => {
                const mine = Object.values(player.advTokens || {});
                push(state, player.id, options('Maître : quel jeton déplacer ?',
                    ['plus1Card', 'plus1Action', 'plus1Buy', 'plus1Coin'].map(t => ({ label: TOKEN_LABELS[t], effects: [{ type: 'MOVE_TOKEN_EXCLUDING', token: t, exclude: mine }] }))));
                return done(state);
            }
        },
        { type: 'MOVE_TOKEN_EXCLUDING', handler: (state, player, effect: any) => moveToken(state, player, effect.token, effect.exclude || []) },
        {
            // Guide: discard your hand and draw 5 cards
            type: 'GUIDE',
            handler: (state, player) => {
                discardCards(state, player, player.hand.splice(0));
                push(state, player.id, { type: 'DRAW', amount: 5 });
                return done(state);
            }
        },
        {
            // Transmogrify: trash a card from your hand, gain a card costing up to $1 more into your hand
            type: 'TRANSMOGRIFY',
            handler: (state, player) => {
                if (!player.hand.length) return done(state);
                push(state, player.id, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Transmogrification : écartez une carte', onSuccess: [{ type: 'TRANSMOGRIFY_GAIN' }] });
                return done(state);
            }
        },
        {
            type: 'TRANSMOGRIFY_GAIN',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return done(state);
                const max = costOf(state, player, t.id) + 1;
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: max }, { destination: 'hand' },
                    `Transmogrification : recevez en main une carte coûtant jusqu'à ${max} 💰`);
            }
        },

        // ---------------------------------------------------------------- Kingdom cards
        {
            // Artificer: you may gain a card onto your deck costing exactly $1 per card discarded
            type: 'ARTIFICER_START',
            handler: (state) => { (state as any).lastDiscardedCount = 0; return done(state); }
        },
        {
            type: 'ARTIFICER_GAIN',
            handler: (state, player) => {
                const n = (state as any).lastDiscardedCount || 0;
                return GainEffectHandler.promptGainFromSupply(state, player, { exactCost: n }, { destination: 'deck' },
                    `Artisan : recevez sur votre pioche une carte coûtant exactement ${n} 💰`, true);
            }
        },
        {
            // Giant (face up): each other player reveals their top card; trashes it if it costs $3–$6,
            // otherwise discards it and gains a Curse
            type: 'GIANT_ATTACK',
            handler: (state, victim) => {
                const top = takeTop(state, victim);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${victim.name} dévoile`);
                const k = costOf(state, victim, top.id);
                if (k >= 3 && k <= 6) TrashEffectHandler.trashCard(state, victim, top);
                else { discardCard(state, victim, top); push(state, victim.id, { type: 'GAIN_CARD', cardId: 'curse' }); }
                return done(state);
            }
        },
        {
            // Haunted Woods: until your next turn, when another player buys a card, they put their hand onto their deck
            type: 'HAUNTED_WOODS_EFFECT',
            handler: (state, victim, _e, ctx: any) => {
                (state.triggers = state.triggers || []).push({
                    type: 'ON_BUY', playerId: victim.id, once: false,
                    effects: [{ type: 'PUT_HAND_ON_DECK' } as any],
                    expiresOnTurnOf: ctx?.attackerId, description: 'Bois hantés'
                } as any);
                return done(state);
            }
        },
        {
            type: 'PUT_HAND_ON_DECK',
            handler: (state, player) => {
                if (!player.hand.length) return done(state);
                if (player.hand.length === 1) { player.deck.unshift(player.hand.pop()!); return done(state); }
                player.limbo.push(...player.hand.splice(0));
                push(state, player.id, { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Bois hantés : placez votre main sur votre pioche dans l\'ordre de votre choix' });
                return done(state);
            }
        },
        {
            // Swamp Hag: until your next turn, when another player buys a card, they gain a Curse
            type: 'SWAMP_HAG_EFFECT',
            handler: (state, victim, _e, ctx: any) => {
                (state.triggers = state.triggers || []).push({
                    type: 'ON_BUY', playerId: victim.id, once: false,
                    effects: [{ type: 'GAIN_CARD', cardId: 'curse' } as any],
                    expiresOnTurnOf: ctx?.attackerId, description: 'Sorcière des marais'
                } as any);
                return done(state);
            }
        },
        {
            // Magpie: reveal the top card; Treasure → into your hand; Action or Victory → gain a Magpie
            type: 'MAGPIE',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                if (isType(top.id, 'TREASURE')) player.hand.push(top);
                else {
                    player.deck.unshift(top);
                    if (isType(top.id, 'ACTION') || isType(top.id, 'VICTORY')) push(state, player.id, { type: 'GAIN_CARD', cardId: 'magpie' });
                }
                return done(state);
            }
        },
        {
            // Messenger: when you gain this, if it's the first card you gained in your Buy phase,
            // gain a card costing up to $4, and each other player gains a copy of it
            type: 'MESSENGER_ON_GAIN',
            handler: (state, player) => {
                if (state.phase !== 'BUY' || state.players[state.currentPlayerIndex]?.id !== player.id) return done(state);
                if ((player as any).buyPhaseGains !== 1) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 4 }, { next: [{ type: 'MESSENGER_SHARE' }] },
                    'Messager : recevez une carte coûtant jusqu\'à 4 💰 (les autres en reçoivent une copie)');
            }
        },
        {
            type: 'MESSENGER_SHARE',
            handler: (state, player) => {
                const id = state.lastGainedCard?.id;
                if (!id) return done(state);
                for (const p of others(state, player).reverse()) push(state, p.id, { type: 'GAIN_CARD', cardId: id });
                return done(state);
            }
        },
        {
            // Raze: trash this or a card from your hand; look at one card per $1 it costs; put one into your hand, discard the rest
            type: 'RAZE',
            handler: (state, player, _e, ctx: any) => {
                const self = ctx?.sourceCardInstanceId;
                const opts: any[] = [];
                if (player.playArea.some(c => c.instanceId === self)) opts.push({ label: 'Écarter ce Raser', effects: [{ type: 'RAZE_TRASH', instanceId: self }] });
                const seen = new Set<string>();
                for (const c of player.hand) {
                    if (seen.has(c.id)) continue;
                    seen.add(c.id);
                    opts.push({ label: `Écarter ${nameOf(c.id)}`, effects: [{ type: 'RAZE_TRASH', instanceId: c.instanceId }] });
                }
                if (opts.length) push(state, player.id, options('Raser : écartez cette carte ou une carte de votre main', opts));
                return done(state);
            }
        },
        {
            type: 'RAZE_TRASH',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (!card) return done(state);
                const n = costOf(state, player, card.id);
                TrashEffectHandler.trashCard(state, player, card);
                const seen: CardInstance[] = [];
                for (let i = 0; i < n; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                if (seen.length === 1) { player.hand.push(seen[0]); return done(state); }
                player.limbo.push(...seen);
                push(state, player.id, options('Raser : prenez une de ces cartes en main (les autres sont défaussées)',
                    seen.map(c => ({ label: nameOf(c.id), effects: [{ type: 'LIMBO_PICK_ONE', keep: c.instanceId, ids: seen.map(x => x.instanceId) }] }))));
                return done(state);
            }
        },
        {
            type: 'LIMBO_PICK_ONE',
            handler: (state, player, effect: any) => {
                const cards = (effect.ids as string[]).map(id => player.limbo.find(c => c.instanceId === id)).filter(Boolean) as CardInstance[];
                player.limbo = player.limbo.filter(c => !cards.includes(c));
                const keep = cards.find(c => c.instanceId === effect.keep);
                if (keep) player.hand.push(keep);
                discardCards(state, player, cards.filter(c => c !== keep));
                return done(state);
            }
        },
        {
            // Storyteller: play up to 3 Treasures from your hand; then +1 Card and pay all your $ for +1 Card per $1
            type: 'STORYTELLER',
            handler: (state, player) => {
                const treasures = player.hand.filter(c => isType(c.id, 'TREASURE'));
                push(state, player.id, { type: 'STORYTELLER_PAY' });
                if (!treasures.length) return done(state);
                state.pendingDecision = {
                    id: `storyteller_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Conteur : jouez jusqu\'à 3 Trésors de votre main',
                    constraints: { min: 0, max: Math.min(3, treasures.length), sourceZone: 'hand', filter: { cardTypes: ['TREASURE'] } },
                    context: { specialAction: 'PLAY_TREASURES_PICK' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            type: 'STORYTELLER_PAY',
            handler: (state, player) => {
                const n = player.coins;
                player.coins = 0;
                push(state, player.id, { type: 'DRAW', amount: n + 1 });
                return done(state);
            }
        },
        {
            // Soldier: +$1 per other Attack you have in play
            type: 'ADD_MONEY_PER_ATTACK_IN_PLAY',
            handler: (state, player, _e, ctx: any) => {
                const n = player.playArea.filter(c => isType(c.id, 'ATTACK') && c.instanceId !== ctx?.sourceCardInstanceId).length;
                if (n) push(state, player.id, { type: 'ADD_MONEY', amount: n });
                return done(state);
            }
        },
        {
            // Soldier: each other player with 4 or more cards in hand discards a card
            type: 'DISCARD_IF_4_OR_MORE',
            handler: (state, victim) => {
                if (victim.hand.length >= 4) push(state, victim.id, { type: 'DISCARD', min: 1, max: 1, message: 'Soldat : défaussez une carte' });
                return done(state);
            }
        },
        {
            // Treasure Hunter: gain a Silver per card the player to your right gained on their last turn
            type: 'GAIN_SILVER_PER_CARDS_GAINED_LAST_TURN',
            handler: (state, player) => {
                const i = state.players.findIndex(p => p.id === player.id);
                const right = state.players[(i - 1 + state.players.length) % state.players.length];
                const n = right.id === player.id ? 0 : (right.gainedLastTurn || []).length;
                for (let k = 0; k < n; k++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'silver' });
                return done(state);
            }
        },
        {
            // Warrior: for each Traveller you have in play, each other player discards their top card and trashes it if it costs $3 or $4
            type: 'WARRIOR_ATTACK',
            handler: (state, player) => {
                const n = player.playArea.filter(c => isType(c.id, 'TRAVELLER')).length;
                for (let k = 0; k < n; k++) push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'WARRIOR_HIT' }] });
                return done(state);
            }
        },
        {
            type: 'WARRIOR_HIT',
            handler: (state, victim) => {
                const top = takeTop(state, victim);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${victim.name} défausse`);
                const k = costOf(state, victim, top.id);
                if (k === 3 || k === 4) TrashEffectHandler.trashCard(state, victim, top); else discardCard(state, victim, top);
                return done(state);
            }
        },
        {
            // Disciple: you may play an Action card from your hand twice. Gain a copy of it.
            type: 'DISCIPLE',
            handler: (state, player) => {
                const actions = player.hand.filter(c => isType(c.id, 'ACTION'));
                if (!actions.length) return done(state);
                state.pendingDecision = {
                    id: `disciple_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Disciple : jouer deux fois une Action de votre main (et en recevoir une copie) ?',
                    constraints: { min: 0, max: 1, sourceZone: 'hand', filter: { cardTypes: ['ACTION'] } },
                    context: { specialAction: 'DISCIPLE_PICK' }
                } as any;
                return { state, needsChoice: true };
            }
        },

        // ---------------------------------------------------------------- Events
        {
            // Alms: if you have no Treasures in play, gain a card costing up to $4
            type: 'ALMS',
            handler: (state, player) => {
                if (player.playArea.some(c => isType(c.id, 'TREASURE'))) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 4 }, {}, 'Aumône : recevez une carte coûtant jusqu\'à 4 💰');
            }
        },
        {
            // Borrow: +1 Buy. If your -1 Card token isn't on your deck, put it there and +$1.
            type: 'BORROW',
            handler: (state, player) => {
                player.buys += 1;
                if (!player.minusCardToken) { player.minusCardToken = true; player.coins += 1; }
                return done(state);
            }
        },
        {
            // Quest: you may discard an Attack, two Curses, or six cards. If you do, gain a Gold.
            type: 'QUEST',
            handler: (state, player) => {
                const opts: any[] = [];
                const attack = player.hand.find(c => isType(c.id, 'ATTACK'));
                const curses = player.hand.filter(c => c.id === 'curse');
                if (attack) opts.push({ label: `Défausser ${nameOf(attack.id)} (Attaque)`, effects: [{ type: 'DISCARD_INSTANCES', ids: [attack.instanceId] }, { type: 'GAIN_CARD', cardId: 'gold' }] });
                if (curses.length >= 2) opts.push({ label: 'Défausser 2 Malédictions', effects: [{ type: 'DISCARD_INSTANCES', ids: curses.slice(0, 2).map(c => c.instanceId) }, { type: 'GAIN_CARD', cardId: 'gold' }] });
                if (player.hand.length >= 6) opts.push({ label: 'Défausser 6 cartes', effects: [{ type: 'DISCARD', min: 6, max: 6, message: 'Quête : défaussez 6 cartes' }, { type: 'GAIN_CARD', cardId: 'gold' }] });
                if (!opts.length) return done(state);
                opts.push({ label: 'Ne rien défausser', effects: [] });
                push(state, player.id, options('Quête : que défausser ?', opts));
                return done(state);
            }
        },
        {
            type: 'DISCARD_INSTANCES',
            handler: (state, player, effect: any) => {
                for (const id of effect.ids as string[]) {
                    const idx = player.hand.findIndex(c => c.instanceId === id);
                    if (idx !== -1) discardCard(state, player, player.hand.splice(idx, 1)[0]);
                }
                return done(state);
            }
        },
        {
            // Save: +1 Buy. Set aside a card from your hand, and put it into your hand at end of turn (after drawing).
            type: 'SAVE',
            handler: (state, player) => {
                player.buys += 1;
                if (!player.hand.length) return done(state);
                state.pendingDecision = {
                    id: `save_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Épargne : mettez de côté une carte de votre main (reprise à la fin du tour)',
                    constraints: { min: 1, max: 1, sourceZone: 'hand' },
                    context: { specialAction: 'SAVE_PICK' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Scouting Party: +1 Buy. Look at the top 5 cards of your deck. Discard 3 and put the rest back in any order.
            type: 'SCOUTING_PARTY',
            handler: (state, player) => {
                player.buys += 1;
                const seen: CardInstance[] = [];
                for (let i = 0; i < 5; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                const k = Math.min(3, seen.length);
                pushAll(state, player.id, [
                    { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: k, max: k, action: 'DISCARD', message: `Éclaireurs : défaussez ${k} de ces cartes` },
                    { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Éclaireurs : remettez les autres dans l\'ordre de votre choix' }
                ]);
                return done(state);
            }
        },
        {
            // Bonfire: trash up to 2 cards you have in play
            type: 'BONFIRE',
            handler: (state, player) => {
                if (!player.playArea.length) return done(state);
                state.pendingDecision = {
                    id: `bonfire_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Feu de joie : écartez jusqu\'à 2 cartes que vous avez en jeu',
                    constraints: { min: 0, max: Math.min(2, player.playArea.length), sourceZone: 'playArea' },
                    context: { specialAction: 'BONFIRE_PICK' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Pilgrimage: turn your Journey token over; then if it's face up, choose up to 3 differently
            // named cards you have in play and gain a copy of each
            type: 'PILGRIMAGE',
            handler: (state, player) => {
                player.journeyFaceDown = !player.journeyFaceDown;
                if (player.journeyFaceDown) return done(state);
                const names = [...new Set(player.playArea.map(c => c.id))].filter(id => state.supply[id]?.count > 0);
                if (!names.length) return done(state);
                state.pendingDecision = {
                    id: `pilgrimage_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Pèlerinage : choisissez jusqu\'à 3 cartes de noms différents en jeu, recevez-en une copie',
                    constraints: { min: 0, max: Math.min(3, names.length), sourceZone: 'playArea' },
                    context: { specialAction: 'PILGRIMAGE_PICK' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Raid: gain a Silver per Silver you have in play. Each other player puts their -1 Card token on their deck.
            type: 'RAID',
            handler: (state, player) => {
                const n = player.playArea.filter(c => c.id === 'silver').length;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'silver' });
                for (const p of others(state, player)) p.minusCardToken = true;
                return done(state);
            }
        },
        {
            // Seaway: gain an Action card costing up to $4. Move your +1 Buy token to its pile.
            type: 'SEAWAY',
            handler: (state, player) => GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 4, cardTypes: ['ACTION'] },
                { next: [{ type: 'TOKEN_TO_GAINED_PILE', token: 'plus1Buy' }] }, 'Route maritime : recevez une carte Action coûtant jusqu\'à 4 💰')
        },
        {
            type: 'TOKEN_TO_GAINED_PILE',
            handler: (state, player, effect: any) => {
                const id = state.lastGainedCard?.id;
                const pile = id ? pileOf(state, id) : undefined;
                if (pile) (player.advTokens = player.advTokens || {})[effect.token] = pile;
                return done(state);
            }
        },
        {
            // Trade: trash up to 2 cards from your hand. Gain a Silver per card you trashed.
            type: 'TRADE',
            handler: (state, player) => {
                (state as any).lastTrashedCards = [];
                push(state, player.id, { type: 'TRADE_SILVERS' });
                if (player.hand.length) push(state, player.id, { type: 'TRASH', min: 0, max: 2, from: 'hand', message: 'Commerce : écartez jusqu\'à 2 cartes' });
                return done(state);
            }
        },
        {
            type: 'TRADE_SILVERS',
            handler: (state, player) => {
                const n = ((state as any).lastTrashedCards || []).length;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'silver' });
                return done(state);
            }
        },
        {
            // Inheritance: set aside a non-Victory Action card from the Supply costing up to $4; move your Estate token to it
            type: 'INHERITANCE',
            handler: (state, player) => {
                const choices = Object.keys(state.supply).filter(id => state.supply[id].count > 0 && isType(id, 'ACTION') && !isType(id, 'VICTORY')
                    && !isType(id, 'COMMAND') && costOf(state, player, id) <= 4 && !def(id)?.potionCost && !def(id)?.debtCost);
                if (!choices.length) return done(state);
                state.pendingDecision = {
                    id: `inheritance_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Héritage : choisissez une carte Action non-Victoire coûtant jusqu\'à 4 💰 (vos Domaines en auront les capacités)',
                    constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { cardIds: choices } },
                    context: { specialAction: 'INHERITANCE_PICK', choices }
                } as any;
                return { state, needsChoice: true };
            }
        }
    ],

    onLoad: () => {
        const owned = (state: GameState, id: string) => state.players.find(p => p.id === id);

        EffectEngine.registerDecisionHandler('MOVE_TOKEN', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const pile: string | undefined = payload.cardId;
            if (!player || !pile || !(decision.context.piles || []).includes(pile)) return;
            (player.advTokens = player.advTokens || {})[decision.context.token] = pile;
            EffectUtils.log(state, `${player.name} place son jeton ${TOKEN_LABELS[decision.context.token] || ''} sur ${nameOf(pile)}.`, player.id);
        });
        EffectEngine.registerDecisionHandler('PLAY_TREASURES_PICK', (state, playerId, payload) => {
            const player = owned(state, playerId);
            if (!player) return;
            const ids = chosenInstanceIds(payload).filter(id => player.hand.some(c => c.instanceId === id && isType(c.id, 'TREASURE'))).slice(0, 3);
            // Play them in the chosen order: the first one's effects must resolve first
            for (const id of ids.slice().reverse()) push(state, player.id, { type: 'PLAY_INSTANCE_IF_OWNED', instanceId: id });
        });
        EffectEngine.registerDecisionHandler('DISCIPLE_PICK', (state, playerId, payload) => {
            const player = owned(state, playerId);
            const id = player ? chosenInstanceIds(payload)[0] : undefined;
            const card = id ? player!.hand.find(c => c.instanceId === id && isType(c.id, 'ACTION')) : undefined;
            if (!player || !card) return;
            push(state, player.id, { type: 'GAIN_CARD', cardId: card.id });
            push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: card.instanceId });
            playCardNow(state, player, card.instanceId);
        });
        EffectEngine.registerDecisionHandler('SAVE_PICK', (state, playerId, payload) => {
            const player = owned(state, playerId);
            const id = player ? chosenInstanceIds(payload)[0] : undefined;
            const idx = id ? player!.hand.findIndex(c => c.instanceId === id) : -1;
            if (player && idx !== -1) getMat(player, 'save').push(player.hand.splice(idx, 1)[0]);
        });
        EffectEngine.registerDecisionHandler('BONFIRE_PICK', (state, playerId, payload) => {
            const player = owned(state, playerId);
            if (!player) return;
            for (const id of chosenInstanceIds(payload).slice(0, 2)) {
                const idx = player.playArea.findIndex(c => c.instanceId === id);
                if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
            }
        });
        EffectEngine.registerDecisionHandler('PILGRIMAGE_PICK', (state, playerId, payload) => {
            const player = owned(state, playerId);
            if (!player) return;
            const ids = [...new Set(chosenInstanceIds(payload).map(id => player.playArea.find(c => c.instanceId === id)?.id).filter(Boolean) as string[])].slice(0, 3);
            for (const cid of ids.reverse()) push(state, player.id, { type: 'GAIN_CARD', cardId: cid });
        });
        EffectEngine.registerDecisionHandler('INHERITANCE_PICK', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const cid: string | undefined = payload.cardId;
            if (!player || !cid || !(decision.context.choices || []).includes(cid)) return;
            const pile = state.supply[cid];
            pile.count--;
            const inherited = def(cid)!;
            const estate = def('estate')!;
            (state.playerCardOverrides = state.playerCardOverrides || {})[player.id] = {
                estate: {
                    types: [...new Set([...estate.types, ...inherited.types, 'COMMAND'])],
                    effects: inherited.effects || [],
                    durationEffects: inherited.durationEffects,
                    description: `${estate.description} Pendant vos tours, c'est aussi une Commande avec les capacités de ${inherited.name}.`
                }
            };
            (state.landscapeState as any)[`inheritance_${player.id}`] = { state: { cardId: cid }, tokens: {} };
            EffectUtils.log(state, `${player.name} place son jeton Domaine sur ${inherited.name} (Héritage).`, player.id);
        });
    }
};
