import { GameState } from './GameState.js';
import { CardRegistry } from '../cards/index.js';

export function getCardCost(state: GameState, playerId: string, cardId: string): number {
    const cardDef = CardRegistry.get(cardId);
    if (!cardDef) return 0;

    let cost = cardDef.cost || 0;

    const player = state.players.find(p => p.id === playerId);
    if (!player) return Math.max(0, cost);

    // Apply Global Reductions (Bridge, etc)
    cost -= (player.costReduction || 0);

    // Apply Quarry (Actions -2)
    if (cardDef.types.includes('ACTION')) {
        const quarries = player.playArea.filter(c => c.id === 'quarry').length;
        cost -= (quarries * 2);
    }

    // Apply Highway (All cards -1 per Highway)
    const highways = player.playArea.filter(c => c.id === 'highway').length;
    cost -= highways;

    // Apply Princess (Buys -2) - Conditional, usually "While in play"
    const princesses = player.playArea.filter(c => c.id === 'princess').length;
    cost -= (princesses * 2);

    // Apply Bridge Troll (-1 each)
    const bridgeTrolls = player.playArea.filter(c => c.id === 'bridge_troll').length;
    cost -= bridgeTrolls;

    // Apply Rising Sun - Flourishing Trade (-1 when fulfilled)
    if (state.activeProphecyId === 'flourishing_trade') {
        const prophecyState = state.landscapeState['flourishing_trade'];
        if (prophecyState && prophecyState.tokens && prophecyState.tokens['sun'] === 0) {
            cost -= 1;
        }
    }

    return Math.max(0, cost);
}
