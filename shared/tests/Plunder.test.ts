import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, PlayerState } from '../engine/GameState.js';
import { ExpansionEffectHandler } from '../engine/effects/ExpansionEffectHandler.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { createPlayerState } from '../engine/PlayerState.js';
import { CardRegistry } from '../cards/index.js';

describe('Plunder Loot Mechanics', () => {
    let state: any;
    let player: PlayerState;

    beforeEach(() => {
        state = createGameState('test');
        player = createPlayerState('p1', 'P1');
        state.players = [player];

        // Setup Loot pile
        state.nonSupply['loot_pile'] = {
            cardId: 'loot_pile',
            count: 3,
            cards: [
                createCardInstance('amphora'),
                createCardInstance('doubloons'),
                createCardInstance('figurehead')
            ]
        };
    });

    it('should gain a random loot to hand', () => {
        const initialHandSize = player.hand.length;
        const initialLootCount = state.nonSupply['loot_pile'].cards.length;

        ExpansionEffectHandler.handleGainLoot(state, player, { count: 1 });

        expect(player.hand.length).toBe(initialHandSize + 1);
        expect(state.nonSupply['loot_pile'].cards.length).toBe(initialLootCount - 1);

        const gainedCard = player.hand[0];
        const def = CardRegistry.get(gainedCard.id);
        expect(def?.types).toContain('LOOT');
    });

    it('should handle empty loot pile', () => {
        state.nonSupply['loot_pile'].cards = [];
        state.nonSupply['loot_pile'].count = 0;

        const initialHandSize = player.hand.length;
        ExpansionEffectHandler.handleGainLoot(state, player, { count: 1 });

        expect(player.hand.length).toBe(initialHandSize);
    });
});
