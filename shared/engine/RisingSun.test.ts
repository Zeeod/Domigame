import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { GameState, createGameState, createCardInstance } from './GameState.js';
import { PlayerState, createPlayerState } from './PlayerState.js';
import { CardRegistry } from '../cards/index.js';
import { EffectEngine } from './EffectEngine.js';
import { registerCoreEffects } from './registerCoreEffects.js';
import { GameLogStore } from './GameLogStore.js';
import './registerExpansions.js';

describe('Rising Sun Expansion Mechanics', () => {
    let state: GameState;
    let player: PlayerState;

    beforeAll(() => {
        registerCoreEffects();
        // Register necessary cards for testing
        CardRegistry.register({
            id: 'poet',
            name: 'Poète',
            cost: 4,
            types: ['ACTION'],
            description: "+1 Action. +1 💰. Dévoilez les 3 premières cartes de votre deck. Vous pouvez en défausser. Gagnez +1 💰 par nom différent parmi les cartes dévoilées.",
            effects: [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }, { type: 'POET_EFFECT' as any }],
            expansion: 'rising_sun'
        });
        CardRegistry.register({
            id: 'river_shrine',
            name: 'Sanctuaire de Rivière',
            cost: 3,
            types: ['ACTION'],
            description: "+1 💰. Vous pouvez défausser une carte pour en gagner une coûtant jusqu'à 3 💰.",
            effects: [{ type: 'ADD_MONEY', amount: 1 }, { type: 'RIVER_SHRINE_EFFECT' as any }],
            expansion: 'rising_sun'
        });
        CardRegistry.register({
            id: 'mountain_shrine',
            name: 'Sanctuaire de Montagne',
            cost: 4,
            types: ['ACTION'],
            description: "Écartez une carte de votre main. +1 💰 par type différent en jeu.",
            effects: [{ type: 'MOUNTAIN_SHRINE_EFFECT' as any }],
            expansion: 'rising_sun'
        });
        CardRegistry.register({
            id: 'copper',
            name: 'Cuivre',
            cost: 0,
            types: ['TREASURE'],
            expansion: 'base'
        });
        CardRegistry.register({
            id: 'silver',
            name: 'Argent',
            cost: 3,
            types: ['TREASURE'],
            expansion: 'base'
        });
        CardRegistry.register({
            id: 'estate',
            name: 'Domaine',
            cost: 2,
            types: ['VICTORY'],
            expansion: 'base'
        });
    });

    beforeEach(() => {
        state = createGameState('test-rs-seed');
        player = createPlayerState('p1', 'Player 1');
        state.players = [player];
        state.phase = 'ACTION';
        GameLogStore.clear(state.id);

        // Initialize supply for gain effects
        state.supply = {
            'copper': { cardId: 'copper', count: 60, cards: Array.from({ length: 60 }, () => createCardInstance('copper')), traits: [] },
            'silver': { cardId: 'silver', count: 40, cards: Array.from({ length: 40 }, () => createCardInstance('silver')), traits: [] },
            'estate': { cardId: 'estate', count: 8, cards: Array.from({ length: 8 }, () => createCardInstance('estate')), traits: [] }
        };
    });

    it('should have Rising Sun cards registered', () => {
        const ids = CardRegistry.getAllIds();
        expect(ids).toContain('poet');
        expect(ids).toContain('river_shrine');
        expect(ids).toContain('mountain_shrine');
    });

    describe('Poet', () => {
        it('should reveal 3 cards and give money per unique name', () => {
            player.deck = [
                { id: 'copper', instanceId: 'c1' },
                { id: 'silver', instanceId: 's1' },
                { id: 'estate', instanceId: 'e1' }
            ];

            // Apply Poet effect
            EffectEngine.applyEffects(state, player.id, [{ type: 'POET_EFFECT' as any }]);

            // Should give +3 coins (3 unique names)
            expect(player.coins).toBe(3);

            // Should prompt for discard choice (mocking as passed if possible, but let's check pendingDecision)
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.type).toBe('CHOOSE_CARDS');
            expect(state.pendingDecision?.context?.specialAction).toBe('SELECT_AND_APPLY');
        });
    });

    describe('Mountain Shrine', () => {
        it('should give money based on unique types in play', () => {
            player.hand = [{ id: 'estate', instanceId: 'e1' }];
            player.playArea = [
                { id: 'copper', instanceId: 'c1' }, // Treasure
                { id: 'mountain_shrine', instanceId: 'ms1' } // Action
            ];

            // Apply Mountain Shrine effect
            EffectEngine.applyEffects(state, player.id, [{ type: 'MOUNTAIN_SHRINE_EFFECT' as any }]);

            // Should prompt for trash
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.type).toBe('CHOOSE_CARDS');

            // Resolve trash decision
            EffectEngine.resolveDecision(state, player.id, { cards: [{ id: 'estate', instanceId: 'e1' }] });

            // Unique types in play: TREASURE (copper), ACTION (mountain_shrine) -> 2 types
            expect(player.coins).toBe(2);
            expect(state.trash).toContainEqual({ id: 'estate', instanceId: 'e1' });
        });
    });

    describe('River Shrine', () => {
        it('should allow discarding to gain a card costing up to 3', () => {
            player.hand = [{ id: 'estate', instanceId: 'e1' }];
            state.supply['silver'] = { cardId: 'silver', count: 10, cards: [{ id: 'silver', instanceId: 's_new' }] };

            // Apply River Shrine effect
            EffectEngine.applyEffects(state, player.id, [{ type: 'RIVER_SHRINE_EFFECT' as any }]);

            // Should prompt for discard
            expect(state.pendingDecision?.type).toBe('CHOOSE_CARDS');
            expect(state.pendingDecision?.context?.specialAction).toBe('SELECT_AND_APPLY');

            // Resolve discard
            EffectEngine.resolveDecision(state, player.id, { cards: [{ id: 'estate', instanceId: 'e1' }] });

            // Should prompt for gain (RIVER_SHRINE_GAIN or generic gain choice?)
            // River Shrine implementation: onSuccess: [{ type: 'GAIN_CARD', maxCost: 4 }]
            // GAIN_CARD usually results in a choice if multiple options exist.
            expect(state.pendingDecision?.type).toBe('CHOOSE_CARDS');

            // Resolve gain
            EffectEngine.resolveDecision(state, player.id, { cards: [{ id: 'silver', instanceId: 's_new' }] });

            expect(player.discardPile.some(c => c.id === 'silver')).toBe(true);
            expect(player.hand.length).toBe(0); // Estate discarded
        });
    });
});
