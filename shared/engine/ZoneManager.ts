import { PlayerState, CardInstance } from './GameState.js';
import { allMatCards, getMat, isMatZone } from './Mats.js';

export class ZoneManager {
    /**
     * Every card a player owns (for scoring and stats):
     * hand, deck, discard, play area, set-aside cards, limbo and all mats.
     */
    static getAllCards(player: PlayerState): CardInstance[] {
        return [
            ...player.hand,
            ...player.deck,
            ...player.discardPile,
            ...player.playArea,
            ...(player.aside || []),
            ...(player.limbo || []),
            ...allMatCards(player),
        ];
    }

    /** A zone by name (mats accept any spelling, see Mats.ts). */
    static getZone(player: PlayerState, zoneName: string): CardInstance[] {
        switch (zoneName) {
            case 'hand': return player.hand;
            case 'deck': return player.deck;
            case 'discardPile': return player.discardPile;
            case 'playArea': return player.playArea;
            case 'aside': return player.aside;
            case 'limbo': return player.limbo;
            default: return getMat(player, zoneName);
        }
    }

    static removeCardFromZone(player: PlayerState, zoneName: string, cardInstanceId: string): CardInstance | undefined {
        const zone = this.getZone(player, zoneName);
        const index = zone.findIndex(c => c.instanceId === cardInstanceId);
        return index !== -1 ? zone.splice(index, 1)[0] : undefined;
    }

    static addCardToZone(player: PlayerState, zoneName: string, card: CardInstance): void {
        if (zoneName === 'deck') player.deck.unshift(card);
        else if (isMatZone(zoneName) || !['hand', 'discardPile', 'playArea', 'aside', 'limbo'].includes(zoneName)) getMat(player, zoneName).push(card);
        else this.getZone(player, zoneName).push(card);
    }

    static moveCard(player: PlayerState, cardInstanceId: string, fromZone: string, toZone: string, position: 'TOP' | 'BOTTOM' = 'BOTTOM'): boolean {
        const card = this.removeCardFromZone(player, fromZone, cardInstanceId);
        if (!card) return false;
        if (toZone === 'deck') {
            if (position === 'BOTTOM') player.deck.push(card);
            else player.deck.unshift(card);
        } else {
            this.addCardToZone(player, toZone, card);
        }
        return true;
    }

    static getMat(player: PlayerState, matName: string): CardInstance[] {
        return getMat(player, matName);
    }

    static moveToMat(player: PlayerState, cardInstanceId: string, matName: string, fromZone: string = 'hand'): boolean {
        return this.moveCard(player, cardInstanceId, fromZone, matName);
    }

    static takeFromMat(player: PlayerState, matName: string, filter?: (c: CardInstance) => boolean): CardInstance[] {
        const zone = getMat(player, matName);
        const taken = zone.filter(c => !filter || filter(c));
        for (const c of taken) zone.splice(zone.indexOf(c), 1);
        return taken;
    }
}
