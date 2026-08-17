/**
 * Guilds Expansion Module
 * 
 * Registers Guilds-specific mechanics:
 * - Merchant Guild: +1 Coffer per buy while in play (via EventBus hook)
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { Logger } from '../Logger.js';

export const GuildsModule: ExpansionModule = {
    id: 'guilds',
    name: 'Guildes',

    eventHooks: [
        {
            id: 'guilds:merchant_guild_on_buy',
            event: 'POST_BUY',
            priority: 'NORMAL',
            handler: (state, event) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player) return;

                const count = player.playArea.filter(c => c.id === 'merchant_guild').length;
                if (count > 0) {
                    player.coffers += count;
                    Logger.log(state, `${player.name} gagne +${count} Coffre(s) (Guilde des Marchands).`, player.id);
                }
            }
        }
    ]
};
