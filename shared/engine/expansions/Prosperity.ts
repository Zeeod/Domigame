/**
 * Prosperity Expansion Module (2nd edition)
 *
 * - Quarry: this turn, Action cards cost $2 less
 * - Peddler: during your Buy phase, costs $2 less per Action card you have in play
 * - Crystal Ball, Investment, War Chest, Watchtower, Mint
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { discardCard } from '../Discard.js';
import { playCardNow } from '../Play.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const isType = (id: string, t: string) => !!CardRegistry.get(id)?.types.includes(t as any);
const nameOf = (id: string) => CardRegistry.get(id)?.name || id;

function push(state: GameState, playerId: string, effect: any, context: any = {}) {
    state.effectStack.push({ type: 'EFFECT', playerId, effect, context });
}

function playerToLeft(state: GameState, player: PlayerState): PlayerState {
    const i = state.players.findIndex(p => p.id === player.id);
    return state.players[(i + 1) % state.players.length];
}

/** Find a card the player owns, wherever it is (hand, play, deck, discard, aside, limbo). */
function findOwned(player: PlayerState, instanceId: string): CardInstance | undefined {
    for (const zone of ['hand', 'playArea', 'discardPile', 'deck', 'aside', 'limbo'] as const) {
        const c = (player[zone] as CardInstance[] | undefined)?.find(x => x.instanceId === instanceId);
        if (c) return c;
    }
    return undefined;
}

