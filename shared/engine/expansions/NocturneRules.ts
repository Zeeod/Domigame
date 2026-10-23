/**
 * Nocturne — rules: Boons, Hexes, States, Spirits, Heirlooms and the Kingdom cards.
 * (The Night phase itself is declared in expansions/Nocturne.ts.)
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
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow, markPlayed, pushPlayEffects } from '../Play.js';
import { getMat } from '../Mats.js';
import { VictoryChecker } from '../VictoryChecker.js';
import { setupHooks } from '../KingdomRules.js';
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

// ------------------------------------------------------------------------------------------ Boons & Hexes

/** Draw the next Boon (reshuffling the discarded Boons if needed). */
function drawBoon(state: GameState): string | undefined {
    if (!state.boonDeck.length && state.boonDiscard.length) {
        state.boonDeck = EffectUtils.shuffle(state.boonDiscard, state) as any;
        state.boonDiscard = [];
    }
    return state.boonDeck.shift();
}
function drawHex(state: GameState): string | undefined {
    if (!state.hexDeck.length && state.hexDiscard.length) {
        state.hexDeck = EffectUtils.shuffle(state.hexDiscard, state) as any;
        state.hexDiscard = [];
    }
    return state.hexDeck.shift();
}
/** Boons kept until Clean-up (Field's, Forest's, River's Gift). */
const KEPT_BOONS = ['the_fields_gift', 'the_forests_gift', 'the_rivers_gift'];

function receiveBoon(state: GameState, player: PlayerState, boonId: string, keep = true) {
    const b = def(boonId);
    if (!b) return;
    EffectUtils.log(state, `${player.name} reçoit la Faveur ${b.name}.`, player.id);
    if (keep) {
        if (KEPT_BOONS.includes(boonId)) ((state as any).boonsKept = (state as any).boonsKept || []).push(boonId);
        else state.boonDiscard.push(boonId);
    }
    pushAll(state, player.id, (b.effects || []) as any[]);
}

function playerStates(p: PlayerState): string[] { return ((p as any).states = (p as any).states || []); }
function takeState(state: GameState, player: PlayerState, id: string) {
    for (const p of state.players) (p as any).states = playerStates(p).filter(s => s !== id || p === player);
    if (!playerStates(player).includes(id)) playerStates(player).push(id);
    EffectUtils.log(state, `${player.name} prend l'État ${nameOf(id)}.`, player.id);
}
function dropState(player: PlayerState, id: string) { (player as any).states = playerStates(player).filter(s => s !== id); }

// ------------------------------------------------------------------------------------------ setup & scoring

export function setupNocturne(state: GameState): void {
    const kingdom = state.kingdomCards || [];
    state.nonSupply = state.nonSupply || {};
    const need = (id: string, n: number) => { if (!state.nonSupply![id]) state.nonSupply![id] = { cardId: id, count: n, cards: [] } as any; };
    const uses = (...ids: string[]) => ids.some(id => kingdom.includes(id));
    const usesBoons = kingdom.some(id => isType(id, 'FATE'));
    const usesHexes = kingdom.some(id => isType(id, 'DOOM'));
    if (usesBoons && !state.boonDeck.length && !state.boonDiscard.length) {
        state.boonDeck = EffectUtils.shuffle(['the_earths_gift', 'the_fields_gift', 'the_flames_gift', 'the_forests_gift', 'the_moons_gift',
            'the_mountains_gift', 'the_rivers_gift', 'the_seas_gift', 'the_skys_gift', 'the_suns_gift', 'the_swamps_gift', 'the_winds_gift'] as any, state) as any;
    }
    if (usesHexes && !state.hexDeck.length && !state.hexDiscard.length) {
        state.hexDeck = EffectUtils.shuffle(['bad_omens', 'delusion', 'envy', 'famine', 'fear', 'greed', 'haunting', 'locusts', 'misery',
            'plague', 'poverty', 'war'] as any, state) as any;
    }
    if (uses('druid') && !(state.landscapeState as any)?.druid_boons) {
        (state.landscapeState as any).druid_boons = { state: { boons: [drawBoon(state), drawBoon(state), drawBoon(state)].filter(Boolean) }, tokens: {} };
    }
    if (usesBoons || uses('exorcist')) need('will_o_wisp', 12);
    if (uses('exorcist', 'devils_workshop', 'tormentor')) need('imp', 13);
    if (uses('exorcist', 'cemetery')) need('ghost', 6);
    if (uses('leprechaun', 'secret_cave')) need('wish', 12);
    if (uses('vampire')) need('bat', 10);
    if (uses('necromancer') && !state.trash.some(c => c.id.startsWith('zombie_'))) {
        state.trash.push(createCardInstance('zombie_apprentice'), createCardInstance('zombie_mason'), createCardInstance('zombie_spy'));
    }
}

function scoreStates(_state: GameState, player: PlayerState): number {
    const s = playerStates(player);
    return (s.includes('miserable') ? -2 : 0) + (s.includes('twice_miserable') ? -4 : 0);
}

