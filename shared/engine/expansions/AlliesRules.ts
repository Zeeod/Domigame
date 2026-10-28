/**
 * Allies — rules: Favors, the Ally in play, Liaisons, the Kingdom cards and the split piles.
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
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { discardCard, discardCards } from '../Discard.js';
import { playCardNow, playOverrides } from '../Play.js';
import { getMat } from '../Mats.js';
import { setupHooks } from '../KingdomRules.js';
import { RulesValidator } from '../RulesValidator.js';
import { VictoryChecker } from '../VictoryChecker.js';

const done = (state: GameState) => ({ state, needsChoice: false });
const def = (id: string) => CardRegistry.get(id);
const isType = (id: string, t: string) => !!def(id)?.types.includes(t as any);
const nameOf = (id: string) => def(id)?.name || id;
const costOf = (state: GameState, player: PlayerState, id: string) => EconomyEngine.getCardCost(state, player.id, id);
const isCurrent = (state: GameState, p: PlayerState) => state.players[state.currentPlayerIndex]?.id === p.id;
const favors = (p: PlayerState) => p.favors || 0;

/** The Ally used in this game (one at most). */
export function activeAlly(state: GameState): string | undefined {
    return (state.landscapes || []).find(id => isType(id, 'ALLY'));
}
const allyIs = (state: GameState, id: string) => activeAlly(state) === id;

function push(state: GameState, playerId: string, effect: any, context: any = {}) {
    state.effectStack.push({ type: 'EFFECT', playerId, effect, context });
}
function pushAll(state: GameState, playerId: string, effects: any[], context: any = {}) {
    for (let i = effects.length - 1; i >= 0; i--) push(state, playerId, effects[i], context);
}
function options(message: string, opts: { label: string; effects: any[] }[]) {
    return { type: 'SELECT_OPTION', message, options: opts };
}
/** "You may spend N Favors to …": a yes/no question, only asked when the player has N Favors. */
function maySpend(state: GameState, player: PlayerState, n: number, message: string, effects: any[]) {
    if (favors(player) < n) return;
    push(state, player.id, options(message, [
        { label: `Oui (−${n} Faveur${n > 1 ? 's' : ''})`, effects: [{ type: 'SPEND_FAVORS', amount: n }, ...effects] },
        { label: 'Non', effects: [] }
    ]));
}
function takeTop(state: GameState, player: PlayerState): CardInstance | undefined {
    if (player.deck.length === 0) EffectUtils.reshuffleDiscard(state, player);
    return player.deck.shift();
}
function uniqueByName(cards: CardInstance[]): CardInstance[] {
    const seen = new Set<string>();
    return cards.filter(c => !seen.has(c.id) && !!seen.add(c.id));
}
function askCards(state: GameState, player: PlayerState, specialAction: string, message: string, pool: CardInstance[], zone: string, min: number, max: number, extra: any = {}) {
    if (!pool.length) return done(state);
    state.pendingDecision = {
        id: `${specialAction.toLowerCase()}_${Date.now()}`, playerId: player.id, type: 'CHOOSE_CARDS' as any, message,
        constraints: { min: Math.min(min, pool.length), max: Math.min(max, pool.length), sourceZone: zone },
        context: { specialAction, candidates: pool.map(c => c.instanceId), cards: pool.map(c => ({ id: c.id, instanceId: c.instanceId })), ...extra }
    } as any;
    return { state, needsChoice: true };
}
const pileTop = (state: GameState, pile: string) => {
    const p = state.supply[pile];
    return p?.cards?.length ? p.cards[p.cards.length - 1].id : pile;
};

/** Push a rule hook once, even if the module is loaded again. */
function addOnce<T extends (...a: any[]) => any>(list: T[], key: string, fn: T) {
    if (list.some(f => (f as any).hookKey === key)) return;
    (fn as any).hookKey = key;
    list.push(fn);
}

/** Setup: one Favor each when an Ally is used; Importer: +4 Favors each. */
export function setupAllies(state: GameState): void {
    if ((state as any).alliesSetupDone) return;
    (state as any).alliesSetupDone = true;
    const n = (activeAlly(state) ? 1 : 0) + ((state.kingdomCards || []).includes('importer') ? 4 : 0);
    if (n) for (const p of state.players) p.favors = (p.favors || 0) + n;
}

