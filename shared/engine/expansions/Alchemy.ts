/**
 * Alchemy Expansion Module
 *
 * Alchemist / Herbalist (when discarded from play), Philosopher's Stone,
 * Scrying Pool, Transmute. Possession: see POSSESSION (extra turn controlled by another player).
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const isType = (id: string, t: string) => !!CardRegistry.get(id)?.types.includes(t as any);
const nameOf = (id: string) => CardRegistry.get(id)?.name || id;

function push(state: GameState, playerId: string, effect: any, context: any = {}) {
    state.effectStack.push({ type: 'EFFECT', playerId, effect, context });
}

/** Top card of the deck, shuffling the discard pile in if needed (stays on the deck). */
function peekTop(state: GameState, player: PlayerState): CardInstance | undefined {
    if (player.deck.length === 0 && player.discardPile.length > 0) {
        player.deck = EffectUtils.shuffle(player.discardPile, state);
        player.discardPile = [];
    }
    return player.deck[0];
}

/** The cards discarded from play in this Clean-up that are still in the discard pile. */
function discardedFromPlay(state: GameState, player: PlayerState): CardInstance[] {
    const ids = new Set(state.cleanupDiscardedFromPlay || []);
    return player.discardPile.filter(c => ids.has(c.instanceId));
}

export const AlchemyModule: ExpansionModule = {
    id: 'alchemy',
    name: 'Alchimie',

    effectHandlers: [
        {
            // Possession: the player to your left takes an extra turn after this one, controlled by you.
            type: 'POSSESSION',
            handler: (state, player) => {
                const i = state.players.findIndex(p => p.id === player.id);
                const left = state.players[(i + 1) % state.players.length];
                if (left.id === player.id) return done(state);
                (state.extraTurns = state.extraTurns || []).push({ playerId: left.id, type: 'POSSESSION', controllerId: player.id });
                EffectUtils.log(state, `${left.name} jouera un tour supplémentaire contrôlé par ${player.name} (Possession).`, player.id);
                return done(state);
            }
        },
        {
            // "When you discard this from play, if you have a Potion in play, you may put this onto your deck."
            type: 'ALCHEMIST_ON_DISCARD',
            handler: (state, player, _effect, ctx) => {
                const self = ctx?.sourceCardInstanceId;
                const fromPlay = discardedFromPlay(state, player);
                if (!self || !fromPlay.some(c => c.instanceId === self) || !fromPlay.some(c => c.id === 'potion')) return done(state);
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: 'Alchimiste : le placer sur votre pioche ?',
                    options: [
                        { label: 'Oui', effects: [{ type: 'TOPDECK_INSTANCE', instanceId: self }] },
                        { label: 'Non', effects: [] }
                    ]
                });
                return done(state);
            }
        },
        {
            // "When you discard this from play, you may put one of your Treasures from play onto your deck."
            type: 'HERBALIST_ON_DISCARD',
            handler: (state, player) => {
                const treasures = discardedFromPlay(state, player).filter(c => isType(c.id, 'TREASURE'));
                if (treasures.length === 0) return done(state);
                const seen = new Set<string>();
                const options: any[] = [];
                for (const c of treasures) {
                    if (seen.has(c.id)) continue;
                    seen.add(c.id);
                    options.push({ label: nameOf(c.id), effects: [{ type: 'TOPDECK_INSTANCE', instanceId: c.instanceId }] });
                }
                options.push({ label: 'Aucun', effects: [] });
                push(state, player.id, { type: 'SELECT_OPTION', message: 'Herboriste : placer un Trésor joué sur votre pioche ?', options });
                return done(state);
            }
        },
        {
            type: 'TOPDECK_INSTANCE',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (card) player.deck.unshift(card);
                return done(state);
            }
        },
        {
            // Philosopher's Stone: +$1 per 5 cards in your deck and discard pile (round down)
            type: 'PHILOSOPHERS_STONE',
            handler: (state, player) => {
                const n = Math.floor((player.deck.length + player.discardPile.length) / 5);
                player.coins += n;
                EffectUtils.log(state, `${player.name} reçoit +${n} 💰 (Pierre philosophale).`, player.id);
                return done(state);
            }
        },
        {
            // Scrying Pool: each player (including you) reveals the top card of their deck and either
            // discards it or puts it back, your choice. Then reveal cards from your deck until revealing
            // one that isn't an Action. Put all of those revealed cards into your hand.
            type: 'SCRYING_POOL',
            handler: (state, player) => {
                push(state, player.id, { type: 'REVEAL_UNTIL_NON_ACTION_TO_HAND' });
                push(state, player.id, { type: 'SCRYING_POOL_REVEAL', chooserId: player.id });
                push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'SCRYING_POOL_REVEAL', chooserId: player.id }] });
                return done(state);
            }
        },
        {
            type: 'SCRYING_POOL_REVEAL',
            handler: (state, target, effect: any, ctx: any) => {
                const chooserId = effect.chooserId || ctx?.attackerId || target.id;
                const top = peekTop(state, target);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${target.name} dévoile`);
                push(state, chooserId, {
                    type: 'SELECT_OPTION',
                    message: `Bassin divinatoire : ${target.name} a dévoilé ${nameOf(top.id)}`,
                    options: [
                        { label: 'La défausser', effects: [{ type: 'DISCARD_TOP_OF', targetId: target.id, instanceId: top.instanceId }] },
                        { label: 'La remettre', effects: [] }
                    ],
                    card: top
                });
                return done(state);
            }
        },
        {
            type: 'DISCARD_TOP_OF',
            handler: (state, _chooser, effect: any) => {
                const target = state.players.find(p => p.id === effect.targetId);
                if (!target) return done(state);
                const idx = target.deck.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) target.discardPile.push(target.deck.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            type: 'REVEAL_UNTIL_NON_ACTION_TO_HAND',
            handler: (state, player) => {
                const revealed: CardInstance[] = [];
                for (;;) {
                    const top = peekTop(state, player);
                    if (!top) break;
                    player.deck.shift();
                    revealed.push(top);
                    if (!isType(top.id, 'ACTION')) break;
                }
                if (revealed.length) {
                    EffectUtils.revealCards(state, revealed, 'ALL', `${player.name} dévoile`);
                    player.hand.push(...revealed);
                }
                return done(state);
            }
        },
        {
            // Transmute: if the trashed card is an Action, gain a Duchy; a Treasure, a Transmute; a Victory card, a Gold.
            type: 'TRANSMUTE_GAIN',
            handler: (state, player) => {
                const trashed = state.lastTrashedCard?.id;
                if (!trashed) return done(state);
                const gains: string[] = [];
                if (isType(trashed, 'ACTION')) gains.push('duchy');
                if (isType(trashed, 'TREASURE')) gains.push('transmute');
                if (isType(trashed, 'VICTORY')) gains.push('gold');
                for (const id of gains.reverse()) push(state, player.id, { type: 'GAIN_CARD', cardId: id });
                return done(state);
            }
        }
    ]
};
