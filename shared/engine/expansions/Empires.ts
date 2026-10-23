/**
 * Empires Expansion Module
 *
 * Cards, Castles, Events, Landmarks (VP pools, hooks and end-game scoring), Tax (debt on piles).
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
import { setupHooks } from '../KingdomRules.js';
import { VictoryChecker } from '../VictoryChecker.js';
import { getMat } from '../Mats.js';
import { ZoneManager } from '../ZoneManager.js';
import { createCardInstance } from '../CardInstance.js';

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
function leftOf(state: GameState, player: PlayerState): PlayerState {
    const i = state.players.findIndex(p => p.id === player.id);
    return state.players[(i + 1) % state.players.length];
}
export function addVP(state: GameState, player: PlayerState, n: number, why = '') {
    if (!n) return;
    player.vpTokens = (player.vpTokens || 0) + n;
    EffectUtils.log(state, `${player.name} ${n > 0 ? 'reçoit' : 'perd'} ${Math.abs(n)} 🛡️${why ? ` (${why})` : ''}.`, player.id);
}
/** The Supply pile a card belongs to (split piles included). */
function pileOf(state: GameState, cardId: string): string | undefined {
    if (state.supply[cardId]) return cardId;
    return Object.keys(state.supply).find(k => state.supply[k].cards?.some(c => c.id === cardId));
}
const pileVP = (state: GameState, pile: string) => state.supply[pile]?.tokens?.vp || 0;
function setPileVP(state: GameState, pile: string, n: number) {
    const p = state.supply[pile];
    if (!p) return;
    p.tokens = p.tokens || {};
    p.tokens.vp = n;
}
/** VP pool of a Landmark (landscapeState[id].tokens.vp). */
const landmarkActive = (state: GameState, id: string) => (state.landscapes || []).includes(id);
function landmarkVP(state: GameState, id: string): number { return (state.landscapeState as any)?.[id]?.tokens?.vp || 0; }
function setLandmarkVP(state: GameState, id: string, n: number) {
    const ls: any = state.landscapeState = state.landscapeState || {};
    ls[id] = ls[id] || { state: {}, tokens: {} };
    ls[id].tokens = ls[id].tokens || {};
    ls[id].tokens.vp = n;
}
function takeFromLandmark(state: GameState, player: PlayerState, id: string, n: number) {
    const have = landmarkVP(state, id);
    const k = Math.min(have, n);
    if (k <= 0) return;
    setLandmarkVP(state, id, have - k);
    addVP(state, player, k, nameOf(id));
}

const CASTLES = ['humble_castle', 'crumbling_castle', 'small_castle', 'haunted_castle', 'opulent_castle', 'sprawling_castle', 'grand_castle', 'kings_castle'];

/** Landmark setup: VP pools and pile tokens. Called once at game start (applyKingdomSetup). */
export function setupEmpires(state: GameState): void {
    const n = state.players.length;
    for (const id of ['arena', 'basilica', 'baths', 'battlefield', 'colonnade', 'labyrinth']) {
        if (landmarkActive(state, id) && !(state.landscapeState as any)?.[id]) setLandmarkVP(state, id, 6 * n);
    }
    if (landmarkActive(state, 'aqueduct')) {
        setPileVP(state, 'silver', 8); setPileVP(state, 'gold', 8);
        if (!(state.landscapeState as any)?.aqueduct) setLandmarkVP(state, 'aqueduct', 0);
    }
    if (landmarkActive(state, 'defiled_shrine')) {
        for (const id of Object.keys(state.supply)) {
            const top = state.supply[id].cards?.length ? state.supply[id].cards![state.supply[id].cards!.length - 1].id : id;
            if (isType(top, 'ACTION') && !isType(top, 'GATHERING')) setPileVP(state, id, 2);
        }
        if (!(state.landscapeState as any)?.defiled_shrine) setLandmarkVP(state, 'defiled_shrine', 0);
    }
    if (landmarkActive(state, 'obelisk') && !(state.landscapeState as any)?.obelisk) {
        const actions = Object.keys(state.supply).filter(id => isType(id, 'ACTION') || state.supply[id].cards?.some(c => isType(c.id, 'ACTION'))).sort();
        if (actions.length) {
            const pick = actions[Math.floor(EffectUtils.random(state) * actions.length)];
            (state.landscapeState as any).obelisk = { state: { pile: pick }, tokens: {} };
        }
    }
    // Castles: 8 (one of each) with 2 players, 12 with 3+ (2 Humble, Small, Opulent and King's)
    const castlePile = Object.keys(state.supply).find(k => state.supply[k].cards?.some(c => c.id === 'humble_castle'));
    if (castlePile && n >= 3 && state.supply[castlePile].cards!.length === 8) {
        const order = ['kings_castle', 'kings_castle', 'grand_castle', 'sprawling_castle', 'opulent_castle', 'opulent_castle',
            'haunted_castle', 'small_castle', 'small_castle', 'crumbling_castle', 'humble_castle', 'humble_castle'];
        const make = (id: string) => createCardInstance(id);
        state.supply[castlePile].cards = order.map(make) as any;
        state.supply[castlePile].count = 12;
    }

    // Tax: 1 debt on each Supply pile
    if ((state.landscapes || []).includes('tax')) {
        for (const id of Object.keys(state.supply)) {
            const p = state.supply[id];
            p.tokens = p.tokens || {};
            if (p.tokens.debt === undefined) p.tokens.debt = 1;
        }
    }
}

