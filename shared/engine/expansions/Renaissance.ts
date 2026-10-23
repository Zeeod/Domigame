/**
 * Renaissance Expansion Module
 *
 * Kingdom cards, Artifacts (Flag, Horn, Key, Lantern, Treasure Chest) and the 20 Projects.
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { CardRegistry } from '../../cards/index.js';
import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { DurationManager } from '../DurationManager.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { GainEffectHandler } from '../effects/GainEffectHandler.js';
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow } from '../Play.js';
import { getMat } from '../Mats.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const def = (id: string) => CardRegistry.get(id);
const isType = (id: string, t: string) => !!def(id)?.types.includes(t as any);
const nameOf = (id: string) => def(id)?.name || id;
const costOf = (state: GameState, player: PlayerState, id: string) => EconomyEngine.getCardCost(state, player.id, id);
const has = (p: PlayerState, project: string) => (p.projects || []).includes(project);
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
function takeArtifact(state: GameState, player: PlayerState, id: string) {
    for (const p of state.players) p.artifacts = (p.artifacts || []).filter(a => a !== id);
    player.artifacts = [...(player.artifacts || []), id];
    EffectUtils.log(state, `${player.name} prend ${nameOf(id)}.`, player.id);
}
function reRegisterDuration(state: GameState, player: PlayerState, instanceId: string, cardId: string) {
    if (state.durations?.some(d => d.cardInstanceId === instanceId)) return;
    DurationManager.register(state, { cardInstanceId: instanceId, cardId, playerId: player.id, turnsRemaining: 1, effects: def(cardId)?.durationEffects || [] } as any);
}
/** Capitalism: Action cards with +$ in their instructions are also Treasures during your turns. */
function capitalismOverrides(): Record<string, any> {
    const o: Record<string, any> = {};
    for (const [id, d] of Object.entries(CardRegistry.getAll())) {
        if (!d.types.includes('ACTION') || d.types.includes('TREASURE')) continue;
        if ((d.effects || []).some((e: any) => e.type === 'ADD_MONEY' && typeof e.amount === 'number' && e.amount > 0)) {
            o[id] = { types: [...d.types, 'TREASURE'] };
        }
    }
    return o;
}

