import { describe, it, expect, beforeEach } from 'vitest';
import { GameRoomV2 } from '../../../server/GameRoomV2';
import { GameState } from '../../../shared/engine/GameState';

describe('Validation des Transitions de Phase par les Trésors', () => {
    let room: GameRoomV2;
    let state: GameState;

    beforeEach(() => {
        const ioMock = {
            to: () => ({ emit: () => { } })
        };
        room = new GameRoomV2(ioMock as any, 'test-room', {
            maxPlayers: 2,
            kingdomCards: ['village', 'smithy', 'market']
        });

        // Setup players
        room.addPlayer({ id: 's1', join: () => { } } as any, 'Player 1', 'red', 'p1');
        room.addPlayer({ id: 's2', join: () => { } } as any, 'Player 2', 'blue', 'p2');

        // Force ready for Player 2 (Player 1 is host, already passes check)
        room.players.forEach(p => p.isReady = true);

        // Initialize Game
        room.startGame(['village', 'smithy', 'market']);
        state = room.gameState;

        console.log('DEBUG TEST: Pipeline =', state.phasePipeline);
        console.log('DEBUG TEST: Current Player =', state.players[state.currentPlayerIndex].id);

        // Force player 1 turn in ACTION phase
        state.currentPlayerIndex = state.players.findIndex(p => p.id === 'p1');
        state.phase = 'ACTION';
        const p1Index = state.currentPlayerIndex;
        state.players[p1Index].actions = 1;
        state.players[p1Index].coins = 0;
        state.players[p1Index].hand = [
            { instanceId: 'c1', id: 'copper' },
            { instanceId: 's1', id: 'silver' },
            { instanceId: 'v1', id: 'village' }
        ];

        // Link sockets
        room['socketToPlayer'].set('s1', 'p1');
        room['socketToPlayer'].set('s2', 'p2');
    });

    it('devrait passer en phase d\'ACHAT en jouant un Cuivre en phase ACTION', () => {
        const result = room.handleAction('s1', { type: 'PLAY_CARD', cardInstanceId: 'c1' });
        expect(result.success).toBe(true);
        expect(room.gameState.phase).toBe('BUY');
        expect(room.gameState.players.find(p => p.id === 'p1')!.coins).toBe(1);
        expect(room.gameState.players.find(p => p.id === 'p1')!.playArea.some(c => c.id === 'copper')).toBe(true);
    });

    it('devrait permettre de jouer un Trésor alors qu\'on est déjà en phase d\'ACHAT', () => {
        // Passer en phase d'achat d'abord (manuellement ou par bouton)
        room.handleAction('s1', { type: 'END_PHASE' });
        expect(room.gameState.phase).toBe('BUY');

        // Jouer un argent
        const result = room.handleAction('s1', { type: 'PLAY_CARD', cardInstanceId: 's1' });
        expect(result.success).toBe(true);
        expect(room.gameState.phase).toBe('BUY');
        expect(room.gameState.players.find(p => p.id === 'p1')!.coins).toBe(2);
    });

    it('devrait passer en phase d\'ACHAT via "Jouer tous les trésors" en phase ACTION', () => {
        const result = room.handleAction('s1', { type: 'PLAY_ALL_TREASURES' });
        expect(result.success).toBe(true);
        expect(room.gameState.phase).toBe('BUY');
        // Cuivre (1) + Argent (2) = 3
        expect(room.gameState.players.find(p => p.id === 'p1')!.coins).toBe(3);
    });

    it('devrait bloquer le jeu d\'une carte ACTION en phase d\'ACHAT', () => {
        room.handleAction('s1', { type: 'END_PHASE' });
        expect(room.gameState.phase).toBe('BUY');

        const result = room.handleAction('s1', { type: 'PLAY_CARD', cardInstanceId: 'v1' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Seuls les Trésors peuvent être joués');
    });
});