/** Landmark end-game scoring (VP from "When scoring" Landmarks). */
export function scoreLandmark(state: GameState, player: PlayerState, id: string, all: CardInstance[]): number {
    const count = (cid: string) => all.filter(c => c.id === cid).length;
    const byName = new Map<string, number>();
    for (const c of all) byName.set(c.id, (byName.get(c.id) || 0) + 1);
    switch (id) {
        case 'bandit_fort': return -2 * (count('silver') + count('gold'));
        case 'fountain': return count('copper') >= 10 ? 15 : 0;
        case 'keep': {
            let vp = 0;
            for (const [cid, n] of byName) {
                if (!isType(cid, 'TREASURE')) continue;
                const best = state.players.every(p => p.id === player.id || ZoneManager.getAllCards(p).filter(c => c.id === cid).length <= n);
                if (best) vp += 5;
            }
            return vp;
        }
        case 'museum': return 2 * byName.size;
        case 'obelisk': {
            const pile = (state.landscapeState as any)?.obelisk?.state?.pile;
            if (!pile) return 0;
            const ids = new Set([pile, ...(state.supply[pile]?.cards || []).map(c => c.id), ...(def(pile)?.mixedPile?.cards || [])]);
            return 2 * all.filter(c => ids.has(c.id)).length;
        }
        case 'orchard': return 4 * [...byName].filter(([cid, n]) => n >= 3 && isType(cid, 'ACTION')).length;
        case 'palace': return 3 * Math.min(count('copper'), count('silver'), count('gold'));
        case 'tower': {
            let vp = 0;
            for (const c of all) {
                if (isType(c.id, 'VICTORY')) continue;
                const pile = pileOf(state, c.id) ?? (state.supply[c.id] ? c.id : undefined);
                if (pile && state.supply[pile].count === 0) vp++;
            }
            return vp;
        }
        case 'triumphal_arch': {
            const counts = [...byName].filter(([cid]) => isType(cid, 'ACTION')).map(([, n]) => n).sort((a, b) => b - a);
            return 3 * (counts[1] || 0);
        }
        case 'wall': return -Math.max(0, all.length - 15);
        case 'wolf_den': return -3 * [...byName.values()].filter(n => n === 1).length;
        default: return 0;
    }
}

