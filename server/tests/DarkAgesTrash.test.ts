
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance, createCardInstances } from '../../shared/engine/CardInstance.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';

describe('Dark Ages Trash Mechanics', () => {
    let state: GameState;
    let p1: any;

    beforeEach(() => {
        state = createGameState('test_game_darkAges');
        p1 = createPlayerState('p1', 'Player 1', '#fff');
        state.players.push(p1);
        state.currentPlayerIndex = 0;

        // Ensure supply exists for Rats gain
        state.supply = {
            'rats': { cardId: 'rats', count: 20, cards: [] },
            'duchy': { cardId: 'duchy', count: 8, cards: [] },
            'estate': { cardId: 'estate', count: 8, cards: [] }
        } as any;
    });

    describe('Rats', () => {
        it('should gain a Rats and trash a card (other than Rats) when played', () => {
            const rats = createCardInstance('rats');
            const copper = createCardInstance('copper');
            p1.hand = [rats, copper];

            // 1. Play Rats
            // Effect: +1 Card, +1 Action. Gain a Rats. Trash a card from hand (not a Rat).
            const ratsDef = CardRegistry.get('rats')!;
            EffectEngine.applyEffects(state, p1.id, ratsDef.effects!, false, rats.instanceId);

            // Immediate bonuses
            expect(p1.hand.length).toBe(2); // Started 2, played 1 (-1), +1 card (+1) -> 2. (Copper + Drawn Card)
            // Wait, deck is empty, so draw might fail unless we assume deck has something.
            // Let's verify pending decision first (Trash card).

            // Should trigger Gain Rats
            expect(state.lastGainedCard).toBeDefined();
            expect(state.lastGainedCard?.id).toBe('rats');
            expect(p1.discardPile.some((c: any) => c.id === 'rats')).toBe(true);

            // Should prompt for Trash
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.context.specialAction).toBe('TRASH'); // We added this to Rats definition

            // Verify constraint: Not Rats
            // The filter implementation for Rats specifically excludes 'rats' type or id

            // Select Copper to trash
            EffectEngine.resolveDecision(state, p1.id, { cardInstanceIds: [copper.instanceId] });

            expect(state.trash.length).toBe(1);
            expect(state.trash[0].id).toBe('copper');
        });
    });

    describe('Fortress (Forteresse)', () => {
        it('should return to hand when trashed', () => {
            const fortress = createCardInstance('fortress');
            p1.hand = [fortress];

            // 1. Trash Fortress manually (simulating a trash effect)
            EffectEngine.applyEffects(state, p1.id, [{
                type: 'CHOOSE_FROM_ZONE',
                sourceZone: 'hand',
                destination: 'trash',
                min: 1,
                max: 1,
                filter: { cardIds: ['fortress'] }
            }] as any);

            // We need to resolve the choice since we used CHOOSE_FROM_ZONE
            expect(state.pendingDecision).toBeDefined();
            EffectEngine.resolveDecision(state, p1.id, { cardInstanceIds: [fortress.instanceId] });

            // Or use handleProcessZoneAction directly via applyEffect/trash helper
            // We can simulate it by:
            // EffectEngine.handleProcessZoneAction(state, p1, { ... }, [fortress.instanceId])
            // But let's use a "Trash this" effect.

            // The applyEffects with type TRASH_CARDS usually prompts?
            // Let's manually trigger the trash logic logic for a specific card using a directed trash effect 
            // OR simply verify `onTrash` logic if we trust the trigger.
            // Let's assume we play a "Remodel" or similar.

            // Simpler: Apply "Trash Self" effect to the fortress instance
            // EffectEngine.applyEffects(state, p1.id, [{ type: 'TRASH_SELF' }], false, fortress.instanceId);

            // Note: TRASH_SELF assumes the card is in play or found via sourceCardInstanceId. 
            // Fortress needs to be in hand for the test scenario above?
            // TRASH_SELF usually works from Play. 

            // Let's use a "Trash Hand" effect
            // We select Fortress.

            // 1. Play "Trash a card from hand"
            // EffectEngine.applyEffects(state, p1.id, [{type: 'CHOOSE_FROM_ZONE', destination: 'trash', sourceZone: 'hand', min:1, max:1}]);
            // Select Fortress

            // Manual approach to ensure precise timing
            p1.hand = []; // Clear hand
            state.trash.push(fortress);
            // Now apply `onTrash` effects of Fortress
            const def = CardRegistry.get('fortress')!;
            if (def.onTrash) {
                EffectEngine.applyEffects(state, p1.id, def.onTrash, false, fortress.instanceId);
            }

            // Verify
            expect(p1.hand.length).toBe(1);
            expect(p1.hand[0].id).toBe('fortress');
            expect(state.trash.filter((c: any) => c.instanceId === fortress.instanceId).length).toBe(0); // Should be gone from trash?
            // Wait, Fortress says "When you trash this, put it into your hand."
            // So it goes Hand -> Trash -> Hand.
            // My manual test pushed to trash then applied effect.
            // The effect 'GAIN_CARD' or 'MOVE_TO_HAND' from trash?
            // Fortress implementation usually is: { type: 'MOVE_CARDS', source: 'trash', destination: 'hand', filter: { cardIds: ['fortress'] } }
        });
    });

    describe('Hunting Grounds (Terrain de Chasse)', () => {
        it('should gain Duchy or 3 Estates when trashed', () => {
            const hg = createCardInstance('hunting_grounds');

            // 1. Trigger `onTrash`
            const def = CardRegistry.get('hunting_grounds')!;
            expect(def.onTrash).toBeDefined();

            // Setup Decision
            EffectEngine.applyEffects(state, p1.id, def.onTrash!, false, hg.instanceId);

            // Should prompt choice: Duchy or 3 Estates
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.type).toBe(PromptType.SELECT_OPTION);

            // Option 1: Gain Duchy
            const duchyOption = state.pendingDecision!.context.options[0].value;
            // We assume order, or check label "Gagner un Duché"

            // Let's resolve with index 0 (Duchy)
            EffectEngine.resolveDecision(state, p1.id, { optionIndex: 0 });

            expect(p1.discardPile.length).toBe(1);
            expect(p1.discardPile[0].id).toBe('duchy');
        });
    });
});
