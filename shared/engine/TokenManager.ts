import { PlayerState } from './PlayerState.js';

import { GameState } from './GameState.js';

export class TokenManager {
    static addToken(_state: GameState, player: PlayerState, type: string, amount: number): void {
        if (!player.tokens) player.tokens = {};
        player.tokens[type] = (player.tokens[type] || 0) + amount;

        // Sync legacy fields
        this.syncLegacyFields(player, type);

        // Log generic message if not standard (already handled by specialized handlers usually)
        if (!['villagers', 'coffers', 'debt', 'favors', 'vp', 'coin', 'potion'].includes(type)) {
            // Logger.log(state, `${player.name} gagne +${amount} jeton(s) ${type}.`, player.id); 
            // Commented out to avoid double logging if Effect handler logs it
        }
    }

    static removeToken(player: PlayerState, type: string, amount: number): boolean {
        if (!player.tokens) player.tokens = {};
        const current = player.tokens[type] || 0;
        if (current < amount) return false;

        player.tokens[type] = current - amount;

        // Sync legacy fields
        this.syncLegacyFields(player, type);

        return true;
    }

    static getCount(player: PlayerState, type: string): number {
        return player.tokens?.[type] || 0;
    }

    private static syncLegacyFields(player: PlayerState, type: string) {
        // Bi-directional sync for backward compatibility during refactor
        const val = player.tokens[type];
        switch (type) {
            case 'villagers': player.villagers = val; break;
            case 'coffers': player.coffers = val; break;
            case 'debt': player.debt = val; break;
            case 'favors': player.favors = val; break;
            case 'vp': player.vpTokens = val; break;
            case 'coin': player.coinTokens = val; break;
            case 'potion': player.potions = val; break;
        }
    }

    /**
     * initialize player tokens based on legacy fields (if creating from old save)
     */
    static initFromLegacy(player: PlayerState) {
        if (!player.tokens) player.tokens = {};
        if (player.villagers) player.tokens['villagers'] = player.villagers;
        if (player.coffers) player.tokens['coffers'] = player.coffers;
        if (player.debt) player.tokens['debt'] = player.debt;
        if (player.favors) player.tokens['favors'] = player.favors;
        if (player.vpTokens) player.tokens['vp'] = player.vpTokens;
        if (player.coinTokens) player.tokens['coin'] = player.coinTokens;
        if (player.potions) player.tokens['potion'] = player.potions;
    }
}
