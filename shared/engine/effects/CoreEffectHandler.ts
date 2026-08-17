import { GameState, EffectResult } from '../GameState.js';
import { PlayerState } from '../PlayerState.js';
import { EffectUtils } from '../EffectUtils.js';
import { Logger } from '../Logger.js';

export class CoreEffectHandler {
    static handleDraw(state: GameState, player: PlayerState, effect: any, suppressLog: boolean = false): EffectResult {
        const amount = EffectUtils.getAmount(state, player, effect.amount);
        EffectUtils.drawCards(state, player, amount);
        if (!suppressLog && amount > 0) {
            Logger.log(state, `${player.name} pioche ${amount} carte(s).`, player.id, undefined, {
                type: 'DRAW',
                cardIds: [], // We don't log drawn IDs publicly usually
                forPlayerId: player.id
            });
        }
        return { state, needsChoice: false };
    }

    static handleAddActions(state: GameState, player: PlayerState, effect: any, suppressLog: boolean = false): EffectResult {
        const amount = EffectUtils.getAmount(state, player, effect.amount);
        player.actions += amount;
        if (!suppressLog) Logger.log(state, `${player.name} gagne +${amount} Action(s).`, player.id);
        return { state, needsChoice: false };
    }

    static handleAddBuys(state: GameState, player: PlayerState, effect: any, suppressLog: boolean = false): EffectResult {
        const amount = EffectUtils.getAmount(state, player, effect.amount);
        player.buys += amount;
        if (!suppressLog) Logger.log(state, `${player.name} gagne +${amount} Achat(s).`, player.id);
        return { state, needsChoice: false };
    }

    static handleAddMoney(state: GameState, player: PlayerState, effect: any, suppressLog: boolean = false): EffectResult {
        const amount = EffectUtils.getAmount(state, player, effect.amount);
        player.coins += amount;
        if (!suppressLog) Logger.log(state, `${player.name} gagne +${amount} 💰.`, player.id);
        return { state, needsChoice: false };
    }
}
