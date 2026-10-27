/**
 * Plunder — rules: Loot, the Kingdom cards, the Events and the Traits.
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EffectEngine } from '../EffectEngine.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { TriggerEffectHandler } from '../effects/TriggerEffectHandler.js';
import { CleanupEffectHandler } from '../effects/CleanupEffectHandler.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { createCardInstance } from '../CardInstance.js';
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow, playOverrides } from '../Play.js';
import { getMat, peekMat } from '../Mats.js';
import { setupHooks } from '../KingdomRules.js';
import { DurationManager } from '../DurationManager.js';
import { LOOT_IDS } from '../../cards/plunder/loot.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const def = (id: string) => CardRegistry.get(id);
const isType = (id: string, t: string) => !!def(id)?.types.includes(t as any);
const nameOf = (id: string) => def(id)?.name || id;
const costOf = (state: GameState, player: PlayerState, id: string) => EconomyEngine.getCardCost(state, player.id, id);
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
function uniqueByName(cards: CardInstance[]): CardInstance[] {
    const seen = new Set<string>();
    return cards.filter(c => !seen.has(c.id) && !!seen.add(c.id));
}
function askCards(state: GameState, player: PlayerState, specialAction: string, message: string, pool: CardInstance[], zone: string, min: number, max: number, extra: any = {}) {
    if (!pool.length) return done(state);
    state.pendingDecision = {
        id: `${specialAction.toLowerCase()}_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any, message,
        constraints: { min: Math.min(min, pool.length), max: Math.min(max, pool.length), sourceZone: zone },
        context: { specialAction, candidates: pool.map(c => c.instanceId), cards: pool.map(c => ({ id: c.id, instanceId: c.instanceId })), ...extra }
    } as any;
    return { state, needsChoice: true };
}
function addOnce<T extends (...a: any[]) => any>(list: T[], key: string, fn: T) {
    if (list.some(f => (f as any).hookKey === key)) return;
    (fn as any).hookKey = key;
    list.push(fn);
}
/** The Trait on this card's pile, if any ("Reckless cards"…). */
function traitOf(state: GameState, cardId: string, trait: string): boolean {
    return !!state.supply[cardId]?.traits?.includes(trait);
}
function traitPile(state: GameState, trait: string): string | undefined {
    return Object.keys(state.supply).find(k => state.supply[k].traits?.includes(trait));
}

/** "The next time …" abilities waiting on a Duration card that stays in play until then. */
interface Pending { kind: string; playerId: string; instanceId: string; data?: any }
const pendings = (state: GameState): Pending[] => ((state as any).plunderPending = (state as any).plunderPending || []);
function addPending(state: GameState, player: PlayerState, kind: string, instanceId: string | undefined, data?: any) {
    if (!instanceId) return;
    pendings(state).push({ kind, playerId: player.id, instanceId, data });
    // The card stays in play until the ability happens
    const d = state.durations?.find(x => x.cardInstanceId === instanceId);
    if (d) d.turnsRemaining = 'PERMANENT' as any;
}
function resolvePending(state: GameState, p: Pending) {
    (state as any).plunderPending = pendings(state).filter(x => x !== p);
    if (state.durations) state.durations = state.durations.filter(d => d.cardInstanceId !== p.instanceId);
}
function trashFromPlay(state: GameState, player: PlayerState, instanceId: string) {
    const idx = player.playArea.findIndex(c => c.instanceId === instanceId);
    if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
}

const LOOT_USERS = ['jewelled_egg', 'search', 'cutthroat', 'pickaxe', 'wealthy_village', 'sack_of_loot',
    'peril', 'foray', 'looting', 'invasion', 'prosper', 'cursed'];

/** Setup: the Loot pile (30 shuffled Loots) when anything gains Loot. */
export function setupPlunder(state: GameState): void {
    const all = [...(state.kingdomCards || []), ...(state.landscapes || [])];
    state.nonSupply = state.nonSupply || {};
    if (all.some(id => LOOT_USERS.includes(id)) && !state.nonSupply.loot_pile?.cards?.length) {
        const cards = EffectUtils.shuffle(LOOT_IDS.flatMap(id => [createCardInstance(id), createCardInstance(id)]), state);
        state.nonSupply.loot_pile = { cardId: 'loot_pile', count: cards.length, cards } as any;
    }
}

/** Gain a Loot (the top of the Loot pile). Returns the card, if any. */
function gainLoot(state: GameState, player: PlayerState, destination: 'discardPile' | 'hand' = 'discardPile'): CardInstance | undefined {
    const pile = state.nonSupply?.loot_pile;
    if (!pile?.cards?.length) { EffectUtils.log(state, 'Il ne reste plus de Butin.', player.id); return undefined; }
    const card = pile.cards.pop()!;
    pile.count = pile.cards.length;
    (destination === 'hand' ? player.hand : player.discardPile).push(card);
    state.lastGainedCard = card;
    EffectUtils.log(state, `${player.name} reçoit un Butin : ${nameOf(card.id)}.`, player.id);
    TriggerEffectHandler.triggerOnGainEffects(state, player, card);
    return card;
}

