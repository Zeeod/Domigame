/**
 * Rising Sun — rules of the Kingdom cards, the Omens / Sun tokens and the 15 Prophecies.
 * (The Events are in RisingSunRules.ts; Shadows are played from the deck: engine/Shadows.ts.)
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EffectEngine } from '../EffectEngine.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { CleanupEffectHandler } from '../effects/CleanupEffectHandler.js';
import { TriggerEffectHandler } from '../effects/TriggerEffectHandler.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { markPlayed, playOverrides, pushPlayEffects } from '../Play.js';
import { getMat } from '../Mats.js';
import { setupHooks } from '../KingdomRules.js';
import { ProphecyManager } from '../ProphecyManager.js';
import { createCardInstance } from '../CardInstance.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const def = (id: string) => CardRegistry.get(id);
const isType = (id: string, t: string) => !!def(id)?.types.includes(t as any);
const nameOf = (id: string) => def(id)?.name || id;
const costOf = (state: GameState, player: PlayerState, id: string) => EconomyEngine.getCardCost(state, player.id, id);
/** A "pure $" cost (no Debt, no Potion). */
const coinOnly = (id: string) => !def(id)?.debtCost && !def(id)?.potionCost;
const isCurrent = (state: GameState, p: PlayerState) => state.players[state.currentPlayerIndex]?.id === p.id;
const active = (state: GameState, id: string) => ProphecyManager.isActive(state, id);

