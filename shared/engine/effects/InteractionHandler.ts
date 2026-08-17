import { PlayerState, GameState, EffectResult } from '../GameState.js';

export class InteractionHandler {
    public static handleEachPlayer(state: GameState, player: PlayerState, effect: any): EffectResult {
        const others = state.players.filter(p => p.id !== player.id);
        const effectObjs = others.map(p => ({
            type: 'EFFECT' as const,
            playerId: p.id,
            effect: effect.effect
        }));
        state.effectStack.push(...effectObjs.reverse());
        return { state, needsChoice: false };
    }

    public static handleOtherPlayers(state: GameState, player: PlayerState, effect: any): EffectResult {
        return this.handleEachPlayer(state, player, effect);
    }
}
