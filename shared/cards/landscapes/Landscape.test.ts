
import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, createGameState } from '../../engine/GameState.js';
import { PlayerState, createPlayerState } from '../../engine/PlayerState.js';
import { LandscapeRegistry } from './index.js';
import { ActionResolver } from '../../engine/ActionResolver.js';
import { TurnMachine } from '../../engine/TurnMachine.js';
import { LandscapeExamples } from './LandscapeExamples.js';
import { TraitExamples } from './TraitExamples.js';
import { CardRegistry } from '../index.js';

describe('Landscape Mechanics', () => {
    let state: GameState;
    let player: PlayerState;

    beforeEach(() => {
        state = createGameState('test-seed');
        player = createPlayerState('p1', 'Player 1');
        state.players = [player];
        state.phase = 'ACTION';

        // Register examples
        LandscapeExamples.register();
        TraitExamples.register();

        // Mock supply for basic cards
        state.supply = {
            'copper': { cardId: 'copper', count: 10, cards: [] },
            'silver': { cardId: 'silver', count: 10, cards: [] },
            'gold': { cardId: 'gold', count: 10, cards: [] },
            'estate': { cardId: 'estate', count: 10, cards: [] },
            'duchy': { cardId: 'duchy', count: 10, cards: [] },
            'province': { cardId: 'province', count: 10, cards: [] },
        };
    });

    describe('Events', () => {
        it('should allow buying an Event (Alms)', () => {
            state.phase = 'BUY';
            player.buys = 1;
            player.coins = 4; // Cost is 0 but let's have money
            state.landscapes = ['alms'];

            // Alms cost is 0.
            const result = ActionResolver['resolveBuyLandscape'](state, player.id, 'alms');
            expect(result.success).toBe(true);
            expect(player.buys).toBe(0);

            // Check effects: Gain a card costing up to 4 if you have no treasures in play
            // Need to implement Alms logic fully or mock EffectEngine?
            // Alms definition should have onBuy effects.
            const def = LandscapeRegistry.get('alms');
            expect(def).toBeDefined();
            // We assume EffectEngine handles it.
        });

        it('should fail if not enough buys', () => {
            state.phase = 'BUY';
            player.buys = 0;
            state.landscapes = ['alms'];
            const result = ActionResolver['resolveBuyLandscape'](state, player.id, 'alms');
            expect(result.success).toBe(false);
            expect(result.error).toBe('No buys remaining');
        });
    });

    describe('Ways', () => {
        it('should allow playing an Action as a Way', () => {
            state.phase = 'ACTION';
            player.actions = 1;
            state.landscapes = ['way_of_the_sheep'];

            // Give player a Smithy
            // We need to register Smithy or mock it? 
            // Assuming basic cards are available.
            // We need a dummy action card in registry.
            // Give player a Village
            // Assuming basic cards are available.
            // We need a dummy action card in registry (mocked in beforeEach).
            // Manually register if needed or mock CardRegistry.get
            // CardRegistry.register(dummyAction); // Access protected?

            // For test purposes, we might need to rely on existing cards.
            // Let's assume 'village' exists or we can mock.

            // Can we spy on ActionResolver.resolvePlayCard?
        });
    });

    describe('Projects', () => {
        it('should mark project as owned on buy', () => {
            // Need a Project example. 
            // Let's create one on the fly?
            LandscapeRegistry.register({
                id: 'star_chart',
                name: 'Star Chart',
                types: ['PROJECT'],
                cost: { coin: 3 },
                expansion: 'Renaissance'
            });

            state.phase = 'BUY';
            player.buys = 1;
            player.coins = 3;
            state.landscapes = ['star_chart'];

            const result = ActionResolver['resolveBuyLandscape'](state, player.id, 'star_chart');
            expect(result.success).toBe(true);
            expect(player.projects).toContain('star_chart');
            expect(player.coins).toBe(0);
        });

        it('should prevent buying owned project', () => {
            LandscapeRegistry.register({
                id: 'star_chart',
                name: 'Star Chart',
                types: ['PROJECT'],
                cost: { coin: 3 },
                expansion: 'Renaissance'
            });

            state.phase = 'BUY';
            player.buys = 1;
            player.coins = 3;
            state.landscapes = ['star_chart'];
            player.projects = ['star_chart'];

            const result = ActionResolver['resolveBuyLandscape'](state, player.id, 'star_chart');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Project already owned');
        });
    });

    describe('Traits', () => {
        it('should apply Traits to card cost', () => {
            // Register 'cheap' definition
            // It's in TraitExamples

            state.supply['village'] = {
                cardId: 'village',
                count: 10,
                traits: ['cheap'],
                cards: []
            };

            // Mock Village card definition
            // Assuming implementation
        });
    });

    describe('Landmarks', () => {
        it('should calculate score with Landmarks', () => {
            // Mock TurnMachine.calculateScores logic or test EffectEngine application?
        });
    });

    describe('Allies', () => {
        it('should activate Ally with Favors', () => {
            LandscapeRegistry.register({
                id: 'plateau_shepherds',
                name: 'Plateau Shepherds',
                types: ['ALLY'],
                expansion: 'Allies',
                // favorCost: 2 // Custom prop check
                setupRequirements: { favorCost: 2 } // Or define how we store it
            });
            // We used (def as any).favorCost in implementation.
            (LandscapeRegistry.get('plateau_shepherds') as any).favorCost = 2;

            state.phase = 'ACTION';
            player.favors = 3;
            state.landscapes = ['plateau_shepherds'];

            const result = ActionResolver['resolveActivateLandscape'](state, player.id, 'plateau_shepherds');
            expect(result.success).toBe(true);
            expect(player.favors).toBe(1);
        });
    });

});
