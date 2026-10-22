import { Logger } from '../Logger.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectEngine } from '../EffectEngine.js';
import { createCardInstance } from '../CardInstance.js';
import { TrashEffectHandler } from '../effects/TrashEffectHandler.js';
import { TriggerEffectHandler } from '../effects/TriggerEffectHandler.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { EffectUtils } from '../EffectUtils.js';
import { ExpansionModule } from '../ExpansionLoader.js';
import { chosenInstanceIds } from '../effects/OpponentChoiceEffects.js';
import { markPlayed, pushPlayEffects } from '../Play.js';
import { getMat, peekMat } from '../Mats.js';
import { GameState } from '../GameState.js';
import { PlayerState } from '../PlayerState.js';

/** Can `player` afford `cardId` right now (coins, potions, no debt)? */
function canAfford(state: GameState, player: PlayerState, cardId: string): boolean {
    const def = CardRegistry.get(cardId);
    if (!def || (player.debt || 0) > 0) return false;
    const potions = (def as any).potionCost || 0;
    return EconomyEngine.getCardCost(state, player.id, cardId) <= player.coins && potions <= (player.potions || 0);
}

export const PromoModule: ExpansionModule = {
    id: 'promo',
    name: 'Promotional Cards',
    effectHandlers: [
        {
            /**
             * Black Market: reveal the top 3 cards of the Black Market deck; you may buy one
             * (paying its cost, without using a Buy); the rest go to the bottom of that deck.
             */
            type: 'BLACK_MARKET',
            handler: (state, player) => {
                const deck = (state.blackMarketDeck = state.blackMarketDeck || []);
                const revealed = deck.splice(0, 3);
                if (revealed.length === 0) {
                    Logger.log(state, 'La pioche du Marché Noir est vide.');
                    return { state, needsChoice: false };
                }
                state.blackMarketRevealed = revealed;
                EffectUtils.revealCards(state, revealed, 'ALL', 'Marché Noir');

                const buyable = revealed.filter(c => canAfford(state, player, c.id));
                if (buyable.length === 0) {
                    deck.push(...state.blackMarketRevealed.splice(0));
                    Logger.log(state, `${player.name} ne peut acheter aucune des cartes du Marché Noir.`, player.id);
                    return { state, needsChoice: false };
                }

                state.pendingDecision = {
                    id: `black_market_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: 'Marché Noir : vous pouvez acheter une de ces cartes',
                    constraints: { min: 0, max: 1, sourceZone: 'blackMarket' as any },
                    context: {
                        specialAction: 'BLACK_MARKET',
                        cards: revealed.map(c => ({ id: c.id, instanceId: c.instanceId })),
                        buyable: buyable.map(c => c.instanceId)
                    }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            /** Captain: play a non-Duration, non-Command Action from the Supply costing up to 4, leaving it there. */
            type: 'PLAY_FROM_SUPPLY',
            handler: (state, player, effect) => {
                const e = effect as any;
                const maxCost = e.maxCost ?? 4;
                const candidates = Object.keys(state.supply).filter(id => {
                    const def = CardRegistry.get(id);
                    if (!def || state.supply[id].count <= 0) return false;
                    if (!def.types.includes('ACTION') || def.types.includes('DURATION') || def.types.includes('COMMAND')) return false;
                    return EconomyEngine.getCardCost(state, player.id, id) <= maxCost && !(def as any).potionCost && !(def as any).debtCost;
                });
                if (candidates.length === 0) return { state, needsChoice: false };

                state.pendingDecision = {
                    id: `play_from_supply_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: e.message || "Choisissez une carte Action de la réserve à jouer (elle y reste)",
                    constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { cardIds: candidates, maxCost } },
                    context: { specialAction: 'PLAY_FROM_SUPPLY', candidates }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            /**
             * Prince: you may set this aside. If you do, set aside an Action (not a Duration or
             * Command) from your hand costing up to 4. At the start of each of your turns, play
             * it, setting it aside again when you would discard it from play.
             */
            type: 'PRINCE',
            handler: (state, player, _effect, ctx) => {
                const princeId = ctx?.sourceCardInstanceId;
                const candidates = player.hand.filter(c => {
                    const def = CardRegistry.get(c.id);
                    return def && def.types.includes('ACTION') && !def.types.includes('DURATION')
                        && !def.types.includes('COMMAND') && EconomyEngine.getCardCost(state, player.id, c.id) <= 4;
                });
                if (!princeId || candidates.length === 0) return { state, needsChoice: false };

                state.pendingDecision = {
                    id: `prince_${Date.now()}`,
                    playerId: player.id,
                    type: 'CHOOSE_CARDS' as any,
                    message: "Prince : mettez de côté une Action coûtant jusqu'à 4 (ou aucune pour ne rien faire)",
                    constraints: { min: 0, max: 1, sourceZone: 'hand', filter: { cardIds: candidates.map(c => c.id) } },
                    context: { specialAction: 'PRINCE', princeId, candidates: candidates.map(c => c.instanceId) }
                } as any;
                return { state, needsChoice: true };
            }
        },
        {
            /** Start of turn: play every card set aside with a Prince. */
            type: 'PRINCE_PLAY',
            handler: (state, player) => {
                const princed = peekMat(player, 'prince').filter(c => c.princedBy);
                for (const card of [...princed].reverse()) {
                    const mat = getMat(player, 'prince');
                    mat.splice(mat.indexOf(card), 1);
                    player.playArea.push(card);
                    markPlayed(state, player, card);
                    Logger.log(state, `${player.name} joue ${CardRegistry.get(card.id)?.name || card.id} (Prince).`, player.id);
                    pushPlayEffects(state, player, card);
                    TriggerEffectHandler.handleOnPlayTriggers(state, player, card.id, card.instanceId);
                }
                return { state, needsChoice: false };
            }
        }
    ],
    onLoad: () => {
        EffectEngine.registerDecisionHandler('BLACK_MARKET', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const revealed = state.blackMarketRevealed || [];
            const chosenId = chosenInstanceIds(payload).find(id => decision.context.buyable.includes(id));
            const idx = chosenId ? revealed.findIndex(c => c.instanceId === chosenId) : -1;

            if (idx !== -1 && canAfford(state, player, revealed[idx].id)) {
                const card = revealed.splice(idx, 1)[0];
                player.coins -= EconomyEngine.getCardCost(state, player.id, card.id);
                player.potions = (player.potions || 0) - ((CardRegistry.get(card.id) as any)?.potionCost || 0);
                player.discardPile.push(card);
                state.lastGainedCard = card;
                Logger.log(state, `${player.name} achète ${CardRegistry.get(card.id)?.name || card.id} (Marché Noir).`, player.id);
                TriggerEffectHandler.handleOnBuyTriggers(state, player, card.id);
                TriggerEffectHandler.triggerOnGainEffects(state, player, card);
            }
            // The rest go to the bottom of the Black Market deck
            (state.blackMarketDeck = state.blackMarketDeck || []).push(...revealed.splice(0));
        });

        EffectEngine.registerDecisionHandler('PLAY_FROM_SUPPLY', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const cardId: string | undefined = payload.cardId || payload.cards?.[0]?.id || chosenInstanceIds(payload)[0];
            if (!cardId || !decision.context.candidates.includes(cardId)) return;
            // The card stays in the Supply: play a "phantom" copy that never enters a zone
            const phantom = createCardInstance(cardId);
            markPlayed(state, player, phantom);
            Logger.log(state, `${player.name} joue ${CardRegistry.get(cardId)?.name || cardId} depuis la réserve.`, player.id);
            pushPlayEffects(state, player, phantom);
            TriggerEffectHandler.handleOnPlayTriggers(state, player, phantom.id, phantom.instanceId);
        });

        EffectEngine.registerDecisionHandler('PRINCE', (state, playerId, payload, decision) => {
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            const chosenId = chosenInstanceIds(payload).find(id => decision.context.candidates.includes(id));
            if (!chosenId) return; // Prince stays in play, nothing happens
            const prince = EffectUtils.removeCardFromPlayer(state, player, decision.context.princeId);
            const card = EffectUtils.removeCardFromPlayer(state, player, chosenId);
            if (!prince || !card) return;
            card.princedBy = prince.instanceId;
            getMat(player, 'prince').push(prince, card);
            Logger.log(state, `${player.name} met de côté ${CardRegistry.get(card.id)?.name || card.id} avec le Prince.`, player.id);
            // Play it at the start of each of your turns (one trigger plays all your Prince cards)
            state.triggers = state.triggers || [];
            const already = state.triggers.some(t => t.type === 'START_TURN' && t.playerId === player.id
                && (t.effects || []).some((e: any) => e.type === 'PRINCE_PLAY'));
            if (!already) {
                state.triggers.push({
                    type: 'START_TURN', playerId: player.id, once: false,
                    effects: [{ type: 'PRINCE_PLAY' } as any]
                });
            }
        });
    }
};
