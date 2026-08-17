
import { AttackEffectHandler } from '../shared/engine/effects/AttackEffectHandler';
import { EffectEngine } from '../shared/engine/EffectEngine';
import { GameState, PlayerState } from '../shared/engine/GameState';
import { CardRegistry } from '../shared/cards/index';

// Mock State
const mockState: GameState = {
    players: [],
    supply: {},
    trash: [],
    phase: 'ACTION',
    turnNumber: 1,
    currentPlayerIndex: 0,
    rng: { seed: 'attack-test', callCount: 0 },
    history: [],
    logs: [],
    effectStack: []
} as any;

const p1: PlayerState = { id: 'p1', name: 'Attacker', hand: [], deck: [], discardPile: [], playArea: [] } as any;
const p2: PlayerState = { id: 'p2', name: 'Victim', hand: [], deck: [], discardPile: [], playArea: [] } as any;

mockState.players = [p1, p2];

// Register Dummy Moat if not present (or usage check)
// Real Moat is in 'base'. CardRegistry should have it.

async function testAttackReaction() {
    console.log('--- Testing Attack/Reaction Logic ---');

    console.log('\nTest 1: Simple Attack with No Defense');
    // Attack: Each other player gains a Curse
    const curseAttack = {
        type: 'ATTACK',
        attackEffect: { type: 'GAIN_CARD', cardId: 'curse' }
    };

    // p2 has no Moat
    p2.hand = [];
    p2.discardPile = [];

    // Apply Attack
    AttackEffectHandler.handleAttack(mockState, p1, curseAttack);
    // Process Stack
    EffectEngine.processStack(mockState);

    // Verify p2 got a Curse (mock gain logic or inspect stack)
    // Since we are using real handlers, we need Supply.
    mockState.supply['curse'] = { count: 10, tokens: {} } as any;
    // We assume GainEffectHandler works. 
    // To verify, we check p2.discardPile or logs.
    const curseGained = p2.discardPile.some(c => c.id === 'curse');
    if (curseGained) console.log('PASS: Victim gained Curse (No Defense)');
    else console.log('FAIL: Victim did not gain Curse');

    console.log('\nTest 2: Attack with Moat in Hand');
    // Reset
    p2.discardPile = [];
    p2.hand = [{ id: 'moat', instanceId: 'moat1' } as any];
    mockState.effectStack = []; // Clear stack

    // Apply Attack again
    AttackEffectHandler.handleAttack(mockState, p1, curseAttack);

    // Process Stack -> Should stop at Decision
    const result = EffectEngine.processStack(mockState);

    if (result.needsChoice && mockState.pendingDecision) {
        console.log('PASS: Stopped for Decision');
        console.log(`Prompt: ${mockState.pendingDecision.message}`);

        // Emulate Player Choice: Reveal Moat
        const decision = mockState.pendingDecision;
        const payload = {
            type: 'CARDS',
            cardInstanceIds: ['moat1']
        };

        // Resolve Decision
        EffectEngine.resolveDecision(mockState, p2.id, payload);

        // Verify Attack Blocked
        const curseGainedAgain = p2.discardPile.some(c => c.id === 'curse');
        if (!curseGainedAgain) console.log('PASS: Attack Blocked (No Curse Gained)');
        else console.log('FAIL: Victim gained Curse despite Moat');

    } else {
        console.error('FAIL: Did not stop for Reaction Decision');
    }
}

testAttackReaction().catch(console.error);
