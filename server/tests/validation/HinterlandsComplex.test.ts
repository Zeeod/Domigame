import { describe, it, expect, beforeEach } from 'vitest';
import { GameRoomV2 } from '../../../server/GameRoomV2';
import { GameState } from '../../../shared/engine/GameState';
import { ActionResolver } from '../../../shared/engine/ActionResolver';

describe('Validation des mécaniques avancées (Hinterlands/Guildes)', () => {
    let room: GameRoomV2;
    let state: GameState;

    beforeEach(() => {
        const kingdom = ['haggler', 'scheme', 'merchant_guild', 'village', 'smithy'];
        const ioMock = {
            to: () => ({ emit: () => { } })
        };
        room = new GameRoomV2(ioMock as any, 'test-room', {
            maxPlayers: 2,
            enabledExpansions: ['hinterlands', 'guilds', 'base'],
            kingdomCards: kingdom
        });
        room.addPlayer({ id: 's1', join: () => { } } as any, 'Player 1', 'red', 'p1');
        room.addPlayer({ id: 's2', join: () => { } } as any, 'Player 2', 'blue', 'p2');
        state = room.createInitialGameState(kingdom);
        room.gameState = state;

        // Fix player order for deterministic tests
        state.players[0].id = 'p1';
        state.players[0].name = 'Player 1';
        state.players[1].id = 'p2';
        state.players[1].name = 'Player 2';
        state.currentPlayerIndex = 0;

        // Link sockets
        room['socketToPlayer'].set('s1', 'p1');
        room['socketToPlayer'].set('s2', 'p2');

        state.phase = 'BUY';
    });

    it('Marchandeur (Haggler) : gagne une carte de coût inférieur lors d\'un achat', () => {
        const player = state.players[0];
        player.hand = [];
        player.playArea = [{ instanceId: 'h1', id: 'haggler' }]; // Simule Haggler en jeu
        player.coins = 5;
        player.buys = 1;

        // Acheter un Village (3$)
        const result = ActionResolver.resolve(state, player.id, { type: 'BUY_CARD', cardId: 'village' });
        if (!result.success) throw new Error(result.error);
        state = result.state;

        // Vérifier que state.lastBoughtCost est 3
        expect(state.lastBoughtCost).toBe(3);

        // Devrait avoir une décision en attente pour gagner une carte < 3$
        if (!state.pendingDecision) {
            console.log('Haggler Search Failed. Supply cards:', Object.keys(state.supply).join(', '));
            console.log('Last Bought Cost:', state.lastBoughtCost);
        }
        expect(state.pendingDecision).toBeDefined();
        expect(state.pendingDecision?.context.filter.maxCost).toBe(2);
    });

    it('Schéma (Scheme) : permet de replacer une Action sur le deck en fin de tour', () => {
        // Initialiser les ressources sur l'état de la salle
        room.gameState.players[0].coins = 10;
        room.gameState.players[0].buys = 2;
        room.gameState.players[0].playArea = [
            { instanceId: 'h1', id: 'haggler' },
            { instanceId: 's1', id: 'scheme' },
            { instanceId: 'v1', id: 'village' }
        ];

        // Acheter Village (déclenche Haggler)
        room.handleAction('s1', { type: 'BUY_CARD', cardId: 'village' } as any);

        // Résoudre le gain de Haggler (obligatoire avant de finir la phase)
        expect(room.gameState.pendingDecision).toBeDefined();
        room.handleAction('s1', {
            type: 'CHOOSE',
            choiceId: room.gameState.pendingDecision!.id,
            payload: { type: 'SUPPLY', cardId: 'estate' }
        } as any);

        // Déclencher le nettoyage (Achat -> Nuit -> Nettoyage)
        // Buy -> Night
        room.handleAction('s1', { type: 'END_PHASE' } as any);
        // Night -> Cleanup
        room.handleAction('s1', { type: 'END_PHASE' } as any);

        let currentState = room.gameState;

        // Devrait avoir une décision pour Stratagème car Village est une Action en jeu
        expect(currentState.pendingDecision).toBeDefined();
        // Optionnel: On peut aussi vérifier que c'est bien Scheme qui a causé cela
        // expect(currentState.pendingDecision?.message).toContain('Stratag');
    });
});
