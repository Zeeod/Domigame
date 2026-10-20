import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from 'immer';
import { CardRegistry } from '../../shared/cards/index.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { EconomyEngine } from '../../shared/engine/EconomyEngine.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { createGameState, createPlayerState, GameState } from '../../shared/engine/GameState.js';
import { registerDefaultPhases } from '../../shared/engine/registerCorePhases.js';
import { registerCoreEffects } from '../../shared/engine/registerCoreEffects.js';
import { ExpansionLoader } from '../../shared/engine/ExpansionLoader.js';
import { PhaseEngine } from '../../shared/engine/PhaseEngine.js';

describe('Plunder Traits Integration', () => {
    let state: GameState;

    beforeEach(() => {
        ExpansionLoader.reset();
        registerDefaultPhases();
        registerCoreEffects();
        
        state = createGameState('test-game');
        PhaseEngine.initTurnPipeline(state);
        
        state.players = [
            createPlayerState('s1', 'Player 1', 'blue'),
            createPlayerState('s2', 'Player 2', 'red')
        ];
        
        const kingdom = ['village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'cellar', 'workshop'];
        kingdom.forEach(cardId => {
            state.supply[cardId] = { cardId, count: 10, cards: [], traits: [] };
            for(let i=0; i<10; i++) {
                state.supply[cardId].cards.push(createCardInstance(cardId));
            }
        });
        
        state.phase = 'ACTION';
        state.turnNumber = 1;
        state.currentPlayerIndex = 0;
        state.players[0].actions = 1;
        state.players[0].buys = 1;
        state.players[0].coins = 0;
    });

    it('should apply Cheap trait cost reduction', () => {
        state.supply['village'].traits = ['cheap'];
        
        const def = CardRegistry.get('village');
        const originalCost = def!.cost || 0;
        const currentCost = EconomyEngine.getCardCost(state, 's1', 'village');
        
        expect(currentCost).toBe(originalCost - 1);
    });

    it('should block playing a card with Shy trait on the turn it was gained', () => {
        state.supply['village'].traits = ['shy'];
        state.phase = 'BUY';
        state.players[0].coins = 10;
        state.players[0].buys = 2; // Prevent auto-advance

        const buyResult = ActionResolver.resolve(state, 's1', { type: 'BUY_CARD', cardId: 'village' });
        expect(buyResult.success, buyResult.error).toBe(true);
        state = buyResult.state;
        
        const gainedVillage = state.players[0].discardPile.find(c => c.id === 'village');
        expect(gainedVillage).toBeDefined();
        expect(gainedVillage?.shy).toBe(true);
        
        state = produce(state, draft => {
            const p = draft.players[0];
            const v = p.discardPile.find(c => c.id === 'village');
            if (v) {
                p.discardPile = p.discardPile.filter(c => c.instanceId !== v.instanceId);
                p.hand.push(v);
            }
            draft.phase = 'ACTION';
            p.actions = 1;
        });
        
        const vInHand = state.players[0].hand.find(c => c.id === 'village');
        const playResult = ActionResolver.resolve(state, 's1', { type: 'PLAY_CARD', cardInstanceId: vInHand!.instanceId });
        
        expect(playResult.success).toBe(false);
        expect(playResult.error).toContain('timide');
    });

    it('should reset Shy trait at the start of the next turn', () => {
        const shyVillage = createCardInstance('village');
        shyVillage.shy = true;
        state.players[0].hand.push(shyVillage);
        
        // p1: ACTION -> BUY
        state = ActionResolver.resolve(state, 's1', { type: 'END_PHASE' }).state;
        // p1: BUY -> CLEANUP -> p2: ACTION
        state = ActionResolver.resolve(state, 's1', { type: 'END_PHASE' }).state;
        
        // p2: ACTION -> BUY
        state = ActionResolver.resolve(state, 's2', { type: 'END_PHASE' }).state;
        // p2: BUY -> CLEANUP -> p1: ACTION
        state = ActionResolver.resolve(state, 's2', { type: 'END_PHASE' }).state;
        
        expect(state.currentPlayerIndex).toBe(0);
        
        const allP1Cards = [
            ...state.players[0].hand,
            ...state.players[0].deck,
            ...state.players[0].discardPile,
            ...state.players[0].playArea
        ];
        
        const allP1Villages = allP1Cards.filter(c => c.id === 'village');
        expect(allP1Villages.length).toBeGreaterThan(0);
        allP1Villages.forEach(v => {
            expect(v.shy).toBeUndefined();
        });
    });
});
