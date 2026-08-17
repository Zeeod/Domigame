import { GameState, PlayerState, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectUtils } from '../EffectUtils.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';

export class ExpansionEffectHandler {

    static handleBuyLastSelected(state: GameState, player: PlayerState, _effect: any, _sourceCardInstanceId?: string): EffectResult {
        if (!state.lastDecisionResults?.cards || state.lastDecisionResults.cards.length === 0) return { state, needsChoice: false };
        const card = state.lastDecisionResults.cards[0];

        const cost = EconomyEngine.getCardCost(state, player.id, card.id);
        if (player.coins >= cost) {
            player.coins -= cost;

            // Remove from player zones OR black market revealed
            let removed = EffectUtils.removeCardFromPlayer(state, player, card.instanceId);
            if (!removed && state.blackMarketRevealed) {
                const idx = state.blackMarketRevealed.findIndex(c => c.instanceId === card.instanceId);
                if (idx !== -1) {
                    removed = state.blackMarketRevealed.splice(idx, 1)[0];
                }
            }

            if (removed) {
                EffectUtils.addCardToZone(player, removed, 'discardPile', state);
                EffectUtils.log(state, `${player.name} achète ${CardRegistry.get(card.id)?.name} (Marché Noir).`, player.id);
            }
        }
        return { state, needsChoice: false };
    }

    static handleRecruiterEffect(state: GameState, player: PlayerState, _effect: any): EffectResult {
        state.pendingDecision = {
            id: `recruiter_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS',
            message: 'Écartez une carte de votre main pour +1 Villageois par 💰 de son coût.',
            constraints: {
                min: 1,
                max: 1,
                sourceZone: 'hand'
            },
            context: {
                specialAction: 'RECRUITER_TRASH',
                next: [
                    { type: 'TRASH' },
                    { type: 'GAIN_STATS_BY_COST', resource: 'villagers', stats: { moneyMultiplier: 1 } }
                ]
            }
        };
        return { state, needsChoice: true };
    }

    static handleTakeArtifact(state: GameState, player: PlayerState, effect: any): EffectResult {
        const artifactId = (effect as any).artifact;
        if (!artifactId) return { state, needsChoice: false };

        // 1. Remove from previous owner
        for (const p of state.players) {
            if (p.artifacts?.includes(artifactId)) {
                p.artifacts = p.artifacts.filter(a => a !== artifactId);
                EffectUtils.log(state, `${p.name} perd l'artéfact : ${artifactId}.`, p.id);
            }
        }

        // 2. Add to current player
        if (!player.artifacts) player.artifacts = [];
        player.artifacts.push(artifactId);
        EffectUtils.log(state, `${player.name} prend l'artéfact : ${artifactId}.`, player.id);

        return { state, needsChoice: false };
    }

    static handleGainLoot(state: GameState, player: PlayerState, effect: any): EffectResult {
        const count = effect.count || 1;
        const destination = effect.destination || 'hand';
        const lootPile = state.nonSupply['loot_pile'] || state.nonSupply['loot'];

        if (!lootPile || lootPile.cards.length === 0) {
            EffectUtils.log(state, "Plus de Butins disponibles.", player.id);
            return { state, needsChoice: false };
        }

        for (let i = 0; i < count; i++) {
            if (lootPile.cards.length === 0) break;

            const card = lootPile.cards.pop()!;
            lootPile.count = lootPile.cards.length;

            EffectUtils.addCardToZone(player, card, destination, state);
            EffectUtils.log(state, `${player.name} gagne un Butin : ${CardRegistry.get(card.id)?.name || card.id}.`, player.id);

            TriggerEffectHandler.triggerOnGainEffects(state, player, card);
        }

        return { state, needsChoice: false };
    }

    static handleCheckPreviousTurn(state: GameState, player: PlayerState, effect: any): EffectResult {
        const query = effect.query;
        if (query === 'GAINED_CARDS_BY_OPPONENT') {
            const playerIndex = state.players.findIndex(p => p.id === player.id);
            const opponentIndex = (playerIndex - 1 + state.players.length) % state.players.length;
            const opponent = state.players[opponentIndex];

            // In LogEntry, the actor is 'playerId'.
            const lastTurnStartIdx = [...state.history].reverse().findIndex(h => h.type === 'TURN_START' && h.playerId === opponent.id);
            
            if (lastTurnStartIdx === -1) {
                return { state, needsChoice: false };
            }
            
            const lastTurnHistory = state.history.slice(state.history.length - 1 - lastTurnStartIdx);

            const gainedCardIds: string[] = lastTurnHistory
                .filter(h => (h.type === 'GAIN_CARD' || h.type === 'BUY_CARD') && h.playerId === opponent.id && (h.payload?.cardId || h.cardId))
                .map(h => (h.payload?.cardId || h.cardId) as string);

            const validCardIds: string[] = [...new Set(gainedCardIds)].filter((id): id is string => {
                if (!id) return false;
                const def = CardRegistry.get(id);
                return def !== undefined && (def.cost || 0) <= 6;
            });

            if (validCardIds.length === 0) {
                EffectUtils.log(state, `Aucune carte éligible gagnée par ${opponent.name} à son dernier tour.`, player.id);
                return { state, needsChoice: false };
            }

            if (validCardIds.length === 1) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: { type: 'GAIN_CARD', cardId: validCardIds[0] } as any
                });
                return { state, needsChoice: false };
            }

            state.pendingDecision = {
                id: `smugglers_${Date.now()}`,
                playerId: player.id,
                type: 'CHOOSE_CARD_FROM_SUPPLY',
                message: `Choisissez une carte à gagner (gagnée par ${opponent.name}).`,
                constraints: {
                    min: 1,
                    max: 1,
                    filter: { cardIds: validCardIds }
                },
                context: {
                    specialAction: 'GAINER'
                }
            };
            return { state, needsChoice: true };
        }

        return { state, needsChoice: false };
    }
}