export const AlliesRulesModule: ExpansionModule = {
    id: 'allies_rules',
    name: 'Alliés (règles)',

    costModifiers: [
        {
            // Family of Inventors: cards cost $1 less per Favor token on their pile
            id: 'allies:family_of_inventors',
            priority: 45,
            modifier: (state, _playerId, cardId, cost) => {
                const tokens = (state as any).inventorTokens as Record<string, number> | undefined;
                if (!tokens) return cost;
                const pile = Object.keys(state.supply).find(k => k === cardId || state.supply[k].cards?.some(c => c.id === cardId));
                return pile && tokens[pile] ? cost - tokens[pile] : cost;
            }
        }
    ],

    eventHooks: [
        {
            // Allies "at the start of your turn"
            id: 'allies:turn_start',
            event: 'TURN_START',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                const ally = activeAlly(state);
                if (!p || !ally) return;
                if (ally === 'cave_dwellers') push(state, p.id, { type: 'CAVE_DWELLERS' });
                if (ally === 'desert_guides') push(state, p.id, { type: 'DESERT_GUIDES' });
                if (ally === 'crafters_guild') maySpend(state, p, 2, 'Guilde des artisans : 2 Faveurs pour recevoir une carte jusqu\'à 4 💰 sur votre pioche ?',
                    [{ type: 'GAIN_CARD', maxCost: 4, destination: 'deck', message: 'Guilde des artisans : recevez une carte coûtant jusqu\'à 4 💰' }]);
                if (ally === 'forest_dwellers') maySpend(state, p, 1, 'Habitants des forêts : 1 Faveur pour regarder les 3 cartes du dessus ?', [{ type: 'FOREST_DWELLERS' }]);
                if (ally === 'mountain_folk') maySpend(state, p, 5, 'Peuple des montagnes : 5 Faveurs pour +3 Cartes ?', [{ type: 'DRAW', amount: 3 }]);
                if (ally === 'gang_of_pickpockets' && p.hand.length > 4) {
                    const discard = { type: 'DISCARD', targetSize: 4, message: 'Bande de pickpockets : défaussez jusqu\'à avoir 4 cartes en main' };
                    if (favors(p) >= 1) push(state, p.id, options('Bande de pickpockets : dépenser une Faveur pour ne pas défausser ?', [
                        { label: 'Dépenser une Faveur', effects: [{ type: 'SPEND_FAVORS', amount: 1 }] },
                        { label: 'Défausser jusqu\'à 4 cartes', effects: [discard] }
                    ]));
                    else push(state, p.id, discard);
                }
            }
        },
        {
            // Allies "at the start of your Buy phase"
            id: 'allies:buy_start',
            event: 'PHASE_ENTER',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                if (event.context?.phaseId !== 'BUY') return;
                const p = state.players[state.currentPlayerIndex];
                const ally = activeAlly(state);
                if (!p || !ally) return;
                if (ally === 'league_of_bankers') {
                    const n = Math.floor(favors(p) / 4);
                    if (n) { p.coins += n; EffectUtils.log(state, `Ligue des banquiers : ${p.name} reçoit +${n} 💰.`, p.id); }
                }
                if (ally === 'family_of_inventors') push(state, p.id, { type: 'INVENTORS' });
                if (ally === 'market_towns') push(state, p.id, { type: 'MARKET_TOWNS' });
                if (ally === 'peaceful_cult') push(state, p.id, { type: 'PEACEFUL_CULT' });
                if (ally === 'woodcarvers_guild' && p.hand.some(c => isType(c.id, 'ACTION'))) {
                    maySpend(state, p, 1, 'Guilde des sculpteurs sur bois : 1 Faveur pour écarter une Action et en recevoir une ?', [
                        { type: 'TRASH', min: 1, max: 1, from: 'hand', filter: { cardTypes: ['ACTION'] }, message: 'Écartez une carte Action',
                            onSuccess: [{ type: 'GAIN_CARD', maxCost: 99, cardTypes: ['ACTION'], message: 'Recevez une carte Action' }] }
                    ]);
                }
            }
        },
        {
            // Allies "when you gain a card"
            id: 'allies:gain',
            event: 'CARD_GAINED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                const cid: string = event.context?.gainedCardId;
                const iid: string = event.context?.gainedInstanceId;
                const ally = activeAlly(state);
                if (!p || !cid || !ally) return;
                const cost = costOf(state, p, cid);
                if (ally === 'architects_guild') maySpend(state, p, 2, `Guilde des architectes : 2 Faveurs pour une carte non-Victoire coûtant moins que ${nameOf(cid)} ?`,
                    [{ type: 'GAIN_CARD', maxCost: cost - 1, nonVictory: true, message: `Recevez une carte non-Victoire coûtant jusqu'à ${cost - 1} 💰` }]);
                if (ally === 'band_of_nomads' && cost >= 3 && favors(p) >= 1) push(state, p.id, options('Bande de nomades : dépenser une Faveur ?', [
                    { label: '+1 Carte', effects: [{ type: 'SPEND_FAVORS', amount: 1 }, { type: 'DRAW', amount: 1 }] },
                    { label: '+1 Action', effects: [{ type: 'SPEND_FAVORS', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }] },
                    { label: '+1 Achat', effects: [{ type: 'SPEND_FAVORS', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }] },
                    { label: 'Non', effects: [] }
                ]));
                if (ally === 'city_state' && iid && isType(cid, 'ACTION') && isCurrent(state, p)) {
                    maySpend(state, p, 2, `Cité-État : 2 Faveurs pour jouer ${nameOf(cid)} ?`, [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: iid }]);
                }
                if (ally === 'trappers_lodge' && iid) maySpend(state, p, 1, `Maison des trappeurs : 1 Faveur pour placer ${nameOf(cid)} sur votre pioche ?`,
                    [{ type: 'GAINED_CARD_TO', to: 'deck', callContext: { gainedInstanceId: iid } }]);
            }
        },
        {
            // Fellowship of Scribes: after playing an Action, with 4 or fewer cards in hand, 1 Favor for +1 Card
            id: 'allies:after_action',
            event: 'AFTER_ACTION',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                if (p && allyIs(state, 'fellowship_of_scribes') && p.hand.length <= 4) {
                    maySpend(state, p, 1, 'Confrérie des scribes : 1 Faveur pour +1 Carte ?', [{ type: 'DRAW', amount: 1 }]);
                }
            }
        },
        {
            // Cards discarded from play: Merchant Camp and Tent may go onto the deck; Island Folk (end of turn)
            id: 'allies:play_discarded',
            event: 'PLAY_DISCARDED',
            priority: 'NORMAL',
            handler: (state, event: any) => {
                const p = state.players.find(x => x.id === event.playerId);
                if (!p) return;
                for (const c of (event.context.cards as CardInstance[])) {
                    if (!(def(c.id) as any)?.topdeckWhenDiscarded) continue;
                    push(state, p.id, options(`${nameOf(c.id)} : la placer sur votre pioche ?`, [
                        { label: 'Oui', effects: [{ type: 'TOPDECK_INSTANCE', instanceId: c.instanceId }] }, { label: 'Non', effects: [] }
                    ]));
                }
                if (allyIs(state, 'island_folk') && state.previousTurnPlayerId !== p.id && !(state.extraTurns || []).some(t => t.playerId === p.id)) {
                    maySpend(state, p, 5, 'Peuple des îles : 5 Faveurs pour jouer un autre tour ?', [{ type: 'SCHEDULE_EXTRA_TURN', turnType: 'EXTRA' }]);
                }
            }
        }
    ],

    effectHandlers: [
        {
            // After playing a Liaison: Circle of Witches, League of Shopkeepers
            type: 'LIAISON_PLAYED',
            handler: (state, player) => {
                const ally = activeAlly(state);
                if (ally === 'league_of_shopkeepers') {
                    if (favors(player) >= 5) player.coins += 1;
                    if (favors(player) >= 10) { player.actions += 1; player.buys += 1; }
                }
                if (ally === 'circle_of_witches') maySpend(state, player, 3, 'Cercle de sorcières : 3 Faveurs pour donner une Malédiction aux autres joueurs ?',
                    [{ type: 'OTHERS_GAIN_CURSE' }]);
                return done(state);
            }
        },
        {
            type: 'OTHERS_GAIN_CURSE',
            handler: (state, player) => {
                const i = state.players.findIndex(p => p.id === player.id);
                const others = [...state.players.slice(i + 1), ...state.players.slice(0, i)];
                for (const p of others.reverse()) push(state, p.id, { type: 'GAIN_CARD', cardId: 'curse' });
                return done(state);
            }
        },
        {
            // "This turn, when you gain a card, you may put it onto your deck" (Bauble)
            type: 'GAINS_MAY_TOPDECK',
            handler: (state, player, effect: any) => {
                if ((player as any).topdeckGainsTurn === state.turnNumber) return done(state);
                (player as any).topdeckGainsTurn = state.turnNumber;
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: player.id, once: false, expires: 'END_OF_TURN', description: effect.source || 'Babiole',
                    effects: [options(`${effect.source || 'Babiole'} : placer la carte reçue sur votre pioche ?`, [
                        { label: 'Oui', effects: [{ type: 'GAINED_CARD_TO', to: 'deck' }] }, { label: 'Non', effects: [] }])]
                } as any);
                return done(state);
            }
        },

        // ------------------------------------------------------------ Allies
        {
            // Cave Dwellers: 1 Favor → discard a card then draw a card; repeat as desired
            type: 'CAVE_DWELLERS',
            handler: (state, player) => {
                if (favors(player) < 1 || !player.hand.length) return done(state);
                push(state, player.id, options('Troglodytes : 1 Faveur pour défausser puis piocher une carte ?', [
                    { label: 'Oui (−1 Faveur)', effects: [{ type: 'SPEND_FAVORS', amount: 1 }, { type: 'DISCARD', amount: 1, message: 'Troglodytes : défaussez une carte' },
                        { type: 'DRAW', amount: 1 }, { type: 'CAVE_DWELLERS' }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Desert Guides: 1 Favor → discard your hand and draw 5; repeat as desired
            type: 'DESERT_GUIDES',
            handler: (state, player) => {
                if (favors(player) < 1) return done(state);
                push(state, player.id, options('Guides du désert : 1 Faveur pour défausser votre main et piocher 5 cartes ?', [
                    { label: 'Oui (−1 Faveur)', effects: [{ type: 'SPEND_FAVORS', amount: 1 }, { type: 'DISCARD', forceAll: true }, { type: 'DRAW', amount: 5 }, { type: 'DESERT_GUIDES' }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Forest Dwellers: look at the top 3, discard any number, put the rest back in any order
            type: 'FOREST_DWELLERS',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 3; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                pushAll(state, player.id, [
                    { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 0, max: seen.length, action: 'DISCARD', message: 'Habitants des forêts : défaussez autant de cartes que vous voulez' },
                    { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Habitants des forêts : remettez les autres dans l\'ordre de votre choix' }
                ]);
                return done(state);
            }
        },
        {
            // Family of Inventors: put a Favor token on a non-Victory Supply pile
            type: 'INVENTORS',
            handler: (state, player) => {
                if (favors(player) < 1) return done(state);
                const piles = Object.keys(state.supply).filter(id => state.supply[id].count > 0 && !isType(pileTop(state, id), 'VICTORY'));
                if (!piles.length) return done(state);
                push(state, player.id, options('Famille d\'inventeurs : placer une Faveur sur une pile (−1 💰 pour ses cartes) ?', [
                    ...piles.map(id => ({ label: nameOf(pileTop(state, id)), effects: [{ type: 'SPEND_FAVORS', amount: 1 }, { type: 'INVENTOR_TOKEN', pile: id }] })),
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'INVENTOR_TOKEN',
            handler: (state, _player, effect: any) => {
                const t = ((state as any).inventorTokens = (state as any).inventorTokens || {});
                t[effect.pile] = (t[effect.pile] || 0) + 1;
                const pile = state.supply[effect.pile] as any;
                pile.tokens = { ...(pile.tokens || {}), favor: t[effect.pile] };
                return done(state);
            }
        },
        {
            // Market Towns: 1 Favor → play an Action from your hand; repeat as desired
            type: 'MARKET_TOWNS',
            handler: (state, player) => {
                const actions = player.hand.filter(c => isType(c.id, 'ACTION'));
                if (favors(player) < 1 || !actions.length) return done(state);
                return askCards(state, player, 'MARKET_TOWNS_PICK', 'Villes de marché : dépenser une Faveur pour jouer une Action de votre main ?', actions, 'hand', 0, 1);
            }
        },
        {
            // Peaceful Cult: spend any number of Favors to trash that many cards from your hand
            type: 'PEACEFUL_CULT',
            handler: (state, player) => {
                const n = Math.min(favors(player), player.hand.length);
                if (!n) return done(state);
                return askCards(state, player, 'PEACEFUL_CULT_PICK', `Culte paisible : écartez des cartes (1 Faveur chacune, jusqu'à ${n})`, player.hand, 'hand', 0, n);
            }
        },

        // ------------------------------------------------------------ Kingdom cards
        {
            // Barbarian (per victim): trash the top card; $3+ → a cheaper card sharing a type, otherwise a Curse
            type: 'BARBARIAN_HIT',
            handler: (state, victim) => {
                const top = takeTop(state, victim);
                if (!top) return done(state);
                TrashEffectHandler.trashCard(state, victim, top);
                const cost = costOf(state, victim, top.id);
                if (cost >= 3) {
                    const types = (def(top.id)?.types || []) as string[];
                    push(state, victim.id, { type: 'GAIN_CARD', maxCost: cost - 1, cardTypes: types, message: `Barbare : recevez une carte moins chère que ${nameOf(top.id)} ayant un type en commun` });
                } else push(state, victim.id, { type: 'GAIN_CARD', cardId: 'curse' });
                return done(state);
            }
        },
        {
            // Broker: +1 Card / Action / $ / Favor per $1 the trashed card costs
            type: 'BROKER_PICK',
            handler: (state, player) => {
                const t = state.lastTrashedCard;
                const n = t ? costOf(state, player, t.id) : 0;
                if (!n) return done(state);
                push(state, player.id, options(`Courtier : choisissez (${n} par 💰)`, [
                    { label: `+${n} Carte(s)`, effects: [{ type: 'DRAW', amount: n }] },
                    { label: `+${n} Action(s)`, effects: [{ type: 'ADD_ACTIONS', amount: n }] },
                    { label: `+${n} 💰`, effects: [{ type: 'ADD_MONEY', amount: n }] },
                    { label: `+${n} Faveur(s)`, effects: [{ type: 'ADD_FAVORS', amount: n }] }
                ]));
                return done(state);
            }
        },
        {
            // Capital City: may discard 2 cards for +$2; may pay $2 for +2 Cards
            type: 'CAPITAL_CITY',
            handler: (state, player) => {
                push(state, player.id, { type: 'CAPITAL_CITY_PAY' });
                if (player.hand.length >= 2) push(state, player.id, options('Capitale : défausser 2 cartes pour +2 💰 ?', [
                    { label: 'Oui', effects: [{ type: 'DISCARD', amount: 2, message: 'Capitale : défaussez 2 cartes' }, { type: 'ADD_MONEY', amount: 2 }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            type: 'CAPITAL_CITY_PAY',
            handler: (state, player) => {
                if (player.coins < 2) return done(state);
                push(state, player.id, options('Capitale : payer 2 💰 pour +2 Cartes ?', [
                    { label: 'Oui', effects: [{ type: 'ADD_MONEY', amount: -2 }, { type: 'DRAW', amount: 2 }] },
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Carpenter
            type: 'CARPENTER',
            handler: (state, player) => {
                const anyEmpty = Object.values(state.supply).some(p => p.count === 0);
                if (!anyEmpty) {
                    player.actions += 1;
                    push(state, player.id, { type: 'GAIN_CARD', maxCost: 4, message: 'Charpentier : recevez une carte coûtant jusqu\'à 4 💰' });
                } else {
                    push(state, player.id, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Charpentier : écartez une carte', onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2 }] });
                }
                return done(state);
            }
        },
        {
            // Contract: you may set aside an Action from your hand to play it at the start of your next turn
            type: 'CONTRACT',
            handler: (state, player, _e, ctx: any) => {
                const actions = player.hand.filter(c => isType(c.id, 'ACTION'));
                if (!actions.length) { push(state, player.id, { type: 'CANCEL_DURATION' }, ctx); return done(state); }
                return askCards(state, player, 'SET_ASIDE_PLAY_NEXT', 'Contrat : mettre de côté une Action, jouée au début de votre prochain tour ?', actions, 'hand', 0, 1,
                    { holder: ctx?.sourceCardInstanceId, label: 'Contrat' });
            }
        },
        {
            // Courier: discard the top card of your deck; you may play an Action or Treasure from your discard pile
            type: 'COURIER',
            handler: (state, player) => {
                const top = takeTop(state, player);
                if (top) discardCard(state, player, top);
                const pool = player.discardPile.filter(c => isType(c.id, 'ACTION') || isType(c.id, 'TREASURE'));
                if (!pool.length) return done(state);
                push(state, player.id, options('Messager : jouer une carte de votre défausse ?', [
                    ...uniqueByName(pool).map(c => ({ label: nameOf(c.id), effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId }] })),
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Emissary: +3 Cards; if this made you shuffle, +1 Action and +2 Favors
            type: 'EMISSARY',
            handler: (state, player) => {
                const shuffles = player.deck.length < 3 && player.discardPile.length > 0;
                EffectUtils.drawCards(state, player, 3);
                if (shuffles) { player.actions += 1; player.favors = favors(player) + 2; }
                return done(state);
            }
        },
        {
            // Highwayman (per victim): until the attacker's next turn, their first Treasure each turn does nothing
            type: 'HIGHWAYMAN_HIT',
            handler: (state, victim, _e, ctx: any) => {
                const list = ((state as any).highwaymen = (state as any).highwaymen || []);
                list.push({ attackerId: ctx?.attackerId, victimId: victim.id });
                return done(state);
            }
        },
        {
            type: 'HIGHWAYMAN_END',
            handler: (state, player) => {
                (state as any).highwaymen = ((state as any).highwaymen || []).filter((h: any) => h.attackerId !== player.id);
                return done(state);
            }
        },
        {
            // Hunter: reveal the top 3; put an Action, a Treasure and a Victory card from them into your hand
            type: 'HUNTER',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 3; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                EffectUtils.revealCards(state, seen, 'ALL', `${player.name} dévoile`);
                player.limbo.push(...seen);
                const ids = seen.map(c => c.instanceId);
                pushAll(state, player.id, ['ACTION', 'TREASURE', 'VICTORY'].map(t => ({ type: 'HUNTER_TAKE', cardType: t, ids }))
                    .concat([{ type: 'LIMBO_TO', ids, to: 'discard' } as any]));
                return done(state);
            }
        },
        {
            type: 'HUNTER_TAKE',
            handler: (state, player, effect: any) => {
                const pool = player.limbo.filter(c => effect.ids.includes(c.instanceId) && isType(c.id, effect.cardType));
                if (!pool.length) return done(state);
                const names = uniqueByName(pool);
                const take = (c: CardInstance) => { player.limbo = player.limbo.filter(x => x !== c); player.hand.push(c); };
                if (names.length === 1) { take(pool[0]); return done(state); }
                const label: Record<string, string> = { ACTION: 'Action', TREASURE: 'Trésor', VICTORY: 'Victoire' };
                push(state, player.id, options(`Chasseur : quelle carte ${label[effect.cardType]} prendre en main ?`,
                    names.map(c => ({ label: nameOf(c.id), effects: [{ type: 'LIMBO_TO', ids: [c.instanceId], to: 'hand' }] }))));
                return done(state);
            }
        },
        {
            // Marquis: +1 Card per card in your hand; discard down to 10 cards in hand
            type: 'MARQUIS',
            handler: (state, player) => {
                EffectUtils.drawCards(state, player, player.hand.length);
                if (player.hand.length > 10) push(state, player.id, { type: 'DISCARD', targetSize: 10, message: 'Marquis : défaussez jusqu\'à avoir 10 cartes en main' });
                return done(state);
            }
        },
        {
            // Royal Galley: you may play a non-Duration Action from your hand; set it aside, play it next turn
            type: 'ROYAL_GALLEY',
            handler: (state, player, _e, ctx: any) => {
                const pool = player.hand.filter(c => isType(c.id, 'ACTION') && !isType(c.id, 'DURATION'));
                if (!pool.length) { push(state, player.id, { type: 'CANCEL_DURATION' }, ctx); return done(state); }
                return askCards(state, player, 'ROYAL_GALLEY_PICK', 'Galère royale : jouer une Action non-Durée (rejouée au prochain tour) ?', pool, 'hand', 0, 1,
                    { holder: ctx?.sourceCardInstanceId });
            }
        },
        {
            type: 'SET_ASIDE_FOR_NEXT_TURN',
            handler: (state, player, effect: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === effect.instanceId);
                if (idx === -1) return done(state);
                player.aside.push(player.playArea.splice(idx, 1)[0]);
                (state.triggers = state.triggers || []).push({
                    type: 'START_TURN', playerId: player.id, once: true, description: effect.label || 'Galère royale',
                    effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: effect.instanceId } as any]
                } as any);
                return done(state);
            }
        },
        {
            // Sentinel: look at the top 5, trash up to 2, put the rest back in any order
            type: 'SENTINEL',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 5; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                pushAll(state, player.id, [
                    { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 0, max: Math.min(2, seen.length), action: 'TRASH', message: 'Sentinelle : écartez jusqu\'à 2 cartes' },
                    { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Sentinelle : remettez les autres dans l\'ordre de votre choix' }
                ]);
                return done(state);
            }
        },
        {
            // Specialist: you may play an Action or Treasure from your hand; replay it, or gain a copy
            type: 'SPECIALIST',
            handler: (state, player) => {
                const pool = player.hand.filter(c => isType(c.id, 'ACTION') || isType(c.id, 'TREASURE'));
                return askCards(state, player, 'SPECIALIST_PICK', 'Spécialiste : jouer une Action ou un Trésor de votre main ?', pool, 'hand', 0, 1);
            }
        },
        {
            type: 'SPECIALIST_AFTER',
            handler: (state, player, effect: any) => {
                push(state, player.id, options(`Spécialiste : ${nameOf(effect.cardId)}`, [
                    { label: 'La rejouer', effects: [{ type: 'PLAY_THIS_CARD' }] },
                    { label: 'En recevoir une copie', effects: [{ type: 'GAIN_CARD', cardId: effect.cardId }] }
                ]), { sourceCardInstanceId: effect.instanceId });
                return done(state);
            }
        },
        {
            // Swap: you may return an Action from your hand to its pile, to gain to your hand a different Action up to $5
            type: 'SWAP',
            handler: (state, player) => {
                const pool = player.hand.filter(c => isType(c.id, 'ACTION'));
                return askCards(state, player, 'SWAP_PICK', 'Échange : remettre une Action de votre main sur sa pile ?', pool, 'hand', 0, 1);
            }
        },

        // ------------------------------------------------------------ Split piles
        {
            // Herb Gatherer: put your deck into your discard pile; you may play a Treasure from it
            type: 'HERB_GATHERER',
            handler: (state, player) => {
                if (player.deck.length) { player.discardPile.push(...player.deck); player.deck = []; }
                const pool = player.discardPile.filter(c => isType(c.id, 'TREASURE'));
                if (!pool.length) return done(state);
                push(state, player.id, options('Cueilleuse d\'herbes : jouer un Trésor de votre défausse ?', [
                    ...uniqueByName(pool).map(c => ({ label: nameOf(c.id), effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: c.instanceId }] })),
                    { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Acolyte: you may trash this to gain an Augur
            type: 'ACOLYTE_SELF',
            handler: (state, player, _e, ctx: any) => {
                if (!player.playArea.some(c => c.instanceId === ctx?.sourceCardInstanceId) || !(state.supply.augurs_pile?.count > 0)) return done(state);
                push(state, player.id, options('Acolyte : écarter cette carte pour recevoir un Augure ?', [
                    { label: 'Oui', effects: [{ type: 'TRASH_SELF' }, { type: 'GAIN_CARD', cardId: 'augurs_pile' }] }, { label: 'Non', effects: [] }
                ]), ctx);
                return done(state);
            }
        },
        {
            // Sorceress: reveal the top card and put it into your hand; if it's the named card, Curses for the others
            type: 'SORCERESS',
            handler: (state, player, _e, ctx: any) => {
                const named = ctx?.namedCardId ?? (state as any).lastNamedCard;
                const top = takeTop(state, player);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
                player.hand.push(top);
                if (top.id === named) push(state, player.id, { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] });
                return done(state);
            }
        },
        {
            // Sibyl: put a card from your hand on top of your deck, and another on the bottom
            type: 'SIBYL',
            handler: (state, player) => {
                push(state, player.id, { type: 'SIBYL_BOTTOM' });
                return askCards(state, player, 'SIBYL_TOP', 'Sibylle : placez une carte sur votre pioche', player.hand, 'hand', 1, 1);
            }
        },
        {
            type: 'SIBYL_BOTTOM',
            handler: (state, player) => askCards(state, player, 'SIBYL_BOTTOM_PICK', 'Sibylle : placez une autre carte sous votre pioche', player.hand, 'hand', 1, 1)
        },
        {
            // Battle Plan: may reveal an Attack for +1 Card; may rotate any Supply pile
            type: 'BATTLE_PLAN',
            handler: (state, player) => {
                const piles = Object.keys(state.supply).filter(id => new Set((state.supply[id].cards || []).map(c => c.id)).size > 1);
                if (piles.length) push(state, player.id, options('Plan de bataille : retourner une pile de la réserve ?', [
                    ...piles.map(id => ({ label: nameOf(id), effects: [{ type: 'ROTATE_PILE', pileId: id }] })), { label: 'Non', effects: [] }
                ]));
                if (player.hand.some(c => isType(c.id, 'ATTACK'))) push(state, player.id, options('Plan de bataille : dévoiler une Attaque pour +1 Carte ?', [
                    { label: 'Oui', effects: [{ type: 'DRAW', amount: 1 }] }, { label: 'Non', effects: [] }
                ]));
                return done(state);
            }
        },
        {
            // Archer (per victim with 5+ cards): reveal all but one; the attacker picks one of those to discard
            type: 'ARCHER_HIT',
            handler: (state, victim, _e, ctx: any) => {
                if (victim.hand.length < 5) return done(state);
                return askCards(state, victim, 'ARCHER_HIDE', 'Archer : choisissez la carte que vous ne dévoilez pas', victim.hand, 'hand', 1, 1,
                    { attackerId: ctx?.attackerId });
            }
        },
        {
            type: 'ARCHER_DISCARD',
            handler: (state, _attacker, effect: any) => {
                const victim = state.players.find(p => p.id === effect.victimId);
                const idx = victim ? victim.hand.findIndex(c => c.id === effect.cardId && c.instanceId !== effect.hiddenId) : -1;
                if (victim && idx !== -1) discardCard(state, victim, victim.hand.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Warlord (per victim): can't play an Action from hand with 2+ copies in play, until the attacker's next turn
            type: 'WARLORD_HIT',
            handler: (state, victim, _e, ctx: any) => {
                ((state as any).warlords = (state as any).warlords || []).push({ attackerId: ctx?.attackerId, victimId: victim.id });
                return done(state);
            }
        },
        {
            type: 'WARLORD_END',
            handler: (state, player) => {
                (state as any).warlords = ((state as any).warlords || []).filter((w: any) => w.attackerId !== player.id);
                return done(state);
            }
        },
        {
            // Territory: when you gain this, gain a Gold per empty Supply pile
            type: 'TERRITORY_GOLDS',
            handler: (state, player) => {
                const n = Object.values(state.supply).filter(p => p.count === 0).length;
                for (let i = 0; i < n; i++) push(state, player.id, { type: 'GAIN_CARD', cardId: 'gold' });
                return done(state);
            }
        },
        {
            // Garrison: this turn, when you gain a card, add a token here; next turn +1 Card per token
            type: 'GARRISON',
            handler: (state, player, _e, ctx: any) => {
                const id = ctx?.sourceCardInstanceId;
                if (!id) return done(state);
                (state.triggers = state.triggers || []).push({
                    type: 'ON_GAIN', playerId: player.id, once: false, expires: 'END_OF_TURN', description: 'Garnison',
                    effects: [{ type: 'GARRISON_TOKEN', instanceId: id } as any]
                } as any);
                return done(state);
            }
        },
        {
            type: 'GARRISON_TOKEN',
            handler: (state, _player, effect: any) => {
                state.cardTokens = state.cardTokens || {};
                state.cardTokens[effect.instanceId] = (state.cardTokens[effect.instanceId] || 0) + 1;
                return done(state);
            }
        },
        {
            type: 'GARRISON_DRAW',
            handler: (state, player, _e, ctx: any) => {
                const id = ctx?.sourceCardInstanceId;
                const n = (id && state.cardTokens?.[id]) || 0;
                if (id && state.cardTokens) delete state.cardTokens[id];
                if (n) push(state, player.id, { type: 'DRAW', amount: n });
                return done(state);
            }
        },
        {
            // Hill Fort: put the gained card into your hand, or +1 Card and +1 Action
            type: 'HILL_FORT',
            handler: (state, player) => {
                const g = state.lastGainedCard;
                push(state, player.id, options('Fort de colline : choisissez', [
                    ...(g ? [{ label: `Prendre ${nameOf(g.id)} en main`, effects: [{ type: 'GAINED_CARD_TO', to: 'hand', callContext: { gainedInstanceId: g.instanceId } }] }] : []),
                    { label: '+1 Carte et +1 Action', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }] }
                ]));
                return done(state);
            }
        },
        {
            // Sunken Treasure: gain an Action card you don't have a copy of in play
            type: 'SUNKEN_TREASURE',
            handler: (state, player) => {
                const inPlay = [...new Set(player.playArea.map(c => c.id))];
                return GainEffectHandler.promptGainFromSupply(state, player, { maxCost: 99, cardTypes: ['ACTION'], excludeIds: inPlay }, {},
                    'Trésor englouti : recevez une carte Action que vous n\'avez pas en jeu');
            }
        },
        {
            // Miller: look at the top 4; put one into your hand and discard the rest
            type: 'MILLER',
            handler: (state, player) => {
                const seen: CardInstance[] = [];
                for (let i = 0; i < 4; i++) { const c = takeTop(state, player); if (c) seen.push(c); }
                if (!seen.length) return done(state);
                player.limbo.push(...seen);
                const ids = seen.map(c => c.instanceId);
                push(state, player.id, options('Meunier : quelle carte prendre en main ?', uniqueByName(seen).map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'LIMBO_TO', ids: [c.instanceId], to: 'hand' }, { type: 'LIMBO_TO', ids, to: 'discard' }]
                }))));
                return done(state);
            }
        },
        {
            // Elder: you may play an Action from your hand; its choice of abilities gets one more option
            type: 'ELDER',
            handler: (state, player) => {
                const pool = player.hand.filter(c => isType(c.id, 'ACTION'));
                return askCards(state, player, 'ELDER_PICK', 'Ancien : jouer une Action de votre main ?', pool, 'hand', 0, 1);
            }
        },
        {
            // Student: if the trashed card is a Treasure, +1 Favor and put this onto your deck
            type: 'STUDENT_AFTER',
            handler: (state, player, _e, ctx: any) => {
                const t = state.lastTrashedCard;
                if (!t || !isType(t.id, 'TREASURE')) return done(state);
                player.favors = favors(player) + 1;
                let idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx === -1) idx = player.playArea.map(c => c.id).lastIndexOf('student');
                if (idx !== -1) player.deck.unshift(player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Conjurer: at the start of your next turn, put this into your hand
            type: 'CONJURER_RETURN',
            handler: (state, player, _e, ctx: any) => {
                const idx = player.playArea.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx !== -1) player.hand.push(player.playArea.splice(idx, 1)[0]);
                return done(state);
            }
        },
        {
            // Sorcerer (victim): reveal the top card; if it isn't the named card, gain a Curse
            type: 'SORCERER_CHECK',
            handler: (state, victim, _e, ctx: any) => {
                const named = ctx?.namedCardId ?? (state as any).lastNamedCard;
                const top = takeTop(state, victim);
                if (!top) return done(state);
                EffectUtils.revealCards(state, [top], 'ALL', `${victim.name} dévoile`);
                victim.deck.unshift(top);
                if (top.id !== named) push(state, victim.id, { type: 'GAIN_CARD', cardId: 'curse' });
                return done(state);
            }
        },
        {
            // Lich: skip a turn
            type: 'SKIP_A_TURN',
            handler: (state, player) => { (player as any).skipTurns = ((player as any).skipTurns || 0) + 1; return done(state); }
        },
        {
            // Lich: when you trash this, discard it and gain a cheaper card from the trash
            type: 'LICH_TRASHED',
            handler: (state, player, _e, ctx: any) => {
                const idx = state.trash.findIndex(c => c.instanceId === ctx?.sourceCardInstanceId);
                if (idx === -1) return done(state);
                const lich = state.trash.splice(idx, 1)[0];
                discardCard(state, player, lich);
                const cost = costOf(state, player, 'lich');
                const pool = state.trash.filter(c => costOf(state, player, c.id) < cost && !(c.id === 'lich'));
                if (!pool.length) return done(state);
                push(state, player.id, options('Liche : recevez une carte moins chère depuis le rebut', uniqueByName(pool).map(c => ({
                    label: nameOf(c.id), effects: [{ type: 'GAIN_FROM_TRASH_INSTANCE', instanceId: c.instanceId }]
                }))));
                return done(state);
            }
        },
        {
            // Coastal Haven, after the choice: carry on with the Clean-up
            type: 'CLEANUP_RESUME',
            handler: (state, player) => CleanupEffectHandler.handlePerformCleanup(state, player)
        }
    ],

    onLoad: () => {
        if (!setupHooks.includes(setupAllies)) setupHooks.push(setupAllies);
        const owned = (state: GameState, id: string) => state.players.find(p => p.id === id);
        const picked = (payload: any, decision: any) => chosenInstanceIds(payload).filter(id => (decision.context.candidates || []).includes(id));
        const pick = (state: GameState, playerId: string, payload: any, decision: any) => {
            const player = owned(state, playerId);
            return { player, ids: player ? picked(payload, decision) : [] };
        };

        EffectEngine.registerDecisionHandler('MARKET_TOWNS_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player || !ids[0] || favors(player) < 1) return;
            player.favors = favors(player) - 1;
            push(state, player.id, { type: 'MARKET_TOWNS' });
            playCardNow(state, player, ids[0]);
        });
        EffectEngine.registerDecisionHandler('PEACEFUL_CULT_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            for (const id of ids.slice(0, favors(player))) {
                const idx = player.hand.findIndex(c => c.instanceId === id);
                if (idx === -1) continue;
                player.favors = favors(player) - 1;
                TrashEffectHandler.trashCard(state, player, player.hand.splice(idx, 1)[0]);
            }
        });
        // Contract: set aside now, play at the start of the next turn
        EffectEngine.registerDecisionHandler('SET_ASIDE_PLAY_NEXT', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            const idx = ids[0] ? player.hand.findIndex(c => c.instanceId === ids[0]) : -1;
            if (idx === -1) { push(state, playerId, { type: 'CANCEL_DURATION' }, { sourceCardInstanceId: decision.context.holder }); return; }
            player.aside.push(player.hand.splice(idx, 1)[0]);
            (state.triggers = state.triggers || []).push({
                type: 'START_TURN', playerId: player.id, once: true, description: decision.context.label || 'Contrat',
                effects: [{ type: 'PLAY_INSTANCE_IF_OWNED', instanceId: ids[0] } as any]
            } as any);
        });
        // Royal Galley: play it now, then set it aside to play it again next turn
        EffectEngine.registerDecisionHandler('ROYAL_GALLEY_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            if (!ids[0]) { push(state, playerId, { type: 'CANCEL_DURATION' }, { sourceCardInstanceId: decision.context.holder }); return; }
            push(state, player.id, { type: 'SET_ASIDE_FOR_NEXT_TURN', instanceId: ids[0], label: 'Galère royale' });
            playCardNow(state, player, ids[0]);
        });
        EffectEngine.registerDecisionHandler('SPECIALIST_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            const card = player && ids[0] ? player.hand.find(c => c.instanceId === ids[0]) : undefined;
            if (!player || !card) return;
            push(state, player.id, { type: 'SPECIALIST_AFTER', instanceId: card.instanceId, cardId: card.id });
            playCardNow(state, player, card.instanceId);
        });
        EffectEngine.registerDecisionHandler('SWAP_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            const idx = player && ids[0] ? player.hand.findIndex(c => c.instanceId === ids[0]) : -1;
            if (!player || idx === -1) return;
            const card = player.hand.splice(idx, 1)[0];
            const pile = Object.keys(state.supply).find(k => k === card.id || def(k)?.mixedPile?.cards?.includes(card.id)) || card.id;
            if (state.supply[pile]) {
                state.supply[pile].count += 1;
                if (state.supply[pile].cards) state.supply[pile].cards!.push(card);
            }
            EffectUtils.log(state, `${player.name} remet ${nameOf(card.id)} sur sa pile.`, player.id);
            push(state, player.id, { type: 'GAIN_CARD', maxCost: 5, cardTypes: ['ACTION'], excludeIds: [card.id], destination: 'hand',
                message: 'Échange : recevez en main une autre carte Action coûtant jusqu\'à 5 💰' });
        });
        EffectEngine.registerDecisionHandler('SIBYL_TOP', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            const idx = player && ids[0] ? player.hand.findIndex(c => c.instanceId === ids[0]) : -1;
            if (player && idx !== -1) player.deck.unshift(player.hand.splice(idx, 1)[0]);
        });
        EffectEngine.registerDecisionHandler('SIBYL_BOTTOM_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            const idx = player && ids[0] ? player.hand.findIndex(c => c.instanceId === ids[0]) : -1;
            if (player && idx !== -1) player.deck.push(player.hand.splice(idx, 1)[0]);
        });
        // Archer: the victim hides one card; the attacker picks one of the revealed ones to discard
        EffectEngine.registerDecisionHandler('ARCHER_HIDE', (state, playerId, payload, decision) => {
            const { player: victim, ids } = pick(state, playerId, payload, decision);
            if (!victim) return;
            const shown = victim.hand.filter(c => c.instanceId !== ids[0]);
            EffectUtils.revealCards(state, shown, 'ALL', `${victim.name} dévoile`);
            const attacker = decision.context.attackerId || state.players[state.currentPlayerIndex].id;
            push(state, attacker, options(`Archer : quelle carte ${victim.name} défausse-t-il ?`, uniqueByName(shown).map(c => ({
                label: nameOf(c.id), effects: [{ type: 'ARCHER_DISCARD', victimId: victim.id, cardId: c.id, hiddenId: ids[0] }]
            }))));
        });
        EffectEngine.registerDecisionHandler('ELDER_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player || !ids[0]) return;
            const e = (player as any).elder;
            (player as any).elder = { turn: state.turnNumber, ids: [...(e?.turn === state.turnNumber ? e.ids : []), ids[0]] };
            playCardNow(state, player, ids[0]);
        });

        // Highwayman: the first Treasure each other player plays each turn does nothing
        addOnce(playOverrides, 'allies:highwayman', (state, player, cardDef) => {
            if (!cardDef.types.includes('TREASURE')) return undefined;
            const hw = ((state as any).highwaymen || []) as { attackerId: string; victimId: string }[];
            if (!hw.some(h => h.victimId === player.id && h.attackerId !== player.id)) return undefined;
            const mark = (player as any).highwaymanTurn;
            if (mark === state.turnNumber) return undefined;
            (player as any).highwaymanTurn = state.turnNumber;
            EffectUtils.log(state, `Bandit de grand chemin : ${cardDef.name} ne fait rien.`, player.id);
            return [];
        });
        // Warlord: can't play an Action from your hand if you have 2 or more copies of it in play
        addOnce(RulesValidator.playRestrictions, 'allies:warlord', (state, player, cardId) => {
            const wl = ((state as any).warlords || []) as { attackerId: string; victimId: string }[];
            if (!isType(cardId, 'ACTION') || !wl.some(w => w.victimId === player.id && w.attackerId !== player.id)) return undefined;
            return player.playArea.filter((c: CardInstance) => c.id === cardId).length >= 2
                ? 'Seigneur de guerre : vous avez déjà 2 exemplaires de cette carte en jeu' : undefined;
        });
        // Coastal Haven: before discarding your hand in Clean-up, spend Favors to keep cards
        addOnce(CleanupEffectHandler.beforeHandDiscard, 'allies:coastal_haven', (state, player) => {
            if (!allyIs(state, 'coastal_haven') || favors(player) < 1 || !player.hand.length) return false;
            if ((player as any).havenTurn === state.turnNumber) return false;
            (player as any).havenTurn = state.turnNumber;
            push(state, player.id, { type: 'CLEANUP_RESUME' });
            const n = Math.min(favors(player), player.hand.length);
            askCards(state, player, 'COASTAL_HAVEN_PICK', `Havre côtier : gardez des cartes en main pour le prochain tour (1 Faveur chacune, jusqu'à ${n})`, player.hand, 'hand', 0, n);
            return true;
        });
        EffectEngine.registerDecisionHandler('COASTAL_HAVEN_PICK', (state, playerId, payload, decision) => {
            const { player, ids } = pick(state, playerId, payload, decision);
            if (!player) return;
            for (const id of ids.slice(0, favors(player))) {
                const idx = player.hand.findIndex(c => c.instanceId === id);
                if (idx === -1) continue;
                player.favors = favors(player) - 1;
                getMat(player, 'save').push(player.hand.splice(idx, 1)[0]);
            }
        });
        // Plateau Shepherds: 2 VP per pair of a Favor and a card costing $2
        addOnce(VictoryChecker.playerScorers, 'allies:plateau_shepherds', (state, player) => {
            if (!allyIs(state, 'plateau_shepherds')) return 0;
            const all = [...player.hand, ...player.deck, ...player.discardPile, ...player.playArea, ...player.aside, ...Object.values(player.mats || {}).flat()] as CardInstance[];
            const twos = all.filter(c => { const d = def(c.id); return d && d.cost === 2 && !d.potionCost && !d.debtCost; }).length;
            return 2 * Math.min(twos, favors(player));
        });
        void discardCards;
    }
};
