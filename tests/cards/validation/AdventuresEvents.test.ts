import { describe, it, expect, beforeEach } from 'vitest';
import { GameRoomV2 } from '../../../server/GameRoomV2';
import { GameState } from '../../../shared/engine/GameState';
import { ActionResolver } from '../../../shared/engine/ActionResolver';

describe('Validation des Événements Adventures', () => {
    let room: GameRoomV2;
    let state: GameState;

    beforeEach(() => {
        const kingdom = ['silver', 'village'];
        const ioMock = {
            to: () => ({ emit: () => { } })
        };
        room = new GameRoomV2(ioMock as any, 'test-room', {
            maxPlayers: 2,
            enabledExpansions: ['adventures', 'base'],
            kingdomCards: kingdom
        });
        room.addPlayer({ id: 's1', join: () => { } } as any, 'Player 1', 'red', 'p1');
        room.addPlayer({ id: 's2', join: () => { } } as any, 'Player 2', 'blue', 'p2');
        state = room.createInitialGameState(kingdom);
        state.phase = 'BUY';
        // Forcer les paysages pour le test
        state.landscapes = ['alms', 'borrow', 'save', 'pilgrimage'];
    });

    it('Aumône (Alms) : gagne une carte si 0 trésor en jeu', () => {
        const player = state.players[0];
        player.playArea = []; // 0 trésors
        player.buys = 1;
        player.coins = 0;

        const res1 = ActionResolver.resolve(state, player.id, { type: 'BUY_EVENT', cardId: 'alms' } as any);
        if (!res1.success) throw new Error(res1.error);
        state = res1.state;

        // Succès de l'achat et gain déclenché
        expect(state.pendingDecision).toBeDefined();
        expect(state.pendingDecision?.constraints?.filter?.maxCost).toBe(4);
    });

    it('Emprunt (Borrow) : défausse défausse pour +1$', () => {
        const player = state.players[0];
        player.discardPile = [{ instanceId: 's1', id: 'silver' }];
        player.buys = 1;
        player.coins = 0;

        const res2 = ActionResolver.resolve(state, player.id, { type: 'BUY_EVENT', cardId: 'borrow' } as any);
        if (!res2.success) throw new Error(res2.error);
        state = res2.state;
        const pFinal = state.players[0];

        expect(pFinal.coins).toBe(1);
        expect(pFinal.discardPile.length).toBe(0);
        expect(pFinal.deck.length).toBeGreaterThan(0); // Silver a été mis sur le deck
    });
});
