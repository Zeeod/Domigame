/**
 * Helpers to drive a game through ActionResolver, the way the server does.
 * Use these in card tests so that the real flow (stack processing, phases,
 * triggers) is exercised — not just isolated effect handlers.
 */
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState, resetTurnResources } from '../../shared/engine/PlayerState.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { ActionResolver } from '../../shared/engine/ActionResolver.js';
import { RulesValidator } from '../../shared/engine/RulesValidator.js';
import { PhaseEngine } from '../../shared/engine/PhaseEngine.js';
import { CardInstance } from '../../shared/engine/GameState.js';
import { autoPayload } from './autoPlay.js';
import { applyKingdomRules } from '../../shared/engine/KingdomRules.js';

export interface TestGame {
    state: GameState;
}

/** A started game: players p1..pN, supply with basics + kingdom, p1 in its Action phase. */
export function makeGame(kingdom: string[] = [], playerCount = 2): GameState {
    const state = createGameState('test_' + Math.random().toString(36).slice(2));
    for (let i = 1; i <= playerCount; i++) {
        const p = createPlayerState(`p${i}`, `Player ${i}`);
        resetTurnResources(p);
        state.players.push(p);
    }
    const basics: Record<string, number> = {
        copper: 46, silver: 40, gold: 30, estate: 8, duchy: 8, province: 8, curse: 10,
    };
    for (const [id, count] of Object.entries(basics)) state.supply[id] = { cardId: id, count, cards: [] } as any;
    for (const id of kingdom) state.supply[id] = { cardId: id, count: 10, cards: [] } as any;
    state.kingdomCards = [...kingdom];
    applyKingdomRules(state);
    state.currentPlayerIndex = 0;
    state.turnNumber = 1;
    state.phase = 'ACTION';
    PhaseEngine.initTurnPipeline(state);
    return state;
}

/** Build card instances from ids. */
export function cards(...ids: string[]): CardInstance[] {
    return ids.map(id => createCardInstance(id));
}

export function player(state: GameState, id = 'p1') {
    return state.players.find(p => p.id === id)!;
}

/** Validate then resolve, exactly like the server (GameRoomV2). Throws on an illegal action. */
function apply(state: GameState, playerId: string, action: any): GameState {
    const validation = RulesValidator.validate(state, playerId, action);
    if (!validation.valid) throw new Error(`Invalid ${action.type}: ${validation.error}`);
    const res = ActionResolver.resolve(state, playerId, action);
    if (!res.success) throw new Error(`Action ${action.type} failed: ${res.error}`);
    return res.state;
}

/** Play the first card with this id from the player's hand. */
export function play(state: GameState, cardId: string, playerId = 'p1'): GameState {
    const card = player(state, playerId).hand.find(c => c.id === cardId);
    if (!card) throw new Error(`${cardId} not in ${playerId}'s hand`);
    return apply(state, playerId, { type: 'PLAY_CARD', cardInstanceId: card.instanceId });
}

/** Answer the pending decision. `payload` is passed as-is (e.g. { type: 'CARDS', cardInstanceIds }). */
export function choose(state: GameState, payload: any, playerId?: string): GameState {
    const d = state.pendingDecision;
    if (!d) throw new Error('No pending decision');
    return apply(state, playerId ?? d.playerId, { type: 'CHOOSE', choiceId: d.id, payload });
}

/** Select cards (by card id, first matches) for the pending decision. */
export function chooseCards(state: GameState, cardIds: string[], zone: 'hand' | 'limbo' | 'discardPile' | 'aside' = 'hand'): GameState {
    const d = state.pendingDecision!;
    const p = player(state, d.playerId);
    const pool = [...(p as any)[zone]];
    const ids = cardIds.map(cid => {
        const idx = pool.findIndex((c: CardInstance) => c.id === cid);
        if (idx === -1) throw new Error(`${cid} not in ${zone}`);
        return pool.splice(idx, 1)[0].instanceId;
    });
    return choose(state, { type: 'CARDS', cardInstanceIds: ids });
}

/** Pick option `index` of the pending SELECT_OPTION decision. */
export function chooseOption(state: GameState, index: number): GameState {
    return choose(state, { type: 'OPTION', optionIndex: index });
}

export function endPhase(state: GameState, playerId = 'p1'): GameState {
    return apply(state, playerId, { type: 'END_PHASE' });
}

export function buy(state: GameState, cardId: string, playerId = 'p1'): GameState {
    return apply(state, playerId, { type: 'BUY_CARD', cardId });
}

export function playAllTreasures(state: GameState, playerId = 'p1'): GameState {
    return apply(state, playerId, { type: 'PLAY_ALL_TREASURES' });
}

/** Pick a card from the supply for the pending decision (same payload as the client). */
export function chooseSupply(state: GameState, cardId: string): GameState {
    return choose(state, { type: 'SUPPLY', cardId });
}

/** End the current player's turn (answering any decision automatically). */
export function endTurn(state: GameState): GameState {
    const startTurn = state.turnNumber;
    for (let i = 0; i < 12 && state.turnNumber === startTurn; i++) {
        if (state.pendingDecision) {
            state = choose(state, autoPayload(state, 'first'));
            continue;
        }
        state = endPhase(state, state.players[state.currentPlayerIndex].id);
    }
    return state;
}

/** End turns until it is `playerId`'s turn again (a new turn). */
export function untilTurnOf(state: GameState, playerId: string): GameState {
    state = endTurn(state);
    for (let i = 0; i < 10 && state.players[state.currentPlayerIndex].id !== playerId; i++) state = endTurn(state);
    return state;
}
