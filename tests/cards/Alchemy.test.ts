
import { describe, it, expect } from 'vitest';
import { createGameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance, createCardInstances } from '../../shared/engine/CardInstance.js';

describe('Alchemy Mechanics', () => {

    describe('Golem (Golem)', () => {
        it('should reveal cards until 2 Actions are found and play them', () => {
            const state = createGameState('alchemy_seed');
            const p1 = createPlayerState('p1', 'Player 1', '#fff');
            state.players.push(p1);
            state.supply['potion'] = { cardId: 'potion', count: 10, cards: [] };

            const golem = createCardInstance('golem');
            const copper1 = createCardInstance('copper');
            const copper2 = createCardInstance('copper');
            const smithy = createCardInstance('smithy');
            const silver = createCardInstance('silver');
            const village = createCardInstance('village');
            const gold = createCardInstance('gold');

            p1.hand = [golem];
            // Deck order (top is Gold): Copper, Copper, Smithy, Silver, Village, Gold
            p1.deck = [copper1, copper2, smithy, silver, village, gold];

            // Play Golem
            const golemDef = CardRegistry.get('golem')!;
            // applyEffects internally calls processStack
            let result = EffectEngine.applyEffects(state, p1.id, golemDef.effects!, false, golem.instanceId);

            // If prompted for order (expected when 2 Actions found), resolve it.
            if (result.needsChoice && result.state.pendingDecision) {
                const decisionState = result.state;
                const playerInDecisionState = decisionState.players.find(p => p.id === 'p1')!;
                const available = playerInDecisionState.aside || [];
                expect(available.length).toBeGreaterThan(0);

                // Choose the first one (e.g. Village or Smithy)
                // resolveDecision returns a new result with updated state
                result = EffectEngine.resolveDecision(decisionState, p1.id, {
                    type: 'CARDS',
                    cardInstanceIds: [available[0].instanceId]
                });
            }

            // Assertions
            // Golem should have played both actions.
            // Hand size: Starts with 0 (Golem played). 
            // Village (+1 Card), Smithy (+3 Cards). Total +4 Cards.
            // Since we use the original p1 reference (which is mutated by the engine), we check its hand.
            expect(p1.hand.length).toBeGreaterThanOrEqual(2);

            const playedNames = p1.playArea.map((c: any) => c.id);
            expect(playedNames).toContain('village');
            expect(playedNames).toContain('smithy');
        });
    });

    describe('Apprentice (Apprenti)', () => {
        it('should trash a card and draw cards/coins', () => {
            const state = createGameState('alchemy_seed_2');
            const p1 = createPlayerState('p1', 'Player 1', '#fff');
            state.players.push(p1);
            state.supply['potion'] = { cardId: 'potion', count: 10, cards: [] };

            const apprentice = createCardInstance('apprentice');
            const gold = createCardInstance('gold'); // Cost 6
            p1.hand = [apprentice, gold];
            p1.deck = createCardInstances('copper', 10);

            // Play Apprentice
            const def = CardRegistry.get('apprentice')!;
            p1.hand = p1.hand.filter((c: any) => c.instanceId !== apprentice.instanceId);
            p1.playArea.push(apprentice);

            // applyEffects internally calls processStack
            let result = EffectEngine.applyEffects(state, p1.id, def.effects!, false, apprentice.instanceId);

            // Prompt to trash
            expect(result.needsChoice).toBe(true);
            expect(result.state.pendingDecision).toBeDefined();

            // Select Gold
            result = EffectEngine.resolveDecision(result.state, p1.id, {
                type: 'CARDS',
                cardInstanceIds: [gold.instanceId]
            });

            expect(p1.hand.length).toBe(6);
            expect(state.trash.find((c: any) => c.instanceId === gold.instanceId)).toBeDefined();
        });
    });
});