export const PlunderModule: ExpansionModule = {
    id: 'plunder',
    name: 'Pillage',

    costModifiers: [
        {
            id: 'plunder:trait_cheap',
            priority: 200,
            modifier: (state, _playerId, cardId, cost) => traitOf(state, cardId, 'cheap') ? cost - 1 : cost
        }
    ],

    eventHooks: [
        {
            id: 'plunder:turn_start',
            event: 'TURN_START',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                if (!p) return;
                // Shaman: gain a card from the trash costing up to $6
                if ((state.kingdomCards || []).includes('shaman')) push(state, p.id, { type: 'SHAMAN_GAIN' });
                // Shy: you may discard one Shy card for +2 Cards
                const shy = traitPile(state, 'shy');
                if (shy && p.hand.some(c => c.id === shy)) push(state, p.id, options(`Timide : défausser ${nameOf(shy)} pour +2 Cartes ?`, [
                    { label: 'Oui', effects: [{ type: 'DISCARD_ONE_OF', cardId: shy }, { type: 'DRAW', amount: 2 }] }, { label: 'Non', effects: [] }
                ]));
            }
        },
        {
            id: 'plunder:turn_end',
            event: 'TURN_END',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                // Tireless: set aside when discarded from play, onto your deck at end of turn
                const p = state.players.find(x => x.id === event.playerId);
                if (p && peekMat(p, 'tireless').length) p.deck.unshift(...getMat(p, 'tireless').splice(0));
            }
        },
        {
            id: 'plunder:gain',
            event: 'CARD_GAINED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                const cid: string = event.context?.gainedCardId;
                const iid: string = event.context?.gainedInstanceId;
                if (!p || !cid) return;

                // Traits of the gained card's pile
                if (traitOf(state, cid, 'cursed')) { push(state, p.id, { type: 'GAIN_CARD', cardId: 'curse' }); push(state, p.id, { type: 'GAIN_LOOT' }); }
                if (traitOf(state, cid, 'nearby')) p.buys += 1;
                if (traitOf(state, cid, 'rich')) push(state, p.id, { type: 'GAIN_CARD', cardId: 'silver' });
                if (traitOf(state, cid, 'pious') && p.hand.length) push(state, p.id, { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Pieux : vous pouvez écarter une carte de votre main' });
                if (traitOf(state, cid, 'hasty') && iid) push(state, p.id, { type: 'HASTY', instanceId: iid });
                const fawning = traitPile(state, 'fawning');
                if (cid === 'province' && fawning) push(state, p.id, { type: 'GAIN_CARD', cardId: fawning });

                // "This turn" gain effects
                if ((p as any).deliverTurn === state.turnNumber && isCurrent(state, p) && iid) push(state, p.id, { type: 'DELIVER_ASIDE', instanceId: iid });
                if (isType(cid, 'ACTION') && isCurrent(state, p)) {
                    if ((p as any).rushTurn === state.turnNumber && iid) { (p as any).rushTurn = undefined; push(state, p.id, { type: 'PLAY_INSTANCE_IF_OWNED', instanceId: iid }); }
                    if ((p as any).mirrorTurn === state.turnNumber) { (p as any).mirrorTurn = undefined; push(state, p.id, { type: 'GAIN_CARD', cardId: cid }); }
                }
                if (isType(cid, 'TREASURE') && (p as any).miningRoadTurn === state.turnNumber && isCurrent(state, p) && iid) {
                    (p as any).miningRoadTurn = undefined;
                    push(state, p.id, options(`Route minière : jouer ${nameOf(cid)} ?`, [
                        { label: 'Oui', effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: iid }] }, { label: 'Non', effects: [] }
                    ]));
                }

                // "The next time you gain …" Durations
                for (const pend of [...pendings(state)]) {
                    const owner = state.players.find(x => x.id === pend.playerId);
                    if (!owner) continue;
                    const mine = owner.id === p.id;
                    if (pend.kind === 'cage' && mine && isType(cid, 'VICTORY')) {
                        resolvePending(state, pend);
                        trashFromPlay(state, owner, pend.instanceId);
                        getMat(owner, 'save').push(...getMat(owner, `cage_${pend.instanceId}`).splice(0));
                    } else if (pend.kind === 'shrine' && mine && isType(cid, 'TREASURE')) {
                        resolvePending(state, pend);
                        push(state, owner.id, { type: 'TRASH', min: 0, max: 2, from: 'hand', message: 'Sanctuaire isolé : écartez jusqu\'à 2 cartes' });
                    } else if (pend.kind === 'abundance' && mine && isType(cid, 'ACTION')) {
                        resolvePending(state, pend);
                        owner.buys += 1; owner.coins += 3;
                    } else if (pend.kind === 'cutthroat' && isType(cid, 'TREASURE') && costOf(state, p, cid) >= 5) {
                        resolvePending(state, pend);
                        push(state, owner.id, { type: 'GAIN_LOOT' });
                    }
                }
                // Search: the next time a Supply pile empties
                const empty = Object.values(state.supply).filter(x => x.count === 0).length;
                for (const pend of [...pendings(state)]) {
                    if (pend.kind !== 'search' || empty <= (pend.data?.empty ?? 0)) continue;
                    const owner = state.players.find(x => x.id === pend.playerId);
                    if (!owner) continue;
                    resolvePending(state, pend);
                    trashFromPlay(state, owner, pend.instanceId);
                    push(state, owner.id, { type: 'GAIN_LOOT' });
                }
            }
        },
        {
            // Card played: Landing Party (first card of a turn is a Treasure), Harbor Village (snapshot $)
            id: 'plunder:played',
            event: 'CARD_PLAYED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                const cid: string = event.context?.cardId;
                if (!p || !cid) return;
                const played = Object.values(p.playedThisTurn || {}).reduce((a: number, b: any) => a + b, 0);
                if (played === 1 && isType(cid, 'TREASURE')) {
                    for (const pend of [...pendings(state)]) {
                        if (pend.kind !== 'landing_party' || pend.playerId !== p.id || pend.data?.turn === state.turnNumber) continue;
                        resolvePending(state, pend);
                        push(state, p.id, { type: 'TOPDECK_INSTANCE_FROM_PLAY', instanceId: pend.instanceId });
                    }
                }
                const hv = (p as any).harbor;
                if (hv && hv.turn === state.turnNumber && !hv.target && isType(cid, 'ACTION') && event.context.cardInstanceId !== hv.source) {
                    hv.target = event.context.cardInstanceId;
                    hv.coins = p.coins;
                }
            }
        },
        {
            id: 'plunder:after_action',
            event: 'AFTER_ACTION',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                const iid: string = event.context?.cardInstanceId;
                const cid: string = event.context?.cardId;
                if (!p) return;
                // Harbor Village: if the next Action gave you +$, +$1
                const hv = (p as any).harbor;
                if (hv && hv.target === iid) {
                    (p as any).harbor = undefined;
                    if (p.coins > hv.coins) p.coins += 1;
                }
                // Flagship: replay the next non-Command Action
                if (cid && !isType(cid, 'COMMAND')) {
                    const pend = pendings(state).find(x => x.kind === 'flagship' && x.playerId === p.id);
                    if (pend && p.playArea.some(c => c.instanceId === iid)) {
                        resolvePending(state, pend);
                        push(state, p.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: iid });
                    }
                }
                // Frigate: after another player plays an Action, they discard down to 4
                if (((state as any).frigates || []).some((f: any) => f.victimId === p.id && f.attackerId !== p.id) && p.hand.length > 4) {
                    push(state, p.id, { type: 'DISCARD', targetSize: 4, message: 'Frégate : défaussez jusqu\'à avoir 4 cartes en main' });
                }
            }
        },
        {
            id: 'plunder:play_discarded',
            event: 'PLAY_DISCARDED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                if (!p) return;
                const cards = event.context.cards as CardInstance[];
                // Tireless: set aside, onto your deck at end of turn
                for (const c of cards) if (traitOf(state, c.id, 'tireless')) push(state, p.id, { type: 'TIRELESS_ASIDE', instanceId: c.instanceId });
                // Trickster: once this turn, set aside a Treasure discarded from play; into your hand at end of turn
                if ((p as any).tricksterTurn === state.turnNumber) {
                    const treasures = uniqueByName(cards.filter(c => isType(c.id, 'TREASURE')));
                    if (treasures.length) push(state, p.id, options('Filou : mettre de côté un Trésor (pris en main à la fin du tour) ?', [
                        ...treasures.map(c => ({ label: nameOf(c.id), effects: [{ type: 'DELIVER_ASIDE', instanceId: c.instanceId }] })),
                        { label: 'Non', effects: [] }
                    ]));
                }
            }
        }
    ],

    effectHandlers: [
        {
            type: 'GAIN_LOOT',
            handler: (state, player, effect: any) => { gainLoot(state, player, effect.destination === 'hand' ? 'hand' : 'discardPile'); return done(state); }
        },
        {
            type: 'DISCARD_ONE_OF',
            handler: (state, player, effect: any) => {
                const idx = player.hand.findIndex(c => c.id === effect.cardId);
                if (idx !== -1) discardCard(state, player, player.hand.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Deliver / Trickster / Puzzle Box: set aside, into your hand at end of turn
            type: 'DELIVER_ASIDE',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (card) getMat(player, 'save').push(card);
                return done(state);
            }
        },
        {
            type: 'TIRELESS_ASIDE',
            handler: (state, player, effect: any) => {
                const idx = player.discardPile.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) getMat(player, 'tireless').push(player.discardPile.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            type: 'HASTY',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (!card) return done(state);
                player.aside.push(card);
                (state.triggers = state.triggers || []).push({
                    type: 'START_TURN', playerId: player.id, once: true, description: `Pressé : ${nameOf(card.id)}`,
                    effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: card.instanceId } as any]
                } as any);
                return done(state);
            }
        },
        {
            // Inspiring: you may play an Action from your hand you don't have a copy of in play
            type: 'INSPIRING',
            handler: (state, player) => {
                const inPlay = new Set(player.playArea.map(c => c.id));
                const pool = player.hand.filter(c => isType(c.id, 'ACTION') && !inPlay.has(c.id));
                return askCards(state, player, 'PLAY_FREE_PICK', 'Inspirant : jouer une Action de votre main que vous n\'avez pas en jeu ?', pool, 'hand', 0, 1);
            }
        },
        {
            // Shaman: at the start of your turn, gain a card from the trash costing up to $6
            type: 'SHAMAN_GAIN',
            handler: (state, player) => {
                const pool = uniqueByName(state.trash.filter(c => costOf(state, player, c.id) <= 6 && !def(c.id)?.debtCost && !def(c.id)?.potionCost));
                if (!pool.length) return done(state);
                push(state, player.id, options('Chamane : recevez une carte du rebut coûtant jusqu\'à 6 💰', pool.map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'GAIN_FROM_TRASH_INSTANCE', instanceId: c.instanceId }]
                }))));
                return done(state);
            }
        },

        // ------------------------------------------------------------ Kingdom cards
        {
            // Cage: set aside up to 4 cards face down; next Victory gained → trash this, those cards to hand at end of turn
            type: 'CAGE',
            handler: (state, player, _e, ctx: any) => {
                addPending(state, player, 'cage', ctx?.sourceCardInstanceId);
                return askCards(state, player, 'MAT_ASIDE', 'Cage : mettez de côté jusqu\'à 4 cartes de votre main', player.hand, 'hand', 0, 4, { mat: `cage_${ctx?.sourceCardInstanceId}` });
            }
        },
        {
            // Grotto: set aside up to 4 cards face down; next turn discard them, then draw as many
            type: 'GROTTO',
            handler: (state, player, _e, ctx: any) =>
                askCards(state, player, 'MAT_ASIDE', 'Grotte : mettez de côté jusqu\'à 4 cartes de votre main', player.hand, 'hand', 0, 4, { mat: `grotto_${ctx?.sourceCardInstanceId}` })
        },
        {
            type: 'GROTTO_RETURN',
            handler: (state, player, _e, ctx: any) => {
                const cards = getMat(player, `grotto_${ctx?.sourceCardInstanceId}`).splice(0);
                if (!cards.length) return done(state);
                discardCards(state, player, cards);
                push(state, player.id, { type: 'DRAW', amount: cards.length });
                return done(state);
            }
        },
        {
            type: 'SEARCH',
            handler: (state, player, _e, ctx: any) => {
                addPending(state, player, 'search', ctx?.sourceCardInstanceId, { empty: Object.values(state.supply).filter(x => x.count === 0).length });
                return done(state);
            }
        },
        { type: 'SECLUDED_SHRINE', handler: (state, player, _e, ctx: any) => { addPending(state, player, 'shrine', ctx?.sourceCardInstanceId); return done(state); } },
        { type: 'ABUNDANCE', handler: (state, player, _e, ctx: any) => { addPending(state, player, 'abundance', ctx?.sourceCardInstanceId); return done(state); } },
        { type: 'CUTTHROAT', handler: (state, player, _e, ctx: any) => { addPending(state, player, 'cutthroat', ctx?.sourceCardInstanceId); return done(state); } },
        { type: 'FLAGSHIP', handler: (state, player, _e, ctx: any) => { addPending(state, player, 'flagship', ctx?.sourceCardInstanceId); return done(state); } },
        {
            type: 'LANDING_PARTY',
            handler: (state, player, _e, ctx: any) => { addPending(state, player, 'landing_party', ctx?.sourceCardInstanceId, { turn: state.turnNumber }); return done(state); }
        },
        {
            type: 'TOPDECK_INSTANCE_FROM_PLAY',
            handler: (state, player, effect: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) player.deck.unshift(player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Siren: when you gain this, trash it unless you trash an Action from your hand
            type: 'SIREN_GAINED',
            handler: (state, player) => {
                const siren = state.lastGainedCard;
                if (!siren) return done(state);
                const trashSiren = { type: 'TRASH_INSTANCE_OF', instanceId: siren.instanceId };
                if (!player.hand.some(c => isType(c.id, 'ACTION'))) { push(state, player.id, trashSiren); return done(state); }
                push(state, player.id, options('Sirène : écarter une Action de votre main pour la garder ?', [
                    { label: 'Écarter une Action', effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', filter: { cardTypes: ['ACTION'] }, message: 'Écartez une carte Action' }] },
                    { label: 'Écarter la Sirène', effects: [trashSiren] }
                ]));
                return done(state);
            }
        },
        {
            type: 'TRASH_INSTANCE_OF',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (card) TrashEffectHandler.trashCard(state, player, card);
                return done(state);
            }
        },
        {
            // Taskmaster: if you gain a card costing exactly $5 this turn, repeat this ability next turn
            type: 'TASKMASTER',
            handler: (state, player, _e, ctx: any) => {
                ((state as any).taskmasters = (state as any).taskmasters || []).push({ playerId: player.id, instanceId: ctx?.sourceCardInstanceId, turn: state.turnNumber });
                return done(state);
            }
        },
        {
            type: 'TASKMASTER_REPEAT',
            handler: (state, player, _e, ctx: any) => {
                player.actions += 1; player.coins += 1;
                const id = ctx?.sourceCardInstanceId;
                if (id && !state.durations?.some(d => d.cardInstanceId === id)) {
                    DurationManager.register(state, { cardInstanceId: id, cardId: 'taskmaster', playerId: player.id, turnsRemaining: 1, effects: def('taskmaster')?.durationEffects || [] } as any);
                }
                ((state as any).taskmasters = (state as any).taskmasters || []).push({ playerId: player.id, instanceId: id, turn: state.turnNumber });
                return done(state);
            }
        },
        {
            // Cabin Boy: +$2, or trash this to gain a Duration card
            type: 'CABIN_BOY',
            handler: (state, player, _e, ctx: any) => {
                push(state, player.id, options('Mousse : choisissez', [
                    { label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                    { label: 'L\'écarter pour recevoir une carte Durée', effects: [{ type: 'TRASH_INSTANCE_OF', instanceId: ctx?.sourceCardInstanceId },
                        { type: 'GAIN_CARD', maxCost: 99, cardTypes: ['DURATION'], message: 'Mousse : recevez une carte Durée' }] }
                ]), ctx);
                return done(state);
            }
        },
        {
            type: 'MONEY_PER_TRASHED_COST',
            handler: (state, player) => { const t = state.lastTrashedCard; if (t) player.coins += Math.max(0, costOf(state, player, t.id)); return done(state); }
        },
        {
            // Fortune Hunter: look at the top 3; you may play a Treasure from them; the rest back in any order
            type: 'FORTUNE_HUNTER',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 3; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                const reorder = { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Chasseur de fortune : remettez les cartes dans l\'ordre de votre choix' };
                const treasures = uniqueByName(seen.filter(c => isType(c.id, 'TREASURE')));
                push(state, player.id, reorder);
                if (treasures.length) push(state, player.id, options('Chasseur de fortune : jouer un Trésor ?', [
                    ...treasures.map(c => ({ label: nameOf(c.id), effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId }] })),
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'HARBOR_VILLAGE',
            handler: (state, player, _e, ctx: any) => { (player as any).harbor = { turn: state.turnNumber, source: ctx?.sourceCardInstanceId }; return done(state); }
        },
        {
            // Mapmaker: look at the top 4; 2 into your hand, discard the rest
            type: 'MAPMAKER',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 4; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                return askCards(state, player, 'MAPMAKER_PICK', 'Cartographe : prenez 2 cartes en main (les autres sont défaussées)', seen, 'limbo', 2, 2, { all: seen.map(c => c.instanceId) });
            }
        },
        {
            // Maroon: +2 Cards per type the trashed card has
            type: 'MAROON',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                const n = t ? (def(t.id)?.types || []).length : 0;
                if (n) push(state, player.id, { type: 'DRAW', amount: 2 * n });
                return done(state);
            }
        },
        {
            type: 'SWAMP_SHACKS',
            handler: (state, player) => { const n = Math.floor(player.playArea.length / 3); if (n) push(state, player.id, { type: 'DRAW', amount: n }); return done(state); }
        },
        {
            // Tools: gain a copy of a card anyone has in play
            type: 'TOOLS',
            handler: (state, player) => {
                const ids = [...new Set(state.players.flatMap(p => p.playArea.map(c => c.id)))].filter(id => (state.supply[id]?.count || 0) > 0);
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids, maxCost: 99 }, {}, 'Outils : recevez un exemplaire d\'une carte en jeu');
            }
        },
        {
            // Buried Treasure: when you gain this, play it
            type: 'PLAY_GAINED_THIS',
            handler: (state, player) => {
                const g = state.lastGainedCard;
                if (g) push(state, player.id, { type: 'PLAY_INSTANCE_IF_OWNED', instanceId: g.instanceId });
                return done(state);
            }
        },
        {
            // Crew: at the start of your next turn, put this onto your deck
            type: 'TOPDECK_SELF',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) player.deck.unshift(player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Jewels: at the start of your next turn, put this on the bottom of your deck
            type: 'BOTTOMDECK_SELF',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) player.deck.push(player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // First Mate: play any number of Actions with the same name from your hand, then draw until 6
            type: 'FIRST_MATE',
            handler: (state, player) => {
                push(state, player.id, { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 });
                const names = uniqueByName(player.hand.filter(c => isType(c.id, 'ACTION')));
                if (!names.length) return done(state);
                push(state, player.id, options('Second : quelles Actions jouer ?', [
                    ...names.map(c => ({ label: nameOf(c.id), effects: [{ type: 'FIRST_MATE_PLAY', cardId: c.id }] })),
                    { label: 'Aucune', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'FIRST_MATE_PLAY',
            handler: (state, player, effect: any) => {
                const copies = player.hand.filter(c => c.id === effect.cardId);
                if (!copies.length) return done(state);
                if (copies.length > 1) push(state, player.id, options(`Second : jouer encore ${nameOf(effect.cardId)} ?`, [
                    { label: 'Oui', effects: [{ type: 'FIRST_MATE_PLAY', cardId: effect.cardId }] }, { label: 'Non', effects: [] }
                ]));
                playCardNow(state, player, copies[0].instanceId);
                return done(state);
            }
        },
        {
            type: 'FRIGATE_HIT',
            handler: (state, victim, _e, ctx: any) => {
                ((state as any).frigates = (state as any).frigates || []).push({ attackerId: ctx?.attackerId, victimId: victim.id });
                return done(state);
            }
        },
        {
            type: 'FRIGATE_END',
            handler: (state, player) => { (state as any).frigates = ((state as any).frigates || []).filter((f: any) => f.attackerId !== player.id); return done(state); }
        },
        { type: 'MINING_ROAD', handler: (state, player) => { (player as any).miningRoadTurn = state.turnNumber; return done(state); } },
        {
            type: 'PENDANT',
            handler: (state, player) => { player.coins += new Set(player.playArea.filter(c => isType(c.id, 'TREASURE')).map(c => c.id)).size; return done(state); }
        },
        {
            // Pickaxe: if the trashed card costs $3 or more, gain a Loot to your hand
            type: 'PICKAXE',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (t && costOf(state, player, t.id) >= 3) gainLoot(state, player, 'hand');
                return done(state);
            }
        },
        {
            type: 'PILGRIM_TOPDECK',
            handler: (state, player) => askCards(state, player, 'TOPDECK_PICK', 'Placez une carte de votre main sur votre pioche', player.hand, 'hand', 1, 1)
        },
        {
            // Quartermaster: each turn, gain a card up to $4 set aside on it, or take one of those into your hand
            type: 'QUARTERMASTER',
            handler: (state, player, _e, ctx: any) => {
                const mat = `quartermaster_${ctx?.sourceCardInstanceId}`;
                const stored = uniqueByName(peekMat(player, mat));
                push(state, player.id, options('Intendant : choisissez', [
                    { label: 'Recevoir une carte coûtant jusqu\'à 4 💰 (mise de côté ici)', effects: [{ type: 'GAIN_CARD', maxCost: 4, message: 'Intendant : recevez une carte coûtant jusqu\'à 4 💰', next: [{ type: 'GAINED_TO_MAT', mat }] }] },
                    ...stored.map(c => ({ label: `Prendre ${nameOf(c.id)} en main`, effects: [{ type: 'MAT_TO_HAND', mat, instanceId: c.instanceId }] }))
                ]), ctx);
                return done(state);
            }
        },
        {
            type: 'GAINED_TO_MAT',
            handler: (state, player, effect: any) => {
                const g = state.lastGainedCard;
                const card = g ? EffectUtils.removeCardFromPlayer(state, player, g.instanceId) : undefined;
                if (card) getMat(player, effect.mat).push(card);
                return done(state);
            }
        },
        { type: 'TRICKSTER', handler: (state, player) => { (player as any).tricksterTurn = state.turnNumber; return done(state); } },
        {
            // Wealthy Village: when you gain this, with 3+ differently named Treasures in play, gain a Loot
            type: 'WEALTHY_VILLAGE',
            handler: (state, player) => {
                if (new Set(player.playArea.filter(c => isType(c.id, 'TREASURE')).map(c => c.id)).size >= 3) gainLoot(state, player);
                return done(state);
            }
        },
        {
            // King's Cache: you may play a Treasure from your hand three times
            type: 'KINGS_CACHE',
            handler: (state, player) => askCards(state, player, 'KINGS_CACHE_PICK', 'Trésor du roi : jouer un Trésor trois fois ?',
                player.hand.filter(c => isType(c.id, 'TREASURE')), 'hand', 0, 1)
        },

        // ------------------------------------------------------------ Loot
        {
            // Orb: play an Action or Treasure from your discard pile; or +1 Buy and +$3
            type: 'ORB',
            handler: (state, player) => {
                const pool = uniqueByName(player.discardPile.filter(c => isType(c.id, 'ACTION') || isType(c.id, 'TREASURE')));
                push(state, player.id, options('Orbe : choisissez', [
                    ...pool.map(c => ({ label: `Jouer ${nameOf(c.id)} (défausse)`, effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId }] })),
                    { label: '+1 Achat et +3 💰', effects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 3 }] }
                ]));
                return done(state);
            }
        },
        {
            type: 'SET_ASIDE_UNTIL_END',
            handler: (state, player, effect: any) => askCards(state, player, 'UNTIL_END_PICK', effect.message || 'Mettre de côté une carte jusqu\'à la fin du tour ?', player.hand, 'hand', 0, 1)
        },
        {
            // Sextant: look at the top N, discard any number, put the rest back in any order
            type: 'LOOK_DISCARD_REORDER',
            handler: (state, player, effect: any) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < (effect.amount || 5); i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                pushAll(state, player.id, [
                    { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 0, max: seen.length, action: 'DISCARD', message: `${effect.label} : défaussez autant de cartes que vous voulez` },
                    { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: `${effect.label} : remettez les autres dans l'ordre de votre choix` }
                ]);
                return done(state);
            }
        },
        {
            // Spell Scroll: trash this to gain a cheaper card; if it's an Action or Treasure, you may play it
            type: 'SPELL_SCROLL',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx === -1) return done(state);
                TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                push(state, player.id, { type: 'GAIN_CARD', maxCost: 6, message: 'Parchemin de sort : recevez une carte coûtant moins de 7 💰', next: [{ type: 'MAY_PLAY_GAINED' }] });
                return done(state);
            }
        },
        {
            type: 'MAY_PLAY_GAINED',
            handler: (state, player) => {
                const g = state.lastGainedCard;
                if (!g || !(isType(g.id, 'ACTION') || isType(g.id, 'TREASURE'))) return done(state);
                push(state, player.id, options(`Jouer ${nameOf(g.id)} ?`, [
                    { label: 'Oui', effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: g.instanceId }] }, { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },

        // ------------------------------------------------------------ Events
        {
            // Bury: put a card from your discard pile on the bottom of your deck
            type: 'BURY',
            handler: (state, player) => {
                const pool = uniqueByName(player.discardPile);
                if (!pool.length) return done(state);
                push(state, player.id, options('Enterrement : quelle carte placer sous votre pioche ?', pool.map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'DISCARD_TO_BOTTOM', instanceId: c.instanceId }]
                }))));
                return done(state);
            }
        },
        {
            type: 'DISCARD_TO_BOTTOM',
            handler: (state, player, effect: any) => {
                const idx = player.discardPile.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) player.deck.push(player.discardPile.splice(idx, 1)[0]);
                return done(state);
            }
        },
        { type: 'SHUFFLE_RULE', handler: (state, player, effect: any) => { if (effect.rule === 'avoid') (player as any).avoidTurn = state.turnNumber; return done(state); } },
        { type: 'DELIVER', handler: (state, player) => { (player as any).deliverTurn = state.turnNumber; return done(state); } },
        { type: 'RUSH', handler: (state, player) => { (player as any).rushTurn = state.turnNumber; return done(state); } },
        { type: 'MIRROR', handler: (state, player) => { (player as any).mirrorTurn = state.turnNumber; return done(state); } },
        {
            // Foray: discard 3 cards, revealing them; 3 different names → a Loot
            type: 'FORAY',
            handler: (state, player) => askCards(state, player, 'FORAY_PICK', 'Raid : défaussez 3 cartes', player.hand, 'hand', 3, 3)
        },
        {
            // Prepare: set aside your hand face up; next turn play its Actions and Treasures in any order, discard the rest
            type: 'PREPARE',
            handler: (state, player) => {
                if (!player.hand.length) return done(state);
                getMat(player, 'prepare').push(...player.hand.splice(0));
                (state.triggers = state.triggers || []).push({
                    type: 'START_TURN', playerId: player.id, once: true, description: 'Préparatifs', effects: [{ type: 'PREPARE_PLAY' } as any]
                } as any);
                return done(state);
            }
        },
        {
            type: 'PREPARE_PLAY',
            handler: (state, player) => {
                const mat = getMat(player, 'prepare');
                const playable = uniqueByName(mat.filter(c => isType(c.id, 'ACTION') || isType(c.id, 'TREASURE')));
                if (!playable.length) { discardCards(state, player, mat.splice(0)); return done(state); }
                push(state, player.id, { type: 'PREPARE_PLAY' });
                if (playable.length === 1) { push(state, player.id, { type: 'PLAY_INSTANCE_IF_OWNED', instanceId: playable[0].instanceId }); return done(state); }
                push(state, player.id, options('Préparatifs : quelle carte jouer maintenant ?', playable.map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId }]
                }))));
                return done(state);
            }
        },
        {
            // Scrounge: trash a card from your hand; or gain an Estate from the trash, and if you did, a card up to $5
            type: 'SCROUNGE',
            handler: (state, player) => {
                const estate = state.trash.find(c => c.id === 'estate');
                push(state, player.id, options('Récupération : choisissez', [
                    { label: 'Écarter une carte de votre main', effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Récupération : écartez une carte' }] },
                    { label: 'Recevoir un Domaine du rebut', effects: estate ? [{ type: 'GAIN_FROM_TRASH_INSTANCE', instanceId: estate.instanceId },
                        { type: 'GAIN_CARD', maxCost: 5, message: 'Récupération : recevez une carte coûtant jusqu\'à 5 💰' }] : [] }
                ]));
                return done(state);
            }
        },
        {
            // Journey: no discarding from play this Clean-up; an extra turn after this one
            type: 'JOURNEY',
            handler: (state, player) => {
                (player as any).journeyTurn = state.turnNumber;
                push(state, player.id, { type: 'SCHEDULE_EXTRA_TURN', turnType: 'EXTRA' });
                return done(state);
            }
        },
        {
            // Maelstrom: each other player with 5 or more cards in hand trashes one
            type: 'MAELSTROM',
            handler: (state, player) => {
                for (const p of state.players) {
                    if (p.id !== player.id && p.hand.length >= 5) push(state, p.id, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Maelström : écartez une carte de votre main' });
                }
                return done(state);
            }
        },
        {
            // Invasion: gain a Duchy, an Action onto your deck, a Loot (played)
            type: 'INVASION',
            handler: (state, player) => {
                pushAll(state, player.id, [
                    { type: 'GAIN_CARD', cardId: 'duchy' },
                    { type: 'GAIN_CARD', maxCost: 99, cardTypes: ['ACTION'], destination: 'deck', message: 'Invasion : recevez une carte Action sur votre pioche' },
                    { type: 'INVASION_LOOT' }
                ]);
                return done(state);
            }
        },
        {
            type: 'INVASION_LOOT',
            handler: (state, player) => {
                const loot = gainLoot(state, player);
                if (loot) push(state, player.id, { type: 'PLAY_INSTANCE_IF_OWNED', instanceId: loot.instanceId });
                return done(state);
            }
        },
        {
            // Prosper: any number of differently named Treasures
            type: 'PROSPER',
            handler: (state, player, effect: any) => {
                const taken: string[] = effect.taken || [];
                const piles = Object.keys(state.supply).filter(id => state.supply[id].count > 0 && isType(id, 'TREASURE') && !taken.includes(id));
                if (!piles.length) return done(state);
                push(state, player.id, options('Prospérité : recevoir un Trésor de plus ?', [
                    ...piles.map(id => ({ label: nameOf(id), effects: [{ type: 'GAIN_CARD', cardId: id }, { type: 'PROSPER', taken: [...taken, id] }] })),
                    { label: 'Terminé', effects: [] }
                ]));
                return done(state);
            }
        }
    ],

    onLoad: () => {
        if (!setupHooks.includes(setupPlunder)) setupHooks.push(setupPlunder);
        const owned = (state: GameState, id: string) => state.players.find(p => p.id === id);
        const pick = (state: GameState, playerId: string, payload: any, decision: any) => {
            const player = owned(state, playerId);
            return { player, ids: player ? chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id)) : [] };
        };
        const fromHand = (player: PlayerState, id: string) => {
            const idx = player.hand.findIndex(c => c.instanceId === id);
            return idx === -1 ? undefined : player.hand.splice(idx, 1)[0];
        };

        EffectEngine.registerDecisionHandler('MAT_ASIDE', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            for (const id of ids) { const c = fromHand(player, id); if (c) getMat(player, decision.context.mat).push(c); }
        });
        EffectEngine.registerDecisionHandler('UNTIL_END_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            const c = player && ids[0] ? fromHand(player, ids[0]) : undefined;
            if (player && c) getMat(player, 'save').push(c);
        });
        EffectEngine.registerDecisionHandler('TOPDECK_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            const c = player && ids[0] ? fromHand(player, ids[0]) : undefined;
            if (player && c) player.deck.unshift(c);
        });
        EffectEngine.registerDecisionHandler('MAPMAKER_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            const all: string[] = decision.context.all || [];
            const cards = all.map(id => player.limbo.find(c => c.instanceId === id)).filter(Boolean) as CardInstance[];
            player.limbo = player.limbo.filter(c => !cards.includes(c));
            player.hand.push(...cards.filter(c => ids.includes(c.instanceId)));
            discardCards(state, player, cards.filter(c => !ids.includes(c.instanceId)));
        });
        EffectEngine.registerDecisionHandler('FORAY_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            const cards = ids.map(id => fromHand(player, id)).filter(Boolean) as CardInstance[];
            EffectUtils.revealCards(state, cards, 'ALL', `${player.name} dévoile`);
            discardCards(state, player, cards);
            if (cards.length === 3 && new Set(cards.map(c => c.id)).size === 3) gainLoot(state, player);
        });
        EffectEngine.registerDecisionHandler('KINGS_CACHE_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player || !ids[0]) return;
            push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: ids[0] });
            push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: ids[0] });
            playCardNow(state, player, ids[0]);
        });
        EffectEngine.registerDecisionHandler('PLAY_FREE_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (player && ids[0]) playCardNow(state, player, ids[0]);
        });

        // Reckless: follow the instructions twice (and back to its pile when discarded from play)
        // Inspiring: afterwards, you may play an Action you don't have a copy of in play
        addOnce(playOverrides, 'plunder:traits', (state, player, cardDef, effects, card) => {
            let out: any[] | undefined;
            if (traitOf(state, cardDef.id, 'reckless')) { (card as any).reckless = true; out = [...effects, ...effects]; }
            if (traitOf(state, cardDef.id, 'inspiring') && isCurrent(state, player)) out = [...(out || effects), { type: 'INSPIRING' }];
            return out;
        });
        // Start of Clean-up: Patient (set aside to play next turn), Friendly (discard one to gain one);
        // Taskmaster stays only if a $5 card was gained
        addOnce(CleanupEffectHandler.beforeHandDiscard, 'plunder:cleanup_start', (state, player) => {
            const tms = ((state as any).taskmasters || []) as any[];
            for (const t of tms.filter(t => t.playerId === player.id && t.turn === state.turnNumber)) {
                const gained5 = (player.gainedThisTurn || []).some(id => costOf(state, player, id) === 5 && !def(id)?.debtCost && !def(id)?.potionCost);
                if (!gained5 && state.durations) state.durations = state.durations.filter(d => d.cardInstanceId !== t.instanceId);
            }
            (state as any).taskmasters = tms.filter(t => t.turn !== state.turnNumber || t.playerId !== player.id);
            if ((player as any).cleanupStartTurn === state.turnNumber) return false;
            const patient = traitPile(state, 'patient');
            const friendly = traitPile(state, 'friendly');
            const hasPatient = !!patient && player.hand.some(c => c.id === patient);
            const hasFriendly = !!friendly && player.hand.some(c => c.id === friendly);
            if (!hasPatient && !hasFriendly) return false;
            (player as any).cleanupStartTurn = state.turnNumber;
            push(state, player.id, { type: 'CLEANUP_RESUME' });
            if (hasFriendly) push(state, player.id, options(`Amical : défausser ${nameOf(friendly!)} pour en recevoir un ?`, [
                { label: 'Oui', effects: [{ type: 'DISCARD_ONE_OF', cardId: friendly }, { type: 'GAIN_CARD', cardId: friendly }] }, { label: 'Non', effects: [] }
            ]));
            if (hasPatient) askCards(state, player, 'PATIENT_PICK', `Patient : mettre de côté des ${nameOf(patient!)} pour les jouer au prochain tour ?`,
                player.hand.filter(c => c.id === patient), 'hand', 0, 99);
            return true;
        });
        EffectEngine.registerDecisionHandler('PATIENT_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            for (const id of ids) {
                const c = fromHand(player, id);
                if (!c) continue;
                player.aside.push(c);
                (state.triggers = state.triggers || []).push({
                    type: 'START_TURN', playerId: player.id, once: true, description: `Patient : ${nameOf(c.id)}`,
                    effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId } as any]
                } as any);
            }
        });
        // Journey: cards stay in play this Clean-up
        addOnce(CleanupEffectHandler.keepInPlay, 'plunder:journey', (state, player) => (player as any).journeyTurn === state.turnNumber);
    }
};
