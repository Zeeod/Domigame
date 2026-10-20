import { GameState, PlayerState } from '../GameState.js';
import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { EffectEngine } from '../EffectEngine.js';
import { EffectUtils } from '../EffectUtils.js';
import { CardRegistry } from '../../cards/index.js';

/** Instance ids chosen in a decision payload, whatever its shape. */
export function chosenInstanceIds(payload: any): string[] {
    if (!payload) return [];
    if (Array.isArray(payload.cardInstanceIds)) return payload.cardInstanceIds;
    if (Array.isArray(payload.cardIds)) return payload.cardIds;
    if (Array.isArray(payload.cards)) return payload.cards.map((c: any) => typeof c === 'string' ? c : c.instanceId);
    return [];
}

/** The player to the left of `player` (next in turn order); `player` itself in a 1-player game. */
export function playerToLeft(state: GameState, player: PlayerState): PlayerState {
    const idx = state.players.findIndex(p => p.id === player.id);
    return state.players[(idx + 1) % state.players.length] ?? player;
}

/**
 * OPPONENT_CHOOSES_DISCARD — Envoy, Advisor.
 * The cards revealed into your limbo are shown to the player to your left, who chooses
 * `count` of them for you to discard; the rest go to your hand (`restTo`).
 */
export function registerOpponentChoiceEffects(): void {
    EffectHandlerRegistry.register('OPPONENT_CHOOSES_DISCARD', (state, player, effect) => {
        const e = effect as any;
        const revealed = [...(player.limbo || [])];
        if (revealed.length === 0) return { state, needsChoice: false };
        const count = Math.min(e.count ?? 1, revealed.length);
        const chooser = playerToLeft(state, player);

        state.pendingDecision = {
            id: `opp_choice_${Date.now()}`,
            playerId: chooser.id,
            type: 'CHOOSE_CARDS' as any,
            message: `Choisissez ${count} carte(s) que ${player.name} doit défausser`,
            constraints: { min: count, max: count, sourceZone: 'revealed' as any },
            context: {
                specialAction: 'OPPONENT_CHOOSES_DISCARD',
                ownerId: player.id,
                restTo: e.restTo || 'hand',
                cards: revealed.map(c => ({ id: c.id, instanceId: c.instanceId }))
            }
        } as any;
        return { state, needsChoice: true };
    });

    EffectEngine.registerDecisionHandler('OPPONENT_CHOOSES_DISCARD', (state, _chooserId, payload, decision) => {
        const ctx = decision.context;
        const owner = state.players.find(p => p.id === ctx.ownerId);
        if (!owner) return;
        const allowed: string[] = ctx.cards.map((c: any) => c.instanceId);
        let chosen = chosenInstanceIds(payload).filter(id => allowed.includes(id));
        const required = decision.constraints?.min ?? 1;
        if (chosen.length < required) chosen = [...chosen, ...allowed.filter(id => !chosen.includes(id))].slice(0, required);

        for (const id of chosen) {
            const card = EffectUtils.removeCardFromPlayer(state, owner, id);
            if (card) {
                owner.discardPile.push(card);
                EffectUtils.log(state, `${owner.name} défausse ${CardRegistry.get(card.id)?.name || card.id}.`, owner.id);
            }
        }
        for (const id of allowed.filter(i => !chosen.includes(i))) {
            const card = EffectUtils.removeCardFromPlayer(state, owner, id);
            if (card) EffectUtils.addCardToZone(owner, card, ctx.restTo, state);
        }
    });

    // Remaining revealed cards (limbo) go to hand
    EffectHandlerRegistry.register('MOVE_REMAINING_TO_HAND', (state, player) => {
        const rest = player.limbo.splice(0, player.limbo.length);
        player.hand.push(...rest);
        return { state, needsChoice: false };
    });
}
