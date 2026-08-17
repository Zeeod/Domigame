
import { CardInstance } from '../../shared/engine/CardInstance';
import { GameState as SharedGameState } from '../../shared/engine/GameState';
import { CardRegistry } from '../../shared/cards';
import { PublicGameState } from '../../shared/types';

// Define ClientGameState locally or import if available
interface ClientGameState {
    public: PublicGameState;
    private: any;
}

/**
 * Calculates a dynamic status string for a card instance based on current game state.
 * Supports both Shared (Server) and Client GameState structures.
 */
export function getCardDynamicStatus(cardInstance: CardInstance, state: SharedGameState | ClientGameState | any): string | null {
    const def = CardRegistry.get(cardInstance.id);
    if (!def) return null;

    // 1. Duration Status
    if (def.types.includes('DURATION') || (def.durationEffects && def.durationEffects.length > 0)) {
        if (cardInstance.durationTurns !== undefined && cardInstance.durationTurns > 0) {
            return `Active for ${cardInstance.durationTurns} more turn${cardInstance.durationTurns > 1 ? 's' : ''}`;
        }
    }

    // 2. Variable VP Status
    if (def.dynamicVP) {
        let score = 0;

        // Normalize state access
        const players = (state as SharedGameState).players || (state as ClientGameState).public?.players;
        if (!players) return null;

        // Find owner
        let targetPlayer = players.find((p: any) =>
            (p.hand || []).some((c: any) => c.instanceId === cardInstance.instanceId) ||
            (p.deck || []).some((c: any) => c.instanceId === cardInstance.instanceId) ||
            (p.discardPile || []).some((c: any) => c.instanceId === cardInstance.instanceId) ||
            (p.playArea || []).some((c: any) => c.instanceId === cardInstance.instanceId)
        );

        // Fallback: use current player if owner not found (e.g. in Supply?)
        if (!targetPlayer) {
            const currentPlayerIndex = (state as SharedGameState).currentPlayerIndex ?? (state as ClientGameState).public.currentPlayerIndex;
            targetPlayer = players[currentPlayerIndex];
        }

        if (!targetPlayer) return null;

        const allCards = [
            ...(targetPlayer.hand || []),
            ...(targetPlayer.deck || []),
            ...(targetPlayer.discardPile || []),
            ...(targetPlayer.playArea || [])
        ];

        switch (cardInstance.id) {
            case 'gardens':
                score = Math.floor(allCards.length / 10);
                break;
            case 'duke':
                score = allCards.filter((c: any) => c.id === 'duchy').length;
                break;
            case 'vineyard':
                const actionCount = allCards.filter((c: any) => {
                    const cDef = CardRegistry.get(c.id);
                    return cDef && cDef.types.includes('ACTION');
                }).length;
                score = Math.floor(actionCount / 3);
                break;
            case 'fairgrounds':
                const uniqueNames = new Set(allCards.map((c: any) => c.id)).size;
                score = Math.floor(uniqueNames / 5) * 2;
                break;
            case 'silk_road':
                const victoryCount = allCards.filter((c: any) => {
                    const cDef = CardRegistry.get(c.id);
                    return cDef && cDef.types.includes('VICTORY');
                }).length;
                score = Math.floor(victoryCount / 4);
                break;
            case 'feodum':
                const silverCount = allCards.filter((c: any) => c.id === 'silver').length;
                score = Math.floor(silverCount / 3);
                break;
        }

        return `Current Value: ${score} VP`;
    }

    // 3. Dynamic Wealth Status (Treasures)
    if (def.types.includes('TREASURE')) {
        const players = (state as SharedGameState).players || (state as ClientGameState).public?.players;
        if (!players) return null;

        const currentPlayerIndex = (state as SharedGameState).currentPlayerIndex ?? (state as ClientGameState).public.currentPlayerIndex;
        const activePlayer = players[currentPlayerIndex];
        if (!activePlayer) return null;

        switch (cardInstance.id) {
            case 'bank': {
                // Bank counts treasures in play. 
                // We add 1 implicitly for the Bank itself if it's currently in hand (since it will be in play when evaluated).
                // Actually, let's just count treasures CURRENTLY in play plus 1.
                const treasuresInPlay = (activePlayer.playArea || []).filter((c: any) => {
                    const cDef = CardRegistry.get(c.id);
                    return cDef && cDef.types.includes('TREASURE');
                }).length;

                // If the bank is in the hand, it will be the N+1th treasure.
                // If it's already in the playArea, it's already counted.
                const isInPlay = (activePlayer.playArea || []).some((c: any) => c.instanceId === cardInstance.instanceId);
                const currentWorth = treasuresInPlay + (isInPlay ? 0 : 1);

                return `Current Worth: +${currentWorth} 💰`;
            }
        }
    }

    return null;
}
