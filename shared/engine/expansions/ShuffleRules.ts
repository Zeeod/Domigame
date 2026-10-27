/**
 * "When you shuffle" choices, made on the cards of the discard pile before they are shuffled:
 *  - Avoid (Plunder Event): pick up to 3 to stay in the discard pile (next shuffle this turn)
 *  - Order of Masons (Allies): pick up to 2 per Favor spent to stay in the discard pile
 *  - Order of Astrologers (Allies): pick 1 per Favor spent to go on top
 *  - Fated (Plunder Trait): Fated cards may go on top or on the bottom
 * The draw that triggered the shuffle carries on afterwards (DrawEffectHandler.shuffleHooks).
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EffectEngine } from '../EffectEngine.js';
import { DrawEffectHandler } from '../effects/DrawEffectHandler.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const nameOf = (id: string) => CardRegistry.get(id)?.name || id;
const allyIs = (state: GameState, id: string) => (state.landscapes || []).includes(id);
const fatedPile = (state: GameState) => Object.keys(state.supply).find(k => state.supply[k].traits?.includes('fated'));

interface Sel { keep: string[]; top: string[]; bottom: string[] }
const sel = (p: PlayerState): Sel => ((p as any).shuffleSel = (p as any).shuffleSel || { keep: [], top: [], bottom: [] });
const free = (p: PlayerState) => { const s = sel(p); return p.discardPile.filter(c => !s.keep.includes(c.instanceId) && !s.top.includes(c.instanceId) && !s.bottom.includes(c.instanceId)); };

function ask(state: GameState, player: PlayerState, step: string, message: string, pool: CardInstance[], max: number) {
    if (!pool.length || max <= 0) return done(state);
    state.pendingDecision = {
        id: `shuffle_${step}_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any, message,
        constraints: { min: 0, max: Math.min(max, pool.length), sourceZone: 'discardPile' },
        context: { specialAction: 'SHUFFLE_PICK', step, candidates: pool.map(c => c.instanceId), cards: pool.map(c => ({ id: c.id, instanceId: c.instanceId })) }
    } as any;
    return { state, needsChoice: true };
}

/** The choices this player has to make on their next shuffle, or undefined. */
function shuffleChoice(state: GameState, player: PlayerState): any | undefined {
    if (!player.discardPile.length) return undefined;
    const steps: string[] = [];
    if ((player as any).avoidTurn === state.turnNumber) steps.push('avoid');
    if (allyIs(state, 'order_of_masons') && (player.favors || 0) > 0 && player.discardPile.length > 1) steps.push('masons');
    if (allyIs(state, 'order_of_astrologers') && (player.favors || 0) > 0 && player.discardPile.length > 1) steps.push('astrologers');
    const fp = fatedPile(state);
    if (fp && player.discardPile.some(c => c.id === fp)) steps.push('fated_top', 'fated_bottom');
    return steps.length ? { type: 'SHUFFLE_CHOICES', steps } : undefined;
}

export const ShuffleRulesModule: ExpansionModule = {
    id: 'shuffle_rules',
    name: 'Choix au mélange',

    effectHandlers: [
        {
            type: 'SHUFFLE_CHOICES',
            handler: (state, player, effect: any) => {
                (player as any).shuffleSel = { keep: [], top: [], bottom: [] };
                const fx = [...effect.steps.map((s: string) => ({ type: 'SHUFFLE_STEP', step: s })), { type: 'SHUFFLE_FINISH' }];
                for (let i = fx.length - 1; i >= 0; i--) state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: fx[i], context: {} });
                return done(state);
            }
        },
        {
            type: 'SHUFFLE_STEP',
            handler: (state, player, effect: any) => {
                const fp = fatedPile(state);
                const favors = player.favors || 0;
                switch (effect.step) {
                    case 'avoid':
                        (player as any).avoidTurn = undefined;
                        return ask(state, player, 'keep', 'Esquive : choisissez jusqu\'à 3 cartes qui restent dans votre défausse', free(player), 3);
                    case 'masons':
                        return ask(state, player, 'masons', `Ordre des maçons : jusqu'à 2 cartes par Faveur dépensée restent dans votre défausse (${favors} Faveur(s))`, free(player), 2 * favors);
                    case 'astrologers':
                        return ask(state, player, 'astrologers', `Ordre des astrologues : une carte par Faveur dépensée va sur le dessus (${favors} Faveur(s))`, free(player), favors);
                    case 'fated_top':
                        return ask(state, player, 'top', `Destiné : quelles cartes ${nameOf(fp!)} placer sur le dessus ?`, free(player).filter(c => c.id === fp), 99);
                    case 'fated_bottom':
                        return ask(state, player, 'bottom', `Destiné : quelles cartes ${nameOf(fp!)} placer sous la pioche ?`, free(player).filter(c => c.id === fp), 99);
                }
                return done(state);
            }
        },
        {
            type: 'SHUFFLE_FINISH',
            handler: (state, player) => {
                const s = sel(player);
                (player as any).shuffleSel = undefined;
                const take = (ids: string[]) => ids.map(id => player.discardPile.find(c => c.instanceId === id)).filter(Boolean) as CardInstance[];
                const kept = take(s.keep), top = take(s.top), bottom = take(s.bottom);
                const rest = player.discardPile.filter(c => !kept.includes(c) && !top.includes(c) && !bottom.includes(c));
                EffectUtils.log(state, `${player.name} mélange sa pioche.`, player.id);
                player.discardPile = rest;
                EffectUtils.reshuffleDiscard(state, player);
                player.deck = [...top, ...player.deck, ...bottom];
                player.discardPile = kept;
                return done(state);
            }
        }
    ],

    onLoad: () => {
        if (!DrawEffectHandler.shuffleHooks.some(h => (h as any).hookKey === 'shuffle')) {
            (shuffleChoice as any).hookKey = 'shuffle';
            DrawEffectHandler.shuffleHooks.push(shuffleChoice);
        }
        EffectEngine.registerDecisionHandler('SHUFFLE_PICK', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const ids = chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id));
            const s = sel(player);
            const step = decision.context.step;
            if (step === 'masons') {
                const spend = Math.ceil(ids.length / 2);
                player.favors = (player.favors || 0) - spend;
                s.keep.push(...ids);
            } else if (step === 'astrologers') {
                player.favors = (player.favors || 0) - ids.length;
                s.top.push(...ids);
            } else if (step === 'keep') s.keep.push(...ids);
            else if (step === 'top') s.top.push(...ids);
            else if (step === 'bottom') s.bottom.push(...ids);
        });
    }
};
