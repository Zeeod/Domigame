
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../GameRoomV2.js';
import { CardRegistry } from '../../shared/cards/index.js';

describe('Allies Split Piles', () => {

    it('should initialize Augurs pile correctly (16 cards, rotating)', () => {
        const room = new GameRoomV2({ to: () => ({ emit: () => { } }) } as any, 'test-room', {
            kingdomCards: ['augurs_pile']
        });
        const state = (room as any).createInitialGameState();

        const pile = state.supply['augurs_pile'];
        expect(pile).toBeDefined();
        expect(pile.count).toBe(16);
        expect(pile.cards.length).toBe(16);

        const cardIds = pile.cards.map((c: any) => c.id);
        // Top 4 should be Herb Gatherer
        for (let i = 12; i < 16; i++) {
            expect(cardIds[i]).toBe('herb_gatherer');
        }
        // Bottom 4 should be Sibyl
        for (let i = 0; i < 4; i++) {
            expect(cardIds[i]).toBe('sibyl');
        }
    });

    it('should initialize Townsfolk pile correctly (16 cards, rotating)', () => {
        const room = new GameRoomV2({ to: () => ({ emit: () => { } }) } as any, 'test-room', {
            kingdomCards: ['townsfolk_pile']
        });
        const state = (room as any).createInitialGameState();

        const pile = state.supply['townsfolk_pile'];
        expect(pile).toBeDefined();
        expect(pile.count).toBe(16);

        const cardIds = pile.cards.map((c: any) => c.id);
        // Top 4 should be Town Crier (index 12-15)
        for (let i = 12; i < 16; i++) {
            expect(cardIds[i]).toBe('town_crier');
        }
        // Next 4 should be Blacksmith (index 8-11)
        for (let i = 8; i < 12; i++) {
            expect(cardIds[i]).toBe('town_blacksmith');
        }
    });

    it('should initialize Wizards pile correctly (16 cards, rotating)', () => {
        const room = new GameRoomV2({ to: () => ({ emit: () => { } }) } as any, 'test-room', {
            kingdomCards: ['wizards_pile']
        });
        const state = (room as any).createInitialGameState();

        const pile = state.supply['wizards_pile'];
        expect(pile).toBeDefined();
        expect(pile.count).toBe(16);

        const cardIds = pile.cards.map((c: any) => c.id);
        // Top 4 should be Student (index 12-15)
        for (let i = 12; i < 16; i++) {
            expect(cardIds[i]).toBe('student');
        }
    });
});
