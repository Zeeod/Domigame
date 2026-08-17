import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../shared/engine/GameState.js';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { CardInstance } from '../../shared/engine/CardInstance.js';

describe('Knights Attack', () => {
    let state: GameState;

    beforeEach(() => {
        state = createGameState('test-knights');
        state.players = [
            createPlayerState('p1', 'Player 1'),
            createPlayerState('p2', 'Player 2')
        ];
        state.players[0].actions = 1;
        state.players[0].buys = 1;
        state.players[0].coins = 0;
        state.phase = 'ACTION';
    });

    it('should trash a 3-6 cost card and discard the rest without trashing attacker', () => {
        const p1 = state.players[0];
        const p2 = state.players[1];

        const anna = createCardInstance('dame_anna');
        p1.playArea = [anna];

        const silver = createCardInstance('silver'); // Cost 3
        const copper = createCardInstance('copper'); // Cost 0
        p2.deck = [silver, copper];

        const knightAttackEffect = (CardRegistry.get('dame_anna')!.effects as any)[1];
        EffectEngine.applyEffects(state, 'p1', [knightAttackEffect], false, anna.instanceId);

        // CHOOSE_FROM_ZONE should prompt p2
        expect(state.pendingDecision).not.toBeNull();
        expect(state.pendingDecision!.playerId).toBe('p2');
        expect(p2.limbo.length).toBe(2);

        // p2 chooses silver
        EffectEngine.resolveDecision(state, 'p2', {
            type: 'CARDS',
            cardInstanceIds: [silver.instanceId]
        });

        expect(state.trash.length).toBe(1);
        expect(state.trash[0].id).toBe('silver');
        expect(p2.discardPile.some((c: CardInstance) => c.id === 'copper')).toBe(true);
        expect(p2.limbo.length).toBe(0);
        // Attacker is NOT trashed because Silver is not a Knight
        expect(p1.playArea.length).toBe(1);
        expect(p1.playArea[0].id).toBe('dame_anna');
    });

    it('should trash the attacker if victim trashes a Knight', () => {
        const p1 = state.players[0];
        const p2 = state.players[1];

        const anna = createCardInstance('dame_anna');
        p1.playArea = [anna];

        const josephine = createCardInstance('dame_josephine'); // Cost 5, type KNIGHT
        const copper = createCardInstance('copper');
        p2.deck = [josephine, copper];

        const knightAttackEffect = (CardRegistry.get('dame_anna')!.effects as any)[1];
        EffectEngine.applyEffects(state, 'p1', [knightAttackEffect], false, anna.instanceId);

        expect(state.pendingDecision).not.toBeNull();
        expect(state.pendingDecision!.playerId).toBe('p2');

        // p2 chooses dame_josephine (a Knight)
        EffectEngine.resolveDecision(state, 'p2', {
            type: 'CARDS',
            cardInstanceIds: [josephine.instanceId]
        });

        // Both Knights should be trashed
        expect(state.trash.some((c: CardInstance) => c.id === 'dame_josephine')).toBe(true);
        expect(state.trash.some((c: CardInstance) => c.id === 'dame_anna')).toBe(true);
        expect(p1.playArea.length).toBe(0);
    });
});
