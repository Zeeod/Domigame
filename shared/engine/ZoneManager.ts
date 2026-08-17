
import { PlayerState, CardInstance } from './GameState.js';

export class ZoneManager {
    /**
     * Get all cards owned by a player for scoring purposes.
     * Includes: Hand, Deck, Discard, Play Area, and all Mats.
     */
    static getAllCards(player: PlayerState): CardInstance[] {
        const cards: CardInstance[] = [
            ...player.hand,
            ...player.deck,
            ...player.discardPile,
            ...player.playArea
        ];

        // Legacy/Specific Mats (to be unified in player.mats later)
        if (player.islandMat) cards.push(...player.islandMat);
        if (player.nativeVillageMat) cards.push(...player.nativeVillageMat);
        if (player.tavernMat) cards.push(...player.tavernMat);
        if (player.exileMat) cards.push(...player.exileMat);

        // Future generic mats
        if (player.mats) {
            for (const matKey in player.mats) {
                cards.push(...player.mats[matKey]);
            }
        }

        return cards;
    }

    /**
     * Get a specific zone by name
     */
    static getZone(player: PlayerState, zoneName: string): CardInstance[] {
        switch (zoneName) {
            case 'hand': return player.hand;
            case 'deck': return player.deck;
            case 'discardPile': return player.discardPile;
            case 'playArea': return player.playArea;
            case 'islandMat': return player.islandMat || [];
            case 'nativeVillageMat': return player.nativeVillageMat || [];
            case 'tavernMat': return player.tavernMat || [];
            case 'exileMat': return player.exileMat || [];
            // Add generic mats lookup
            default:
                if (player.mats && player.mats[zoneName]) {
                    return player.mats[zoneName];
                }
                return [];
        }
    }

    /**
     * Remove a card from a specific zone.
     * Returns the removed card or undefined if not found.
     */
    static removeCardFromZone(player: PlayerState, zoneName: string, cardInstanceId: string): CardInstance | undefined {
        const zone = this.getZone(player, zoneName);
        const index = zone.findIndex(c => c.instanceId === cardInstanceId);
        if (index !== -1) {
            return zone.splice(index, 1)[0];
        }
        return undefined;
    }

    /**
     * Add a card to a zone
     */
    static addCardToZone(player: PlayerState, zoneName: string, card: CardInstance): void {

        // Special handling if getZone returned a copy or empty array for undefined mats? 
        // JavaScript arrays are references, so if getZone returns `player.hand`, pushing works.
        // But if it returns `[]` because `player.islandMat` was undefined, pushing does nothing to player state.

        // BETTER: Handle logic here.
        switch (zoneName) {
            case 'hand': player.hand.push(card); break;
            case 'deck': player.deck.unshift(card); break; // Deck usually unshift?
            case 'discardPile': player.discardPile.push(card); break;
            case 'playArea': player.playArea.push(card); break;
            case 'islandMat':
                if (!player.islandMat) player.islandMat = [];
                player.islandMat.push(card);
                break;
            case 'nativeVillageMat':
                if (!player.nativeVillageMat) player.nativeVillageMat = [];
                player.nativeVillageMat.push(card);
                break;
            case 'tavernMat':
                if (!player.tavernMat) player.tavernMat = [];
                player.tavernMat.push(card);
                break;
            case 'exileMat':
                if (!player.exileMat) player.exileMat = [];
                player.exileMat.push(card);
                break;
            default:
                if (!player.mats) player.mats = {};
                if (!player.mats[zoneName]) player.mats[zoneName] = [];
                player.mats[zoneName].push(card);
                break;
        }
    }

    /**
     * Move a card from one zone to another.
     * Returns true if successful.
     */
    static moveCard(player: PlayerState, cardInstanceId: string, fromZone: string, toZone: string, position: 'TOP' | 'BOTTOM' = 'BOTTOM'): boolean {
        const card = this.removeCardFromZone(player, fromZone, cardInstanceId);
        if (!card) return false;

        // Add to new zone
        // Re-use addCardToZone but handle position?
        // addCardToZone defaults to push/unshift based on zone type.
        // If we need explicit position control, we need to modify addCardToZone or handle here.

        // For now, let's use addCardToZone default behavior unless critical.
        // Standard Zone behavior:
        // Deck: Top (unshift)
        // Hand/Discard/Play: Bottom (push) - Order matters less for logic, but UI displays it.

        // If specific position requested:
        if (toZone === 'deck') {
            if (position === 'BOTTOM') {
                player.deck.push(card);
            } else {
                player.deck.unshift(card);
            }
        } else {
            // For others, usually just push (effectively bottom/end of array)
            // Dominon rules: verify "Put on bottom of deck" vs "Put on top".
            this.addCardToZone(player, toZone, card);
        }

        return true;
    }

    /**
     * Get cards from a mat
     */
    static getMat(player: PlayerState, matName: string): CardInstance[] {
        return this.getZone(player, matName);
    }

    /**
     * Move card to a mat
     */
    static moveToMat(player: PlayerState, cardInstanceId: string, matName: string, fromZone: string = 'hand'): boolean {
        return this.moveCard(player, cardInstanceId, fromZone, matName);
    }

    /**
     * Take specific cards from a mat
     */
    static takeFromMat(player: PlayerState, matName: string, filter?: (c: CardInstance) => boolean): CardInstance[] {
        const zone = this.getMat(player, matName);
        if (!zone || zone.length === 0) return [];

        const toRemove: number[] = [];
        const result: CardInstance[] = [];

        for (let i = 0; i < zone.length; i++) {
            if (!filter || filter(zone[i])) {
                toRemove.push(i);
                result.push(zone[i]);
            }
        }

        // Remove in reverse order to preserve indices
        for (let i = toRemove.length - 1; i >= 0; i--) {
            zone.splice(toRemove[i], 1);
        }

        return result;
    }
}
