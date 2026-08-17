
console.log('1. Starting verify_repro');
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
        console.log('3. Instantiated GameRoomV2, ID:', room.id);

        // Add Host
        const socket = {
            id: 'host',
            join: () => { },
            emit: () => { },
            rooms: new Set(),
            handshake: { query: {}, headers: {} }
        } as any;

        room.addPlayer(socket, 'Host', '#fff', 'host');
        // Force host
        const h = room.getPlayer('host');
        if (h) h.isHost = true;

        console.log('4. Added Host');

        // Add P2 (Required for start)
        const socket2 = {
            id: 'p2',
            join: () => { },
            emit: () => { },
            rooms: new Set(),
            handshake: { query: {}, headers: {} }
        } as any;
        room.addPlayer(socket2, 'P2', '#0f0', 'p2');
        console.log('4b. Added P2');

        room.updateSetup('host', { landscapeInstructions: ['plan'] });
        console.log('5. Updated Setup');

        room.startGame();
        console.log('6. Started Game. isStarted:', room.isStarted);

        if (!room.isStarted) {
            throw new Error('Game failed to start!');
        }

        // Access state
        const state = (room as any).state;
        console.log('7. Landscapes:', state.landscapes);

        if (!state.landscapes.includes('plan')) {
            throw new Error('PLAN MISSING!');
        }
        console.log('✅ PLAN PRESENT');

        // Interaction
        const hostPlayer = state.players.find((p: any) => p.id === 'host');
        hostPlayer.coins = 5;
        hostPlayer.buys = 1;
        hostPlayer.phase = 'buy';
        console.log('8. Host set up for buy');

        const action = {
            type: 'BUY_LANDSCAPE',
            landscapeId: 'plan'
        };

        const valid = RulesValidator.validate(state, 'host', action as any);
        console.log('9. Validation:', valid.valid ? 'PASSED' : valid.error);

        if (!valid.valid) { throw new Error('Validation failed'); }

        const res = ActionResolver.resolve(state, 'host', action as any);
        console.log('10. Resolution:', res.success ? 'PASSED' : res.error);

        if (!res.success) { throw new Error('Resolution failed'); }
        console.log('✅ RESOLUTION PASSED (Plan bought!)');

        process.exit(0);

    } catch (e) {
        console.error('FAILED:', e);
        process.exit(1);
    }
}
run();
