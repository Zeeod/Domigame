/**
 * Rising Sun — rules of the 10 Events.
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
import { discardCards } from '../Discard.js';
import { playCardNow } from '../Play.js';
import { getMat } from '../Mats.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const def = (id: string) => CardRegistry.get(id);
const isType = (id: string, t: string) => !!def(id)?.types.includes(t as any);
const costOf = (state: GameState, player: PlayerState, id: string) => EconomyEngine.getCardCost(state, player.id, id);
/** A "pure $" cost (no Debt, no Potion): what "costing up to $X" can match. */
const coinOnly = (id: string) => !def(id)?.debtCost && !def(id)?.potionCost;

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
/** Supply piles (by top card) that can be gained with this test. */
function supplyIds(state: GameState, test: (id: string) => boolean): string[] {
    return Object.keys(state.supply).filter(k => {
        const p = state.supply[k];
        if (!p || p.count <= 0) return false;
        const top = p.cards?.length ? p.cards[p.cards.length - 1].id : k;
        return test(top);
    });
}

export const RisingSunRulesModule: ExpansionModule = {
    id: 'rising_sun_rules',
    name: 'Soleil Levant (règles)',

    eventHooks: [
        {
            // Kintsugi: "if you've gained a Gold this game"
            id: 'rising_sun:gold',
            event: 'CARD_GAINED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                if (event.context?.gainedCardId !== 'gold') return;
                const p = state.players.find(x => x.id === event.playerId);
                if (p) (p as any).gainedGold = true;
            }
        }
    ],

    effectHandlers: [
        {
            // Amass: if you have no Action cards in play, gain an Action card costing up to $5
            type: 'AMASS',
            handler: (state, player) => {
                if (player.playArea.some(c => isType(c.id, 'ACTION'))) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 5, cardTypes: ['ACTION'] }, {}, 'Amasser : recevez une carte Action coûtant jusqu\'à 5 💰');
            }
        },
        {
            // Asceticism: pay any amount of $ to trash that many cards from your hand
            type: 'ASCETICISM',
            handler: (state, player) => askCards(state, player, 'ASCETICISM_PICK', `Ascétisme : écartez des cartes (1 💰 chacune, jusqu'à ${Math.min(player.coins, player.hand.length)})`,
                player.hand, 0, Math.min(player.coins, player.hand.length))
        },
        {
            // Credit: gain an Action or Treasure costing up to $8; +Debt equal to its cost
            type: 'CREDIT',
            handler: (state, player) => {
                const ids = supplyIds(state, id => (isType(id, 'ACTION') || isType(id, 'TREASURE')) && coinOnly(id) && costOf(state, player, id) <= 8);
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids, maxCost: 8 }, { next: [{ type: 'DEBT_FOR_GAINED' }] },
                    'Crédit : recevez une carte Action ou Trésor coûtant jusqu\'à 8 💰 (Dette égale à son coût)');
            }
        },
        {
            type: 'DEBT_FOR_GAINED',
            handler: (state, player) => {
                const g = state.lastGainedCard;
                if (!g) return done(state);
                const n = Math.max(0, costOf(state, player, g.id));
                player.debt = (player.debt || 0) + n;
                if (n) EffectUtils.log(state, `${player.name} prend ${n} Dette.`, player.id);
                return done(state);
            }
        },
        {
            // Foresight: reveal until an Action; set it aside (into your hand at end of turn), discard the rest
            type: 'FORESIGHT',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                let found: CardInstance | undefined;
                while (!found) {
                    if (!player.deck.length) {
                        if (!player.discardPile.length) break;
                        EffectUtils.reshuffleDiscard(state, player);
                        player.discardPile = [];
                    }
                    const c = player.deck.shift()!;
                    if (isType(c.id, 'ACTION')) found = c; else seen.push(c);
                }
                EffectUtils.revealCards(state, found ? [...seen, found] : seen, 'ALL', `${player.name} dévoile`);
                discardCards(state, player, seen);
                if (found) getMat(player, 'save').push(found);
                return done(state);
            }
        },
        {
            // Kintsugi: if you've gained a Gold this game, gain a card costing up to $2 more than the trashed card
            type: 'KINTSUGI',
            handler: (state, player) => {
                if (!(player as any).gainedGold) return done(state);
                push(state, player.id, { type: 'GAIN_CARD_PLUS_COST', costBonus: 2 });
                return done(state);
            }
        },
        {
            // Practice: you may play an Action card from your hand twice
            type: 'PRACTICE',
            handler: (state, player) => askCards(state, player, 'PRACTICE_PICK', 'Entraînement : jouer deux fois une Action de votre main ?',
                player.hand.filter(c => isType(c.id, 'ACTION')), 0, 1)
        },
        {
            // Sea Trade: +1 Card per Action in play; trash up to that many cards from your hand
            type: 'SEA_TRADE',
            handler: (state, player) => {
                const n = player.playArea.filter(c => isType(c.id, 'ACTION')).length;
                if (!n) return done(state);
                push(state, player.id, { type: 'TRASH', min: 0, max: n, from: 'hand', message: `Commerce maritime : écartez jusqu'à ${n} carte(s)` });
                push(state, player.id, { type: 'DRAW', amount: n });
                return done(state);
            }
        },
        {
            // Receive Tribute: with 3+ cards gained this turn, gain up to 3 differently named Actions not in play
            type: 'RECEIVE_TRIBUTE',
            handler: (state, player, effect: any) => {
                if (effect.left === undefined && (player.gainedThisTurn || []).length < 3) return done(state);
                const left = effect.left ?? 3;
                const taken: string[] = effect.taken || [];
                if (left <= 0) return done(state);
                const inPlay = new Set(player.playArea.map(c => c.id));
                const ids = supplyIds(state, id => isType(id, 'ACTION') && !inPlay.has(id) && !taken.includes(id));
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids, maxCost: 99 },
                    { next: [{ type: 'RECEIVE_TRIBUTE_NEXT', left: left - 1, taken }] },
                    `Recevoir le tribut : recevez une carte Action (encore ${left})`, true);
            }
        },
        {
            type: 'RECEIVE_TRIBUTE_NEXT',
            handler: (state, player, effect: any) => {
                const g = state.lastGainedCard;
                push(state, player.id, { type: 'RECEIVE_TRIBUTE', left: effect.left, taken: [...effect.taken, ...(g ? [g.id] : [])] });
                return done(state);
            }
        },
        {
            // Gather: gain a card costing exactly $3, $4, $5 (none optional)
            type: 'GAIN_EXACT',
            handler: (state, player, effect: any) => {
                const ids = supplyIds(state, id => coinOnly(id) && costOf(state, player, id) === effect.cost);
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids, exactCost: effect.cost }, {},
                    `Rassemblement : recevez une carte coûtant exactement ${effect.cost} 💰`);
            }
        },
        {
            // Continue: gain a non-Attack Action up to $4, return to your Action phase and play it; +1 Action +1 Buy
            type: 'CONTINUE',
            handler: (state, player) => {
                player.actions += 1; player.buys += 1;
                const ids = supplyIds(state, id => isType(id, 'ACTION') && !isType(id, 'ATTACK') && coinOnly(id) && costOf(state, player, id) <= 4);
                push(state, player.id, { type: 'CHANGE_PHASE', phase: 'ACTION' });
                if (!ids.length) return done(state);
                return GainEffectHandler.promptGainFromSupply(state, player, { cardIds: ids, maxCost: 4 }, { next: [{ type: 'PLAY_LAST_GAINED' }] },
                    'Continuer : recevez une carte Action non-Attaque coûtant jusqu\'à 4 💰');
            }
        },
        {
            type: 'PLAY_LAST_GAINED',
            handler: (state, player) => {
                const g = state.lastGainedCard;
                if (g) push(state, player.id, { type: 'PLAY_INSTANCE_IF_OWNED', instanceId: g.instanceId });
                return done(state);
            }
        }
    ],

    onLoad: () => {
        const pick = (state: GameState, playerId: string, payload: any, decision: any) => {
            const player = state.players.find(p => p.id === playerId);
            return { player, ids: player ? chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id)) : [] };
        };
        EffectEngine.registerDecisionHandler('ASCETICISM_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            for (const id of ids.slice(0, player.coins)) {
                const idx = player.hand.findIndex(c => c.instanceId === id);
                if (idx === -1) continue;
                player.coins -= 1;
                TrashEffectHandler.trashCard(state, player, player.hand.splice(idx, 1)[0]);
            }
        });
        EffectEngine.registerDecisionHandler('PRACTICE_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player || !ids[0]) return;
            push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: ids[0] });
            playCardNow(state, player, ids[0]);
        });
    }
};
