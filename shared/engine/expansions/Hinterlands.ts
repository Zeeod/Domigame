/**
 * Hinterlands Expansion Module (2nd edition)
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { playCardNow } from '../Play.js';
import { EffectEngine } from '../EffectEngine.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const isType = (id: string, t: string) => !!CardRegistry.get(id)?.types.includes(t as any);
const nameOf = (id: string) => CardRegistry.get(id)?.name || id;

function push(state: GameState, playerId: string, effect: any, context: any = {}) {
    state.effectStack.push({ type: 'EFFECT', playerId, effect, context });
}
/** Push effects so that they resolve in the given order. */
function pushAll(state: GameState, playerId: string, effects: any[], context: any = {}) {
    for (let i = effects.length - 1; i >= 0; i--) push(state, playerId, effects[i], context);
}
function findOwned(player: PlayerState, instanceId: string): CardInstance | undefined {
    for (const zone of ['hand', 'playArea', 'discardPile', 'deck', 'aside', 'limbo'] as const) {
        const c = (player[zone] as CardInstance[] | undefined)?.find(x => x.instanceId === instanceId);
        if (c) return c;
    }
    return undefined;
}
/** "You may play it" — only while the card is still where the event left it. */
function mayPlay(state: GameState, player: PlayerState, instanceId: string, cardId: string, fromTrash = false) {
    push(state, player.id, {
        type: 'SELECT_OPTION', message: `Jouer ${nameOf(cardId)} ?`,
        options: [
            { label: 'Oui', effects: [{ type: fromTrash ? 'PLAY_FROM_TRASH' : 'PLAY_INSTANCE_IF_OWNED', instanceId }] },
            { label: 'Non', effects: [] }
        ]
    }, { sourceCardInstanceId: instanceId });
}

