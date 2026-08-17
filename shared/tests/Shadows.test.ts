import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../engine/GameState.js';
import { DrawEffectHandler } from '../engine/effects/DrawEffectHandler.js';
import { TriggerEffectHandler } from '../engine/effects/TriggerEffectHandler.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { createPlayerState } from '../engine/PlayerState.js';
import { CardRegistry } from '../cards/index.js';

describe('Rising Sun Shadow Mechanics', () => {
    let state: any;
    let player: any;

    beforeEach(() => {
        player = createPlayerState('p1', 'Player 1');
        player.hand = [];
        player.deck = [
            createCardInstance('silver'),
            createCardInstance('silver'),
            createCardInstance('silver')
        ];

        state = {
            players: [player],
            currentPlayerIndex: 0,
            effectStack: [],
            logs: [],
            rng: { seed: 'test', callCount: 0 }
        };
    });

    it('should trigger Shadow play when drawing a card', () => {
        // 1. Give player a Shadow card in hand
        const shadowCard = createCardInstance('alley'); // Alley is a Shadow
        player.hand.push(shadowCard);

        // 2. Draw a card (which triggers the Shadow check)
        DrawEffectHandler.handleDraw(state, player, 1);

        // Since handleOnDrawTriggers uses dynamic import in DrawEffectHandler, 
        // we wait for the promise to resolve.
        return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
            // Check if the trigger was pushed to the stack
            // Since there is only 1 trigger, it resolves directly to SELECT_OPTION
            expect(state.effectStack.length).toBeGreaterThan(0);
            const stackItem = state.effectStack[state.effectStack.length - 1];
            expect(stackItem.effect.type).toBe('SELECT_OPTION');
            expect(stackItem.effect.message).toContain('Allée');
        });
    });
});
