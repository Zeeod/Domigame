
import { describe, it, expect } from 'vitest';
import { createGameState } from '../../shared/engine/GameState.js';
import { GameRoomV2 } from '../GameRoomV2.js';
import { CardRegistry } from '../../shared/cards/index.js';

describe('Mixed Piles Initialization', () => {

    it('should initialize Knights pile correctly (SHUFFLED)', () => {
        const room = new GameRoomV2({ to: () => ({ emit: () => { } }) } as any, 'test-room', {
            kingdomCards: ['knights']
        });
        const state = room.createInitialGameState();

        const knightsPile = state.supply['knights'];
        expect(knightsPile).toBeDefined();
        expect(knightsPile.isMixed).toBe(true);
        expect(knightsPile.count).toBe(10);
        expect(knightsPile.cards?.length).toBe(10);

        // Knights are shuffled, so we can't check exact order, 
        // but we can check they are all unique knights.
        const cardIds = knightsPile.cards?.map(c => c.id) || [];
        const uniqueIds = new Set(cardIds);
        expect(uniqueIds.size).toBe(10);
    });

    it('should initialize Castles pile correctly (ORDERED)', () => {
        const room = new GameRoomV2({ to: () => ({ emit: () => { } }) } as any, 'test-room', {
            kingdomCards: ['castles_pile']
        });
        const state = room.createInitialGameState();

        const castlesPile = state.supply['castles_pile'];
        expect(castlesPile).toBeDefined();
        expect(castlesPile.isMixed).toBe(true);
        expect(castlesPile.count).toBe(8);
        expect(castlesPile.cards?.length).toBe(8);

        // Check order: Humble (3) should be on TOP (last in array if using pop() logic, 
        // but wait, GameRoomV2 uses index 0 as top or what? 
        // Let's check GameRoomV2.ts handleAction logic for BUY.

        // Actually, supply initialization in GameRoomV2:
        // cards: baseCards.map(id => createCardInstance(id))
        // And pop() usually takes from the end of the array.
        // If the array is [Kings, ..., Humble], then Humble is at index 7.

        const cardIds = castlesPile.cards?.map(c => c.id) || [];
        expect(cardIds[7]).toBe('humble_castle');
        expect(cardIds[0]).toBe('kings_castle');
    });

    it('should initialize Split Piles correctly (ORDERED)', () => {
        const room = new GameRoomV2({ to: () => ({ emit: () => { } }) } as any, 'test-room', {
            kingdomCards: ['catapult_rocks_pile']
        });
        const state = room.createInitialGameState();

        const pile = state.supply['catapult_rocks_pile'];
        expect(pile).toBeDefined();
        expect(pile.isMixed).toBe(true);
        expect(pile.count).toBe(10);
        expect(pile.cards?.length).toBe(10);

        const cardIds = pile.cards?.map(c => c.id) || [];
        // [5x Rocks, 5x Catapult]
        // Catapult should be on top (index 5-9)
        expect(cardIds[0]).toBe('rocks');
        expect(cardIds[4]).toBe('rocks');
        expect(cardIds[5]).toBe('catapult');
        expect(cardIds[9]).toBe('catapult');
    });

    it('should filter kingdom candidates correctly (only conglomerates)', () => {
        const candidates = CardRegistry.getKingdomCandidates();

        // Should contain conglomerates
        expect(candidates).toContain('knights');
        expect(candidates).toContain('castles_pile');
        expect(candidates).toContain('catapult_rocks_pile');

        // Should NOT contain constituents
        expect(candidates).not.toContain('sir_bailey');
        expect(candidates).not.toContain('humble_castle');
        expect(candidates).not.toContain('catapult');
        expect(candidates).not.toContain('rocks');
    });
});
