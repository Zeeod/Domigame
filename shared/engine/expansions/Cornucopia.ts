/**
 * Cornucopia & Guilds (2nd edition, 2024) Expansion Module
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { EffectEngine } from '../EffectEngine.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow } from '../Play.js';
import { REWARDS } from '../KingdomRules.js';
import { ActionResolver } from '../ActionResolver.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const isType = (id: string, t: string) => !!CardRegistry.get(id)?.types.includes(t as any);
const nameOf = (id: string) => CardRegistry.get(id)?.name || id;
const isReward = (id: string) => isType(id, 'REWARD') || REWARDS.includes(id);

function push(state: GameState, playerId: string, effect: any, context: any = {}) {
    state.effectStack.push({ type: 'EFFECT', playerId, effect, context });
}
function pushAll(state: GameState, playerId: string, effects: any[], context: any = {}) {
    for (let i = effects.length - 1; i >= 0; i--) push(state, playerId, effects[i], context);
}
/** Take the top card of the deck, shuffling the discard pile in if needed. */
function drawTop(state: GameState, player: PlayerState): CardInstance | undefined {
    if (player.deck.length === 0 && player.discardPile.length > 0) {
        EffectUtils.reshuffleDiscard(state, player);
        player.discardPile = [];
    }
    return player.deck.shift();
}
function baneOf(state: GameState): string | undefined {
    return (state.landscapeState as any)?.young_witch_bane?.state?.baneId;
}
/** Ask to pick cards from hand; the answer goes to a registered decision handler. */
function askHand(state: GameState, player: PlayerState, specialAction: string, message: string, filter: any, max = 1, extra: any = {}) {
    const candidates = EffectUtils.filterCards(player.hand, filter);
    if (candidates.length === 0) return done(state);
    state.pendingDecision = {
        id: `${specialAction.toLowerCase()}_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any, message,
        constraints: { min: 0, max, sourceZone: 'hand', filter: { ...filter, cardIds: undefined } },
        context: { specialAction, candidates: candidates.map(c => c.instanceId), ...extra }
    } as any;
    return { state, needsChoice: true };
}
/** Play a card twice: the second play is queued under the first one's effects. */
function playTwice(state: GameState, player: PlayerState, instanceId: string) {
    push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: instanceId });
    playCardNow(state, player, instanceId);
}

export const CornucopiaModule: ExpansionModule = {
    id: 'cornucopia',
    name: 'Abondance & Guildes',

    effectHandlers: [
        {
            // Answer to "overpay how much?": complete the purchase
            type: 'BUY_WITH_OVERPAY',
            handler: (state, player, effect: any) => {
                ActionResolver.buyWithOverpay(state, player.id, effect.cardId, effect.amount || 0);
                return { state, needsChoice: !!state.pendingDecision };
            }
        },
        // ---------------------------------------------------------------- Cornucopia
        {
            // Horn of Plenty: gain a card costing up to $1 per differently named card you have in play.
            // If it's a Victory card, trash this.
            type: 'HORN_OF_PLENTY',
            handler: (state, player, _effect, ctx) => {
                const n = new Set(player.playArea.map(c => c.id)).size;
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: n }, {
                    next: [{ type: 'HORN_OF_PLENTY_CHECK', hornId: ctx?.sourceCardInstanceId }]
                }, `Corne d'abondance : recevez une carte coûtant jusqu'à ${n} 💰`);
            }
        },
        {
            type: 'HORN_OF_PLENTY_CHECK',
            handler: (state, player, effect: any) => {
                if (!state.lastGainedCard || !isType(state.lastGainedCard.id, 'VICTORY')) return done(state);
                const idx = player.playArea.findIndex(c => c.instanceId === effect.hornId);
                if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Hunting Party: reveal your hand; reveal cards until one that isn't a copy of a card in your hand,
            // put it into your hand, discard the rest.
            type: 'HUNTING_PARTY',
            handler: (state, player) => {
                if (player.hand.length) EffectUtils.revealCards(state, player.hand, 'ALL', `${player.name} dévoile sa main`);
                const inHand = new Set(player.hand.map(c => c.id));
                const revealed: CardInstance[] = [];
                for (;;) {
                    const c = drawTop(state, player);
                    if (!c) break;
                    if (!inHand.has(c.id)) { player.hand.push(c); EffectUtils.revealCards(state, [c], 'ALL', `${player.name} prend`); break; }
                    revealed.push(c);
                }
                if (revealed.length) { EffectUtils.revealCards(state, revealed, 'ALL', `${player.name} défausse`); discardCards(state, player, revealed); }
                return done(state);
            }
        },
        {
            // Jester (per victim): discard your top card; Victory → gain a Curse; otherwise the attacker
            // chooses who gains a copy of it.
            type: 'JESTER',
            handler: (state, victim, _effect, ctx: any) => {
                const top = drawTop(state, victim);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${victim.name} défausse`);
                discardCard(state, victim, top);
                if (isType(top.id, 'VICTORY')) { push(state, victim.id, { type: 'GAIN_CARD', cardId: 'curse' }); return done(state); }
                const attackerId = ctx?.attackerId;
                if (!attackerId || !state.supply[top.id]) return done(state);
                push(state, attackerId, {
                    type: 'SELECT_OPTION', message: `Bouffon : ${victim.name} a défaussé ${nameOf(top.id)}. Qui en reçoit une copie ?`,
                    options: [
                        { label: 'Moi', effects: [{ type: 'GAIN_CARD', cardId: top.id }] },
                        { label: victim.name, effects: [{ type: 'GAIN_FOR', targetId: victim.id, cardId: top.id }] }
                    ]
                });
                return done(state);
            }
        },
        {
            type: 'GAIN_FOR',
            handler: (state, _player, effect: any) => {
                const target = state.players.find(p => p.id === effect.targetId);
                if (target) push(state, target.id, { type: 'GAIN_CARD', cardId: effect.cardId });
                return done(state);
            }
        },
        {
            // Young Witch (per victim): may reveal a Bane card from hand; if not, gain a Curse
            type: 'YOUNG_WITCH_ATTACK',
            handler: (state, victim) => {
                const bane = baneOf(state);
                if (bane && victim.hand.some(c => c.id === bane)) {
                    push(state, victim.id, {
                        type: 'SELECT_OPTION', message: `Jeune sorcière : dévoiler ${nameOf(bane)} (Fléau) pour éviter la Malédiction ?`,
                        options: [
                            { label: 'Dévoiler', effects: [] },
                            { label: 'Ne pas dévoiler', effects: [{ type: 'GAIN_CARD', cardId: 'curse' }] }
                        ]
                    });
                } else {
                    push(state, victim.id, { type: 'GAIN_CARD', cardId: 'curse' });
                }
                return done(state);
            }
        },
        {
            // Carnival: reveal the top 4 cards; put one of each differently named card into your hand, discard the rest
            type: 'CARNIVAL',
            handler: (state, player) => {
                const revealed: CardInstance[] = [];
                for (let i = 0; i < 4; i++) { const c = drawTop(state, player); if (c) revealed.push(c); }
                if (!revealed.length) return done(state);
                EffectUtils.revealCards(state, revealed, 'ALL', `${player.name} dévoile`);
                const seen = new Set<string>();
                const rest: CardInstance[] = [];
                for (const c of revealed) {
                    if (seen.has(c.id)) rest.push(c); else { seen.add(c.id); player.hand.push(c); }
                }
                discardCards(state, player, rest);
                return done(state);
            }
        },
        {
            // Farmhands (when gained): you may set aside an Action or Treasure from your hand, and play it at the start of your next turn
            type: 'FARMHANDS_ON_GAIN',
            handler: (state, player) => askHand(state, player, 'FARMHANDS_SET_ASIDE',
                'Ouvriers agricoles : mettre de côté une Action ou un Trésor de votre main, joué au début de votre prochain tour ?',
                { cardTypes: ['ACTION', 'TREASURE'] })
        },
        {
            // Ferryman (when gained): gain a card from the set-aside pile
            type: 'FERRYMAN_ON_GAIN',
            handler: (state, player) => {
                if (state.ferrymanPile) push(state, player.id, { type: 'GAIN_CARD', cardId: state.ferrymanPile });
                return done(state);
            }
        },
        {
            // Joust: you may set aside a Province from your hand to gain any Reward to your hand (Province discarded in Clean-up)
            type: 'JOUST',
            handler: (state, player) => {
                const prov = player.hand.find(c => c.id === 'province');
                if (!prov) return done(state);
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: 'Joute : mettre de côté une Province pour recevoir une Récompense en main ?',
                    options: [
                        { label: 'Oui', effects: [{ type: 'JOUST_SET_ASIDE', instanceId: prov.instanceId }] },
                        { label: 'Non', effects: [] }
                    ]
                });
                return done(state);
            }
        },
        {
            type: 'JOUST_SET_ASIDE',
            handler: (state, player, effect: any) => {
                const idx = player.hand.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                player.aside.push(player.hand.splice(idx, 1)[0]);
                (state.discardFromPlayEffects = state.discardFromPlayEffects || [])
                    .push({ playerId: player.id, turn: state.turnNumber, effect: { type: 'DISCARD_FROM_ASIDE', instanceId: effect.instanceId } });
                const rewards = REWARDS.filter(id => (state.nonSupply?.[id]?.count || 0) > 0);
                if (rewards.length === 0) return done(state);
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: 'Joute : choisissez une Récompense (en main)',
                    options: rewards.map(id => ({ label: nameOf(id), effects: [{ type: 'GAIN_CARD', cardId: id, destination: 'hand' }] }))
                });
                return done(state);
            }
        },
        {
            type: 'DISCARD_FROM_ASIDE',
            handler: (state, player, effect: any) => {
                const idx = player.aside.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) player.discardPile.push(player.aside.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Shop: you may play an Action card from your hand that you don't have a copy of in play
            type: 'SHOP',
            handler: (state, player) => {
                const inPlay = new Set(player.playArea.map(c => c.id));
                const ok = player.hand.filter(c => isType(c.id, 'ACTION') && !inPlay.has(c.id));
                if (!ok.length) return done(state);
                return askHand(state, player, 'PLAY_FROM_HAND', 'Boutique : jouer une Action dont vous n\'avez pas de copie en jeu ?',
                    { cardTypes: ['ACTION'], excludeIds: [...inPlay] });
            }
        },

        // ---------------------------------------------------------------- Rewards
        {
            // Coronet: you may play a non-Reward Action from your hand twice; you may play a non-Reward Treasure from your hand twice
            type: 'CORONET',
            handler: (state, player) => {
                push(state, player.id, { type: 'CORONET_PICK', cardType: 'TREASURE' });
                push(state, player.id, { type: 'CORONET_PICK', cardType: 'ACTION' });
                return done(state);
            }
        },
        {
            type: 'CORONET_PICK',
            handler: (state, player, effect: any) => {
                const ok = player.hand.filter(c => isType(c.id, effect.cardType) && !isReward(c.id));
                if (!ok.length) return done(state);
                return askHand(state, player, 'PLAY_TWICE_FROM_HAND',
                    `Diadème : jouer deux fois ${effect.cardType === 'ACTION' ? 'une Action' : 'un Trésor'} (hors Récompense) ?`,
                    { cardTypes: [effect.cardType], excludeIds: REWARDS });
            }
        },
        {
            // Courser: choose two different: +2 Cards; +2 Actions; +$2; gain 4 Silvers (done in that order)
            type: 'COURSER',
            handler: (state, player) => {
                const opts = [
                    { label: '+2 Cartes', effects: [{ type: 'DRAW', amount: 2 }] },
                    { label: '+2 Actions', effects: [{ type: 'ADD_ACTIONS', amount: 2 }] },
                    { label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                    { label: '4 Argents', effects: [0, 1, 2, 3].map(() => ({ type: 'GAIN_CARD', cardId: 'silver' })) },
                ];
                const options: any[] = [];
                for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
                    options.push({ label: `${opts[a].label} et ${opts[b].label}`, effects: [...opts[a].effects, ...opts[b].effects] });
                }
                push(state, player.id, { type: 'SELECT_OPTION', message: 'Coursier : choisissez deux options', options });
                return done(state);
            }
        },
        {
            // Housecarl: +1 Card per differently named Action card you have in play
            type: 'HOUSECARL',
            handler: (state, player) => {
                const n = new Set(player.playArea.filter(c => isType(c.id, 'ACTION')).map(c => c.id)).size;
                if (n) push(state, player.id, { type: 'DRAW', amount: n });
                return done(state);
            }
        },
        {
            // Huge Turnip: +2 Coffers, +$1 per Coffers you have
            type: 'HUGE_TURNIP',
            handler: (state, player) => {
                player.coffers = (player.coffers || 0) + 2;
                player.coins += player.coffers;
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Guilds
        {
            // Butcher: you may trash a card from your hand; if you do, remove any number of Coffers,
            // gain a card costing up to the trashed card's cost plus the Coffers removed
            type: 'BUTCHER',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return done(state);
                const base = EconomyEngine.getCardCost(state, player.id, t.id);
                const max = player.coffers || 0;
                if (max === 0) { push(state, player.id, { type: 'BUTCHER_PAY', base, amount: 0 }); return done(state); }
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: `Boucher : combien de Coffres dépenser ? (carte jusqu'à ${base} 💰 + Coffres)`,
                    options: Array.from({ length: max + 1 }, (_, n) => ({ label: `${n} Coffre${n > 1 ? 's' : ''} → jusqu'à ${base + n} 💰`, effects: [{ type: 'BUTCHER_PAY', base, amount: n }] }))
                });
                return done(state);
            }
        },
        {
            type: 'BUTCHER_PAY',
            handler: (state, player, effect: any) => {
                player.coffers = Math.max(0, (player.coffers || 0) - effect.amount);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: effect.base + effect.amount }, {},
                    `Boucher : recevez une carte coûtant jusqu'à ${effect.base + effect.amount} 💰`);
            }
        },
        {
            // Soothsayer (per victim): gain a Curse; if you did, draw a card
            type: 'SOOTHSAYER_ATTACK',
            handler: (state, victim) => {
                if (!(state.supply.curse?.count > 0)) return done(state);
                pushAll(state, victim.id, [{ type: 'GAIN_CARD', cardId: 'curse' }, { type: 'DRAW', amount: 1 }]);
                return done(state);
            }
        },
        {
            // Herald: reveal the top card of your deck; if it's an Action, play it
            type: 'HERALD',
            handler: (state, player) => {
                const top = drawTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                player.deck.unshift(top);
                if (isType(top.id, 'ACTION')) playCardNow(state, player, top.instanceId);
                return done(state);
            }
        },
        {
            // Herald overpay: per $1 overpaid, put a card from your discard pile onto your deck
            type: 'HERALD_OVERPAY',
            handler: (state, player, _effect, ctx: any) => {
                const n = Math.min(ctx?.overpaid || 0, player.discardPile.length);
                if (!n) return done(state);
                state.pendingDecision = {
                    id: `herald_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: `Héraut : placez jusqu'à ${n} carte(s) de votre défausse sur votre pioche`,
                    constraints: { min: 0, max: n, sourceZone: 'discardPile' },
                    context: { specialAction: 'TOPDECK_FROM_DISCARD' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Stonemason overpay: gain 2 Action cards each costing the amount you overpaid
            type: 'STONEMASON_OVERPAY',
            handler: (state, player, _effect, ctx: any) => {
                const n = ctx?.overpaid || 0;
                const e = { type: 'STONEMASON_GAIN', exactCost: n };
                pushAll(state, player.id, [e, e]);
                return done(state);
            }
        },
        {
            type: 'STONEMASON_GAIN',
            handler: (state, player, effect: any) =>
                GainEffectHandler.promptGainFromSupply(state, player, { exactCost: effect.exactCost, cardTypes: ['ACTION'] }, {},
                    `Tailleur de pierre : recevez une carte Action coûtant exactement ${effect.exactCost} 💰`)
        },
        {
            // Farrier overpay: +1 Card at the end of this turn per $1 overpaid
            type: 'FARRIER_OVERPAY',
            handler: (state, player, _effect, ctx: any) => {
                player.nextTurnDraw = (player.nextTurnDraw || 0) + (ctx?.overpaid || 0);
                return done(state);
            }
        },
        {
            // Infirmary overpay: play this once per $1 overpaid
            type: 'INFIRMARY_OVERPAY',
            handler: (state, player, _effect, ctx: any) => {
                const n = ctx?.overpaid || 0;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: ctx?.sourceCardInstanceId });
                return done(state);
            }
        }
    ],

    onLoad: () => {
        const owned = (state: GameState, playerId: string) => state.players.find(p => p.id === playerId);
        const picked = (payload: any, decision: any) =>
            chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id));

        // Farmhands: set the card aside, play it at the start of the next turn
        EffectEngine.registerDecisionHandler('FARMHANDS_SET_ASIDE', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            if (!player || !id) return;
            const idx = player.hand.findIndex(c => c.instanceId === id);
            if (idx === -1) return;
            player.aside.push(player.hand.splice(idx, 1)[0]);
            (state.triggers = state.triggers || []).push({
                type: 'START_TURN', playerId: player.id, once: true,
                effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: id } as any],
                description: `Ouvriers agricoles : jouer ${nameOf(player.aside[player.aside.length - 1].id)}`
            } as any);
        });
        // Shop
        EffectEngine.registerDecisionHandler('PLAY_FROM_HAND', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            if (player && id) playCardNow(state, player, id);
        });
        // Coronet
        EffectEngine.registerDecisionHandler('PLAY_TWICE_FROM_HAND', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            if (player && id) playTwice(state, player, id);
        });
        // Herald overpay
        EffectEngine.registerDecisionHandler('TOPDECK_FROM_DISCARD', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            if (!player) return;
            const max = decision.constraints?.max || 0;
            const ids = chosenInstanceIds(payload).filter(id => player.discardPile.some(c => c.instanceId === id)).slice(0, max);
            for (const id of ids) {
                const idx = player.discardPile.findIndex(c => c.instanceId === id);
                player.deck.unshift(player.discardPile.splice(idx, 1)[0]);
            }
        });
    }
};