export const ProsperityModule: ExpansionModule = {
    id: 'prosperity',
    name: 'Prospérité',

    costModifiers: [
        {
            // Quarry: "This turn, Action cards cost $2 less." (keeps working if Quarry leaves play)
            id: 'prosperity:quarry',
            priority: 50,
            modifier: (state, playerId, cardId, currentCost) => {
                if (state.players[state.currentPlayerIndex]?.id !== playerId) return currentCost;
                const n = (state as any).quarryTurn?.turn === state.turnNumber ? (state as any).quarryTurn.count : 0;
                if (!n || !isType(cardId, 'ACTION')) return currentCost;
                return currentCost - n * 2;
            }
        },
        {
            // Peddler: "During your Buy phase, this costs $2 less per Action card you have in play."
            id: 'prosperity:peddler',
            priority: 60,
            modifier: (state, playerId, cardId, currentCost) => {
                if (cardId !== 'peddler' || state.phase !== 'BUY') return currentCost;
                if (state.players[state.currentPlayerIndex]?.id !== playerId) return currentCost;
                const player = state.players.find(p => p.id === playerId);
                if (!player) return currentCost;
                const actionsInPlay = player.playArea.filter(c => isType(c.id, 'ACTION')).length;
                return currentCost - actionsInPlay * 2;
            }
        }
    ],

    effectHandlers: [
        {
            type: 'QUARRY',
            handler: (state) => {
                const q = (state as any).quarryTurn;
                (state as any).quarryTurn = { turn: state.turnNumber, count: q?.turn === state.turnNumber ? q.count + 1 : 1 };
                return done(state);
            }
        },
        {
            // Crystal Ball: look at the top card; you may trash it, discard it, or (Action/Treasure) play it.
            type: 'CRYSTAL_BALL',
            handler: (state, player) => {
                if (player.deck.length === 0 && player.discardPile.length > 0) {
                    EffectUtils.reshuffleDiscard(state, player);
                    player.discardPile = [];
                }
                const top = player.deck[0];
                if (!top) return done(state);
                const options: any[] = [
                    { label: `Écarter ${nameOf(top.id)}`, effects: [{ type: 'TOP_CARD_TO', instanceId: top.instanceId, to: 'trash' }] },
                    { label: `Défausser ${nameOf(top.id)}`, effects: [{ type: 'TOP_CARD_TO', instanceId: top.instanceId, to: 'discardPile' }] },
                ];
                if (isType(top.id, 'ACTION') || isType(top.id, 'TREASURE')) {
                    options.push({ label: `Jouer ${nameOf(top.id)}`, effects: [{ type: 'TOP_CARD_TO', instanceId: top.instanceId, to: 'play' }] });
                }
                options.push({ label: 'La laisser sur la pioche', effects: [] });
                push(state, player.id, { type: 'SELECT_OPTION', message: `Boule de cristal : la carte du dessus est ${nameOf(top.id)}`, options, card: top });
                return done(state);
            }
        },
        {
            type: 'TOP_CARD_TO',
            handler: (state, player, effect: any) => {
                const idx = player.deck.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                if (effect.to === 'play') { playCardNow(state, player, effect.instanceId); return done(state); }
                const [card] = player.deck.splice(idx, 1);
                if (effect.to === 'trash') TrashEffectHandler.trashCard(state, player, card);
                else discardCard(state, player, card);
                return done(state);
            }
        },
        {
            // Investment: trash a card from your hand. Choose one: +$1; or trash this to reveal
            // your hand for +1 VP per differently named Treasure there.
            type: 'INVESTMENT',
            handler: (state, player, _effect, ctx) => {
                push(state, player.id, {
                    type: 'SELECT_OPTION', message: 'Investissement : choisissez',
                    options: [
                        { label: '+1 💰', effects: [{ type: 'ADD_MONEY', amount: 1 }] },
                        { label: 'Écarter Investissement : +1 🛡️ par Trésor différent en main', effects: [{ type: 'INVESTMENT_CASH_IN' }] }
                    ]
                }, { sourceCardInstanceId: ctx?.sourceCardInstanceId });
                if (player.hand.length > 0) {
                    push(state, player.id, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Investissement : écartez une carte de votre main' });
                }
                return done(state);
            }
        },
        {
            type: 'INVESTMENT_CASH_IN',
            handler: (state, player, _effect, ctx) => {
                const id = ctx?.sourceCardInstanceId;
                const idx = player.playArea.findIndex(c => c.instanceId === id);
                if (idx === -1) return done(state); // not in play any more: cannot trash it
                TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                EffectUtils.revealCards(state, player.hand, 'ALL', `${player.name} dévoile sa main`);
                const kinds = new Set(player.hand.filter(c => isType(c.id, 'TREASURE')).map(c => c.id)).size;
                player.vpTokens = (player.vpTokens || 0) + kinds;
                EffectUtils.log(state, `${player.name} reçoit ${kinds} 🛡️ (Investissement).`, player.id);
                return done(state);
            }
        },
        {
            // War Chest: the player to your left names a card. Gain a card costing up to $5
            // that hasn't been named for War Chests this turn.
            type: 'WAR_CHEST',
            handler: (state, player) => {
                const left = playerToLeft(state, player);
                if (left.id === player.id) {
                    push(state, player.id, { type: 'WAR_CHEST_GAIN', ownerId: player.id });
                    return done(state);
                }
                push(state, left.id, {
                    type: 'NAME_CARD',
                    message: `Trésor de guerre de ${player.name} : nommez une carte (il ne pourra pas la recevoir)`,
                    next: [{ type: 'WAR_CHEST_GAIN', ownerId: player.id }]
                });
                return done(state);
            }
        },
        {
            type: 'WAR_CHEST_GAIN',
            handler: (state, _namer, effect: any, ctx: any) => {
                const owner = state.players.find(p => p.id === effect.ownerId);
                if (!owner) return done(state);
                const wc = (state as any).warChestNamed;
                const named: string[] = wc?.turn === state.turnNumber ? [...wc.ids] : [];
                if (ctx?.namedCardId) named.push(ctx.namedCardId);
                (state as any).warChestNamed = { turn: state.turnNumber, ids: named };
                return GainEffectHandler.promptGainFromSupply(state, owner, { maxCost: 5, excludeIds: named }, {},
                    'Trésor de guerre : recevez une carte coûtant jusqu\'à 5 💰 (sauf les cartes nommées)');
            }
        },
        {
            // Mint (when you gain this): trash all of your non-Duration Treasures from play.
            type: 'MINT_ON_GAIN',
            handler: (state, player) => {
                const current = state.players[state.currentPlayerIndex];
                if (current?.id !== player.id) return done(state);
                const toTrash = player.playArea.filter(c => isType(c.id, 'TREASURE') && !isType(c.id, 'DURATION'));
                for (const c of toTrash) {
                    player.playArea = player.playArea.filter(x => x.instanceId !== c.instanceId);
                    TrashEffectHandler.trashCard(state, player, c);
                }
                return done(state);
            }
        },
        {
            // Watchtower reaction: trash the gained card, or put it onto your deck.
            type: 'GAINED_CARD_TO',
            handler: (state, player, effect: any, ctx: any) => {
                const id = ctx?.gainedInstanceId || state.lastGainedCard?.instanceId;
                if (!id || !findOwned(player, id)) return done(state);
                const card = EffectUtils.removeCardFromPlayer(state, player, id)!;
                if (effect.to === 'trash') TrashEffectHandler.trashCard(state, player, card);
                else if (effect.to === 'hand') player.hand.push(card);
                else player.deck.unshift(card);
                return done(state);
            }
        }
    ]
};
