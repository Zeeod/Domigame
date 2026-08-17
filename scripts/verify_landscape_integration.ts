
// Use dynamic imports to simulate safe loading
async function runTest() {
    try {
        console.log('--- Starting Integration Test (Safe Mode) ---');

        const { GameRoomV2 } = await import('../server/GameRoomV2.js');
        const { ActionResolver } = await import('../shared/engine/ActionResolver.js');
        const { RulesValidator } = await import('../shared/engine/RulesValidator.js');
        // Type imports are erased at runtime so this is fine
        // implementation logic follows

        // Mock IO
        const io = {
            to: (id: string) => ({ emit: () => { } }),
            emit: () => { }
        } as any;

        const room = new GameRoomV2(io, 'TEST_ROOM');
        const roomId = room.id;
        console.log(`Room created: ${roomId}`);

        // Mock Player Socket
        const createMockSocket = (id: string) => ({
            id,
            join: (room: string) => { },
            emit: (event: string, ...args: any[]) => { },
            disconnect: () => { },
            on: () => { },
            rooms: new Set(),
            handshake: { query: {}, headers: {} }
        } as any);

        const hostId = 'host_socket_id';
        const hostSocket = createMockSocket(hostId);
        const p2Id = 'p2_socket_id';
        const p2Socket = createMockSocket(p2Id);

        // Add players
        console.log('Adding players...');
        room.addPlayer(hostSocket, 'HostPlayer', '#ff0000', hostId);

        const hostPlayer = room.getPlayer(hostId);
        if (hostPlayer) hostPlayer.isHost = true;

        room.addPlayer(p2Socket, 'Player2', '#00ff00', p2Id);

        // 1. Configure Landscape
        console.log('1. Setting up landscape: "plan"');
        room.updateSetup(hostId, {
            enabledExpansions: ['base', 'adventures', 'empires'],
            landscapeInstructions: ['plan']
        });

        // 2. Start Game
        console.log('2. Starting game...');
        room.startGame();

        if (!room.isStarted) {
            throw new Error('Game failed to verify start condition (isStarted is false)');
        }

        // Access state
        const state = (room as any).state; // Cast to any to access protected state if needed, or getGameState()

        if (!state) {
            throw new Error('Game failed to start (no state)');
        }

        // 3. Verify Landscape Presence
        console.log('3. Verifying landscape presence...');
        console.log('Landscapes in state:', state.landscapes);

        const hasPlan = state.landscapes && state.landscapes.includes('plan');
        if (hasPlan) {
            console.log('✅ PASSED: "plan" is present in landscapes.');
        } else {
            throw new Error('❌ FAILED: "plan" is MISSING from landscapes.');
        }

        // 4. Verify Interaction (Buy Landscape)
        console.log('4. Verifying interaction (Buy Landscape)...');
        // Give host money
        const hostStatePlayer = state.players.find((p: any) => p.id === hostId);
        if (hostStatePlayer) {
            hostStatePlayer.coins = 5; // Enough for Plan (3)
            hostStatePlayer.buys = 1;
            hostStatePlayer.phase = 'buy';
        } else {
            throw new Error('Host player not found in state');
        }

        const action = {
            type: 'BUY_LANDSCAPE',
            landscapeId: 'plan'
        };

        console.log('Validating BUY_LANDSCAPE action for Plan...');
        const validation = RulesValidator.validate(state, hostId, action as any);
        console.log('Validation result:', validation);

        if (!validation.valid) {
            throw new Error(`❌ FAILED: Buy validation failed - ${validation.error}`);
        } else {
            console.log('✅ PASSED: Buy validation successful.');
        }

        console.log('Executing BUY_LANDSCAPE action...');
        const result = ActionResolver.resolve(state, hostId, action as any);

        if (result.success) {
            console.log('✅ PASSED: Buy resolution successful.');
        } else {
            throw new Error(`❌ FAILED: Buy resolution failed - ${result.error}`);
        }

        console.log('--- Test Complete ---');
        process.exit(0);

    } catch (err: any) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

runTest();