export const HinterlandsModule: ExpansionModule = {
    id: 'hinterlands',
    name: 'Arrière-pays',

    effectHandlers: [
        {
            // Gain a card costing less than the source card (Berserker, Border Village)
            type: 'GAIN_CHEAPER_THAN',
            handler: (state, player, effect: any) => {
                const max = EconomyEngine.getCardCost(state, player.id, effect.cardId) - 1;
                if (max < 0) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: max, ...(effect.filter || {}) }, effect.destination ? { destination: effect.destination } : {},
                    `Recevez une carte coûtant moins que ${nameOf(effect.cardId)} (jusqu'à ${max} 💰)`);
            }
        },
        {
            type: 'PLAY_INSTANCE_IF_OWNED',
            handler: (state, player, effect: any) => {
                if (findOwned(player, effect.instanceId)) playCardNow(state, player, effect.instanceId);
                return done(state);
            }
        },
        {
            // Trail: playing it after trashing it brings it back into play
            type: 'PLAY_FROM_TRASH',
            handler: (state, player, effect: any) => {
                const idx = state.trash.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                player.limbo.push(state.trash.splice(idx, 1)[0]);
                playCardNow(state, player, effect.instanceId);
                return done(state);
            }
        },
        {
            // Trail / Weaver: "When you gain/trash/discard this (other than in Clean-up), you may play it."
            type: 'MAY_PLAY_THIS',
            handler: (state, player, effect: any, ctx: any) => {
                const id = ctx?.sourceCardInstanceId;
                if (!id) return done(state);
                if (effect.fromTrash) {
                    const c = state.trash.find(x => x.instanceId === id);
                    if (c) mayPlay(state, player, id, c.id, true);
                } else {
                    const c = findOwned(player, id);
                    if (c && !player.playArea.some(x => x.instanceId === id)) mayPlay(state, player, id, c.id);
                }
                return done(state);
            }
        },
        {
            // Berserker: when you gain this, if you have an Action in play, play this.
            type: 'BERSERKER_ON_GAIN',
            handler: (state, player, _effect, ctx: any) => {
                const id = ctx?.sourceCardInstanceId;
                if (!id || !player.playArea.some(c => isType(c.id, 'ACTION'))) return done(state);
                if (findOwned(player, id)) playCardNow(state, player, id);
                return done(state);
            }
        },
        {
            // Cauldron: the third time you gain an Action this turn, each other player gains a Curse.
            type: 'CAULDRON',
            handler: (state, player) => {
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: player.id, once: false, expires: 'END_OF_TURN',
                    filter: { cardTypes: ['ACTION'] },
                    effects: [{ type: 'CAULDRON_CHECK' } as any],
                    description: 'Chaudron'
                } as any);
                return done(state);
            }
        },
        {
            type: 'CAULDRON_CHECK',
            handler: (state, player) => {
                const actions = (player.gainedThisTurn || []).filter(id => isType(id, 'ACTION')).length;
                if (actions === 3) push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] });
                return done(state);
            }
        },
        {
            // Scheme: this turn, you may put one of your Action cards onto your deck when you discard it from play
            type: 'SCHEME',
            handler: (state, player) => {
                (state.discardFromPlayEffects = state.discardFromPlayEffects || [])
                    .push({ playerId: player.id, turn: state.turnNumber, effect: { type: 'SCHEME_PICK' } });
                return done(state);
            }
        },
        {
            type: 'SCHEME_PICK',
            handler: (state, player) => {
                const fromPlay = new Set(state.cleanupDiscardedFromPlay || []);
                const actions = player.discardPile.filter(c => fromPlay.has(c.instanceId) && isType(c.id, 'ACTION'));
                if (actions.length === 0) return done(state);
                const seen = new Set<string>();
                const options: any[] = [];
                for (const c of actions) {
                    if (seen.has(c.id)) continue;
                    seen.add(c.id);
                    options.push({ label: nameOf(c.id), effects: [{ type: 'TOPDECK_INSTANCE', instanceId: c.instanceId }] });
                }
                options.push({ label: 'Aucune', effects: [] });
                push(state, player.id, { type: 'SELECT_OPTION', message: 'Stratagème : placer une carte Action sur votre pioche ?', options });
                return done(state);
            }
        },
        {
            // Souk: +1 Buy, +$7, -$1 per card in your hand (you can't go below $0)
            type: 'SOUK',
            handler: (state, player) => {
                player.coins = Math.max(0, player.coins + 7 - player.hand.length);
                return done(state);
            }
        },
        {
            // Develop: gain a card costing exactly $1 more and one costing exactly $1 less, in either order, onto your deck
            type: 'DEVELOP',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return done(state);
                const c = EconomyEngine.getCardCost(state, player.id, t.id);
                const plus = { type: 'DEVELOP_GAIN', exactCost: c + 1 };
                const minus = { type: 'DEVELOP_GAIN', exactCost: c - 1 };
                if (c - 1 < 0) { push(state, player.id, plus); return done(state); }
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: 'Développement : quelle carte recevoir en premier ?',
                    options: [
                        { label: `D'abord celle à ${c + 1} 💰`, effects: [plus, minus] },
                        { label: `D'abord celle à ${c - 1} 💰`, effects: [minus, plus] }
                    ]
                });
                return done(state);
            }
        },
        {
            type: 'DEVELOP_GAIN',
            handler: (state, player, effect: any) =>
                GainEffectHandler.promptGainFromSupply(state, player, { exactCost: effect.exactCost }, { destination: 'deck' },
                    `Développement : recevez une carte coûtant exactement ${effect.exactCost} 💰 (sur votre pioche)`)
        },
        {
            // Inn: when you gain this, reveal any number of Action cards from your discard pile and shuffle them into your deck
            type: 'INN_ON_GAIN',
            handler: (state, player) => {
                const actions = player.discardPile.filter(c => isType(c.id, 'ACTION'));
                if (actions.length === 0) return done(state);
                state.pendingDecision = {
                    id: `inn_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Auberge : choisissez des cartes Action de votre défausse à mélanger dans votre pioche',
                    constraints: { min: 0, max: actions.length, sourceZone: 'discardPile', filter: { cardTypes: ['ACTION'] } },
                    context: { specialAction: 'INN_SHUFFLE' }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            type: 'SHUFFLE_INTO_DECK',
            handler: (state, player, effect: any) => {
                const ids: string[] = effect.instanceIds || (state.lastDecisionResults?.cards || []).map((c: any) => c.instanceId);
                const moved = ids.map(id => EffectUtils.removeCardFromPlayer(state, player, id)).filter(Boolean) as CardInstance[];
                if (moved.length === 0) return done(state);
                EffectUtils.revealCards(state, moved, 'ALL', `${player.name} dévoile`);
                player.deck = EffectUtils.shuffle([...player.deck, ...moved], state);
                return done(state);
            }
        },
        {
            // Trader: trash a card from your hand. Gain a Silver per $1 it costs.
            type: 'TRADER_SILVERS',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (!t) return done(state);
                const n = EconomyEngine.getCardCost(state, player.id, t.id);
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'silver' });
                return done(state);
            }
        },
        {
            // Trader reaction: exchange the gained card for a Silver (it goes back to its pile)
            type: 'EXCHANGE_GAINED_FOR_SILVER',
            handler: (state, player, _effect, ctx: any) => {
                const id = ctx?.gainedInstanceId || state.lastGainedCard?.instanceId;
                const card = id ? findOwned(player, id) : undefined;
                if (!card) return done(state);
                EffectUtils.removeCardFromPlayer(state, player, card.instanceId);
                const pile = state.supply[card.id];
                if (pile) { pile.count++; if (Array.isArray(pile.cards) && pile.cards.length) pile.cards.push(card); }
                EffectUtils.log(state, `${player.name} échange ${nameOf(card.id)} contre un Argent.`, player.id);
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'silver' });
                return done(state);
            }
        },
        {
            // Tunnel: when you discard this other than during Clean-up, you may reveal it to gain a Gold
            type: 'TUNNEL',
            handler: (state, player) => {
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: 'Tunnel : le dévoiler pour recevoir un Or ?',
                    options: [
                        { label: 'Oui', effects: [{ type: 'GAIN_CARD', cardId: 'gold' }] },
                        { label: 'Non', effects: [] }
                    ]
                });
                return done(state);
            }
        },
        {
            // Weaver: gain two Silvers or a card costing up to $4
            type: 'WEAVER',
            handler: (state, player) => {
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: 'Tisserand : choisissez',
                    options: [
                        { label: 'Recevoir 2 Argents', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }, { type: 'GAIN_CARD', cardId: 'silver' }] },
                        { label: 'Recevoir une carte coûtant jusqu\'à 4 💰', effects: [{ type: 'GAIN_CARD', maxCost: 4 }] }
                    ]
                });
                return done(state);
            }
        },
        {
            // Wheelwright: you may discard a card to gain an Action card costing as much as it or less
            type: 'WHEELWRIGHT_GAIN',
            handler: (state, player) => {
                const d = state.lastDecisionResults?.cards?.[0];
                if (!d) return done(state);
                const max = EconomyEngine.getCardCost(state, player.id, d.id);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: max, cardTypes: ['ACTION'] }, {},
                    `Charron : recevez une carte Action coûtant jusqu'à ${max} 💰`);
            }
        },
        {
            // Witch's Hut: discard 2 cards, revealed; if they're both Actions, each other player gains a Curse
            type: 'WITCHS_HUT_CHECK',
            handler: (state, player) => {
                const d = state.lastDecisionResults?.cards || [];
                if (d.length) EffectUtils.revealCards(state, d as any, 'ALL', `${player.name} défausse`);
                if (d.length === 2 && d.every((c: any) => isType(c.id, 'ACTION'))) {
                    push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] });
                }
                return done(state);
            }
        },
        {
            // Fool's Gold: $1 if it's the first Fool's Gold you played this turn, otherwise $4
            type: 'FOOLS_GOLD',
            handler: (state, player) => {
                const n = player.playedThisTurn?.['fools_gold'] || 0;
                player.coins += n <= 1 ? 1 : 4;
                return done(state);
            }
        },
        {
            // Fool's Gold reaction: trash it to gain a Gold onto your deck
            type: 'FOOLS_GOLD_REACT',
            handler: (state, player, _effect, ctx: any) => {
                const id = ctx?.sourceCardInstanceId;
                const idx = player.hand.findIndex(c => c.instanceId === id);
                if (idx === -1) return done(state);
                TrashEffectHandler.trashCard(state, player, player.hand.splice(idx, 1)[0]);
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' });
                return done(state);
            }
        }
    ],

    onLoad: () => {
        // Inn: the chosen Action cards are revealed and shuffled into the deck
        EffectEngine.registerDecisionHandler('INN_SHUFFLE', (state, playerId, payload) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const ids = chosenInstanceIds(payload).filter(id => player.discardPile.some(c => c.instanceId === id && isType(c.id, 'ACTION')));
            push(state, player.id, { type: 'SHUFFLE_INTO_DECK', instanceIds: ids });
        });
    }
};
