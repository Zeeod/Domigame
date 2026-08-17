import { GameState, EffectResult } from '../GameState.js';
import { PlayerState } from '../PlayerState.js';
import { TokenManager } from '../TokenManager.js';
import { Logger } from '../Logger.js';

export class TokenEffectHandler {
    static handleAddToken(state: GameState, player: PlayerState, effect: any): EffectResult {
        const { tokenType, amount } = effect;
        TokenManager.addToken(state, player, tokenType, amount || 1);
        return { state, needsChoice: false };
    }

    static handleRemoveToken(state: GameState, player: PlayerState, effect: any): EffectResult {
        const { tokenType, amount } = effect;
        TokenManager.removeToken(player, tokenType, amount || 1);
        return { state, needsChoice: false };
    }
}