export const RenaissanceModule: ExpansionModule = {
    id: 'renaissance',
    name: 'Renaissance',

    costModifiers: [
        {
            // Canal: during your turns, cards cost $1 less
            id: 'renaissance:canal',
            priority: 57,
            modifier: (state, _playerId, _cardId, cost) => {
                const cur = state.players[state.currentPlayerIndex];
                return cur && has(cur, 'canal') ? cost - 1 : cost;
            }
        }
    ],

    eventHooks: [
        {
            id: 'renaissance:turn_start',
            event: 'TURN_START',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (player?.artifacts?.includes('key')) { player.coins += 1; EffectUtils.log(state, `${player.name} a la Clé : +1 💰.`, player.id); }
            }
        },
        {
            // Treasure Chest: at the start of your Buy phase, gain a Gold
            id: 'renaissance:buy_start',
            event: 'PHASE_ENTER',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                if (event.context?.phaseId !== 'BUY') return;
                const player = state.players[state.currentPlayerIndex];
                if (player?.artifacts?.includes('treasure_chest')) push(state, player.id, { type: 'GAIN_CARD', cardId: 'gold' });
            }
        },
        {
            // End of your Buy phase: Exploration (+1 Coffers +1 Villager if nothing bought), Pageant (pay $1 for +1 Coffers)
            id: 'renaissance:buy_end',
            event: 'PHASE_EXIT',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                if (event.context?.phaseId !== 'BUY') return;
                const player = state.players[state.currentPlayerIndex];
                if (!player) return;
                if (has(player, 'exploration') && !(player.cardsBoughtThisTurn || 0)) { player.coffers += 1; player.villagers = (player.villagers || 0) + 1; }
                if (has(player, 'pageant') && player.coins >= 1) { player.coins -= 1; player.coffers += 1; }
            }
        },
        {
            // Academy, Guildhall, Innovation; Road Network (another player gains a Victory card)
            id: 'renaissance:gain',
            event: 'CARD_GAINED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                const cid: string = event.context.gainedCardId;
                if (!player || !cid) return;
                if (has(player, 'academy') && isType(cid, 'ACTION')) player.villagers = (player.villagers || 0) + 1;
                if (has(player, 'guildhall') && isType(cid, 'TREASURE')) player.coffers += 1;
                if (has(player, 'innovation') && isType(cid, 'ACTION') && isCurrent(state, player)
                    && (player.gainedThisTurn || []).filter(id => isType(id, 'ACTION')).length === 1 && event.context.gainedInstanceId) {
                    push(state, player.id, options(`Innovation : mettre de côté et jouer ${nameOf(cid)} ?`, [
                        { label: 'Oui', effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: event.context.gainedInstanceId }] },
                        { label: 'Non', effects: [] }
                    ]));
                }
                if (isType(cid, 'VICTORY')) {
                    for (const p of state.players) if (p.id !== player.id && has(p, 'road_network')) push(state, p.id, { type: 'DRAW', amount: 1 });
                }
            }
        },
        {
            // Priest (+$2 per trash this turn), Sewers (may trash another card)
            id: 'renaissance:trash',
            event: 'CARD_TRASHED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player) return;
                const priest = (player as any).priestTurn;
                if (priest && priest.turn === state.turnNumber && isCurrent(state, player)) player.coins += 2 * priest.count;
                if (has(player, 'sewers') && !(state as any).sewersActive && player.hand.length) {
                    push(state, player.id, { type: 'SEWERS_TRASH' });
                }
            }
        },
        {
            id: 'renaissance:horn',
            event: 'PLAY_DISCARDED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player?.artifacts?.includes('horn')) return;
                const guard = (event.context.cards as CardInstance[]).find(c => c.id === 'border_guard');
                if (!guard) return;
                push(state, player.id, options('Cor : placer le Garde-frontière sur votre pioche ?', [
                    { label: 'Oui', effects: [{ type: 'TOPDECK_INSTANCE', instanceId: guard.instanceId }] },
                    { label: 'Non', effects: [] }
                ]));
            }
        },
        {
            // Citadel: the first time you play an Action card during each of your turns, replay it afterwards
            id: 'renaissance:citadel',
            event: 'AFTER_ACTION',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player || !has(player, 'citadel') || !isCurrent(state, player)) return;
                if ((player as any).citadelTurn === state.turnNumber) return;
                (player as any).citadelTurn = state.turnNumber;
                if (player.playArea.some(c => c.instanceId === event.context.cardInstanceId)) {
                    push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: event.context.cardInstanceId });
                }
            }
        }
    ],

    effectHandlers: [
        { type: 'TAKE_ARTIFACT', handler: (state, player, effect: any) => { takeArtifact(state, player, effect.artifact); return done(state); } },
        {
            // Border Guard: reveal 2 (3 with the Lantern); one into your hand, discard the rest; all Actions → Lantern or Horn
            type: 'BORDER_GUARD',
            handler: (state, player) => {
                const n = player.artifacts?.includes('lantern') ? 3 : 2;
                const seen: CardInstance[] = [];
                for (let i = 0; i < n; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                EffectUtils.revealCards(state, seen, 'ALL', `${player.name} dévoile`);
                player.limbo.push(...seen);
                const allActions = seen.length === n && seen.every(c => isType(c.id, 'ACTION'));
                const after = allActions ? [options('Garde-frontière : prenez la Lanterne ou le Cor', [
                    { label: 'La Lanterne', effects: [{ type: 'TAKE_ARTIFACT', artifact: 'lantern' }] },
                    { label: 'Le Cor', effects: [{ type: 'TAKE_ARTIFACT', artifact: 'horn' }] }
                ])] : [];
                const seenIds = new Set<string>();
                push(state, player.id, options('Garde-frontière : quelle carte prendre en main ?', seen.filter(c => !seenIds.has(c.id) && seenIds.add(c.id)).map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'LIMBO_PICK_ONE', keep: c.instanceId, ids: seen.map(x => x.instanceId) }, ...after]
                }))));
                return done(state);
            }
        },
        {
            // Cargo Ship: once this turn, when you gain a card, you may set it aside on this; it comes to your hand next turn
            type: 'CARGO_SHIP',
            handler: (state, player, _e, ctx: any) => {
                const ship = ctx?.sourceCardInstanceId;
                push(state, player.id, { type: 'CANCEL_DURATION' }, { sourceCardInstanceId: ship }); // only a Duration if it holds a card
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: player.id, once: true, expires: 'END_OF_TURN',
                    effects: [{ type: 'CARGO_SHIP_OFFER', shipId: ship } as any], description: 'Cargo'
                } as any);
                return done(state);
            }
        },
        {
            type: 'CARGO_SHIP_OFFER',
            handler: (state, player, effect: any, ctx: any) => {
                const iid = ctx?.gainedInstanceId;
                if (!iid) return done(state);
                push(state, player.id, options(`Cargo : mettre ${nameOf(ctx.gainedCardId)} de côté pour votre prochain tour ?`, [
                    { label: 'Oui', effects: [{ type: 'CARGO_SHIP_LOAD', shipId: effect.shipId, instanceId: iid }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'CARGO_SHIP_LOAD',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (!card) return done(state);
                (card as any).setAsideBy = effect.shipId;
                getMat(player, 'cargo_ship').push(card);
                reRegisterDuration(state, player, effect.shipId, 'cargo_ship');
                return done(state);
            }
        },
        {
            type: 'CARGO_SHIP_RETURN',
            handler: (state, player, _e, ctx: any) => {
                for (const mat of ['cargo_ship', 'research']) {
                    const m = getMat(player, mat);
                    for (const c of m.filter(x => (x as any).setAsideBy === ctx?.sourceCardInstanceId)) {
                        m.splice(m.indexOf(c), 1); delete (c as any).setAsideBy; player.hand.push(c);
                    }
                }
                return done(state);
            }
        },
        { type: 'RESEARCH_RETURN', handler: (state, player, _e, ctx: any) => { push(state, player.id, { type: 'CARGO_SHIP_RETURN' }, ctx); return done(state); } },
        {
            // Experiment: when you gain this, gain another Experiment (that doesn't come with another)
            type: 'EXPERIMENT_ON_GAIN',
            handler: (state, player) => {
                if ((state as any).experimentChain) { (state as any).experimentChain = false; return done(state); }
                (state as any).experimentChain = true;
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'experiment' });
                return done(state);
            }
        },
        {
            // Hideout: if the trashed card is a Victory card, gain a Curse
            type: 'HIDEOUT_CURSE',
            handler: (state, player) => {
                if (state.lastTrashedCard && isType(state.lastTrashedCard.id, 'VICTORY')) push(state, player.id, { type: 'GAIN_CARD', cardId: 'curse' });
                return done(state);
            }
        },
        {
            // Improve: at the start of Clean-up, you may trash an Action you discard from play to gain a card costing exactly $1 more
            type: 'IMPROVE',
            handler: (state, player) => {
                (state.discardFromPlayEffects = state.discardFromPlayEffects || []).push({ playerId: player.id, turn: state.turnNumber, effect: { type: 'IMPROVE_PICK' } });
                return done(state);
            }
        },
        {
            type: 'IMPROVE_PICK',
            handler: (state, player) => {
                const ids = new Set(state.cleanupDiscardedFromPlay || []);
                const actions = player.discardPile.filter(c => ids.has(c.instanceId) && isType(c.id, 'ACTION'));
                if (!actions.length) return done(state);
                const seen = new Set<string>();
                push(state, player.id, options('Amélioration : écarter une Action défaussée du jeu pour une carte coûtant exactement 1 💰 de plus ?', [
                    ...actions.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: nameOf(c.id), effects: [{ type: 'IMPROVE_DO', instanceId: c.instanceId, cardId: c.id }] })),
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'IMPROVE_DO',
            handler: (state, player, effect: any) => {
                const idx = player.discardPile.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                const target = costOf(state, player, effect.cardId) + 1;
                TrashEffectHandler.trashCard(state, player, player.discardPile.splice(idx, 1)[0]);
                return GainEffectHandler.promptGainFromSupply(state, player, { exactCost: target }, {}, `Amélioration : recevez une carte coûtant exactement ${target} 💰`);
            }
        },
        {
            // Mountain Village: put a card from your discard pile into your hand; if you can't, +1 Card
            type: 'MOUNTAIN_VILLAGE',
            handler: (state, player) => {
                if (!player.discardPile.length) { push(state, player.id, { type: 'DRAW', amount: 1 }); return done(state); }
                push(state, player.id, { type: 'CHOOSE_FROM_ZONE', sourceZone: 'discardPile', destination: 'hand', min: 1, max: 1, message: 'Village de montagne : prenez une carte de votre défausse' });
                return done(state);
            }
        },
        {
            // Priest: for the rest of this turn, when you trash a card, +$2
            type: 'PRIEST',
            handler: (state, player) => {
                const p = (player as any).priestTurn;
                (player as any).priestTurn = { turn: state.turnNumber, count: p?.turn === state.turnNumber ? p.count + 1 : 1 };
                return done(state);
            }
        },
        {
            type: 'RECRUITER_VILLAGERS',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                if (t) player.villagers = (player.villagers || 0) + costOf(state, player, t.id);
                return done(state);
            }
        },
        {
            type: 'RESEARCH_START',
            handler: (state, player, _e, ctx: any) => {
                const research = ctx?.sourceCardInstanceId;
                if (!player.hand.length) { push(state, player.id, { type: 'CANCEL_DURATION' }, { sourceCardInstanceId: research }); return done(state); }
                push(state, player.id, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Recherche : écartez une carte', onSuccess: [{ type: 'RESEARCH', researchId: research }] });
                return done(state);
            }
        },
        {
            // Research: per $1 the trashed card costs, set aside a card from your deck (on this)
            type: 'RESEARCH',
            handler: (state, player, effect: any) => {
                const t = state.lastTrashedCard;
                const research = effect.researchId;
                const n = t ? costOf(state, player, t.id) : 0;
                let k = 0;
                for (let i = 0; i < n; i++) {
                    const c = takeTop(state, player);
                    if (!c) break;
                    (c as any).setAsideBy = research;
                    getMat(player, 'research').push(c); k++;
                }
                if (!k) push(state, player.id, { type: 'CANCEL_DURATION' }, { sourceCardInstanceId: research });
                return done(state);
            }
        },
        {
            // Scepter: +$2; or replay a non-Command Action card you played this turn that's still in play
            type: 'SCEPTER',
            handler: (state, player) => {
                const actions = player.playArea.filter(c => isType(c.id, 'ACTION') && !isType(c.id, 'COMMAND'));
                const seen = new Set<string>();
                push(state, player.id, options('Sceptre : choisissez', [
                    { label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                    ...actions.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: `Rejouer ${nameOf(c.id)}`, effects: [{ type: 'REPLAY_INSTANCE', instanceId: c.instanceId }] }))
                ]));
                return done(state);
            }
        },
        { type: 'REPLAY_INSTANCE', handler: (state, player, effect: any) => { push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: effect.instanceId }); return done(state); } },
        {
            type: 'SCULPTOR_CHECK',
            handler: (state, player) => {
                if (state.lastGainedCard && isType(state.lastGainedCard.id, 'TREASURE')) player.villagers = (player.villagers || 0) + 1;
                return done(state);
            }
        },
        {
            // Seer: reveal the top 3; the ones costing $2–$4 into your hand; the rest back in any order
            type: 'SEER',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 3; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                EffectUtils.revealCards(state, seen, 'ALL', `${player.name} dévoile`);
                const ok = (c: CardInstance) => { const k = costOf(state, player, c.id); return k >= 2 && k <= 4 && !def(c.id)?.potionCost && !def(c.id)?.debtCost; };
                player.hand.push(...seen.filter(ok));
                const rest = seen.filter(c => !ok(c));
                if (rest.length <= 1) { player.deck.unshift(...rest); return done(state); }
                player.limbo.push(...rest);
                push(state, player.id, { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Voyant : remettez les autres dans l\'ordre de votre choix' });
                return done(state);
            }
        },
        {
            // Swashbuckler: if your discard pile has any cards: +1 Coffers, then with 4+ Coffers take the Treasure Chest
            type: 'SWASHBUCKLER',
            handler: (state, player) => {
                if (!player.discardPile.length) return done(state);
                player.coffers += 1;
                if (player.coffers >= 4) takeArtifact(state, player, 'treasure_chest');
                return done(state);
            }
        },
        {
            // Treasurer: trash a Treasure from your hand; or gain a Treasure from the trash to your hand; or take the Key
            type: 'TREASURER',
            handler: (state, player) => {
                const opts: any[] = [];
                if (player.hand.some(c => isType(c.id, 'TREASURE'))) opts.push({ label: 'Écarter un Trésor de votre main', effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', filter: { cardTypes: ['TREASURE'] }, message: 'Trésorier : écartez un Trésor' }] });
                const inTrash = state.trash.filter(c => isType(c.id, 'TREASURE'));
                const seen = new Set<string>();
                for (const c of inTrash) if (!seen.has(c.id) && seen.add(c.id)) opts.push({ label: `Prendre ${nameOf(c.id)} du rebut en main`, effects: [{ type: 'TRASH_TO_HAND', instanceId: c.instanceId }] });
                opts.push({ label: 'Prendre la Clé', effects: [{ type: 'TAKE_ARTIFACT', artifact: 'key' }] });
                push(state, player.id, options('Trésorier : choisissez', opts));
                return done(state);
            }
        },
        {
            type: 'TRASH_TO_HAND',
            handler: (state, player, effect: any) => {
                const idx = state.trash.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) { const c = state.trash.splice(idx, 1)[0]; player.hand.push(c); state.lastGainedCard = c; }
                return done(state);
            }
        },
        {
            // Villain: each other player with 5+ cards discards one costing $2 or more (or reveals they can't)
            type: 'VILLAIN_HIT',
            handler: (state, victim) => {
                if (victim.hand.length < 5) return done(state);
                const ok = victim.hand.filter(c => costOf(state, victim, c.id) >= 2);
                if (!ok.length) { EffectUtils.revealCards(state, victim.hand, 'ALL', `${victim.name} dévoile sa main`); return done(state); }
                push(state, victim.id, { type: 'DISCARD', min: 1, max: 1, filter: { minCost: 2 }, message: 'Scélérat : défaussez une carte coûtant 2 💰 ou plus' });
                return done(state);
            }
        },

        // ---------------------------------------------------------------- Projects
        {
            // Piazza: reveal the top card; if it's an Action, play it
            type: 'PIAZZA',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                player.deck.unshift(top);
                if (isType(top.id, 'ACTION')) playCardNow(state, player, top.instanceId);
                return done(state);
            }
        },
        {
            // Silos: discard any number of Coppers, revealed, and draw that many cards
            type: 'SILOS',
            handler: (state, player) => {
                if (!player.hand.some(c => c.id === 'copper')) return done(state);
                pushAll(state, player.id, [
                    { type: 'ARTIFICER_START' },
                    { type: 'DISCARD', min: 0, max: 99, filter: { cardIds: ['copper'] }, message: 'Silos : défaussez des Cuivres pour piocher autant' },
                    { type: 'SILOS_DRAW' }
                ]);
                return done(state);
            }
        },
        { type: 'SILOS_DRAW', handler: (state, player) => { const n = (state as any).lastDiscardedCount || 0; if (n) push(state, player.id, { type: 'DRAW', amount: n }); return done(state); } },
        {
            // Sinister Plot: add a token here, or remove your tokens here for +1 Card each
            type: 'SINISTER_PLOT',
            handler: (state, player) => {
                const n = (player as any).sinisterPlot || 0;
                push(state, player.id, options(`Complot : ${n} jeton(s)`, [
                    { label: 'Ajouter un jeton', effects: [{ type: 'SINISTER_PLOT_SET', value: n + 1 }] },
                    ...(n ? [{ label: `Retirer les jetons : +${n} Carte(s)`, effects: [{ type: 'SINISTER_PLOT_SET', value: 0 }, { type: 'DRAW', amount: n }] }] : [])
                ]));
                return done(state);
            }
        },
        { type: 'SINISTER_PLOT_SET', handler: (state, player, effect: any) => { (player as any).sinisterPlot = effect.value; return done(state); } },
        {
            // Sewers: when you trash a card other than with this, you may trash a card from your hand
            type: 'SEWERS_TRASH',
            handler: (state, player) => {
                if (!player.hand.length) return done(state);
                pushAll(state, player.id, [
                    { type: 'SEWERS_FLAG', on: true },
                    { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Égouts : vous pouvez écarter une carte de votre main' },
                    { type: 'SEWERS_FLAG', on: false }
                ]);
                return done(state);
            }
        },
        { type: 'SEWERS_FLAG', handler: (state, _p, effect: any) => { (state as any).sewersActive = effect.on; return done(state); } },
        {
            // Buying Capitalism: from then on, during your turns, Actions with +$ are also Treasures
            type: 'CAPITALISM',
            handler: (state, player) => {
                const all = (state.playerCardOverrides = state.playerCardOverrides || {});
                all[player.id] = { ...capitalismOverrides(), ...(all[player.id] || {}) };
                return done(state);
            }
        }
    ]
};
