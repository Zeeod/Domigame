
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

async function main() {
    console.log('Connecting to server...');
    const socket = io(SERVER_URL);

    const roomId = 'test_landscape_room_' + Date.now();

    socket.on('connect', () => {
        console.log('Connected:', socket.id);
        console.log('Joining room:', roomId);
        socket.emit('join_room', { roomId, username: 'Verifier', color: '#ff0000' });
    });

    socket.on('joined', (data: any) => {
        console.log('Joined room event received:', data);

        // 2. Configure Setup
        socket.emit('change_setup', {
            roomId,
            enabledExpansions: ['base', 'adventures'],
            landscapeInstructions: ['plan']
        });

        // 3. Add Bot to satisfy minPlayers=2
        console.log('Adding bot...');
        socket.emit('add_bot', { botType: 'random' });

        // 4. Start Game (delayed slightly)
        setTimeout(() => {
            console.log('Starting game...');
            socket.emit('start_game', { roomId });
        }, 1500);
    });

    socket.on('action_error', (err: any) => {
        console.error('Action Error:', err);
    });

    socket.on('game_state', (state: any) => {
        console.log('Received Game State!');
        if (state && state.public) {
            console.log('Phase:', state.public.phase);
            console.log('Landscapes:', state.public.landscapes);

            if (state.public.landscapes && state.public.landscapes.includes('plan')) {
                console.log('SUCCESS: Plan is present in client state.');
                process.exit(0);
            } else if (state.public.phase === 'ACTION' || state.public.phase === 'PREGAME') {
                if (state.public.phase === 'ACTION') {
                    console.log('FAILURE: Plan is MISSING in client state (Phase: ACTION).');
                    process.exit(1);
                }
            }
        }
    });

    socket.on('room_state', (room: any) => {
        console.log('Room State Update. Players:', room.players.length, 'Instructions:', room.landscapeInstructions);
    });

    setTimeout(() => {
        console.log('Timeout waiting for state.');
        process.exit(1);
    }, 10000);
}

main();