export const EmpiresModule: ExpansionModule = {
    id: 'empires',
    name: 'Empires',

    eventHooks: [
        {
            // Landmarks reacting to gains: Aqueduct, Battlefield, Defiled Shrine, Labyrinth
            id: 'empires:gain',
            event: 'CARD_GAINED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                const cid: string = event.context.gainedCardId;
                if (!player || !cid) return;
                if (landmarkActive(state, 'aqueduct')) {
                    if (isType(cid, 'TREASURE')) {
                        const pile = pileOf(state, cid);
                        if (pile && pileVP(state, pile) > 0) { setPileVP(state, pile, pileVP(state, pile) - 1); setLandmarkVP(state, 'aqueduct', landmarkVP(state, 'aqueduct') + 1); }
                    }
                    if (isType(cid, 'VICTORY')) takeFromLandmark(state, player, 'aqueduct', 999);
                }
                if (landmarkActive(state, 'battlefield') && isType(cid, 'VICTORY')) takeFromLandmark(state, player, 'battlefield', 2);
                if (landmarkActive(state, 'defiled_shrine') && isType(cid, 'ACTION')) {
                    const pile = pileOf(state, cid);
                    if (pile && pileVP(state, pile) > 0) { setPileVP(state, pile, pileVP(state, pile) - 1); setLandmarkVP(state, 'defiled_shrine', landmarkVP(state, 'defiled_shrine') + 1); }
                }
                if (landmarkActive(state, 'labyrinth') && state.players[state.currentPlayerIndex]?.id === player.id
                    && (player.gainedThisTurn || []).length === 2) takeFromLandmark(state, player, 'labyrinth', 2);
            }
        },
        {
            // Landmarks and Tax reacting to buys: Basilica, Colonnade, Defiled Shrine (Curse), Tax
            id: 'empires:buy',
            event: 'CARD_BOUGHT',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                const cid: string = event.context.boughtCardId;
                if (!player || !cid) return;
                if (landmarkActive(state, 'basilica') && player.coins >= 2) takeFromLandmark(state, player, 'basilica', 2);
                if (landmarkActive(state, 'colonnade') && isType(cid, 'ACTION') && player.playArea.some(c => c.id === cid)) takeFromLandmark(state, player, 'colonnade', 2);
                if (landmarkActive(state, 'defiled_shrine') && cid === 'curse') takeFromLandmark(state, player, 'defiled_shrine', 999);
                const pile = pileOf(state, cid);
                const debt = pile ? state.supply[pile].tokens?.debt || 0 : 0;
                if (pile && debt > 0) {
                    state.supply[pile].tokens!.debt = 0;
                    player.debt = (player.debt || 0) + debt;
                    EffectUtils.log(state, `${player.name} prend ${debt} Dette (Taxe).`, player.id);
                }
            }
        },
        {
            // Tomb: when you trash a card, +1 VP
            id: 'empires:trash',
            event: 'CARD_TRASHED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (player && landmarkActive(state, 'tomb')) addVP(state, player, 1, 'Tombeau');
            }
        },
        {
            // Arena: at the start of your Buy phase, you may discard an Action card for 2 VP
            id: 'empires:arena',
            event: 'PHASE_ENTER',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                if (event.context?.phaseId !== 'BUY' || !landmarkActive(state, 'arena') || landmarkVP(state, 'arena') <= 0) return;
                const player = state.players[state.currentPlayerIndex];
                const actions = player?.hand.filter(c => isType(c.id, 'ACTION')) || [];
                if (!actions.length) return;
                const seen = new Set<string>();
                push(state, player.id, options('Arène : défausser une carte Action pour 2 🛡️ ?', [
                    ...actions.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: nameOf(c.id), effects: [{ type: 'ARENA_DISCARD', instanceId: c.instanceId }] })),
                    { label: 'Non', effects: [] }
                ]));
            }
        },
        {
            // Baths (no card gained this turn) and Mountain Pass, at the end of a turn
            id: 'empires:turn_end',
            event: 'TURN_END',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player) return;
                if (landmarkActive(state, 'baths') && (player.gainedThisTurn || []).length === 0) takeFromLandmark(state, player, 'baths', 2);
                // Mountain Pass: when you are the first player to gain a Province, after that turn each player bids
                // once, up to 40 Debt, ending with you. The high bidder gets +8 VP and takes the Debt they bid.
                const mp: any = (state.landscapeState as any)?.mountain_pass;
                if (landmarkActive(state, 'mountain_pass') && !mp?.state?.done && (player.gainedThisTurn || []).includes('province')) {
                    (state.landscapeState as any).mountain_pass = { state: { done: true }, tokens: {} };
                    const order = [...others(state, player), player].map(p => p.id);
                    push(state, order[0], { type: 'MOUNTAIN_PASS_BID', order, idx: 0, high: 0, highBy: null });
                }
            }
        }
    ],

    effectHandlers: [
        // ---------------------------------------------------------------- cards
        {
            // Archive: set aside the top 3 cards; now and at the start of your next two turns, put one into your hand
            type: 'ARCHIVE',
            handler: (state, player, _e, ctx: any) => {
                const mat = getMat(player, 'archive');
                for (let i = 0; i < 3; i++) {
                    const c = takeTop(state, player);
                    if (!c) break;
                    (c as any).setAsideBy = ctx?.sourceCardInstanceId;
                    mat.push(c);
                }
                push(state, player.id, { type: 'ARCHIVE_PICK' }, { sourceCardInstanceId: ctx?.sourceCardInstanceId });
                return done(state);
            }
        },
        {
            type: 'ARCHIVE_PICK',
            handler: (state, player, _e, ctx: any) => {
                const mine = getMat(player, 'archive').filter(c => (c as any).setAsideBy === ctx?.sourceCardInstanceId);
                if (!mine.length) return done(state);
                if (mine.length === 1 || new Set(mine.map(c => c.id)).size === 1) {
                    push(state, player.id, { type: 'ARCHIVE_TAKE', instanceId: mine[0].instanceId });
                    return done(state);
                }
                const seen = new Set<string>();
                push(state, player.id, options('Archives : prenez une carte en main',
                    mine.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: nameOf(c.id), effects: [{ type: 'ARCHIVE_TAKE', instanceId: c.instanceId }] }))));
                return done(state);
            }
        },
        {
            type: 'ARCHIVE_TAKE',
            handler: (state, player, effect: any) => {
                const mat = getMat(player, 'archive');
                const idx = mat.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) { const c = mat.splice(idx, 1)[0]; delete (c as any).setAsideBy; player.hand.push(c); }
                return done(state);
            }
        },
        {
            // Settlers / Bustling Village: you may reveal a <card> from your discard pile and put it into your hand
            type: 'TAKE_FROM_DISCARD',
            handler: (state, player, effect: any) => {
                const card = player.discardPile.find(c => c.id === effect.cardId);
                if (!card) return done(state);
                push(state, player.id, options(`Prendre un ${nameOf(effect.cardId)} de votre défausse en main ?`, [
                    { label: 'Oui', effects: [{ type: 'DISCARD_TO_HAND', instanceId: card.instanceId }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'DISCARD_TO_HAND',
            handler: (state, player, effect: any) => {
                const idx = player.discardPile.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) player.hand.push(player.discardPile.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Capital: when you discard this from play, take 6 Debt, then you may pay off Debt
            type: 'CAPITAL_DEBT',
            handler: (state, player) => {
                player.debt = (player.debt || 0) + 6;
                const pay = Math.min(player.debt, player.coins);
                player.debt -= pay; player.coins -= pay;
                EffectUtils.log(state, `${player.name} prend 6 Dette (Capitale)${pay ? ` et en rembourse ${pay}` : ''}.`, player.id);
                return done(state);
            }
        },
        {
            // Catapult: trash a card; $3+ → Curse to the others; Treasure → they discard down to 3
            type: 'CATAPULT_ATTACK',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return done(state);
                const hit: any[] = [];
                if (costOf(state, player, t.id) >= 3) hit.push({ type: 'GAIN_CARD', cardId: 'curse' });
                if (isType(t.id, 'TREASURE')) hit.push({ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 });
                if (hit.length) push(state, player.id, { type: 'ATTACK', attackEffects: hit });
                return done(state);
            }
        },
        {
            // Chariot Race: reveal your top card, put it into your hand; the player to your left reveals theirs;
            // if yours costs more, +$1 and +1 VP
            type: 'CHARIOT_RACE',
            handler: (state, player) => {
                const mine = takeTop(state, player);
                if (!mine) return done(state);
                player.hand.push(mine);
                const left = leftOf(state, player);
                const theirs = left.id === player.id ? undefined : (() => { const c = takeTop(state, left); if (c) left.deck.unshift(c); return c; })();
                EffectUtils.revealCards(state, theirs ? [mine, theirs] : [mine], 'ALL', 'Course de chars');
                const cost = (p: PlayerState, c: CardInstance) => costOf(state, p, c.id) + (def(c.id)?.debtCost || 0) + (def(c.id)?.potionCost || 0);
                if (!theirs || cost(player, mine) > cost(left, theirs)) {
                    player.coins += 1;
                    addVP(state, player, 1, 'Course de chars');
                }
                return done(state);
            }
        },
        {
            // Charm: the next time you buy a card this turn, you may also gain a differently named card with the same cost
            type: 'CHARM_SET',
            handler: (state, player) => {
                (state.triggers = state.triggers || []).push({
                    type: 'ON_BUY', playerId: player.id, once: true, expires: 'END_OF_TURN',
                    effects: [{ type: 'CHARM_GAIN' } as any], description: 'Charme'
                } as any);
                return done(state);
            }
        },
        {
            type: 'CHARM_GAIN',
            handler: (state, player, _e, ctx: any) => {
                const bought = ctx?.boughtCardId || state.lastBoughtCardId;
                if (!bought) return done(state);
                const b = def(bought)!;
                const ids = Object.keys(state.supply).filter(id => {
                    const top = state.supply[id].cards?.length ? state.supply[id].cards![state.supply[id].cards!.length - 1].id : id;
                    const d = def(top);
                    return state.supply[id].count > 0 && top !== bought && d
                        && costOf(state, player, top) === costOf(state, player, bought)
                        && (d.debtCost || 0) === (b.debtCost || 0) && (d.potionCost || 0) === (b.potionCost || 0);
                });
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids }, {}, 'Charme : recevez une carte de nom différent de même coût', true);
            }
        },
        {
            // City Quarter: reveal your hand, +1 Card per Action card revealed
            type: 'CITY_QUARTER',
            handler: (state, player) => {
                if (player.hand.length) EffectUtils.revealCards(state, player.hand, 'ALL', `${player.name} dévoile sa main`);
                const n = player.hand.filter(c => isType(c.id, 'ACTION')).length;
                if (n) push(state, player.id, { type: 'DRAW', amount: n });
                return done(state);
            }
        },
        {
            // Crown: Action phase → play an Action twice; Buy phase → play a Treasure twice
            type: 'CROWN',
            handler: (state, player) => {
                const t = state.phase === 'BUY' ? 'TREASURE' : 'ACTION';
                const ok = player.hand.filter(c => isType(c.id, t));
                if (!ok.length) return done(state);
                state.pendingDecision = {
                    id: `crown_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: `Couronne : jouer deux fois ${t === 'ACTION' ? 'une Action' : 'un Trésor'} de votre main ?`,
                    constraints: { min: 0, max: 1, sourceZone: 'hand', filter: { cardTypes: [t] } },
                    context: { specialAction: 'PLAY_TWICE_FROM_HAND', candidates: ok.map(c => c.instanceId) }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Emporium: when you gain this, if you have at least 5 Action cards in play, +2 VP
            type: 'EMPORIUM_ON_GAIN',
            handler: (state, player) => {
                if (player.playArea.filter(c => isType(c.id, 'ACTION')).length >= 5) addVP(state, player, 2, 'Emporium');
                return done(state);
            }
        },
        {
            // Encampment: you may reveal a Gold or Plunder from your hand. If you don't, set this aside and return it
            // to the Supply at the start of Clean-up.
            type: 'ENCAMPMENT',
            handler: (state, player, _e, ctx: any) => {
                const self = ctx?.sourceCardInstanceId;
                const aside = { type: 'ENCAMPMENT_ASIDE', instanceId: self };
                if (!player.hand.some(c => c.id === 'gold' || c.id === 'plunder')) { push(state, player.id, aside); return done(state); }
                push(state, player.id, options('Campement : dévoiler un Or ou un Butin pour le garder ?', [
                    { label: 'Dévoiler', effects: [] },
                    { label: 'Ne pas dévoiler (il retourne dans la réserve)', effects: [aside] }
                ]));
                return done(state);
            }
        },
        {
            type: 'ENCAMPMENT_ASIDE',
            handler: (state, player, effect: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                getMat(player, 'encampment').push(player.playArea.splice(idx, 1)[0]);
                (state.discardFromPlayEffects = state.discardFromPlayEffects || [])
                    .push({ playerId: player.id, turn: state.turnNumber, effect: { type: 'ENCAMPMENT_RETURN', instanceId: effect.instanceId } });
                return done(state);
            }
        },
        {
            type: 'ENCAMPMENT_RETURN',
            handler: (state, player, effect: any) => {
                const mat = getMat(player, 'encampment');
                const idx = mat.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                const card = mat.splice(idx, 1)[0];
                const pile = pileOf(state, 'encampment') || Object.keys(state.supply).find(k => def(k)?.mixedPile?.cards.includes('encampment'));
                if (pile) {
                    const p = state.supply[pile];
                    p.count++;
                    if (Array.isArray(p.cards)) { p.cards.push(card); p.cardId = card.id; }
                } else {
                    player.discardPile.push(card);
                }
                return done(state);
            }
        },
        {
            // Farmers' Market: 4+ VP on the pile → take them and trash this; otherwise add 1 VP, then +$1 per VP there
            type: 'FARMERS_MARKET',
            handler: (state, player, _e, ctx: any) => {
                const pile = pileOf(state, 'farmers_market') || 'farmers_market';
                const vp = pileVP(state, pile);
                if (vp >= 4) {
                    setPileVP(state, pile, 0);
                    addVP(state, player, vp, 'Marché fermier');
                    const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                    if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                } else {
                    setPileVP(state, pile, vp + 1);
                    player.coins += vp + 1;
                }
                return done(state);
            }
        },
        {
            // Fortune: double your $ if you haven't yet this turn
            type: 'FORTUNE_DOUBLE',
            handler: (state, player) => {
                if ((player as any).fortuneTurn === state.turnNumber) return done(state);
                (player as any).fortuneTurn = state.turnNumber;
                player.coins *= 2;
                return done(state);
            }
        },
        {
            // Fortune (when gained): gain a Gold per Gladiator you have in play
            type: 'FORTUNE_ON_GAIN',
            handler: (state, player) => {
                const n = player.playArea.filter(c => c.id === 'gladiator').length;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'gold' });
                return done(state);
            }
        },
        {
            // Gladiator: reveal a card from your hand; the player to your left may reveal a copy.
            // If they don't, +$1 and trash a Gladiator from the Supply.
            type: 'GLADIATOR',
            handler: (state, player) => {
                if (!player.hand.length) { push(state, player.id, { type: 'GLADIATOR_WIN' }); return done(state); }
                const seen = new Set<string>();
                push(state, player.id, options('Gladiateur : dévoilez une carte de votre main',
                    player.hand.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: nameOf(c.id), effects: [{ type: 'GLADIATOR_DUEL', cardId: c.id }] }))));
                return done(state);
            }
        },
        {
            type: 'GLADIATOR_DUEL',
            handler: (state, player, effect: any) => {
                const left = leftOf(state, player);
                if (left.id !== player.id && left.hand.some(c => c.id === effect.cardId)) {
                    push(state, left.id, options(`Gladiateur de ${player.name} : dévoiler un ${nameOf(effect.cardId)} ?`, [
                        { label: 'Dévoiler', effects: [] },
                        { label: 'Ne pas dévoiler', effects: [{ type: 'GLADIATOR_WIN_FOR', ownerId: player.id }] }
                    ]));
                } else push(state, player.id, { type: 'GLADIATOR_WIN' });
                return done(state);
            }
        },
        {
            type: 'GLADIATOR_WIN_FOR',
            handler: (state, _p, effect: any) => { push(state, effect.ownerId, { type: 'GLADIATOR_WIN' }); return done(state); }
        },
        {
            type: 'GLADIATOR_WIN',
            handler: (state, player) => {
                player.coins += 1;
                const pile = pileOf(state, 'gladiator');
                if (pile) {
                    const p = state.supply[pile];
                    const top = p.cards?.length ? p.cards[p.cards.length - 1] : undefined;
                    if (p.count > 0 && (!top || top.id === 'gladiator')) {
                        const card = GainEffectHandler.takeFromPile(state, pile);
                        if (card) TrashEffectHandler.trashCard(state, player, card);
                    }
                }
                return done(state);
            }
        },
        {
            // Legionary: you may reveal a Gold; if you do, each other player discards down to 2, then draws a card
            type: 'LEGIONARY',
            handler: (state, player) => {
                if (!player.hand.some(c => c.id === 'gold')) return done(state);
                push(state, player.id, options('Légionnaire : dévoiler un Or ?', [
                    { label: 'Dévoiler', effects: [{ type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 2 }, { type: 'DRAW', amount: 1 }] }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Overlord: play a non-Command Action card from the Supply costing up to $5, leaving it there
            type: 'OVERLORD',
            handler: (state, player) => {
                const candidates = Object.keys(state.supply).filter(id => {
                    const top = state.supply[id].cards?.length ? state.supply[id].cards![state.supply[id].cards!.length - 1].id : id;
                    const d = def(top);
                    return d && state.supply[id].count > 0 && d.types.includes('ACTION') && !d.types.includes('COMMAND')
                        && costOf(state, player, top) <= 5 && !d.potionCost && !d.debtCost && top === id;
                });
                if (!candidates.length) return done(state);
                state.pendingDecision = {
                    id: `overlord_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Suzerain : jouez une carte Action de la réserve coûtant jusqu\'à 5 💰 (elle y reste)',
                    constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { cardIds: candidates } },
                    context: { specialAction: 'PLAY_FROM_SUPPLY', candidates }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Patrician: reveal the top card; if it costs $5 or more, put it into your hand
            type: 'PATRICIAN',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                if (costOf(state, player, top.id) >= 5) player.hand.push(top); else player.deck.unshift(top);
                return done(state);
            }
        },
        {
            // Rocks: gain a Silver; during your Buy phase onto your deck, otherwise into your hand
            type: 'ROCKS_SILVER',
            handler: (state, player) => {
                const buy = state.phase === 'BUY' && state.players[state.currentPlayerIndex]?.id === player.id;
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'silver', destination: buy ? 'deck' : 'hand' });
                return done(state);
            }
        },
        {
            type: 'DISCARD_ALL_OF',
            handler: (state, player, effect: any) => {
                const cards = player.hand.filter(c => c.id === effect.cardId);
                player.hand = player.hand.filter(c => c.id !== effect.cardId);
                discardCards(state, player, cards);
                return done(state);
            }
        },
        {
            // Sacrifice: Action → +2 Cards +2 Actions; Treasure → +$2; Victory → +2 VP
            type: 'SACRIFICE_BONUS',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return done(state);
                if (isType(t.id, 'VICTORY')) addVP(state, player, 2, 'Sacrifice');
                if (isType(t.id, 'TREASURE')) push(state, player.id, { type: 'ADD_MONEY', amount: 2 });
                if (isType(t.id, 'ACTION')) pushAll(state, player.id, [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 2 }]);
                return done(state);
            }
        },
        {
            // Temple: +1 VP. Trash from 1 to 3 differently named cards from your hand. Add 1 VP to the Temple pile.
            type: 'TEMPLE',
            handler: (state, player) => {
                addVP(state, player, 1, 'Temple');
                const pile = pileOf(state, 'temple') || 'temple';
                setPileVP(state, pile, pileVP(state, pile) + 1);
                if (!player.hand.length) return done(state);
                state.pendingDecision = {
                    id: `temple_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Temple : écartez de 1 à 3 cartes de noms différents',
                    constraints: { min: 1, max: Math.min(3, new Set(player.hand.map(c => c.id)).size), sourceZone: 'hand' },
                    context: { specialAction: 'TEMPLE_TRASH' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Gathering piles: when you gain this, take the VP from its pile (Temple)
            type: 'TAKE_PILE_VP',
            handler: (state, player, effect: any) => {
                const pile = pileOf(state, effect.cardId) || effect.cardId;
                const vp = pileVP(state, pile);
                if (vp > 0) { setPileVP(state, pile, 0); addVP(state, player, vp, nameOf(effect.cardId)); }
                return done(state);
            }
        },
        {
            // Villa: when you gain this, put it into your hand, +1 Action, and if it's your Buy phase return to your Action phase
            type: 'VILLA_ON_GAIN',
            handler: (state, player, _e, ctx: any) => {
                const id = ctx?.sourceCardInstanceId;
                const card = id ? EffectUtils.removeCardFromPlayer(state, player, id) : undefined;
                if (card) player.hand.push(card);
                player.actions += 1;
                if (state.phase === 'BUY' && state.players[state.currentPlayerIndex]?.id === player.id) {
                    state.phase = 'ACTION';
                    state.phaseIndex = state.phasePipeline?.indexOf('ACTION' as any) ?? 0;
                    EffectUtils.log(state, `${player.name} retourne en phase Action (Villa).`, player.id);
                }
                return done(state);
            }
        },
        {
            // Wild Hunt: gain an Estate, and if you do, take the VP from the pile
            type: 'WILD_HUNT_ESTATE',
            handler: (state, player) => {
                if (!(state.supply.estate?.count > 0)) return done(state);
                pushAll(state, player.id, [{ type: 'GAIN_CARD', cardId: 'estate' }, { type: 'TAKE_PILE_VP', cardId: 'wild_hunt' }]);
                return done(state);
            }
        },
        {
            type: 'ADD_PILE_VP',
            handler: (state, _p, effect: any) => {
                const pile = pileOf(state, effect.cardId) || effect.cardId;
                setPileVP(state, pile, pileVP(state, pile) + (effect.amount || 1));
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Castles
        {
            // Small Castle: trash this or a Castle from your hand. If you do, gain a Castle.
            type: 'SMALL_CASTLE',
            handler: (state, player, _e, ctx: any) => {
                const opts: any[] = [];
                const self = ctx?.sourceCardInstanceId;
                if (player.playArea.some(c => c.instanceId === self)) opts.push({ label: 'Écarter ce Petit château', effects: [{ type: 'SMALL_CASTLE_TRASH', instanceId: self }] });
                const seen = new Set<string>();
                for (const c of player.hand.filter(x => CASTLES.includes(x.id))) {
                    if (seen.has(c.id)) continue;
                    seen.add(c.id);
                    opts.push({ label: `Écarter ${nameOf(c.id)}`, effects: [{ type: 'SMALL_CASTLE_TRASH', instanceId: c.instanceId }] });
                }
                if (opts.length) push(state, player.id, options('Petit château : quel Château écarter ?', opts));
                return done(state);
            }
        },
        {
            type: 'SMALL_CASTLE_TRASH',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (!card) return done(state);
                TrashEffectHandler.trashCard(state, player, card);
                const pile = pileOf(state, 'humble_castle') || Object.keys(state.supply).find(k => state.supply[k].cards?.some(c => CASTLES.includes(c.id)));
                if (pile) push(state, player.id, { type: 'GAIN_CARD', cardId: pile });
                return done(state);
            }
        },
        {
            // Haunted Castle: when you gain this during your turn, gain a Gold, and each other player with 5+ cards
            // in hand puts 2 cards from their hand onto their deck
            type: 'HAUNTED_CASTLE_ON_GAIN',
            handler: (state, player) => {
                if (state.players[state.currentPlayerIndex]?.id !== player.id) return done(state);
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'gold' });
                for (const p of others(state, player).reverse()) {
                    if (p.hand.length >= 5) push(state, p.id, { type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', min: 2, max: 2, destination: 'deck', message: 'Château hanté : placez 2 cartes de votre main sur votre pioche' });
                }
                return done(state);
            }
        },
        {
            // Opulent Castle: discard any number of Victory cards, revealed. +$2 per card discarded.
            type: 'OPULENT_CASTLE_PAY',
            handler: (state, player) => {
                player.coins += 2 * ((state as any).lastDiscardedCount || 0);
                return done(state);
            }
        },
        {
            // Grand Castle: when you gain this, reveal your hand. +1 VP per Victory card in your hand and/or in play.
            type: 'GRAND_CASTLE_ON_GAIN',
            handler: (state, player) => {
                if (player.hand.length) EffectUtils.revealCards(state, player.hand, 'ALL', `${player.name} dévoile sa main`);
                const n = [...player.hand, ...player.playArea].filter(c => isType(c.id, 'VICTORY')).length;
                addVP(state, player, n, 'Grand château');
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Landmark actions
        {
            type: 'MOUNTAIN_PASS_BID',
            handler: (state, bidder, effect: any) => {
                const { order, idx, high, highBy } = effect;
                const next = (h: number, by: string | null) => idx + 1 < order.length
                    ? [{ type: 'MOUNTAIN_PASS_FORWARD', order, idx: idx + 1, high: h, highBy: by }]
                    : [{ type: 'MOUNTAIN_PASS_END', high: h, highBy: by }];
                const opts: any[] = [{ label: 'Passer', effects: next(high, highBy) }];
                for (let d = high + 1; d <= 40; d++) opts.push({ label: `Enchérir ${d} Dette`, effects: next(d, bidder.id) });
                push(state, bidder.id, options(`Col de montagne : enchère actuelle ${high} Dette`, opts));
                return done(state);
            }
        },
        {
            type: 'MOUNTAIN_PASS_FORWARD',
            handler: (state, _p, effect: any) => {
                push(state, effect.order[effect.idx], { type: 'MOUNTAIN_PASS_BID', order: effect.order, idx: effect.idx, high: effect.high, highBy: effect.highBy });
                return done(state);
            }
        },
        {
            type: 'MOUNTAIN_PASS_END',
            handler: (state, _p, effect: any) => {
                const winner = state.players.find(p => p.id === effect.highBy);
                if (!winner) return done(state);
                winner.debt = (winner.debt || 0) + effect.high;
                addVP(state, winner, 8, 'Col de montagne');
                return done(state);
            }
        },
        {
            type: 'ARENA_DISCARD',
            handler: (state, player, effect: any) => {
                const idx = player.hand.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                discardCard(state, player, player.hand.splice(idx, 1)[0]);
                takeFromLandmark(state, player, 'arena', 2);
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Events
        {
            // Advance: you may trash an Action card from your hand. If you do, gain an Action card costing up to $6.
            type: 'ADVANCE',
            handler: (state, player) => {
                if (!player.hand.some(c => isType(c.id, 'ACTION'))) return done(state);
                push(state, player.id, { type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { cardTypes: ['ACTION'] }, message: 'Avancée : écartez une carte Action',
                    ifTrashed: { count: 1, effects: [{ type: 'GAIN_CARD', maxCost: 6, cardTypes: ['ACTION'], message: 'Avancée : recevez une Action coûtant jusqu\'à 6 💰' }] } });
                return done(state);
            }
        },
        {
            // Annex: look through your discard pile. Shuffle all but up to 5 cards from it into your deck. Gain a Duchy.
            type: 'ANNEX',
            handler: (state, player) => {
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'duchy' });
                if (player.discardPile.length <= 5 && player.discardPile.length === 0) return done(state);
                state.pendingDecision = {
                    id: `annex_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Annexion : choisissez jusqu\'à 5 cartes à GARDER dans votre défausse (les autres sont mélangées dans votre pioche)',
                    constraints: { min: 0, max: Math.min(5, player.discardPile.length), sourceZone: 'discardPile' },
                    context: { specialAction: 'ANNEX_KEEP' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Conquest: gain 2 Silvers. +1 VP per Silver you've gained this turn.
            type: 'CONQUEST',
            handler: (state, player) => {
                pushAll(state, player.id, [{ type: 'GAIN_CARD', cardId: 'silver' }, { type: 'GAIN_CARD', cardId: 'silver' }, { type: 'CONQUEST_VP' }]);
                return done(state);
            }
        },
        {
            type: 'CONQUEST_VP',
            handler: (state, player) => { addVP(state, player, (player.gainedThisTurn || []).filter(id => id === 'silver').length, 'Conquête'); return done(state); }
        },
        {
            // Dominate: gain a Province. If you do, +9 VP.
            type: 'DOMINATE',
            handler: (state, player) => {
                if (!(state.supply.province?.count > 0)) return done(state);
                push(state, player.id, { type: 'ADD_VICTORY_TOKENS', amount: 9 });
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'province' });
                return done(state);
            }
        },
        {
            // Donate: at the end of your turn, put your deck and discard pile into your hand, trash any number of cards
            // from it, then shuffle your hand into your deck and draw 5 cards
            type: 'DONATE',
            handler: (state, player) => {
                (state.discardFromPlayEffects = state.discardFromPlayEffects || [])
                    .push({ playerId: player.id, turn: state.turnNumber, effect: { type: 'DONATE_NOW' } });
                return done(state);
            }
        },
        {
            type: 'DONATE_NOW',
            handler: (state, player) => {
                // Runs before the new hand is drawn: everything goes into the "hand" for trashing
                player.hand.push(...player.deck.splice(0), ...player.discardPile.splice(0));
                push(state, player.id, { type: 'DONATE_SHUFFLE' });
                push(state, player.id, { type: 'TRASH', min: 0, max: 999, from: 'hand', message: 'Don : écartez autant de cartes que vous voulez' });
                return done(state);
            }
        },
        {
            type: 'DONATE_SHUFFLE',
            handler: (state, player) => {
                player.deck = EffectUtils.shuffle([...player.deck, ...player.hand.splice(0)], state);
                return done(state);
            }
        },
        {
            // Ritual: gain a Curse. If you do, trash a card from your hand. +1 VP per $1 it cost.
            type: 'RITUAL',
            handler: (state, player) => {
                if (!(state.supply.curse?.count > 0)) return done(state);
                pushAll(state, player.id, [
                    { type: 'GAIN_CARD', cardId: 'curse' },
                    { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Rituel : écartez une carte', onSuccess: [{ type: 'RITUAL_VP' }] }
                ]);
                return done(state);
            }
        },
        {
            type: 'RITUAL_VP',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (t) addVP(state, player, costOf(state, player, t.id), 'Rituel');
                return done(state);
            }
        },
        {
            // Salt the Earth: +1 VP. Trash a Victory card from the Supply.
            type: 'SALT_THE_EARTH',
            handler: (state, player) => {
                addVP(state, player, 1, 'Saler la terre');
                const piles = Object.keys(state.supply).filter(id => state.supply[id].count > 0 && isType(state.supply[id].cards?.length ? state.supply[id].cards![state.supply[id].cards!.length - 1].id : id, 'VICTORY'));
                if (!piles.length) return done(state);
                push(state, player.id, options('Saler la terre : écartez une carte Victoire de la réserve',
                    piles.map(id => ({ label: nameOf(id), effects: [{ type: 'TRASH_FROM_SUPPLY', cardId: id }] }))));
                return done(state);
            }
        },
        {
            // Tax: add 2 Debt to a Supply pile
            type: 'TAX',
            handler: (state, player) => {
                const piles = Object.keys(state.supply).filter(id => state.supply[id].count > 0);
                push(state, player.id, options('Taxe : ajoutez 2 Dette sur une pile de la réserve',
                    piles.map(id => ({ label: nameOf(id), effects: [{ type: 'ADD_PILE_DEBT', pileId: id, amount: 2 }] }))));
                return done(state);
            }
        },
        {
            type: 'ADD_PILE_DEBT',
            handler: (state, _p, effect: any) => {
                const p = state.supply[effect.pileId];
                if (p) { p.tokens = p.tokens || {}; p.tokens.debt = (p.tokens.debt || 0) + effect.amount; }
                return done(state);
            }
        },
        {
            // Triumph: gain an Estate. If you do, +1 VP per card you've gained this turn.
            type: 'TRIUMPH',
            handler: (state, player) => {
                if (!(state.supply.estate?.count > 0)) return done(state);
                pushAll(state, player.id, [{ type: 'GAIN_CARD', cardId: 'estate' }, { type: 'TRIUMPH_VP' }]);
                return done(state);
            }
        },
        {
            type: 'TRIUMPH_VP',
            handler: (state, player) => { addVP(state, player, (player.gainedThisTurn || []).length, 'Triomphe'); return done(state); }
        },
        {
            // Windfall: if your deck and discard pile are empty, gain 3 Golds
            type: 'WINDFALL',
            handler: (state, player) => {
                if (player.deck.length || player.discardPile.length) return done(state);
                pushAll(state, player.id, [0, 1, 2].map(() => ({ type: 'GAIN_CARD', cardId: 'gold' })));
                return done(state);
            }
        }
    ],

    onLoad: () => {
        if (!setupHooks.includes(setupEmpires)) setupHooks.push(setupEmpires);
        if (!VictoryChecker.landmarkScorers.includes(scoreLandmark)) VictoryChecker.landmarkScorers.push(scoreLandmark);
        EffectEngine.registerDecisionHandler('TEMPLE_TRASH', (state, playerId, payload) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const seen = new Set<string>();
            for (const id of chosenInstanceIds(payload)) {
                const idx = player.hand.findIndex(c => c.instanceId === id);
                if (idx === -1 || seen.has(player.hand[idx].id) || seen.size >= 3) continue;
                seen.add(player.hand[idx].id);
                TrashEffectHandler.trashCard(state, player, player.hand.splice(idx, 1)[0]);
            }
        });
        EffectEngine.registerDecisionHandler('ANNEX_KEEP', (state, playerId, payload) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const keep = new Set(chosenInstanceIds(payload).slice(0, 5));
            const moving = player.discardPile.filter(c => !keep.has(c.instanceId));
            player.discardPile = player.discardPile.filter(c => keep.has(c.instanceId));
            player.deck = EffectUtils.shuffle([...player.deck, ...moving], state);
        });
    }
};

