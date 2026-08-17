import { ActionResolver } from './shared/engine/ActionResolver.js';
import { TurnMachine } from './shared/engine/TurnMachine.js';
import { PhaseEngine } from './shared/engine/PhaseEngine.js';
import { createPlayerState } from './shared/engine/PlayerState.js';

const state = {
    players: [createPlayerState('Player1', 'Player1'), createPlayerState('Player2', 'Player2')],
    supply: {},
    trash: [],
    log: [],
    currentPlayerIndex: 0,
    turnCount: 1,
    phase: 'ACTION' as any,
    pendingDecision: null,
    landscapes: [],
    landscapeState: {},
    effectStack: [],
    turnNumber: 1
};

state.players[0].hand = [
    { instanceId: '1', id: 'copper', zone: 'hand' },
    { instanceId: '2', id: 'copper', zone: 'hand' },
    { instanceId: '3', id: 'copper', zone: 'hand' },
    { instanceId: '4', id: 'estate', zone: 'hand' },
    { instanceId: '5', id: 'estate', zone: 'hand' }
];

ActionResolver.startGame(state as any);
console.log("pendingDecision before check:", !!state.pendingDecision);
console.log("autoSkip evaluating:", PhaseEngine.getCurrentPhase(state as any)?.autoSkip?.(state as any));
TurnMachine.checkAutoEndActionPhase(state as any);
