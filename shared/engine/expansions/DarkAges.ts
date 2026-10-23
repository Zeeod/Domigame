/**
 * Dark Ages Expansion Module
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
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow } from '../Play.js';
import { TriggerEffectHandler } from '../effects/TriggerEffectHandler.js';

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
function takeTop(state: GameState, player: PlayerState): CardInstance | undefined {
    if (player.deck.length === 0) EffectUtils.reshuffleDiscard(state, player);
    return player.deck.shift();
}
function options(message: string, opts: { label: string; effects: any[] }[]) {
    return { type: 'SELECT_OPTION', message, options: opts };
}
/** Ask the player to pick from their hand; the answer goes to `specialAction`'s decision handler. */
function askHand(state: GameState, player: PlayerState, specialAction: string, message: string, filter: any, extra: any = {}, min = 0) {
    const candidates = EffectUtils.filterCards(player.hand, filter);
    if (candidates.length === 0) return done(state);
    state.pendingDecision = {
        id: `${specialAction.toLowerCase()}_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any, message,
        constraints: { min, max: 1, sourceZone: 'hand', filter },
        context: { specialAction, candidates: candidates.map(c => c.instanceId), ...extra }
    } as any;
    return { state, needsChoice: true };
}

export const DarkAgesModule: ExpansionModule = {
    id: 'dark_ages',
    name: 'Âge des Ténèbres',

    effectHandlers: [
        {
            // Band of Misfits: play a non-Command Action card from the Supply that costs less than this, leaving it there
            type: 'BAND_OF_MISFITS',
            handler: (state, player) => {
                const max = costOf(state, player, 'band_of_misfits') - 1;
                const candidates = Object.keys(state.supply).filter(id => {
                    const d = def(id);
                    if (!d || state.supply[id].count <= 0) return false;
                    if (!d.types.includes('ACTION') || d.types.includes('COMMAND')) return false;
                    return costOf(state, player, id) <= max && !d.potionCost && !d.debtCost;
                });
                if (!candidates.length) return done(state);
                state.pendingDecision = {
                    id: `bom_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any,
                    message: 'Bande de marginaux : choisissez une carte Action de la réserve à jouer (elle y reste)',
                    constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { cardIds: candidates } },
                    context: { specialAction: 'PLAY_FROM_SUPPLY', candidates }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            // Beggar / Market Square reactions: discard this card from your hand
            type: 'DISCARD_SELF_FROM_HAND',
            handler: (state, player, _e, ctx) => {
                const idx = player.hand.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) discardCard(state, player, player.hand.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Catacombs: look at the top 3 cards. Choose one: put them into your hand; or discard them and +3 Cards.
            type: 'CATACOMBS',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 3; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                push(state, player.id, options(`Catacombes : ${seen.map(c => nameOf(c.id)).join(', ')}`, [
                    { label: 'Les prendre en main', effects: [{ type: 'LIMBO_TO', ids: seen.map(c => c.instanceId), to: 'hand' }] },
                    { label: 'Les défausser et +3 Cartes', effects: [{ type: 'LIMBO_TO', ids: seen.map(c => c.instanceId), to: 'discard' }, { type: 'DRAW', amount: 3 }] }
                ]));
                return done(state);
            }
        },
        {
            type: 'LIMBO_TO',
            handler: (state, player, effect: any) => {
                const cards = (effect.ids as string[]).map(id => player.limbo.find(c => c.instanceId === id)).filter(Boolean) as CardInstance[];
                player.limbo = player.limbo.filter(c => !cards.includes(c));
                if (effect.to === 'hand') player.hand.push(...cards);
                else if (effect.to === 'deck') player.deck.unshift(...cards);
                else discardCards(state, player, cards);
                return done(state);
            }
        },
        {
            // Count: trash your hand
            type: 'TRASH_HAND',
            handler: (state, player) => {
                const cards = player.hand.splice(0);
                for (const c of cards) TrashEffectHandler.trashCard(state, player, c);
                return done(state);
            }
        },
        {
            // Counterfeit: you may play a non-Duration Treasure from your hand twice. If you do, trash it.
            type: 'COUNTERFEIT',
            handler: (state, player) => askHand(state, player, 'COUNTERFEIT_PICK',
                'Contrefaçon : jouer deux fois un Trésor (puis l\'écarter) ?', { cardTypes: ['TREASURE'], excludeTypes: ['DURATION'] })
        },
        {
            type: 'TRASH_FROM_PLAY',
            handler: (state, player, effect: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Death Cart: you may trash an Action card from your hand. If you don't, trash this.
            type: 'DEATH_CART',
            handler: (state, player, _e, ctx) => {
                const self = ctx?.sourceCardInstanceId;
                const trashSelf = { type: 'TRASH_FROM_PLAY', instanceId: self };
                if (!player.hand.some(c => isType(c.id, 'ACTION'))) { push(state, player.id, trashSelf); return done(state); }
                push(state, player.id, options('Chariot funèbre : que voulez-vous écarter ?', [
                    { label: 'Une carte Action de ma main', effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', filter: { cardTypes: ['ACTION'] }, message: 'Écartez une carte Action' }] },
                    { label: 'Le Chariot funèbre', effects: [trashSelf] }
                ]));
                return done(state);
            }
        },
        {
            // Fortress: when you trash this, put it into your hand
            type: 'FORTRESS_RETURN',
            handler: (state, player, _e, ctx) => {
                const idx = state.trash.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) player.hand.push(state.trash.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Hermit: look through your discard pile. You may trash a non-Treasure card from your discard pile or hand.
            type: 'HERMIT',
            handler: (state, player) => {
                const opts: any[] = [];
                const seen = new Set<string>();
                for (const [zone, label] of [['hand', 'main'], ['discardPile', 'défausse']] as const) {
                    for (const c of player[zone]) {
                        if (isType(c.id, 'TREASURE') || seen.has(zone + c.id)) continue;
                        seen.add(zone + c.id);
                        opts.push({ label: `${nameOf(c.id)} (${label})`, effects: [{ type: 'TRASH_INSTANCE', instanceId: c.instanceId }] });
                    }
                }
                if (!opts.length) return done(state);
                opts.push({ label: 'Ne rien écarter', effects: [] });
                push(state, player.id, options('Ermite : écarter une carte non-Trésor de votre main ou de votre défausse ?', opts));
                return done(state);
            }
        },
        {
            type: 'TRASH_INSTANCE',
            handler: (state, player, effect: any) => {
                const card = EffectUtils.removeCardFromPlayer(state, player, effect.instanceId);
                if (card) TrashEffectHandler.trashCard(state, player, card);
                return done(state);
            }
        },
        {
            // Hermit: when you discard this from play, if you didn't buy any cards this turn, trash this and gain a Madman
            type: 'HERMIT_ON_DISCARD',
            handler: (state, player, _e, ctx) => {
                if ((player.cardsBoughtThisTurn || 0) > 0) return done(state);
                const card = (ctx?.sourceCardInstanceId ? EffectUtils.removeCardFromPlayer(state, player, ctx.sourceCardInstanceId) : undefined);
                if (!card) return done(state);
                TrashEffectHandler.trashCard(state, player, card);
                push(state, player.id, { type: 'GAIN_CARD', cardId: 'madman' });
                return done(state);
            }
        },
        {
            // Ironmonger: reveal the top card; you may discard it. Either way: Action +1 Action, Treasure +$1, Victory +1 Card
            type: 'IRONMONGER',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                player.deck.unshift(top);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                const bonus: any[] = [];
                if (isType(top.id, 'ACTION')) bonus.push({ type: 'ADD_ACTIONS', amount: 1 });
                if (isType(top.id, 'TREASURE')) bonus.push({ type: 'ADD_MONEY', amount: 1 });
                if (isType(top.id, 'VICTORY')) bonus.push({ type: 'DRAW', amount: 1 });
                push(state, player.id, options(`Ferronnier : ${nameOf(top.id)}`, [
                    { label: 'La défausser', effects: [{ type: 'DISCARD_TOP_IF', instanceId: top.instanceId }, ...bonus] },
                    { label: 'La laisser', effects: bonus }
                ]));
                return done(state);
            }
        },
        {
            type: 'DISCARD_TOP_IF',
            handler: (state, player, effect: any) => {
                if (player.deck[0]?.instanceId === effect.instanceId) discardCard(state, player, player.deck.shift()!);
                return done(state);
            }
        },
        {
            // Madman: … if you returned it to its pile, +1 Card per card in your hand
            type: 'MADMAN_DRAW',
            handler: (state, player) => {
                if ((state as any).lastReturnedToPile && player.hand.length) push(state, player.id, { type: 'DRAW', amount: player.hand.length });
                return done(state);
            }
        },
        {
            // Pillage: trash this. If you did, gain 2 Spoils, and each other player with 5+ cards in hand
            // reveals their hand and discards a card that you choose.
            type: 'PILLAGE',
            handler: (state, player, _e, ctx) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx === -1) return done(state);
                TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                pushAll(state, player.id, [
                    { type: 'GAIN_CARD', cardId: 'spoils' }, { type: 'GAIN_CARD', cardId: 'spoils' },
                    { type: 'ATTACK', attackEffects: [{ type: 'PILLAGE_ATTACK' }] }
                ]);
                return done(state);
            }
        },
        {
            type: 'PILLAGE_ATTACK',
            handler: (state, victim, _e, ctx: any) => {
                if (victim.hand.length < 5 || !ctx?.attackerId) return done(state);
                EffectUtils.revealCards(state, victim.hand, 'ALL', `${victim.name} dévoile sa main`);
                const seen = new Set<string>();
                const opts = victim.hand.filter(c => !seen.has(c.id) && seen.add(c.id))
                    .map(c => ({ label: nameOf(c.id), effects: [{ type: 'DISCARD_FROM_HAND_OF', targetId: victim.id, instanceId: c.instanceId }] }));
                push(state, ctx.attackerId, options(`Pillage : quelle carte ${victim.name} défausse-t-il ?`, opts));
                return done(state);
            }
        },
        {
            type: 'DISCARD_FROM_HAND_OF',
            handler: (state, _p, effect: any) => {
                const t = state.players.find(p => p.id === effect.targetId);
                const idx = t ? t.hand.findIndex(c => c.instanceId === effect.instanceId) : -1;
                if (t && idx !== -1) discardCard(state, t, t.hand.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Procession: you may play a non-Duration Action card from your hand twice. Trash it.
            // Gain an Action card costing exactly $1 more than it.
            type: 'PROCESSION',
            handler: (state, player) => askHand(state, player, 'PROCESSION_PICK',
                'Procession : jouer deux fois une Action (non-Durée), puis l\'écarter ?', { cardTypes: ['ACTION'], excludeTypes: ['DURATION'] })
        },
        {
            type: 'PROCESSION_END',
            handler: (state, player, effect: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.playArea.splice(idx, 1)[0]);
                const target = costOf(state, player, effect.cardId) + 1;
                return GainEffectHandler.promptGainFromSupply(state, player, { exactCost: target, cardTypes: ['ACTION'] }, {},
                    `Procession : recevez une carte Action coûtant exactement ${target} 💰`);
            }
        },
        {
            // Rebuild: reveal until a Victory card you did not name; discard the rest, trash it,
            // gain a Victory card costing up to $3 more than it.
            type: 'REBUILD',
            handler: (state, player) => {
                push(state, player.id, { type: 'NAME_CARD', message: 'Reconstruction : nommez une carte', next: [{ type: 'REBUILD_DIG' }] });
                return done(state);
            }
        },
        {
            type: 'REBUILD_DIG',
            handler: (state, player, _e, ctx: any) => {
                const named = ctx?.namedCardId ?? (state as any).lastNamedCard;
                const revealed: CardInstance[] = [];
                let found: CardInstance | undefined;
                for (;;) {
                    const c = takeTop(state, player);
                    if (!c) break;
                    if (isType(c.id, 'VICTORY') && c.id !== named) { found = c; break; }
                    revealed.push(c);
                }
                if (revealed.length) { EffectUtils.revealCards(state, revealed, 'ALL', `${player.name} dévoile`); discardCards(state, player, revealed); }
                if (!found) return done(state);
                TrashEffectHandler.trashCard(state, player, found);
                const max = costOf(state, player, found.id) + 3;
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: max, cardTypes: ['VICTORY'] }, {},
                    `Reconstruction : recevez une carte Victoire coûtant jusqu'à ${max} 💰`);
            }
        },
        {
            // Rogue: if there are cards in the trash costing $3–$6, gain one; otherwise each other player reveals the
            // top 2 cards of their deck, trashes one of them costing $3–$6, and discards the rest.
            type: 'ROGUE',
            handler: (state, player) => {
                const inTrash = state.trash.filter(c => { const k = costOf(state, player, c.id); return k >= 3 && k <= 6; });
                if (inTrash.length) {
                    const seen = new Set<string>();
                    push(state, player.id, options('Voleur : recevez une carte du rebut coûtant de 3 à 6 💰',
                        inTrash.filter(c => !seen.has(c.id) && seen.add(c.id)).map(c => ({ label: nameOf(c.id), effects: [{ type: 'GAIN_FROM_TRASH_INSTANCE', instanceId: c.instanceId }] }))));
                    return done(state);
                }
                push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'ROGUE_ATTACK' }] });
                return done(state);
            }
        },
        {
            type: 'GAIN_FROM_TRASH_INSTANCE',
            handler: (state, player, effect: any) => {
                const idx = state.trash.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                const card = state.trash.splice(idx, 1)[0];
                player.discardPile.push(card);
                state.lastGainedCard = card;
                EffectUtils.log(state, `${player.name} reçoit ${nameOf(card.id)} du rebut.`, player.id);
                TriggerEffectHandler.triggerOnGainEffects(state, player, card);
                return done(state);
            }
        },
        {
            type: 'ROGUE_ATTACK',
            handler: (state, victim) => {
                const two: CardInstance[] = [];
                for (let i = 0; i < 2; i++) { const c = takeTop(state, victim); if (c) two.push(c); }
                if (!two.length) return done(state);
                EffectUtils.revealCards(state, two, 'ALL', `${victim.name} dévoile`);
                const ok = two.filter(c => { const k = costOf(state, victim, c.id); return k >= 3 && k <= 6; });
                victim.limbo.push(...two);
                const ids = two.map(c => c.instanceId);
                if (ok.length <= 1 || ok[0].id === ok[1]?.id) {
                    const t = ok[0];
                    pushAll(state, victim.id, [
                        ...(t ? [{ type: 'TRASH_LIMBO', instanceId: t.instanceId }] : []),
                        { type: 'LIMBO_TO', ids, to: 'discard' }
                    ]);
                } else {
                    push(state, victim.id, options('Voleur : quelle carte écarter ?', ok.map(c => ({
                        label: nameOf(c.id), effects: [{ type: 'TRASH_LIMBO', instanceId: c.instanceId }, { type: 'LIMBO_TO', ids, to: 'discard' }]
                    }))));
                }
                return done(state);
            }
        },
        {
            type: 'TRASH_LIMBO',
            handler: (state, player, effect: any) => {
                const idx = player.limbo.findIndex(c => c.instanceId === effect.instanceId);
                if (idx !== -1) TrashEffectHandler.trashCard(state, player, player.limbo.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Scavenger: you may put your deck into your discard pile (this is not discarding)
            type: 'MAY_DISCARD_DECK',
            handler: (state, player) => {
                if (!player.deck.length) return done(state);
                push(state, player.id, options('Charognard : mettre votre pioche dans votre défausse ?', [
                    { label: 'Oui', effects: [{ type: 'DECK_TO_DISCARD' }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'DECK_TO_DISCARD',
            handler: (state, player) => {
                player.discardPile.push(...player.deck.splice(0));
                return done(state);
            }
        },
        {
            // Urchin: when you play another Attack card with this in play, you may first trash this, to gain a Mercenary
            type: 'URCHIN_OFFER',
            handler: (state, player, _e, ctx: any) => {
                const urchin = ctx?.sourceCardInstanceId;
                if (!urchin || ctx?.cardInstanceId === urchin || !player.playArea.some(c => c.instanceId === urchin)) return done(state);
                push(state, player.id, options('Gamin des rues : l\'écarter pour recevoir un Mercenaire ?', [
                    { label: 'Oui', effects: [{ type: 'TRASH_FROM_PLAY', instanceId: urchin }, { type: 'GAIN_CARD', cardId: 'mercenary' }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Vagrant: reveal the top card; if it's a Curse, Ruins, Shelter, or Victory card, put it into your hand
            type: 'VAGRANT',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                if (['CURSE', 'RUINS', 'SHELTER', 'VICTORY'].some(t => isType(top.id, t))) player.hand.push(top);
                else player.deck.unshift(top);
                return done(state);
            }
        },
        {
            // Wandering Minstrel: reveal the top 3 cards; put the Actions back in any order and discard the rest
            type: 'WANDERING_MINSTREL',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 3; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                EffectUtils.revealCards(state, seen, 'ALL', `${player.name} dévoile`);
                const actions = seen.filter(c => isType(c.id, 'ACTION'));
                discardCards(state, player, seen.filter(c => !actions.includes(c)));
                if (actions.length <= 1) { player.deck.unshift(...actions); return done(state); }
                player.limbo.push(...actions);
                push(state, player.id, { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Ménestrel errant : remettez les Actions dans l\'ordre de votre choix' });
                return done(state);
            }
        },
        {
            // Cultist: you may play a Cultist from your hand
            type: 'MAY_PLAY_FROM_HAND',
            handler: (state, player, effect: any) => askHand(state, player, 'PLAY_FROM_HAND', effect.message || 'Jouer une carte de votre main ?', effect.filter || {})
        }
    ],

    onLoad: () => {
        const owned = (state: GameState, id: string) => state.players.find(p => p.id === id);
        const picked = (payload: any, decision: any) => chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id));
        const playTwiceThen = (state: GameState, player: PlayerState, id: string, after: any) => {
            push(state, player.id, after);
            push(state, player.id, { type: 'PLAY_THIS_CARD' }, { sourceCardInstanceId: id });
            playCardNow(state, player, id);
        };
        EffectEngine.registerDecisionHandler('COUNTERFEIT_PICK', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            if (player && id) playTwiceThen(state, player, id, { type: 'TRASH_FROM_PLAY', instanceId: id });
        });
        EffectEngine.registerDecisionHandler('PROCESSION_PICK', (state, playerId, payload, decision) => {
            const player = owned(state, playerId);
            const id = player && picked(payload, decision)[0];
            const card = id ? player!.hand.find(c => c.instanceId === id) : undefined;
            if (player && card) playTwiceThen(state, player, card.instanceId, { type: 'PROCESSION_END', instanceId: card.instanceId, cardId: card.id });
        });
    }
};
