console.log('1. Starting debug import');
async function run() {
    try {
        const { GameRoomV2 } = await import('../server/GameRoomV2.js');
        const { ActionResolver } = await import('../shared/engine/ActionResolver.js');
        const { RulesValidator } = await import('../shared/engine/RulesValidator.js');
        console.log('2. Imported modules');

        // Mock IO
        const io = {
            to: (id: string) => ({ emit: () => { } }),
            emit: () => { }
        } as any;

        const room = new GameRoomV2(io, 'TEST');
        console.log('3. Room created');
        console.log('Room Keys:', Object.keys(room));
        console.log('room.gameState type:', typeof (room as any).gameState);
        console.log('room.state type:', typeof (room as any).state);

        // Add Host
        const socket = { id: 'host', join: () => { }, emit: () => { }, rooms: new Set(), handshake: { query: {}, headers: {} } } as any;
        room.addPlayer(socket, 'Host', '#fff', 'host');

        const h = room.players.find((p: any) => p.id === 'host');
        if (h) h.isHost = true;

        room.updateSetup('host', { landscapeInstructions: ['plan'] });
        console.log('3. Updated Setup');

        // Add P2
        const s2 = { id: 'p2', join: () => { }, emit: () => { }, rooms: new Set(), handshake: { query: {}, headers: {} } } as any;
        room.addPlayer(s2, 'P2', '#0f0', 'p2');
        room.players.forEach((p: any) => p.isReady = true);

        room.startGame();
        console.log('4. Started Game');

        // Check State again
        const state = (room as any).gameState || (room as any).state;
        console.log('State found:', !!state);

        if (!state) {
            console.error('FAILED: No State');
            process.exit(1);
        }

        if (!state.landscapes) {
            console.error('FAILED: No landscapes in state:', Object.keys(state));
            process.exit(1);
        }

        console.log('5. Landscapes:', state.landscapes);
        if (!state.landscapes.includes('plan')) {
            console.error('FAILED: Plan missing');
            process.exit(1);
        }
        console.log('✅ PLAN PRESENT');

        // Simulate Action
        const host = state.players.find((p: any) => p.isHost);
        host.coins = 5; host.buys = 1; host.phase = 'buy';

        const action = { type: 'BUY_LANDSCAPE', landscapeId: 'plan' };

        const valid = RulesValidator.validate(state, host.id, action as any);
        console.log('6. Validation:', valid.valid ? 'PASSED' : valid.error);

        if (!valid.valid) { throw new Error('Validation failed'); }

        const res = ActionResolver.resolve(state, host.id, action as any);
        console.log('7. Resolution:', res.success ? 'PASSED' : res.error);

        if (!res.success) {
            console.error('FAILED: Buy action failed');
            process.exit(1);
        }
        console.log('✅ VERIFICATION PASSED');

    } catch (e) {
        console.error('FAILED:', e);
        process.exit(1);
    }
    console.log('8. Done');
}
run();
