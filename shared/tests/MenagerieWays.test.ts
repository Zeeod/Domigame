
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState, getCurrentPlayer } from '../engine/GameState.js';
import { createPlayerState } from '../engine/PlayerState.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import { MenagerieModule } from '../engine/expansions/Menagerie.js';
import { ExpansionLoader } from '../engine/ExpansionLoader.js';
import { CardRegistry } from '../cards/index.js';
import { PhaseEngine } from '../engine/PhaseEngine.js';
import { registerCoreEffects } from '../engine/registerCoreEffects.js';
import { registerDefaultPhases } from '../engine/registerCorePhases.js';
import { EffectEngine } from '../engine/EffectEngine.js';

describe('Menagerie Way Mechanics', () => {
    let state: GameState;
    const P1 = 'p1';

    beforeEach(() => {
        // Essential bootstrap for tests
        ExpansionLoader.reset();
        
        registerCoreEffects();
        registerDefaultPhases();
        
        ExpansionLoader.load(MenagerieModule);

        state = createGameState('test-menagerie');
        const player = createPlayerState(P1, 'Player 1');
        state.players = [player];
        state.currentPlayerIndex = 0;
        
        PhaseEngine.initTurnPipeline(state);
        state.phase = 'ACTION';
        player.actions = 1;
        player.buys = 1;
        
        // Populate deck so drawing tests (Turtle, Squirrel, Frog) have cards to draw
        player.deck = Array(20).fill(null).map(() => createCardInstance('copper'));

        // Add some basic cards to supply for Way of the Butterfly
        state.supply['village'] = { cardId: 'village', count: 10, cards: Array(10).fill(null).map(() => createCardInstance('village')) };
        state.supply['smithy'] = { cardId: 'smithy', count: 10, cards: Array(10).fill(null).map(() => createCardInstance('smithy')) };
    });

    /**
     * Simulates ending a turn completely (Cleanup + Next Turn Start)
     */
    function fullEndTurn(currentState: GameState): GameState {
        let s = currentState;
        const initialTurn = s.turnNumber;
        let safeCounter = 0;
        
        while (s.turnNumber === initialTurn) {
            console.log(`[fullEndTurn] loop start: turnNumber=${s.turnNumber}, phase=${s.phase}`);
            if (safeCounter++ > 10) {
                throw new Error(`Infinite loop in fullEndTurn. Phase: ${s.phase}, PendingDecision: ${JSON.stringify(s.pendingDecision)}`);
            }
            s = ActionResolver.resolve(s, P1, { type: 'END_PHASE' }).state;
            console.log(`[fullEndTurn] loop end: turnNumber=${s.turnNumber}, phase=${s.phase}`);
        }
        
        // No need to process stack here, ActionResolver already processed it, including START_NEXT_TURN
        return s;
    }

    it('Way of the Butterfly: should return card to pile and gain one costing exactly 1 more', () => {
        let s = state;
        const player = s.players[0];
        const village = createCardInstance('village'); // Cost 3
        player.hand.push(village);
        s.landscapes = ['way_of_the_butterfly'];

        const initialSupplyVillageCount = s.supply['village'].count;
        const initialSupplySmithyCount = s.supply['smithy'].count;

        const result = ActionResolver.resolve(s, P1, { type: 'PLAY_CARD', cardInstanceId: village.instanceId, wayId: 'way_of_the_butterfly' });
        s = result.state;

        // Village count should be incremented
        expect(s.supply['village'].count).toBe(initialSupplyVillageCount + 1);
        
        // Should have a pending decision to gain a card costing 4
        expect(s.pendingDecision?.type).toBe('CHOOSE_CARDS');
        expect(s.pendingDecision?.constraints?.filter?.exactCost).toBe(4);

        // Resolve decision: Gain Smithy
        const decisionResult = ActionResolver.resolve(s, P1, { 
            type: 'CHOOSE', 
            choiceId: s.pendingDecision!.id, 
            payload: { type: 'CARDS', cardInstanceIds: [s.supply['smithy'].cards[0].instanceId] } 
        });
        s = decisionResult.state;

        const newPlayer = s.players[0];
        expect(newPlayer.discardPile.some(c => c.id === 'smithy')).toBe(true);
        expect(s.supply['smithy'].count).toBe(initialSupplySmithyCount - 1);
    });

    it('Way of the Chameleon: should swap +Cards and +Coins', () => {
        let s = state;
        const player = s.players[0];
        const smithy = createCardInstance('smithy'); // Normally +3 Cards
        player.hand.push(smithy);
        s.landscapes = ['way_of_the_chameleon'];

        const initialCoins = player.coins;
        const initialHandSize = player.hand.length;

        const result = ActionResolver.resolve(s, P1, { type: 'PLAY_CARD', cardInstanceId: smithy.instanceId, wayId: 'way_of_the_chameleon' });
        s = result.state;

        // Should have +3 Coins instead of +3 Cards
        const newPlayer = s.players[0];
        expect(newPlayer.coins).toBe(initialCoins + 3);
        expect(newPlayer.hand.length).toBe(initialHandSize - 1); 
    });

    it('Way of the Frog: should put card on deck during cleanup', () => {
        let s = state;
        const player = s.players[0];
        const village = createCardInstance('village');
        player.hand.push(village);
        s.landscapes = ['way_of_the_frog'];

        const result = ActionResolver.resolve(s, P1, { type: 'PLAY_CARD', cardInstanceId: village.instanceId, wayId: 'way_of_the_frog' });
        s = result.state;
        
        const playerAfterPlay = s.players[0];
        expect(playerAfterPlay.actions).toBe(1); // Frog gives +1 Action (and we spent 1 to play it)

        // Advance to Cleanup
        while (s.phase !== 'CLEANUP') {
            s = ActionResolver.resolve(s, P1, { type: 'END_PHASE' }).state;
        }
        
        // Should have a decision (Frog: topdeck?)
        expect(s.pendingDecision?.message).toContain('deck');
        
        // Resolve: Yes
        const decisionResult = ActionResolver.resolve(s, P1, {
            type: 'CHOOSE',
            choiceId: s.pendingDecision!.id,
            payload: { type: 'OPTION', optionIndex: 0 } // Yes
        });
        s = decisionResult.state;

        // Finish cleanup stack
        const finalResult = EffectEngine.processStack(s);
        s = finalResult.state;

        // Village should be in the new hand (put on deck, then drawn during cleanup)
        const finalPlayer = s.players[0];
        expect(finalPlayer.hand.some(c => c.instanceId === village.instanceId)).toBe(true);
    });

    it('Way of the Turtle: should set aside and play next turn', () => {
        let s = state;
        const player = s.players[0];
        const smithy = createCardInstance('smithy');
        player.hand.push(smithy);
        s.landscapes = ['way_of_the_turtle'];

        const result = ActionResolver.resolve(s, P1, { type: 'PLAY_CARD', cardInstanceId: smithy.instanceId, wayId: 'way_of_the_turtle' });
        s = result.state;

        // Card should be in aside zone
        const playerAfterTurtle = s.players[0];
        expect(playerAfterTurtle.aside.some(c => c.instanceId === smithy.instanceId)).toBe(true);

        // Advance to next turn
        s = fullEndTurn(s);

        // Smithy should be played automatically at start of turn
        const newPlayer = getCurrentPlayer(s);
        expect(newPlayer.playArea.some(c => c.instanceId === smithy.instanceId)).toBe(true);
        expect(newPlayer.hand.length).toBe(5 + 3); // 5 from draw, 3 from smithy
    });

    it('Way of the Squirrel: should draw 2 cards at end of turn', () => {
        let s = state;
        const player = s.players[0];
        const village = createCardInstance('village');
        player.hand.push(village);
        s.landscapes = ['way_of_the_squirrel'];

        const result = ActionResolver.resolve(s, P1, { type: 'PLAY_CARD', cardInstanceId: village.instanceId, wayId: 'way_of_the_squirrel' });
        s = result.state;

        // End turn
        s = fullEndTurn(s);

        // Should have 5 (normal draw) + 2 (squirrel) = 7 cards
        const newPlayer = getCurrentPlayer(s);
        expect(newPlayer.hand.length).toBe(7);
    });
});
