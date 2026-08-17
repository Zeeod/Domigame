import { GameState, PlayerState, EffectResult } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';

export class ReactionEffectHandler {
    static handleReaction(state: GameState, player: PlayerState, effect: any): EffectResult {
        // Logic for handling reaction effects
        return { state, needsChoice: false };
    }
}
