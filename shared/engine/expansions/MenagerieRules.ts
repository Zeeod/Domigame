/**
 * Menagerie — rules: Exile, Horses, Ways, Events and the Kingdom cards.
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EffectEngine } from '../EffectEngine.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow, markPlayed, pushPlayEffects } from '../Play.js';
import { getMat, peekMat } from '../Mats.js';
import { setupHooks } from '../KingdomRules.js';
import { TriggerEffectHandler } from '../effects/TriggerEffectHandler.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const def = (id: string) => CardRegistry.get(id);
const isType = (id: string, t: string) => !!def(id)?.types.includes(t as any);
const nameOf = (id: string) => def(id)?.name || id;
const costOf = (state: GameState, player: PlayerState, id: string) => EconomyEngine.getCardCost(state, player.id, id);
const emptyPiles = (state: GameState) => Object.values(state.supply).filter(p => p.count === 0).length;
const isCurrent = (state: GameState, p: PlayerState) => state.players[state.currentPlayerIndex]?.id === p.id;

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
const topOf = (state: GameState, pile: string) => state.supply[pile]?.cards?.length ? state.supply[pile].cards![state.supply[pile].cards!.length - 1].id : pile;
function exile(state: GameState, player: PlayerState, card: CardInstance) {
    getMat(player, 'exile').push(card);
    EffectUtils.log(state, `${player.name} exile ${nameOf(card.id)}.`, player.id);
}
function askHand(state: GameState, player: PlayerState, specialAction: string, message: string, filter: any, max = 1, extra: any = {}, min = 0) {
    const candidates = EffectUtils.filterCards(player.hand, filter);
    if (candidates.length === 0) return done(state);
    state.pendingDecision = {
        id: `${specialAction.toLowerCase()}_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any, message,
        constraints: { min: Math.min(min, candidates.length), max: Math.min(max, candidates.length), sourceZone: 'hand', filter },
        context: { specialAction, candidates: candidates.map(c => c.instanceId), ...extra }
    } as any;
    return { state, needsChoice: true };
}

const HORSE_USERS = ['cavalry', 'groom', 'hostelry', 'livery', 'paddock', 'scrap', 'sleigh', 'supplies', 'bargain', 'demand', 'ride', 'stampede'];

export function setupMenagerie(state: GameState): void {
    const all = [...(state.kingdomCards || []), ...(state.landscapes || [])];
    state.nonSupply = state.nonSupply || {};
    if (all.some(id => HORSE_USERS.includes(id)) && !state.nonSupply.horse) state.nonSupply.horse = { cardId: 'horse', count: 30, cards: [] } as any;
    if (all.includes('way_of_the_mouse') && !(state.landscapeState as any)?.way_of_the_mouse) {
        const used = new Set([...Object.keys(state.supply), ...(state.kingdomCards || [])]);
        const pool = CardRegistry.getKingdomCandidates().filter(id => {
            const d = def(id);
            return d && !used.has(id) && d.types.includes('ACTION') && (d.cost === 2 || d.cost === 3) && !d.potionCost && !d.debtCost && !d.mixedPile;
        }).sort();
        if (pool.length) (state.landscapeState as any).way_of_the_mouse = { state: { cardId: pool[Math.floor(EffectUtils.random(state) * pool.length)] }, tokens: {} };
    }
}

export const MenagerieRulesModule: ExpansionModule = {
    id: 'menagerie_rules',
    name: 'Ménagerie (règles)',

    costModifiers: [
        {
            id: 'menagerie:card_costs',
            priority: 40,
            modifier: (state, playerId, cardId, cost) => {
                const cur = state.players[state.currentPlayerIndex];
                const mine = cur && cur.id === playerId;
                if (cardId === 'destrier' && mine) return cost - (cur.gainedThisTurn || []).length;
                if (cardId === 'fisherman' && mine && cur.discardPile.length === 0) return cost - 3;
                if (cardId === 'wayfarer') {
                    const last = state.lastGainedCard;
                    if (last && last.id !== 'wayfarer' && cur && (cur.gainedThisTurn || []).length && state.lastGainedCost !== undefined) return state.lastGainedCost as number;
                }
                return cost;
            }
        }
    ],

    eventHooks: [
        {
            // Invest: while the card is in Exile, when another player gains a copy of it, +2 Cards
            id: 'menagerie:invest',
            event: 'CARD_GAINED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const cid: string = event.context.gainedCardId;
                for (const p of state.players) {
                    if (p.id === event.playerId) continue;
                    const inv: string[] = (p as any).invested || [];
                    const n = peekMat(p, 'exile').filter(c => c.id === cid && inv.includes(c.instanceId)).length;
                    for (let i = 0; i < n; i++) push(state, p.id, { type: 'DRAW', amount: 2 });
                }
            }
        },
        {
            // Goatherd looks at the cards trashed by the player to your right on their last turn
            id: 'menagerie:turn_end',
            event: 'TURN_END',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                if (p) (p as any).trashedLastTurn = p.trashedThisTurn || 0;
            }
        }
    ],

    effectHandlers: [
        { type: 'NOOP', handler: (state) => done(state) },
        { type: 'BUYS_PER_EMPTY_PILE', handler: (state, player) => { player.buys += emptyPiles(state); return done(state); } },
        { type: 'ACTIONS_PER_EMPTY_PILE', handler: (state, player) => { player.actions += emptyPiles(state); return done(state); } },
        {
            // Stockpile: when you play this, Exile it
            type: 'EXILE_SELF',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) exile(state, player, player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Coven (per victim): Exile a Curse from the Supply; if you can't, discard your Exiled Curses
            type: 'EXILE_CURSE',
            handler: (state, victim) => {
                const curse = GainEffectHandler.takeFromPile(state, 'curse');
                if (curse) { exile(state, victim, curse); return done(state); }
                const mat = getMat(victim, 'exile');
                const curses = mat.filter(c => c.id === 'curse');
                if (!curses.length) return done(state);
                victim.mats.exile = mat.filter(c => c.id !== 'curse');
                discardCards(state, victim, curses);
                return done(state);
            }
        },
        {
            // Snowy Village: ignore any further +Actions you would get this turn
            type: 'IGNORE_EXTRA_ACTIONS',
            handler: (state, player) => { player.ignoreExtraActions = true; return done(state); }
        },
        {
            // "Either now or at the start of your next turn" (Barge, Village Green)
            type: 'NOW_OR_LATER',
            handler: (state, player, effect: any, ctx: any) => {
                push(state, player.id, options(`${effect.label} : maintenant ou au début de votre prochain tour ?`, [
                    { label: 'Maintenant', effects: [...effect.effects, { type: 'CANCEL_DURATION' }] },
                    { label: 'Au prochain tour', effects: [] }
                ]), ctx);
                return done(state);
            }
        },
        {
            // Black Cat: if it isn't your turn, each other player gains a Curse
            type: 'BLACK_CAT',
            handler: (state, player) => {
                if (!isCurrent(state, player)) push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] });
                return done(state);
            }
        },
        {
            // Exile a card from your hand (Bounty Hunter: +$3 if no copy was in Exile; Displace: gain a different card up to $2 more)
            type: 'EXILE_FROM_HAND',
            handler: (state, player, effect: any) =>
                askHand(state, player, 'EXILE_HAND_PICK', effect.optional ? 'Vous pouvez exiler une carte de votre main' : 'Exilez une carte de votre main', {}, 1,
                    { bounty: !!effect.bounty, displace: !!effect.displace }, effect.optional ? 0 : 1)
        },
        {
            // Exile a card from the Supply (a given card, or one you choose matching a filter)
            type: 'EXILE_FROM_SUPPLY',
            handler: (state, player, effect: any) => {
                if (effect.cardId) {
                    const card = GainEffectHandler.takeFromPile(state, effect.cardId);
                    if (card) exile(state, player, card);
                    return done(state);
                }
                const piles = Object.keys(state.supply).filter(id => state.supply[id].count > 0 && EffectUtils.filterCards([{ id: topOf(state, id), instanceId: '' } as any], effect.filter || {}).length > 0);
                if (!piles.length) return done(state);
                push(state, player.id, options('Exilez une carte de la réserve', piles.map(id => ({ label: nameOf(topOf(state, id)), effects: [{ type: 'EXILE_PILE_TOP', pileId: id, invest: !!effect.invest }] }))));
                return done(state);
            }
        },
        {
            type: 'EXILE_PILE_TOP',
            handler: (state, player, effect: any) => {
                const card = GainEffectHandler.takeFromPile(state, effect.pileId);
                if (!card) return done(state);
                exile(state, player, card);
                if (effect.invest) ((player as any).invested = (player as any).invested || []).push(card.instanceId);
                return done(state);
            }
        },
        {
            // Cardinal (per victim): reveal the top 2, Exile one costing $3–$6, discard the rest
            type: 'CARDINAL_HIT',
            handler: (state, victim) => {
                const two: CardInstance[] = [];
                for (let i = 0; i < 2; i++) { const c = takeTop(state, victim); if (c) two.push(c); }
                if (!two.length) return done(state);
                EffectUtils.revealCards(state, two, 'ALL', `${victim.name} dévoile`);
                const ok = two.filter(c => { const k = costOf(state, victim, c.id); return k >= 3 && k <= 6; });
                if (!ok.length) { discardCards(state, victim, two); return done(state); }
                if (ok.length === 1 || ok[0].id === ok[1].id) {
                    exile(state, victim, ok[0]);
                    discardCards(state, victim, two.filter(c => c !== ok[0]));
                    return done(state);
                }
                victim.limbo.push(...two);
                push(state, victim.id, options('Cardinal : quelle carte exiler ?', ok.map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'CARDINAL_PICK', keep: c.instanceId, ids: two.map(x => x.instanceId) }]
                }))));
                return done(state);
            }
        },
        {
            type: 'CARDINAL_PICK',
            handler: (state, player, effect: any) => {
                const cards = (effect.ids as string[]).map(id => player.limbo.find(c => c.instanceId === id)).filter(Boolean) as CardInstance[];
                player.limbo = player.limbo.filter(c => !cards.includes(c));
                const ex = cards.find(c => c.instanceId === effect.keep);
                if (ex) exile(state, player, ex);
                discardCards(state, player, cards.filter(c => c !== ex));
                return done(state);
            }
        },
        {
            // Cavalry: when you gain this, +2 Cards, +1 Buy, and if it's your Buy phase return to your Action phase
            type: 'CAVALRY_ON_GAIN',
            handler: (state, player) => {
                player.buys += 1;
                push(state, player.id, { type: 'DRAW', amount: 2 });
                if (state.phase === 'BUY' && isCurrent(state, player)) {
                    state.phase = 'ACTION';
                    state.phaseIndex = state.phasePipeline?.indexOf('ACTION' as any) ?? 0;
                }
                return done(state);
            }
        },
        {
            // Gatekeeper (per victim): until your next turn, when they gain an Action or Treasure they don't have an Exiled copy of, they Exile it
            type: 'GATEKEEPER_HIT',
            handler: (state, victim, _e, ctx: any) => {
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: victim.id, once: false, expiresOnTurnOf: ctx?.attackerId,
                    effects: [{ type: 'GATEKEEPER_EXILE' } as any], description: 'Gardien de la porte'
                } as any);
                return done(state);
            }
        },
        {
            type: 'GATEKEEPER_EXILE',
            handler: (state, player, _e, ctx: any) => {
                const cid = ctx?.gainedCardId;
                const iid = ctx?.gainedInstanceId;
                if (!cid || !iid || !(isType(cid, 'ACTION') || isType(cid, 'TREASURE'))) return done(state);
                if (peekMat(player, 'exile').some(c => c.id === cid)) return done(state);
                const card = EffectUtils.removeCardFromPlayer(state, player, iid);
                if (card) exile(state, player, card);
                return done(state);
            }
        },
        {
            // Goatherd: +1 Card per card the player to your right trashed on their last turn
            type: 'GOATHERD',
            handler: (state, player) => {
                const i = state.players.findIndex(p => p.id === player.id);
                const right = state.players[(i - 1 + state.players.length) % state.players.length];
                const n = right.id === player.id ? 0 : ((right as any).trashedLastTurn || 0);
                if (n) push(state, player.id, { type: 'DRAW', amount: n });
                return done(state);
            }
        },
        {
            // Groom: Action → a Horse; Treasure → a Silver; Victory → +1 Card +1 Action
            type: 'GROOM_AFTER',
            handler: (state, player) => {
                const g = state.lastGainedCard;
                if (!g) return done(state);
                const fx: any[] = [];
                if (isType(g.id, 'ACTION')) fx.push({ type: 'GAIN_CARD', cardId: 'horse' });
                if (isType(g.id, 'TREASURE')) fx.push({ type: 'GAIN_CARD', cardId: 'silver' });
                if (isType(g.id, 'VICTORY')) fx.push({ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 });
                pushAll(state, player.id, fx);
                return done(state);
            }
        },
        {
            type: 'HORSES_PER_DISCARD',
            handler: (state, player) => {
                const n = (state as any).lastDiscardedCount || 0;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'horse' });
                return done(state);
            }
        },
        {
            // Kiln: the next time you gain a card this turn, you may first gain a copy of it
            type: 'KILN',
            handler: (state, player) => {
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: player.id, once: true, expires: 'END_OF_TURN',
                    effects: [{ type: 'KILN_OFFER' } as any], description: 'Four'
                } as any);
                return done(state);
            }
        },
        {
            type: 'KILN_OFFER',
            handler: (state, player, _e, ctx: any) => {
                const cid = ctx?.gainedCardId;
                if (!cid || !(state.supply[cid]?.count > 0)) return done(state);
                push(state, player.id, options(`Four : recevoir une copie de ${nameOf(cid)} ?`, [
                    { label: 'Oui', effects: [{ type: 'GAIN_CARD', cardId: cid }] }, { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Mastermind: you may play an Action card from your hand three times
            type: 'MASTERMIND',
            handler: (state, player) => askHand(state, player, 'PLAY_THRICE_PICK', 'Cerveau : jouer trois fois une Action de votre main ?', { cardTypes: ['ACTION'] })
        },
        {
            // Sleigh (reaction): discard this to put the gained card into your hand or onto your deck
            type: 'SLEIGH',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.hand.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) discardCard(state, player, player.hand.splice(idx, 1)[0]);
                push(state, player.id, options('Traîneau : où placer la carte reçue ?', [
                    { label: 'En main', effects: [{ type: 'GAINED_CARD_TO', to: 'hand', callContext: ctx }] },
                    { label: 'Sur la pioche', effects: [{ type: 'GAINED_CARD_TO', to: 'deck', callContext: ctx }] }
                ]), ctx);
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Ways
        {
            // Butterfly: you may return this to its pile to gain a card costing exactly $1 more
            type: 'WAY_BUTTERFLY',
            handler: (state, player, _e, ctx: any) => {
                const card = player.playArea.find(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (!card) return done(state);
                push(state, player.id, options(`Voie du papillon : remettre ${nameOf(card.id)} pour une carte à +1 💰 ?`, [
                    { label: 'Oui', effects: [{ type: 'BUTTERFLY_DO', instanceId: card.instanceId, cardId: card.id }] },
                    { label: 'Non', effects: [] }
                ]), ctx);
                return done(state);
            }
        },
        {
            type: 'BUTTERFLY_DO',
            handler: (state, player, effect: any, ctx: any) => {
                const target = costOf(state, player, effect.cardId) + 1;
                push(state, player.id, { type: 'BUTTERFLY_GAIN', exactCost: target });
                push(state, player.id, { type: 'RETURN_TO_PILE' }, { ...ctx, sourceCardInstanceId: effect.instanceId });
                return done(state);
            }
        },
        {
            type: 'BUTTERFLY_GAIN',
            handler: (state, player, effect: any) => {
                if (!(state as any).lastReturnedToPile) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { exactCost: effect.exactCost }, {}, `Voie du papillon : recevez une carte coûtant exactement ${effect.exactCost} 💰`);
            }
        },
        {
            // Frog: when you discard this from play this turn, you may put it onto your deck
            type: 'WAY_FROG',
            handler: (state, player, _e, ctx: any) => {
                (state.discardFromPlayEffects = state.discardFromPlayEffects || [])
                    .push({ playerId: player.id, turn: state.turnNumber, effect: { type: 'FROG_TOPDECK', instanceId: ctx?.sourceCardInstanceId } });
                return done(state);
            }
        },
        {
            type: 'FROG_TOPDECK',
            handler: (state, player, effect: any) => {
                if (!player.discardPile.some(c => c.instanceId === effect.instanceId)) return done(state);
                push(state, player.id, options('Voie de la grenouille : placer la carte sur votre pioche ?', [
                    { label: 'Oui', effects: [{ type: 'TOPDECK_INSTANCE', instanceId: effect.instanceId }] }, { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Mouse: play the set-aside card, leaving it there
            type: 'WAY_MOUSE',
            handler: (state, player) => {
                const cid = (state.landscapeState as any)?.way_of_the_mouse?.state?.cardId;
                if (!cid) return done(state);
                const phantom = { id: cid, instanceId: `mouse_${cid}` } as CardInstance;
                markPlayed(state, player, phantom);
                EffectUtils.log(state, `${player.name} joue ${nameOf(cid)} (Voie de la souris).`, player.id);
                pushAll(state, player.id, (def(cid)?.effects || []) as any[], { sourceCardInstanceId: phantom.instanceId });
                return done(state);
            }
        },
        {
            // Rat: you may discard a Treasure to gain a copy of this
            type: 'WAY_RAT',
            handler: (state, player, _e, ctx: any) => {
                const card = player.playArea.find(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (!card || !player.hand.some(c => isType(c.id, 'TREASURE'))) return done(state);
                push(state, player.id, { type: 'DISCARD', min: 0, max: 1, filter: { cardTypes: ['TREASURE'] }, message: `Voie du rat : défausser un Trésor pour recevoir un ${nameOf(card.id)} ?`, onSuccess: [{ type: 'GAIN_CARD', cardId: card.id }] });
                return done(state);
            }
        },
        {
            // Turtle: set this aside; if you did, play it at the start of your next turn
            type: 'WAY_TURTLE',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx === -1) return done(state);
                const card = player.playArea.splice(idx, 1)[0];
                player.aside.push(card);
                (state.triggers = state.triggers || []).push({
                    type: 'START_TURN', playerId: player.id, once: true,
                    effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: card.instanceId } as any], description: `Voie de la tortue : ${nameOf(card.id)}`
                } as any);
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Events
        {
            // Banish: Exile any number of cards with the same name from your hand
            type: 'BANISH',
            handler: (state, player) => {
                const names = [...new Set(player.hand.map(c => c.id))];
                if (!names.length) return done(state);
                const opts: any[] = [];
                for (const n of names) {
                    const k = player.hand.filter(c => c.id === n).length;
                    for (let i = 1; i <= k; i++) opts.push({ label: `${i} × ${nameOf(n)}`, effects: [{ type: 'BANISH_DO', cardId: n, count: i }] });
                }
                opts.push({ label: 'Aucune', effects: [] });
                push(state, player.id, options('Bannissement : exilez des cartes de même nom', opts));
                return done(state);
            }
        },
        {
            type: 'BANISH_DO',
            handler: (state, player, effect: any) => {
                for (let i = 0; i < effect.count; i++) {
                    const idx = player.hand.findIndex(c => c.id === effect.cardId);
                    if (idx !== -1) exile(state, player, player.hand.splice(idx, 1)[0]);
                }
                return done(state);
            }
        },
        {
            type: 'OTHERS_GAIN',
            handler: (state, player, effect: any) => {
                for (const p of others(state, player).reverse()) push(state, p.id, { type: 'GAIN_CARD', cardId: effect.cardId });
                return done(state);
            }
        },
        {
            // Commerce: gain a Gold per differently named card you've gained this turn
            type: 'COMMERCE',
            handler: (state, player) => {
                const n = new Set(player.gainedThisTurn || []).size;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'gold' });
                return done(state);
            }
        },
        {
            // Delay: you may set aside an Action card from your hand; at the start of your next turn, play it
            type: 'DELAY',
            handler: (state, player) => askHand(state, player, 'DELAY_PICK', 'Retard : mettre de côté une Action (jouée au début de votre prochain tour) ?', { cardTypes: ['ACTION'] })
        },
        {
            // Desperation: you may gain a Curse; if you do, +1 Buy and +$2
            type: 'DESPERATION',
            handler: (state, player) => {
                if (!(state.supply.curse?.count > 0)) return done(state);
                push(state, player.id, options('Désespoir : recevoir une Malédiction pour +1 Achat et +2 💰 ?', [
                    { label: 'Oui', effects: [{ type: 'GAIN_CARD', cardId: 'curse' }, { type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 2 }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Gamble: reveal the top card; Treasure or Action → you may play it; otherwise discard it
            type: 'GAMBLE',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                if (!(isType(top.id, 'TREASURE') || isType(top.id, 'ACTION'))) { discardCard(state, player, top); return done(state); }
                player.limbo.push(top);
                push(state, player.id, options(`Pari : jouer ${nameOf(top.id)} ?`, [
                    { label: 'Jouer', effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: top.instanceId }] },
                    { label: 'Défausser', effects: [{ type: 'LIMBO_TO', ids: [top.instanceId], to: 'discard' }] }
                ]));
                return done(state);
            }
        },
        {
            // March: look through your discard pile; you may play an Action card from it
            type: 'MARCH',
            handler: (state, player) => {
                const actions = player.discardPile.filter(c => isType(c.id, 'ACTION'));
                if (!actions.length) return done(state);
                const seen = new Set<string>();
                push(state, player.id, options('Marche : jouer une Action de votre défausse ?', [
                    ...actions.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: nameOf(c.id), effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId }] })),
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Populate: gain one card from each Action Supply pile
            type: 'POPULATE',
            handler: (state, player) => {
                const piles = Object.keys(state.supply).filter(id => state.supply[id].count > 0 && isType(topOf(state, id), 'ACTION'));
                for (const id of piles.reverse()) push(state, player.id, { type: 'GAIN_CARD', cardId: id });
                return done(state);
            }
        },
        {
            // Pursue: reveal the top 4; put the named ones back and discard the rest
            type: 'PURSUE',
            handler: (state, player, _e, ctx: any) => {
                const named = ctx?.namedCardId ?? (state as any).lastNamedCard;
                const seen: CardInstance[] = [];
                for (let i = 0; i < 4; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                EffectUtils.revealCards(state, seen, 'ALL', `${player.name} dévoile`);
                player.deck.unshift(...seen.filter(c => c.id === named));
                discardCards(state, player, seen.filter(c => c.id !== named));
                return done(state);
            }
        },
        {
            // Reap: gain a Gold, set it aside; if you do, play it at the start of your next turn
            type: 'REAP',
            handler: (state, player) => {
                const gold = GainEffectHandler.takeFromPile(state, 'gold');
                if (!gold) return done(state);
                player.aside.push(gold);
                state.lastGainedCard = gold;
                TriggerEffectHandler.triggerOnGainEffects(state, player, gold);
                (state.triggers = state.triggers || []).push({
                    type: 'START_TURN', playerId: player.id, once: true,
                    effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: gold.instanceId } as any], description: 'Moisson : jouer l\'Or'
                } as any);
                return done(state);
            }
        },
        {
            // Stampede: if you have 5 or fewer cards in play, gain 5 Horses onto your deck
            type: 'STAMPEDE',
            handler: (state, player) => {
                if (player.playArea.length > 5) return done(state);
                for (let i = 0; i < 5; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'horse', destination: 'deck' });
                return done(state);
            }
        },
        {
            // Transport: Exile an Action card from the Supply; or put an Action card you have in Exile onto your deck
            type: 'TRANSPORT',
            handler: (state, player) => {
                const exiled = peekMat(player, 'exile').filter(c => isType(c.id, 'ACTION'));
                const seen = new Set<string>();
                push(state, player.id, options('Transport : choisissez', [
                    { label: 'Exiler une Action de la réserve', effects: [{ type: 'EXILE_FROM_SUPPLY', filter: { cardTypes: ['ACTION'] } }] },
                    ...exiled.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: `Placer ${nameOf(c.id)} (Exil) sur votre pioche`, effects: [{ type: 'EXILE_TO_DECK', instanceId: c.instanceId }] }))
                ]));
                return done(state);
            }
        },
        {
            type: 'EXILE_TO_DECK',
            handler: (state, player, effect: any) => {
                const mat = getMat(player, 'exile');
                const idx = mat.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) player.deck.unshift(mat.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Scrap: choose a different thing per $1 the trashed card costs
            type: 'SCRAP_BONUSES',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                const n = Math.min(6, t ? costOf(state, player, t.id) : 0);
                if (!n) return done(state);
                push(state, player.id, { type: 'SCRAP_PICK', left: n, taken: [] });
                return done(state);
            }
        },
        {
            type: 'SCRAP_PICK',
            handler: (state, player, effect: any) => {
                const all = [
                    { key: 'card', label: '+1 Carte', fx: { type: 'DRAW', amount: 1 } },
                    { key: 'action', label: '+1 Action', fx: { type: 'ADD_ACTIONS', amount: 1 } },
                    { key: 'buy', label: '+1 Achat', fx: { type: 'ADD_BUYS', amount: 1 } },
                    { key: 'coin', label: '+1 💰', fx: { type: 'ADD_MONEY', amount: 1 } },
                    { key: 'silver', label: 'Recevoir un Argent', fx: { type: 'GAIN_CARD', cardId: 'silver' } },
                    { key: 'horse', label: 'Recevoir un Cheval', fx: { type: 'GAIN_CARD', cardId: 'horse' } },
                ];
                const taken: string[] = effect.taken || [];
                if (effect.left <= 0 || taken.length >= all.length) {
                    // Do the chosen things in the listed order
                    pushAll(state, player.id, all.filter(a => taken.includes(a.key)).map(a => a.fx));
                    return done(state);
                }
                push(state, player.id, options(`Ferraille : choisissez (encore ${effect.left})`, all.filter(a => !taken.includes(a.key)).map(a => ({
                    label: a.label, effects: [{ type: 'SCRAP_PICK', left: effect.left - 1, taken: [...taken, a.key] }]
                }))));
                return done(state);
            }
        }
    ],

    onLoad: () => {
        if (!setupHooks.includes(setupMenagerie)) setupHooks.push(setupMenagerie);
        const owned = (state: GameState, id: string) => state.players.find(p => p.id === id);
        const picked = (payload: any, decision: any) => chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id));

        EffectEngine.registerDecisionHandler('EXILE_HAND_PICK', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            const idx = id ? player!.hand.findIndex(c => c.instanceId === id) : -1;
            if (!player || idx === -1) return;
            const card = player.hand.splice(idx, 1)[0];
            const hadCopy = peekMat(player, 'exile').some(c => c.id === card.id);
            exile(state, player, card);
            if (decision.context.bounty && !hadCopy) push(state, player.id, { type: 'ADD_MONEY', amount: 3 });
            if (decision.context.displace) {
                const max = costOf(state, player, card.id) + 2;
                push(state, player.id, { type: 'GAIN_CARD', maxCost: max, excludeIds: [card.id], message: `Déplacement : recevez une carte d'un autre nom coûtant jusqu'à ${max} 💰` });
            }
        });
        EffectEngine.registerDecisionHandler('PLAY_THRICE_PICK', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            if (!player || !id) return;
            push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: id });
            push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: id });
            playCardNow(state, player, id);
        });
        EffectEngine.registerDecisionHandler('DELAY_PICK', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            const idx = id ? player!.hand.findIndex(c => c.instanceId === id) : -1;
            if (!player || idx === -1) return;
            player.aside.push(player.hand.splice(idx, 1)[0]);
            (state.triggers = state.triggers || []).push({
                type: 'START_TURN', playerId: player.id, once: true,
                effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: id } as any], description: 'Retard'
            } as any);
        });
        void pushPlayEffects; void TrashEffectHandler;
    }
};
