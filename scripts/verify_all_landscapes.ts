
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

// List of landscapes we want to test together
// Ensure these IDs are lowercased if the registry uses lower case
const TEST_LANDSCAPES = [
    'plan',          // Event (Adventures)
    'aqueduct',      // Landmark (Empires)
    'city_quarter',  // Project (Renaissance) - Wait, do I have this implemented? User said "Project support" is done.
    'way_of_the_sheep' // Way (Menagerie)
];

// Fallback to simpler ones if some aren't implemented yet
// Based on previous context, 'plan' is definitely there. 'aqueduct' mentioned in task.md.
// 'way_of_the_sheep' mentioned in task.md.

async function main() {
    console.log('Connecting to server...');
    const socket = io(SERVER_URL);
    const roomId = 'test_landscapes_comprehensive_' + Date.now();

    socket.on('connect', () => {
        console.log('Connected:', socket.id);
        socket.emit('join_room', { roomId, username: 'Verifier', color: '#ff0000' });
    });

    socket.on('joined', (data: any) => {
        console.log('Joined room event received:', data);

        // 2. Configure Setup to force MULTIPLE landscapes
        console.log('Configuring setup with Multiple Landscapes...');

        // We act as if we selected these in the lobby
        socket.emit('change_setup', {
            roomId,
            enabledExpansions: ['base', 'adventures', 'empires', 'renaissance', 'menagerie'],
            landscapeInstructions: TEST_LANDSCAPES
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

    socket.on('game_state', (state: any) => {
        console.log('Received Game State!');
        if (state && state.public) {
            console.log('Landscapes in State:', state.public.landscapes);

            const missing = TEST_LANDSCAPES.filter(id => !state.public.landscapes.includes(id));

            if (missing.length === 0) {
                console.log('SUCCESS: All requested landscapes are present.');
                process.exit(0);
            } else {
                console.log('FAILURE: Missing landscapes:', missing);
                // Maybe some aren't implemented?
                process.exit(1);
            }
        }
    });

    socket.on('room_state', (room: any) => {
        console.log('Room State Update. Instructions:', room.landscapeInstructions);
    });

    setTimeout(() => {
        console.log('Timeout waiting for state.');
        process.exit(1);
    }, 10000);
}

main();
