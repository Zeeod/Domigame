
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { GameState, PlayerState } from '../engine/GameState.js';
import { ActionResolver } from '../engine/ActionResolver.js';
import { TurnMachine } from '../engine/TurnMachine.js';
import { EffectEngine } from '../engine/EffectEngine.js';
import { CardRegistry } from '../cards/index.js';

function log(msg: string) {
    try {
        fs.appendFileSync('debug_log.txt', msg + '\n');
    } catch (e) {
        // ignore
    }
}

import { createPlayerState } from '../engine/PlayerState.js';
import { createGameState } from '../engine/GameState.js';

function createMockState(): GameState {
    const state = createGameState('test_debug_caravan');
    const p1 = createPlayerState('p1', 'Player 1');
    const p2 = createPlayerState('p2', 'Player 2');
    state.players.push(p1, p2);
    // Initialize required properties usually handled by setup
    state.currentPlayerIndex = 0;
    return state;
}

describe('Caravan Guard Debug', () => {
    it('Should react to Attack', () => {
        fs.writeFileSync('debug_log.txt', 'START\n');
        log('DEBUG: Test Start');
        let state = createMockState();
        const p1 = state.players[0];
        const p2 = state.players[1];

        p1.hand = [{ id: 'witch', instanceId: 'w1' }] as any;
        p2.hand = [{ id: 'caravan_guard', instanceId: 'cg1' }] as any;
        p2.deck = [{ id: 'copper', instanceId: 'd1' }] as any;

        const cgDef = CardRegistry.get('caravan_guard');
        log('DEBUG: Registry Check: ' + (cgDef ? 'Found' : 'Missing'));
        if (cgDef) {
            log('DEBUG: CG isReaction: ' + cgDef.isReaction);
        }

        const witchDef = CardRegistry.get('witch');
        if (witchDef) {
            const effects = witchDef.effects || [];
            log('DEBUG: Witch effects count: ' + effects.length);
            effects.forEach((e, i) => {
                log(`DEBUG: Witch effect ${i} type: ${e.type}`);
            });
        } else {
            log('DEBUG: Witch def missing!');
        }

        log('DEBUG: P1 plays Witch');

        let result = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'w1' });
        state = result.state;

        log('DEBUG: Pending Decision Type: ' + (state.pendingDecision ? state.pendingDecision.type : 'null'));
        log('DEBUG: Effect Stack Length: ' + state.effectStack.length);
        if (state.effectStack.length > 0) {
            log('DEBUG: Top Stack Item Type: ' + state.effectStack[state.effectStack.length - 1].type);
        }

        if (state.pendingDecision && (state.pendingDecision.type === 'SELECT_CARDS' || state.pendingDecision.type === 'CHOOSE_CARDS')) {
            log('DEBUG: Reacting with Caravan Guard');
            result = ActionResolver.resolve(state, 'p2', {
                type: 'CHOOSE',
                choiceId: state.pendingDecision.id,
                payload: { type: 'CARDS', cardInstanceIds: ['cg1'] }
            });
            state = result.state;
            log('DEBUG: Reaction Resolved');
        } else {
            log('DEBUG: No Reaction Decision prompted!');
        }

        const cgInPlay = state.players[1].playArea.find(c => c.id === 'caravan_guard');
        log('DEBUG: CG in Play: ' + !!cgInPlay);

        log('DEBUG: P2 Actions: ' + state.players[1].actions);
        expect(state.players[1].actions).toBe(2);
    });
});