function push(state: GameState, playerId: string, effect: any, context: any = {}) {
    state.effectStack.push({ type: 'EFFECT', playerId, effect, context });
}
function options(message: string, opts: { label: string; effects: any[] }[]) {
    return { type: 'SELECT_OPTION', message, options: opts };
}
function askCards(state: GameState, player: PlayerState, specialAction: string, message: string, pool: CardInstance[], min: number, max: number) {
    if (!pool.length || max <= 0) return done(state);
    state.pendingDecision = {
        id: `${specialAction.toLowerCase()}_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any, message,
        constraints: { min: Math.min(min, pool.length), max: Math.min(max, pool.length), sourceZone: 'hand' },
        context: { specialAction, candidates: pool.map(c => c.instanceId) }
    } as any;
    return { state, needsChoice: true };
}
function takeTop(state: GameState, player: PlayerState): CardInstance | undefined {
    if (player.deck.length === 0) EffectUtils.reshuffleDiscard(state, player);
    return player.deck.shift();
}
const pileTop = (state: GameState, k: string) => {
    const p = state.supply[k];
    return p?.cards?.length ? p.cards[p.cards.length - 1].id : k;
};
/** Supply piles (by top card) that can be gained with this test. */
function supplyIds(state: GameState, test: (id: string) => boolean): string[] {
    return Object.keys(state.supply).filter(k => (state.supply[k]?.count || 0) > 0 && test(pileTop(state, k)));
}
/** The pile a card comes from (Supply or not). */
function pileOf(state: GameState, cardId: string): any {
    for (const zone of [state.supply, state.nonSupply || {}] as Record<string, any>[]) {
        const k = Object.keys(zone).find(k => k === cardId || zone[k]?.cards?.some((c: CardInstance) => c.id === cardId));
        if (k) return zone[k];
    }
    return undefined;
}
function addOnce<T extends (...a: any[]) => any>(list: T[], key: string, fn: T) {
    if (list.some(f => (f as any).hookKey === key)) return;
    (fn as any).hookKey = key;
    list.push(fn);
}
const random = (state: GameState, n: number) => Math.floor(EffectUtils.random(state) * n);

/** A new Kingdom pile for this card (split piles included). */
function addKingdomPile(state: GameState, cardId: string): void {
    const d = def(cardId);
    if (!d) return;
    if (d.mixedPile) {
        const cards = d.mixedPile.cards.map(id => createCardInstance(id));
        if (d.mixedPile.type === 'SHUFFLED') EffectUtils.shuffle(cards, state).forEach((c, i) => (cards[i] = c));
        state.supply[cardId] = { cardId, count: cards.length, isMixed: true, cards } as any;
    } else {
        const count = d.types.includes('VICTORY') ? (state.players.length <= 2 ? 8 : 12) : 10;
        state.supply[cardId] = { cardId, count, cards: [] } as any;
    }
    state.kingdomCards = [...(state.kingdomCards || []), cardId];
}
/** Kingdom cards not used in this game (by their randomizer: split piles count once). */
function unusedKingdom(state: GameState, test: (id: string) => boolean): string[] {
    const used = new Set([...(state.kingdomCards || []), ...Object.keys(state.supply), ...Object.keys(state.nonSupply || {}),
        ...((state as any).removedKingdom || []), (state as any).riverboatCard].filter(Boolean));
    return CardRegistry.getKingdomCandidates().filter(id => !used.has(id) && test(id)).sort();
}

/** Setup: Sun tokens, Approaching Army's extra Attack pile, Riverboat's set-aside card. */
export function setupRisingSun(state: GameState): void {
    ProphecyManager.setup(state);
    const kingdom = state.kingdomCards || [];
    if (ProphecyManager.prophecy(state) === 'approaching_army' && !(state as any).approachingArmyPile) {
        const isAttack = (id: string) => isType(id, 'ATTACK') || (def(id)?.mixedPile?.cards || []).some(c => isType(c, 'ATTACK'));
        const pool = unusedKingdom(state, isAttack);
        if (pool.length) {
            const pick = pool[random(state, pool.length)];
            (state as any).approachingArmyPile = pick;
            addKingdomPile(state, pick);
            EffectUtils.log(state, `Armée en approche : la pile ${nameOf(pick)} est ajoutée à la Réserve.`);
        }
    }
    if (kingdom.includes('riverboat') && !(state as any).riverboatCard) {
        const pool = unusedKingdom(state, id => {
            const d = def(id);
            return !!d && d.types.includes('ACTION') && !d.types.includes('DURATION') && d.cost === 5 && coinOnly(id) && !d.mixedPile;
        });
        if (pool.length) {
            (state as any).riverboatCard = pool[random(state, pool.length)];
            EffectUtils.log(state, `Bateau de Rivière : ${nameOf((state as any).riverboatCard)} est mis de côté.`);
        }
    }
}

/** Enlightenment: "Treasures are also Actions" (every Treasure gets the Action type). */
function applyEnlightenment(state: GameState): void {
    // A plain copy (the state may be an Immer draft), used at once for the rest of this action
    const o: Record<string, any> = JSON.parse(JSON.stringify(state.cardOverrides || {}));
    for (const [id, d] of Object.entries(CardRegistry.getAll())) {
        const types = (o[id]?.types || d.types) as string[];
        if (types.includes('TREASURE') && !types.includes('ACTION')) o[id] = { ...(o[id] || {}), types: [...types, 'ACTION'] };
    }
    state.cardOverrides = o;
    const pid = state.players[state.currentPlayerIndex]?.id;
    const mine = pid ? state.playerCardOverrides?.[pid] : undefined;
    CardRegistry.useOverridesNow(mine ? { ...o, ...JSON.parse(JSON.stringify(mine)) } : { ...o });
}

/** The last Sun token was removed by `player`: the Prophecy happens. */
function fulfill(state: GameState, player: PlayerState): void {
    const id = ProphecyManager.prophecy(state)!;
    EffectUtils.log(state, `☀️ La Prophétie ${nameOf(id)} s'accomplit !`);
    if (id === 'enlightenment') applyEnlightenment(state);
    if (id === 'kind_emperor') push(state, player.id, { type: 'KIND_EMPEROR' });
    if (id === 'divine_wind') push(state, player.id, { type: 'DIVINE_WIND' });
}

export const RisingSunCardsModule: ExpansionModule = {
    id: 'rising_sun',
    name: 'Soleil Levant',

    costModifiers: [
        {
            // Flourishing Trade: cards cost $1 less
            id: 'rising_sun:flourishing_trade',
            priority: 40,
            modifier: (state, _playerId, _cardId, cost) => active(state, 'flourishing_trade') ? Math.max(0, cost - 1) : cost
        }
    ],

    eventHooks: [
        {
            id: 'rising_sun:turn_start',
            event: 'TURN_START',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                if (!p) return;
                // Rapid Expansion: play the cards set aside
                const rapid = getMat(p, 'rapid_expansion');
                for (const c of [...rapid].reverse()) push(state, p.id, { type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId });
                // Biding Time: the set-aside hand comes back
                const bided = getMat(p, 'biding_time');
                if (bided.length) { p.hand.push(...bided.splice(0)); EffectUtils.log(state, `${p.name} reprend sa main mise de côté (Attendre son heure).`, p.id); }
                if (active(state, 'kind_emperor')) push(state, p.id, { type: 'KIND_EMPEROR' });
                if (active(state, 'sickness')) push(state, p.id, options('Maladie : choisissez', [
                    { label: 'Recevoir une Malédiction sur votre pioche', effects: [{ type: 'GAIN_CARD', cardId: 'curse', destination: 'deck' }] },
                    { label: 'Défausser 3 cartes', effects: [{ type: 'DISCARD', amount: Math.min(3, p.hand.length), message: 'Maladie : défaussez 3 cartes' }] }
                ]));
            }
        },
        {
            id: 'rising_sun:gain',
            event: 'CARD_GAINED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                const cid: string = event.context?.gainedCardId;
                const iid: string = event.context?.gainedInstanceId;
                if (!p || !cid) return;
                // River Shrine: a card gained in the Buy phase
                if (state.phase === 'BUY' && isCurrent(state, p)) (p as any).gainedInBuyTurn = state.turnNumber;
                const prophecy = ProphecyManager.prophecy(state);
                if (!prophecy || !active(state, prophecy)) return;
                const cost = costOf(state, p, cid);
                if (prophecy === 'bureaucracy_prophecy' && (cost !== 0 || !coinOnly(cid))) push(state, p.id, { type: 'GAIN_CARD', cardId: 'copper' });
                if (prophecy === 'growth' && isType(cid, 'TREASURE')) push(state, p.id, { type: 'GROWTH', cost, cardId: cid });
                if (prophecy === 'progress' && iid) push(state, p.id, { type: 'GAINED_CARD_TO', to: 'deck', callContext: { gainedInstanceId: iid } });
                if (prophecy === 'rapid_expansion' && iid && (isType(cid, 'ACTION') || isType(cid, 'TREASURE'))) push(state, p.id, { type: 'RAPID_EXPANSION', instanceId: iid });
                if (prophecy === 'harsh_winter' && isCurrent(state, p)) {
                    const pile = pileOf(state, cid);
                    if (pile) {
                        pile.tokens = pile.tokens || {};
                        const debt = pile.tokens.debt || 0;
                        if (debt > 0) {
                            pile.tokens.debt = 0;
                            p.debt = (p.debt || 0) + debt;
                            EffectUtils.log(state, `Hiver rigoureux : ${p.name} prend ${debt} Dette(s).`, p.id);
                        } else {
                            pile.tokens.debt = 2;
                            EffectUtils.log(state, `Hiver rigoureux : 2 Dettes sur la pile ${nameOf(cid)}.`, p.id);
                        }
                    }
                }
            }
        },
        {
            // Daimyo: the next non-Command Action played this turn is replayed afterwards
            id: 'rising_sun:after_action',
            event: 'AFTER_ACTION',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId) as any;
                const cid: string = event.context?.cardId;
                if (!p || !cid || isType(cid, 'COMMAND') || !isType(cid, 'ACTION')) return;
                if (!p.daimyo || p.daimyo.turn !== state.turnNumber || !p.daimyo.n) return;
                const n = p.daimyo.n;
                p.daimyo = undefined;
                for (let i = 0; i < n; i++) push(state, p.id, { type: 'DAIMYO_REPLAY', cardId: cid, instanceId: event.context.cardInstanceId });
            }
        },
        {
            // Panic: Treasures discarded from play go back to their pile
            id: 'rising_sun:play_discarded',
            event: 'PLAY_DISCARDED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                if (!active(state, 'panic')) return;
                for (const c of (event.context.cards as CardInstance[])) {
                    if (isType(c.id, 'TREASURE')) push(state, event.playerId, { type: 'RETURN_TO_PILE' }, { sourceCardInstanceId: c.instanceId });
                }
            }
        }
    ],

    effectHandlers: [
        {
            // "+1 Sun": remove a Sun token from the Prophecy; the last one makes it happen
            type: 'GAIN_SUN',
            handler: (state, player) => {
                const id = ProphecyManager.prophecy(state);
                const ls = id ? state.landscapeState?.[id] : undefined;
                if (!id || !ls?.tokens?.sun) return done(state);
                ls.tokens.sun -= 1;
                EffectUtils.log(state, `${player.name} retire un Soleil de ${nameOf(id)} (reste ${ls.tokens.sun}).`, player.id);
                if (ls.tokens.sun === 0) fulfill(state, player);
                return done(state);
            }
        },
        {
            type: 'ARISTOCRAT',
            handler: (state, player) => {
                const n = player.playArea.filter(c => c.id === 'aristocrat').length;
                const fx = n === 1 || n === 5 ? { type: 'ADD_ACTIONS', amount: 3 } : n === 2 || n === 6 ? { type: 'DRAW', amount: 3 }
                    : n === 3 || n === 7 ? { type: 'ADD_MONEY', amount: 3 } : n === 4 || n === 8 ? { type: 'ADD_BUYS', amount: 3 } : undefined;
                if (fx) push(state, player.id, fx);
                return done(state);
            }
        },
        {
            // Artist: +1 Card per card you have exactly one copy of in play
            type: 'ARTIST',
            handler: (state, player) => {
                const counts: Record<string, number> = {};
                for (const c of player.playArea) counts[c.id] = (counts[c.id] || 0) + 1;
                const n = Object.values(counts).filter(v => v === 1).length;
                if (n) push(state, player.id, { type: 'DRAW', amount: n });
                return done(state);
            }
        },
        {
            // Change: with Debt, +$3; otherwise trash a card, gain one costing more $, +Debt equal to the difference
            type: 'CHANGE',
            handler: (state, player) => {
                if ((player.debt || 0) > 0) {
                    player.coins += 3;
                    EffectUtils.log(state, `${player.name} reçoit +3 💰 (Changement).`, player.id);
                    return done(state);
                }
                return askCards(state, player, 'CHANGE_PICK', 'Changement : écartez une carte de votre main', player.hand, 1, 1);
            }
        },
        {
            type: 'CHANGE_GAIN',
            handler: (state, player, effect: any) => GainEffectHandler.promptGainFromSupply(state, player, { cardIds: effect.cardIds }, { next: [{ type: 'CHANGE_DEBT', base: effect.base }] },
                `Changement : recevez une carte coûtant plus de ${effect.base} 💰`)
        },
        {
            type: 'CHANGE_DEBT',
            handler: (state, player, effect: any) => {
                const g = state.lastGainedCard;
                if (!g) return done(state);
                const n = Math.max(0, costOf(state, player, g.id) - effect.base);
                if (n) { player.debt = (player.debt || 0) + n; EffectUtils.log(state, `${player.name} prend ${n} Dette(s).`, player.id); }
                return done(state);
            }
        },
        {
            type: 'DAIMYO',
            handler: (state, player) => {
                const p = player as any;
                p.daimyo = { turn: state.turnNumber, n: (p.daimyo?.turn === state.turnNumber ? p.daimyo.n : 0) + 1 };
                return done(state);
            }
        },
        {
            // Replay a card (Daimyo), wherever it is now — even trashed
            type: 'DAIMYO_REPLAY',
            handler: (state, player, effect: any) => {
                const zones = [player.playArea, player.hand, player.discardPile, player.deck, player.aside, state.trash];
                const card = zones.flatMap(z => z || []).find(c => c.instanceId === effect.instanceId) || { id: effect.cardId, instanceId: effect.instanceId } as CardInstance;
                EffectUtils.log(state, `${player.name} rejoue ${nameOf(card.id)} (Daimyo).`, player.id);
                markPlayed(state, player, card);
                pushPlayEffects(state, player, card);
                TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
                return done(state);
            }
        },
        {
            type: 'MOUNTAIN_SHRINE',
            handler: (state, player) => {
                if (state.trash.some(c => isType(c.id, 'ACTION'))) push(state, player.id, { type: 'DRAW', amount: 2 });
                return done(state);
            }
        },
        {
            // Poet: reveal the top card; if it costs $3 or less, put it into your hand
            type: 'POET',
            handler: (state, player) => {
                const c = takeTop(state, player);
                if (!c) return done(state);
                EffectUtils.revealCards(state, [c], 'ALL', `${player.name} dévoile`);
                if (coinOnly(c.id) && costOf(state, player, c.id) <= 3) {
                    player.hand.push(c);
                    EffectUtils.log(state, `${player.name} prend ${nameOf(c.id)} en main.`, player.id);
                } else player.deck.unshift(c);
                return done(state);
            }
        },
        {
            // Rice: +$1 per different type among cards you have in play
            type: 'RICE',
            handler: (state, player) => {
                const types = new Set(player.playArea.flatMap(c => def(c.id)?.types || []));
                player.coins += types.size;
                EffectUtils.log(state, `${player.name} reçoit +${types.size} 💰 (Riz : ${types.size} types).`, player.id);
                return done(state);
            }
        },
        {
            type: 'RICE_BROKER',
            handler: (state, player) => askCards(state, player, 'RICE_BROKER_PICK', 'Courtier en Riz : écartez une carte de votre main', player.hand, 1, 1)
        },
        {
            type: 'RIVER_SHRINE',
            handler: (state, player) => {
                const p = player as any;
                p.riverShrine = { turn: state.turnNumber, n: (p.riverShrine?.turn === state.turnNumber ? p.riverShrine.n : 0) + 1 };
                return done(state);
            }
        },
        {
            // Riverboat: play the set-aside card, leaving it there
            type: 'RIVERBOAT',
            handler: (state, player) => {
                const id = (state as any).riverboatCard;
                if (!id) return done(state);
                const s = state as any;
                s.riverboatInstance = s.riverboatInstance || createCardInstance(id);
                const card = s.riverboatInstance as CardInstance;
                EffectUtils.log(state, `${player.name} joue ${nameOf(id)} (Bateau de Rivière).`, player.id);
                markPlayed(state, player, card);
                pushPlayEffects(state, player, card);
                TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
                return done(state);
            }
        },
        {
            type: 'RUSTIC_VILLAGE',
            handler: (state, player) => {
                if (player.hand.length < 2) return done(state);
                push(state, player.id, options('Village Rustique : défausser 2 cartes pour +1 Carte ?', [
                    { label: 'Oui', effects: [{ type: 'DISCARD', amount: 2, message: 'Village Rustique : défaussez 2 cartes' }, { type: 'DRAW', amount: 1 }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Snake Witch: no duplicates in hand → may reveal it and return this to its pile, for a Curse to each other player
            type: 'SNAKE_WITCH',
            handler: (state, player, _effect: any, ctx: any = {}) => {
                const ids = player.hand.map(c => c.id);
                if (new Set(ids).size !== ids.length) return done(state);
                const iid = ctx?.sourceCardInstanceId;
                if (!iid || !player.playArea.some(c => c.instanceId === iid)) return done(state);
                push(state, player.id, options('Sorcière aux Serpents : dévoiler votre main et remettre la Sorcière dans sa pile ?', [
                    { label: 'Oui (Malédiction aux autres)', effects: [{ type: 'SNAKE_WITCH_RETURN', instanceId: iid }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'SNAKE_WITCH_RETURN',
            handler: (state, player, effect: any) => {
                EffectUtils.revealCards(state, player.hand, 'ALL', `${player.name} dévoile sa main`);
                push(state, player.id, { type: 'SNAKE_WITCH_CURSE' });
                push(state, player.id, { type: 'RETURN_TO_PILE' }, { sourceCardInstanceId: effect.instanceId });
                return done(state);
            }
        },
        {
            type: 'SNAKE_WITCH_CURSE',
            handler: (state, player) => {
                if ((state as any).lastReturnedToPile) push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] });
                return done(state);
            }
        },
        {
            // Kind Emperor: gain an Action card to your hand (any cost)
            type: 'KIND_EMPEROR',
            handler: (state, player) => {
                const ids = supplyIds(state, id => isType(id, 'ACTION'));
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids }, { destination: 'hand' },
                    'Empereur bienveillant : recevez une carte Action en main');
            }
        },
        {
            // Growth: gain a cheaper card (not optional)
            type: 'GROWTH',
            handler: (state, player, effect: any) => {
                const ids = supplyIds(state, id => coinOnly(id) && costOf(state, player, id) < effect.cost);
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids }, {},
                    `Croissance : recevez une carte coûtant moins de ${effect.cost} 💰`);
            }
        },
        {
            // Rapid Expansion: the gained card is set aside, to be played at the start of your next turn
            type: 'RAPID_EXPANSION',
            handler: (state, player, effect: any) => {
                const c = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (c) {
                    getMat(player, 'rapid_expansion').push(c);
                    EffectUtils.log(state, `${player.name} met ${nameOf(c.id)} de côté (Expansion rapide).`, player.id);
                }
                return done(state);
            }
        },
        {
            // Divine Wind: remove all Kingdom piles and set up 10 new random ones
            type: 'DIVINE_WIND',
            handler: (state) => {
                const s = state as any;
                const old = [...(state.kingdomCards || [])];
                for (const k of old) delete state.supply[k];
                s.removedKingdom = [...(s.removedKingdom || []), ...old];
                state.kingdomCards = [];
                const pool = unusedKingdom(state, () => true);
                const picks: string[] = [];
                while (picks.length < 10 && pool.length) picks.push(pool.splice(random(state, pool.length), 1)[0]);
                for (const id of picks) addKingdomPile(state, id);
                EffectUtils.log(state, `Vent divin : nouvelle Réserve — ${picks.map(nameOf).join(', ')}.`);
                return done(state);
            }
        }
    ],

    onLoad: () => {
        if (!setupHooks.includes(setupRisingSun)) setupHooks.push(setupRisingSun);
        const pick = (state: GameState, playerId: string, payload: any, decision: any) => {
            const player = state.players.find(p => p.id === playerId);
            return { player, ids: player ? chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id)) : [] };
        };
        const trashFromHand = (state: GameState, player: PlayerState, id: string): CardInstance | undefined => {
            const idx = player.hand.findIndex(c => c.instanceId === id);
            if (idx === -1) return undefined;
            const c = player.hand.splice(idx, 1)[0];
            TrashEffectHandler.trashCard(state, player, c);
            return c;
        };
        EffectEngine.registerDecisionHandler('CHANGE_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player || !ids[0]) return;
            const c = trashFromHand(state, player, ids[0]);
            if (!c) return;
            const base = costOf(state, player, c.id);
            const choices = supplyIds(state, id => costOf(state, player, id) > base);
            if (!choices.length) return;
            push(state, player.id, { type: 'CHANGE_GAIN', cardIds: choices, base });
        });
        EffectEngine.registerDecisionHandler('RICE_BROKER_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player || !ids[0]) return;
            const c = trashFromHand(state, player, ids[0]);
            if (!c) return;
            // Treasure: +2 Cards; Action: +5 Cards (both if it is both)
            if (isType(c.id, 'ACTION')) push(state, player.id, { type: 'DRAW', amount: 5 });
            if (isType(c.id, 'TREASURE')) push(state, player.id, { type: 'DRAW', amount: 2 });
        });

        // Prophecies that change what a played card does
        addOnce(playOverrides, 'rising_sun:prophecies', (state, player, cardDef, effects) => {
            const id = ProphecyManager.prophecy(state);
            if (!id || !active(state, id)) return undefined;
            const types: string[] = cardDef.types || [];
            let out = effects;
            if (id === 'enlightenment' && types.includes('TREASURE') && state.phase === 'ACTION') {
                out = [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }];
            }
            if (id === 'good_harvest' && types.includes('TREASURE')) {
                const p = player as any;
                if (p.goodHarvest?.turn !== state.turnNumber) p.goodHarvest = { turn: state.turnNumber, names: [] };
                if (!p.goodHarvest.names.includes(cardDef.id)) {
                    p.goodHarvest.names.push(cardDef.id);
                    out = [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }, ...out];
                }
            }
            if (id === 'panic' && types.includes('TREASURE')) out = [...out, { type: 'ADD_BUYS', amount: 2 }];
            if (id === 'approaching_army' && types.includes('ATTACK')) out = [...out, { type: 'ADD_MONEY', amount: 1 }];
            if (id === 'great_leader' && types.includes('ACTION')) out = [...out, { type: 'ADD_ACTIONS', amount: 1 }];
            return out === effects ? undefined : out;
        });

        // Start of Clean-up: River Shrine gains, then Biding Time sets the hand aside
        addOnce(CleanupEffectHandler.beforeHandDiscard, 'rising_sun:cleanup_start', (state, player) => {
            const p = player as any;
            const rs = p.riverShrine;
            if (rs && rs.turn === state.turnNumber && rs.n > 0) {
                const n = rs.n;
                rs.n = 0;
                if (p.gainedInBuyTurn !== state.turnNumber) {
                    push(state, player.id, { type: 'CLEANUP_RESUME' });
                    for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', maxCost: 4, message: 'Sanctuaire de Rivière : recevez une carte coûtant jusqu\'à 4 💰' });
                    return true;
                }
            }
            if (active(state, 'biding_time') && player.hand.length) {
                getMat(player, 'biding_time').push(...player.hand.splice(0));
                EffectUtils.log(state, `${player.name} met sa main de côté (Attendre son heure).`, player.id);
            }
            return false;
        });
    }
};
