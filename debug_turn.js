import { GameState } from './shared/engine/GameState.js';
import { TurnMachine } from './shared/engine/TurnMachine.js';
import { ActionResolver } from './shared/engine/ActionResolver.js';
import { PhaseEngine } from './shared/engine/PhaseEngine.js';
import { createPlayer } from './shared/engine/PlayerState.js';

const state = {
    players: [createPlayer('p1', 'Player1'), createPlayer('p2', 'Player2')],
    supply: {},
    trash: [],
    log: [],
    currentPlayerIndex: 0,
    turnCount: 1,
    phase: 'ACTION',
    pendingDecision: null
};
PhaseEngine.initTurnPipeline(state);

// Setup P1 with only Coppers and Estates (no Actions)
state.players[0].hand = [
    { id: 'copper', zone: 'hand' },
    { id: 'copper', zone: 'hand' },
    { id: 'copper', zone: 'hand' },
    { id: 'estate', zone: 'hand' },
    { id: 'estate', zone: 'hand' }
];

console.log("Before: phase=", state.phase, "pendingDecision=", !!state.pendingDecision, "buys=", state.players[0].buys);
TurnMachine.checkAutoEndActionPhase(state);
console.log("After: phase=", state.phase);