// ------------------------------------------------------------------------------------------ module

export const NocturneRulesModule: ExpansionModule = {
    id: 'nocturne_rules',
    name: 'Nocturne (règles)',

    eventHooks: [
        {
            // Start of turn: Lost in the Woods (discard a card to receive a Boon)
            id: 'nocturne:turn_start',
            event: 'TURN_START',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player || !playerStates(player).includes('lost_in_the_woods') || !player.hand.length) return;
                push(state, player.id, { type: 'DISCARD', min: 0, max: 1, message: 'Perdu dans les bois : défausser une carte pour recevoir une Faveur ?', onSuccess: [{ type: 'RECEIVE_BOON' }] });
            }
        },
        {
            // Start of your Buy phase: Deluded (no Actions to buy) / Envious (Silver and Gold make $1) are returned
            id: 'nocturne:buy_phase',
            event: 'PHASE_ENTER',
            priority: 'EARLY',
            handler: (state, event: any) => {
                if (event.context?.phaseId !== 'BUY') return;
                const player = state.players[state.currentPlayerIndex];
                if (!player) return;
                if (playerStates(player).includes('deluded')) {
                    dropState(player, 'deluded');
                    (player as any).deludedTurn = state.turnNumber;
                    EffectUtils.log(state, `${player.name} est Trompé : pas d'achat d'Action ce tour-ci.`, player.id);
                }
                if (playerStates(player).includes('envious')) {
                    dropState(player, 'envious');
                    const o = ((state.playerCardOverrides = state.playerCardOverrides || {})[player.id] = { ...(state.playerCardOverrides[player.id] || {}) });
                    o.silver = { treasureValue: 1, effects: [{ type: 'ADD_MONEY', amount: 1 }] };
                    o.gold = { treasureValue: 1, effects: [{ type: 'ADD_MONEY', amount: 1 }] };
                    (player as any).enviousTurn = state.turnNumber;
                    EffectUtils.log(state, `${player.name} est Envieux : Argent et Or rapportent 1 💰 ce tour-ci.`, player.id);
                }
            }
        },
        {
            // End of turn: kept Boons go back; Envious ends
            id: 'nocturne:turn_end',
            event: 'TURN_END',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const kept: string[] = (state as any).boonsKept || [];
                if (kept.length) { state.boonDiscard.push(...kept); (state as any).boonsKept = []; }
                const player = state.players.find(p => p.id === event.playerId);
                if (player && (player as any).enviousTurn !== undefined) {
                    const o = state.playerCardOverrides?.[player.id];
                    if (o) { const n = { ...o }; delete n.silver; delete n.gold; state.playerCardOverrides![player.id] = n; }
                    delete (player as any).enviousTurn;
                }
            }
        },
        {
            // Changeling: in games using it, when you gain a card costing $3 or more, you may exchange it for a Changeling
            id: 'nocturne:changeling',
            event: 'CARD_GAINED',
            priority: 'LATE',
            handler: (state, event: any) => {
                if (!(state.kingdomCards || []).includes('changeling')) return;
                const cid: string = event.context.gainedCardId;
                const iid: string = event.context.gainedInstanceId;
                const player = state.players.find(p => p.id === event.playerId);
                if (!player || !iid || cid === 'changeling' || !(state.supply.changeling?.count > 0)) return;
                if (costOf(state, player, cid) < 3) return;
                push(state, player.id, options(`Changelin : échanger ${nameOf(cid)} contre un Changelin ?`, [
                    { label: 'Échanger', effects: [{ type: 'EXCHANGE_FOR', instanceId: iid, to: 'changeling' }] },
                    { label: 'Garder', effects: [] }
                ]));
            }
        }
    ],

    effectHandlers: [
        // ---------------------------------------------------------------- Boons, Hexes, States
        {
            type: 'RECEIVE_BOON',
            handler: (state, player, effect: any) => {
                const id = effect.boonId || drawBoon(state);
                if (id) receiveBoon(state, player, id, !effect.boonId);
                return done(state);
            }
        },
        {
            // Druid: receive one of the set-aside Boons (leaving it there)
            type: 'DRUID_CHOOSE_BOON',
            handler: (state, player) => {
                const boons: string[] = (state.landscapeState as any)?.druid_boons?.state?.boons || [];
                if (!boons.length) return done(state);
                push(state, player.id, options('Druide : quelle Faveur recevoir ?', boons.map(b => ({ label: nameOf(b), effects: [{ type: 'RECEIVE_BOON', boonId: b }] }))));
                return done(state);
            }
        },
        {
            // Receive a Hex: a specific one (Attack: same Hex for everyone) or the next one
            type: 'RECEIVE_HEX',
            handler: (state, player, effect: any) => {
                const own = !effect.hexId;
                const id = effect.hexId || drawHex(state);
                if (!id) return done(state);
                if (own) state.hexDiscard.push(id);
                EffectUtils.log(state, `${player.name} reçoit le Maléfice ${nameOf(id)}.`, player.id);
                pushAll(state, player.id, (def(id)?.effects || []) as any[]);
                return done(state);
            }
        },
        {
            // "Each other player receives the next Hex": one Hex for everyone, then discarded
            type: 'HEX_OTHERS',
            handler: (state, player) => {
                const id = drawHex(state);
                if (!id) return done(state);
                push(state, player.id, { type: 'DISCARD_HEX', hexId: id });
                push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'RECEIVE_HEX', hexId: id }] });
                return done(state);
            }
        },
        { type: 'DISCARD_HEX', handler: (state, _p, effect: any) => { state.hexDiscard.push(effect.hexId); return done(state); } },
        { type: 'TAKE_STATE', handler: (state, player, effect: any) => { takeState(state, player, effect.stateId); return done(state); } },
        {
            // Delusion / Envy: if you don't have Deluded or Envious, take the given State
            type: 'TAKE_STATE_IF_FREE',
            handler: (state, player, effect: any) => {
                const s = playerStates(player);
                if (!s.includes('deluded') && !s.includes('envious')) takeState(state, player, effect.stateId);
                return done(state);
            }
        },
        {
            // Misery: first Misery → Miserable; otherwise flip it to Twice Miserable
            type: 'MISERY',
            handler: (state, player) => {
                const s = playerStates(player);
                if (s.includes('twice_miserable')) return done(state);
                if (s.includes('miserable')) { dropState(player, 'miserable'); takeState(state, player, 'twice_miserable'); }
                else takeState(state, player, 'miserable');
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Boon effects
        {
            // Moon's Gift: you may put a card from your discard pile onto your deck
            type: 'MOONS_GIFT',
            handler: (state, player) => {
                if (!player.discardPile.length) return done(state);
                push(state, player.id, { type: 'TOPDECK_FROM_DISCARD', min: 0, max: 1 });
                return done(state);
            }
        },
        {
            // Sky's Gift: you may discard 3 cards to gain a Gold
            type: 'SKYS_GIFT',
            handler: (state, player) => {
                if (player.hand.length < 3) return done(state);
                push(state, player.id, options('Don du ciel : défausser 3 cartes pour recevoir un Or ?', [
                    { label: 'Oui', effects: [{ type: 'DISCARD', min: 3, max: 3, message: 'Défaussez 3 cartes' }, { type: 'GAIN_CARD', cardId: 'gold' }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Sun's Gift: look at the top 4 cards; discard any number, put the rest back in any order
            type: 'SUNS_GIFT',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 4; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                pushAll(state, player.id, [
                    { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 0, max: seen.length, action: 'DISCARD', message: 'Don du soleil : défaussez autant de cartes que vous voulez' },
                    { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Remettez les autres dans l\'ordre de votre choix' }
                ]);
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Hex effects
        {
            // Bad Omens: put your deck into your discard pile; put 2 Coppers from it onto your deck
            type: 'BAD_OMENS',
            handler: (state, player) => {
                player.discardPile.push(...player.deck.splice(0));
                for (let i = 0; i < 2; i++) {
                    const idx = player.discardPile.findIndex(c => c.id === 'copper');
                    if (idx === -1) break;
                    player.deck.unshift(player.discardPile.splice(idx, 1)[0]);
                }
                return done(state);
            }
        },
        {
            // Famine: reveal the top 3 cards; discard the Actions; shuffle the rest into your deck
            type: 'FAMINE',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 3; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                EffectUtils.revealCards(state, seen, 'ALL', `${player.name} dévoile`);
                discardCards(state, player, seen.filter(c => isType(c.id, 'ACTION')));
                player.deck = EffectUtils.shuffle([...player.deck, ...seen.filter(c => !isType(c.id, 'ACTION'))], state);
                return done(state);
            }
        },
        {
            // Fear: if you have at least 5 cards in hand, discard an Action or Treasure
            type: 'FEAR',
            handler: (state, player) => {
                if (player.hand.length < 5) return done(state);
                if (!player.hand.some(c => isType(c.id, 'ACTION') || isType(c.id, 'TREASURE'))) {
                    EffectUtils.revealCards(state, player.hand, 'ALL', `${player.name} dévoile sa main`);
                    return done(state);
                }
                push(state, player.id, { type: 'DISCARD', min: 1, max: 1, filter: { cardTypes: ['ACTION', 'TREASURE'] }, message: 'Peur : défaussez une Action ou un Trésor' });
                return done(state);
            }
        },
        {
            // Haunting: if you have at least 4 cards in hand, put one of them onto your deck
            type: 'HAUNTING',
            handler: (state, player) => {
                if (player.hand.length < 4) return done(state);
                push(state, player.id, { type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', min: 1, max: 1, destination: 'deck', message: 'Hantise : placez une carte de votre main sur votre pioche' });
                return done(state);
            }
        },
        {
            // Locusts: trash the top card; Copper/Estate → gain a Curse; otherwise gain a cheaper card sharing a type
            type: 'LOCUSTS',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                TrashEffectHandler.trashCard(state, player, top);
                if (top.id === 'copper' || top.id === 'estate') { push(state, player.id, { type: 'GAIN_CARD', cardId: 'curse' }); return done(state); }
                const max = costOf(state, player, top.id) - 1;
                if (max < 0) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: max, cardTypes: def(top.id)?.types || [] }, {},
                    `Sauterelles : recevez une carte moins chère partageant un type avec ${nameOf(top.id)}`);
            }
        },
        {
            // War: reveal cards until one costing $3 or $4; trash it and discard the rest
            type: 'WAR',
            handler: (state, player) => {
                const revealed: CardInstance[] = [];
                for (;;) {
                    const c = takeTop(state, player);
                    if (!c) break;
                    const k = costOf(state, player, c.id);
                    if (k === 3 || k === 4) { TrashEffectHandler.trashCard(state, player, c); break; }
                    revealed.push(c);
                }
                if (revealed.length) discardCards(state, player, revealed);
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Kingdom cards
        {
            // Blessed Village: when you gain this, take a Boon; receive it now or at the start of your next turn
            type: 'BLESSED_VILLAGE_ON_GAIN',
            handler: (state, player) => {
                const id = drawBoon(state);
                if (!id) return done(state);
                push(state, player.id, options(`Village béni : recevoir ${nameOf(id)} maintenant ou au début de votre prochain tour ?`, [
                    { label: 'Maintenant', effects: [{ type: 'RECEIVE_BOON_KEEP', boonId: id }] },
                    { label: 'Au prochain tour', effects: [{ type: 'BOON_NEXT_TURN', boonId: id }] }
                ]));
                return done(state);
            }
        },
        { type: 'RECEIVE_BOON_KEEP', handler: (state, player, effect: any) => { receiveBoon(state, player, effect.boonId, true); return done(state); } },
        {
            type: 'BOON_NEXT_TURN',
            handler: (state, player, effect: any) => {
                (state.triggers = state.triggers || []).push({
                    type: 'START_TURN', playerId: player.id, once: true,
                    effects: [{ type: 'RECEIVE_BOON_KEEP', boonId: effect.boonId } as any], description: `Faveur : ${nameOf(effect.boonId)}`
                } as any);
                return done(state);
            }
        },
        {
            // Changeling: trash this. Gain a copy of a card you have in play.
            type: 'CHANGELING',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                const names = [...new Set(player.playArea.map(c => c.id))].filter(id => state.supply[id]?.count > 0);
                if (!names.length) return done(state);
                push(state, player.id, options('Changelin : recevez une copie d\'une carte que vous avez en jeu',
                    names.map(id => ({ label: nameOf(id), effects: [{ type: 'GAIN_CARD', cardId: id }] }))));
                return done(state);
            }
        },
        {
            type: 'EXCHANGE_FOR',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (!card) return done(state);
                const back = state.supply[card.id] || state.nonSupply?.[card.id];
                if (back) back.count++;
                const n = GainEffectHandler.takeFromPile(state, effect.to);
                if (n) player.discardPile.push(n);
                EffectUtils.log(state, `${player.name} échange ${nameOf(card.id)} contre ${nameOf(effect.to)}.`, player.id);
                return done(state);
            }
        },
        {
            // Conclave / Imp: you may play an Action card from your hand that you don't have a copy of in play
            type: 'PLAY_UNIQUE_ACTION',
            handler: (state, player, effect: any) => {
                const inPlay = new Set(player.playArea.map(c => c.id));
                return askHand(state, player, 'PLAY_UNIQUE_PICK', effect.message || 'Jouer une Action dont vous n\'avez pas de copie en jeu ?',
                    { cardTypes: ['ACTION'], excludeIds: [...inPlay] }, 1, { bonusAction: !!effect.bonusAction });
            }
        },
        {
            // Crypt: set aside any number of non-Duration Treasures you have in play
            type: 'CRYPT',
            handler: (state, player, _e, ctx: any) => {
                const t = player.playArea.filter(c => isType(c.id, 'TREASURE') && !isType(c.id, 'DURATION'));
                if (!t.length) { push(state, player.id, { type: 'CANCEL_DURATION' }, { sourceCardInstanceId: ctx?.sourceCardInstanceId }); return done(state); }
                state.pendingDecision = {
                    id: `crypt_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Crypte : mettez de côté des Trésors en jeu (un revient en main au début de chaque tour)',
                    constraints: { min: 0, max: t.length, sourceZone: 'playArea', filter: { cardTypes: ['TREASURE'] } },
                    context: { specialAction: 'CRYPT_PICK', cryptId: ctx?.sourceCardInstanceId }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            type: 'CRYPT_RETURN',
            handler: (state, player, _e, ctx: any) => {
                const mat = getMat(player, 'crypt');
                const mine = mat.filter(c => (c as any).setAsideBy === ctx?.sourceCardInstanceId);
                if (!mine.length) { push(state, player.id, { type: 'CANCEL_DURATION' }, ctx); return done(state); }
                const seen = new Set<string>();
                push(state, player.id, options('Crypte : prenez un Trésor en main', mine.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'MAT_TO_HAND', mat: 'crypt', instanceId: c.instanceId }]
                }))));
                if (mine.length === 1) push(state, player.id, { type: 'CANCEL_DURATION' }, ctx);
                return done(state);
            }
        },
        {
            type: 'MAT_TO_HAND',
            handler: (state, player, effect: any) => {
                const mat = getMat(player, effect.mat);
                const idx = mat.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) { const c = mat.splice(idx, 1)[0]; delete (c as any).setAsideBy; player.hand.push(c); }
                return done(state);
            }
        },
        {
            // Devil's Workshop: 2+ gained this turn → Imp; 1 → a card up to $4; 0 → Gold
            type: 'DEVILS_WORKSHOP',
            handler: (state, player) => {
                const n = (player.gainedThisTurn || []).length;
                if (n >= 2) push(state, player.id, { type: 'GAIN_CARD', cardId: 'imp' });
                else if (n === 1) push(state, player.id, { type: 'GAIN_CARD', maxCost: 4 });
                else push(state, player.id, { type: 'GAIN_CARD', cardId: 'gold' });
                return done(state);
            }
        },
        {
            // Exorcist: trash a card from your hand. Gain a cheaper Spirit from one of the Spirit piles.
            type: 'EXORCIST_GAIN',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return done(state);
                const max = costOf(state, player, t.id) - 1;
                const spirits = ['will_o_wisp', 'imp', 'ghost'].filter(id => (state.nonSupply?.[id]?.count || 0) > 0 && costOf(state, player, id) <= max);
                if (!spirits.length) return done(state);
                push(state, player.id, options('Exorciste : recevez un Esprit moins cher', spirits.map(id => ({ label: nameOf(id), effects: [{ type: 'GAIN_CARD', cardId: id }] }))));
                return done(state);
            }
        },
        {
            // Faithful Hound: when you discard this other than in Clean-up, you may set it aside, and put it into your hand at end of turn
            type: 'FAITHFUL_HOUND',
            handler: (state, player, _e, ctx: any) => {
                const id = ctx?.sourceCardInstanceId;
                if (!player.discardPile.some(c => c.instanceId === id)) return done(state);
                push(state, player.id, options('Chien fidèle : le mettre de côté (il revient en main à la fin du tour) ?', [
                    { label: 'Oui', effects: [{ type: 'SET_ASIDE_TO_SAVE', instanceId: id }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'SET_ASIDE_TO_SAVE',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (card) getMat(player, 'save').push(card);
                return done(state);
            }
        },
        {
            // Fool: if you aren't the player with Lost in the Woods, take it, take 3 Boons, receive them in any order
            type: 'FOOL',
            handler: (state, player) => {
                if (playerStates(player).includes('lost_in_the_woods')) return done(state);
                takeState(state, player, 'lost_in_the_woods');
                const boons = [drawBoon(state), drawBoon(state), drawBoon(state)].filter(Boolean) as string[];
                push(state, player.id, { type: 'FOOL_RECEIVE', boons });
                return done(state);
            }
        },
        {
            type: 'FOOL_RECEIVE',
            handler: (state, player, effect: any) => {
                const boons: string[] = effect.boons || [];
                if (!boons.length) return done(state);
                if (boons.length === 1) { receiveBoon(state, player, boons[0]); return done(state); }
                push(state, player.id, options('Fou : quelle Faveur recevoir maintenant ?', boons.map((b, i) => ({
                    label: nameOf(b), effects: [{ type: 'RECEIVE_BOON_KEEP', boonId: b }, { type: 'FOOL_RECEIVE', boons: boons.filter((_, j) => j !== i) }]
                }))));
                return done(state);
            }
        },
        {
            // Idol: odd number of Idols in play → receive a Boon; even → each other player gains a Curse
            type: 'IDOL',
            handler: (state, player) => {
                const n = player.playArea.filter(c => c.id === 'idol').length;
                if (n % 2 === 1) push(state, player.id, { type: 'RECEIVE_BOON' });
                else push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] });
                return done(state);
            }
        },
        {
            // Leprechaun: exactly 7 cards in play → gain a Wish; otherwise receive a Hex
            type: 'LEPRECHAUN',
            handler: (state, player) => {
                if (player.playArea.length === 7) push(state, player.id, { type: 'GAIN_CARD', cardId: 'wish' });
                else push(state, player.id, { type: 'RECEIVE_HEX' });
                return done(state);
            }
        },
        {
            // Monastery: for each card you've gained this turn, you may trash a card from your hand or a Copper in play
            type: 'MONASTERY',
            handler: (state, player) => {
                const n = (player.gainedThisTurn || []).length;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'MONASTERY_ONE' });
                return done(state);
            }
        },
        {
            type: 'MONASTERY_ONE',
            handler: (state, player) => {
                const opts: any[] = [];
                const seen = new Set<string>();
                for (const c of player.hand) if (!seen.has('h' + c.id) && seen.add('h' + c.id)) opts.push({ label: `${nameOf(c.id)} (main)`, effects: [{ type: 'TRASH_INSTANCE', instanceId: c.instanceId }] });
                const copper = player.playArea.find(c => c.id === 'copper');
                if (copper) opts.push({ label: 'Cuivre (en jeu)', effects: [{ type: 'TRASH_INSTANCE', instanceId: copper.instanceId }] });
                if (!opts.length) return done(state);
                opts.push({ label: 'Ne rien écarter', effects: [] });
                push(state, player.id, options('Monastère : écarter une carte de votre main ou un Cuivre en jeu ?', opts));
                return done(state);
            }
        },
        {
            // Necromancer: play a face-up, non-Duration Action card from the trash, leaving it there (face down this turn)
            type: 'NECROMANCER',
            handler: (state, player) => {
                const used: string[] = (state as any).necroUsed?.turn === state.turnNumber ? (state as any).necroUsed.ids : [];
                const ok = state.trash.filter(c => isType(c.id, 'ACTION') && !isType(c.id, 'DURATION') && !used.includes(c.instanceId));
                if (!ok.length) return done(state);
                const seen = new Set<string>();
                push(state, player.id, options('Nécromancien : jouez une Action du rebut', ok.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'NECRO_PLAY', instanceId: c.instanceId }]
                }))));
                return done(state);
            }
        },
        {
            type: 'NECRO_PLAY',
            handler: (state, player, effect: any) => {
                const card = state.trash.find(c => c.instanceId === effect.instanceId);
                if (!card) return done(state);
                const nu = (state as any).necroUsed?.turn === state.turnNumber ? (state as any).necroUsed : { turn: state.turnNumber, ids: [] };
                nu.ids.push(card.instanceId);
                (state as any).necroUsed = nu;
                markPlayed(state, player, card);
                EffectUtils.log(state, `${player.name} joue ${nameOf(card.id)} depuis le rebut (Nécromancien).`, player.id);
                pushPlayEffects(state, player, card);
                TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
                return done(state);
            }
        },
        {
            // Night Watchman: look at the top 5 cards, discard any number, put the rest back in any order
            type: 'NIGHT_WATCHMAN',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 5; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                pushAll(state, player.id, [
                    { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 0, max: seen.length, action: 'DISCARD', message: 'Veilleur de nuit : défaussez autant de cartes que vous voulez' },
                    { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Remettez les autres dans l\'ordre de votre choix' }
                ]);
                return done(state);
            }
        },
        {
            // Pixie: discard the top Boon. You may trash this to receive that Boon twice.
            type: 'PIXIE',
            handler: (state, player, _e, ctx: any) => {
                const id = drawBoon(state);
                if (!id) return done(state);
                state.boonDiscard.push(id);
                EffectUtils.log(state, `Lutin : la Faveur défaussée est ${nameOf(id)}.`, player.id);
                push(state, player.id, options(`Lutin : l'écarter pour recevoir deux fois ${nameOf(id)} ?`, [
                    { label: 'Oui', effects: [{ type: 'PIXIE_TRASH', boonId: id }] },
                    { label: 'Non', effects: [] }
                ]), { sourceCardInstanceId: ctx?.sourceCardInstanceId });
                return done(state);
            }
        },
        {
            type: 'PIXIE_TRASH',
            handler: (state, player, effect: any, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx === -1) return done(state);
                TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                const b = def(effect.boonId);
                if (b) { pushAll(state, player.id, (b.effects || []) as any[]); pushAll(state, player.id, (b.effects || []) as any[]); }
                return done(state);
            }
        },
        {
            // Raider: each other player with 5+ cards in hand discards a copy of a card you have in play (or reveals they can't)
            type: 'RAIDER_HIT',
            handler: (state, victim, _e, ctx: any) => {
                const attacker = state.players.find(p => p.id === ctx?.attackerId);
                if (!attacker || victim.hand.length < 5) return done(state);
                const names = new Set(attacker.playArea.map(c => c.id));
                if (!victim.hand.some(c => names.has(c.id))) { EffectUtils.revealCards(state, victim.hand, 'ALL', `${victim.name} dévoile sa main`); return done(state); }
                push(state, victim.id, { type: 'DISCARD', min: 1, max: 1, filter: { cardIds: [...names] }, message: 'Pillard : défaussez une copie d\'une carte qu\'il a en jeu' });
                return done(state);
            }
        },
        {
            // Sacred Grove: receive a Boon; if it doesn't give +$1, each other player may receive it
            type: 'SACRED_GROVE',
            handler: (state, player) => {
                const id = drawBoon(state);
                if (!id) return done(state);
                const givesCoin = ['the_fields_gift', 'the_forests_gift'].includes(id);
                if (!givesCoin) {
                    for (const p of others(state, player).reverse()) {
                        push(state, p.id, options(`Bosquet sacré : recevoir ${nameOf(id)} ?`, [
                            { label: 'Oui', effects: [{ type: 'RECEIVE_BOON', boonId: id }] },
                            { label: 'Non', effects: [] }
                        ]));
                    }
                }
                receiveBoon(state, player, id, true);
                return done(state);
            }
        },
        {
            // Secret Cave: you may discard 3 cards. If you did, at the start of your next turn, +$3.
            type: 'SECRET_CAVE',
            handler: (state, player, _e, ctx: any) => {
                const cancel = { type: 'CANCEL_DURATION' };
                if (player.hand.length < 3) { push(state, player.id, cancel, ctx); return done(state); }
                push(state, player.id, options('Grotte secrète : défausser 3 cartes pour +3 💰 au prochain tour ?', [
                    { label: 'Oui', effects: [{ type: 'DISCARD', min: 3, max: 3, message: 'Défaussez 3 cartes' }] },
                    { label: 'Non', effects: [cancel] }
                ]), ctx);
                return done(state);
            }
        },
        {
            // Shepherd: discard any number of Victory cards, revealing them. +2 Cards per card discarded.
            type: 'SHEPHERD_DRAW',
            handler: (state, player) => {
                const n = (state as any).lastDiscardedCount || 0;
                if (n) push(state, player.id, { type: 'DRAW', amount: 2 * n });
                return done(state);
            }
        },
        {
            // Tormentor: no other cards in play → gain an Imp; otherwise each other player receives the next Hex
            type: 'TORMENTOR',
            handler: (state, player, _e, ctx: any) => {
                const othersInPlay = player.playArea.filter(c => c.instanceId !== ctx?.sourceCardInstanceId).length;
                if (othersInPlay === 0) push(state, player.id, { type: 'GAIN_CARD', cardId: 'imp' });
                else push(state, player.id, { type: 'HEX_OTHERS' });
                return done(state);
            }
        },
        {
            // Tragic Hero: if you have 8 or more cards in hand, trash this and gain a Treasure
            type: 'TRAGIC_HERO',
            handler: (state, player, _e, ctx: any) => {
                if (player.hand.length < 8) return done(state);
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                push(state, player.id, { type: 'GAIN_CARD', maxCost: 99, cardTypes: ['TREASURE'], message: 'Héros tragique : recevez un Trésor' });
                return done(state);
            }
        },
        {
            // Vampire: hex the others; gain a card up to $5 other than a Vampire; exchange this for a Bat
            type: 'VAMPIRE',
            handler: (state, player, _e, ctx: any) => {
                pushAll(state, player.id, [
                    { type: 'HEX_OTHERS' },
                    { type: 'GAIN_CARD', maxCost: 5, excludeIds: ['vampire'], message: 'Vampire : recevez une carte coûtant jusqu\'à 5 💰 (pas un Vampire)' },
                    { type: 'EXCHANGE_FROM_PLAY', instanceId: ctx?.sourceCardInstanceId, to: 'bat' }
                ]);
                return done(state);
            }
        },
        {
            // Bat: trash up to 2 cards from your hand; if you trashed at least one, exchange this for a Vampire
            type: 'BAT_EXCHANGE',
            handler: (state, player, _e, ctx: any) => {
                push(state, player.id, { type: 'EXCHANGE_FROM_PLAY', instanceId: ctx?.sourceCardInstanceId, to: 'vampire' });
                return done(state);
            }
        },
        {
            type: 'EXCHANGE_FROM_PLAY',
            handler: (state, player, effect: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === effect.instanceId);
                const pile = state.supply[effect.to] || state.nonSupply?.[effect.to];
                if (idx === -1 || !pile || pile.count <= 0) return done(state);
                const old = player.playArea.splice(idx, 1)[0];
                const back = state.supply[old.id] || state.nonSupply?.[old.id];
                if (back) back.count++;
                const n = GainEffectHandler.takeFromPile(state, effect.to);
                if (n) player.discardPile.push(n);
                EffectUtils.log(state, `${player.name} échange ${nameOf(old.id)} contre ${nameOf(effect.to)}.`, player.id);
                return done(state);
            }
        },
        {
            // Werewolf: in your Night phase, hex the others; otherwise +3 Cards
            type: 'WEREWOLF',
            handler: (state, player) => {
                if (state.phase === 'NIGHT') push(state, player.id, { type: 'HEX_OTHERS' });
                else push(state, player.id, { type: 'DRAW', amount: 3 });
                return done(state);
            }
        },
        {
            // Ghost: reveal until an Action; discard the others, set it aside; play it twice next turn
            type: 'GHOST',
            handler: (state, player, _e, ctx: any) => {
                const revealed: CardInstance[] = [];
                let found: CardInstance | undefined;
                for (;;) {
                    const c = takeTop(state, player);
                    if (!c) break;
                    if (isType(c.id, 'ACTION')) { found = c; break; }
                    revealed.push(c);
                }
                if (revealed.length) discardCards(state, player, revealed);
                if (!found) { push(state, player.id, { type: 'CANCEL_DURATION' }, ctx); return done(state); }
                (found as any).setAsideBy = ctx?.sourceCardInstanceId;
                getMat(player, 'ghost').push(found);
                return done(state);
            }
        },
        {
            type: 'GHOST_PLAY',
            handler: (state, player, _e, ctx: any) => {
                const mat = getMat(player, 'ghost');
                const idx = mat.findIndex(c => (c as any).setAsideBy === ctx?.sourceCardInstanceId);
                if (idx === -1) return done(state);
                const card = mat.splice(idx, 1)[0];
                delete (card as any).setAsideBy;
                player.limbo.push(card);
                push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: card.instanceId });
                playCardNow(state, player, card.instanceId);
                return done(state);
            }
        },
        {
            // Will-o'-Wisp: reveal the top card; if it costs $2 or less, put it into your hand
            type: 'WILL_O_WISP',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                if (costOf(state, player, top.id) <= 2 && !def(top.id)?.potionCost && !def(top.id)?.debtCost) player.hand.push(top); else player.deck.unshift(top);
                return done(state);
            }
        },
        {
            // Wish: return this to its pile. If you did, gain a card to your hand costing up to $6.
            type: 'WISH_GAIN',
            handler: (state, player) => {
                if (!(state as any).lastReturnedToPile) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 6 }, { destination: 'hand' }, 'Vœu : recevez en main une carte coûtant jusqu\'à 6 💰');
            }
        },
        {
            // Zombie Mason: trash the top card of your deck; you may gain a card costing up to $1 more
            type: 'ZOMBIE_MASON',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                TrashEffectHandler.trashCard(state, player, top);
                const max = costOf(state, player, top.id) + 1;
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: max }, {}, `Maçon zombie : recevez une carte coûtant jusqu'à ${max} 💰`, true);
            }
        },
        {
            // Zombie Spy: look at the top card; discard it or put it back
            type: 'ZOMBIE_SPY',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                player.deck.unshift(top);
                push(state, player.id, options(`Espion zombie : ${nameOf(top.id)}`, [
                    { label: 'La défausser', effects: [{ type: 'DISCARD_TOP_IF', instanceId: top.instanceId }] },
                    { label: 'La remettre', effects: [] }
                ]));
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Heirlooms
        {
            // Haunted Mirror: when you trash this, you may discard an Action card, to gain a Ghost
            type: 'HAUNTED_MIRROR',
            handler: (state, player) => {
                if (!player.hand.some(c => isType(c.id, 'ACTION'))) return done(state);
                push(state, player.id, options('Miroir hanté : défausser une Action pour recevoir un Fantôme ?', [
                    { label: 'Oui', effects: [{ type: 'DISCARD', min: 1, max: 1, filter: { cardTypes: ['ACTION'] }, message: 'Défaussez une Action' }, { type: 'GAIN_CARD', cardId: 'ghost' }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Magic Lamp: if at least 6 cards you have exactly 1 copy of in play, trash this and gain 3 Wishes
            type: 'MAGIC_LAMP',
            handler: (state, player, _e, ctx: any) => {
                const counts = new Map<string, number>();
                for (const c of player.playArea) counts.set(c.id, (counts.get(c.id) || 0) + 1);
                if ([...counts.values()].filter(n => n === 1).length < 6) return done(state);
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx === -1) return done(state);
                TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                pushAll(state, player.id, [0, 1, 2].map(() => ({ type: 'GAIN_CARD', cardId: 'wish' })));
                return done(state);
            }
        }
    ],

    onLoad: () => {
        if (!setupHooks.includes(setupNocturne)) setupHooks.push(setupNocturne);
        if (!VictoryChecker.playerScorers.includes(scoreStates)) VictoryChecker.playerScorers.push(scoreStates);

        EffectEngine.registerDecisionHandler('PLAY_UNIQUE_PICK', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            const id = player ? chosenInstanceIds(payload).find(x => (decision.context.candidates || []).includes(x)) : undefined;
            if (!player || !id) return;
            if (decision.context.bonusAction) push(state, player.id, { type: 'ADD_ACTIONS', amount: 1 });
            playCardNow(state, player, id);
        });
        EffectEngine.registerDecisionHandler('CRYPT_PICK', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const mat = getMat(player, 'crypt');
            let n = 0;
            for (const id of chosenInstanceIds(payload)) {
                const idx = player.playArea.findIndex(c => c.instanceId === id && isType(c.id, 'TREASURE') && !isType(c.id, 'DURATION'));
                if (idx === -1) continue;
                const c = player.playArea.splice(idx, 1)[0];
                (c as any).setAsideBy = decision.context.cryptId;
                mat.push(c); n++;
            }
            if (!n) push(state, player.id, { type: 'CANCEL_DURATION' }, { sourceCardInstanceId: decision.context.cryptId });
        });
    }
};
