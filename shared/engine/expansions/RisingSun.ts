import { TokenManager } from '../TokenManager.js';
import { Logger } from '../Logger.js';
import { ExpansionModule } from '../ExpansionLoader.js';
import { ProphecyManager } from '../ProphecyManager.js';

export const RisingSunModule: ExpansionModule = {
    id: 'rising_sun',
    name: 'Rising Sun',
    effectHandlers: [
        {
            type: 'GAIN_TEA',
            handler: (state, player, effect) => {
                const amount = effect.amount || 1;
                TokenManager.addToken(state, player, 'tea', amount);
                Logger.log(state, `${player.name} gagne +${amount} Thé 🍵.`, player.id);
                return { state, needsChoice: false };
            }
        },
        {
            type: 'SPEND_TEA',
            handler: (state, player, effect) => {
                const amount = effect.amount || 1;
                if (TokenManager.removeToken(player, 'tea', amount)) {
                    Logger.log(state, `${player.name} dépense ${amount} Thé 🍵.`, player.id);
                    return { state, needsChoice: false };
                }
                return { state, needsChoice: false };
            }
        },
        {
            type: 'INCREASE_ENLIGHTENMENT',
            handler: (state, player, effect) => {
                const amount = effect.amount || 1;
                TokenManager.addToken(state, player, 'enlightenment', amount);
                Logger.log(state, `${player.name} augmente son Illumination 🕯️ (+${amount}).`, player.id);
                return { state, needsChoice: false };
            }
        },
        {
            type: 'REMOVE_SUN_TOKEN',
            handler: (state, _player, _effect) => {
                ProphecyManager.removeSunToken(state);
                return { state, needsChoice: false };
            }
        },
        {
            type: 'FULFILL_PROPHECY',
            handler: (state, _player, _effect) => {
                ProphecyManager.fulfillProphecy(state);
                return { state, needsChoice: false };
            }
        }
    ],
    onLoad: () => {
        console.log('[RisingSun] Module loaded.');
    }
};
