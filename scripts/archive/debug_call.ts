import { GameRoomV2 } from './server/GameRoomV2.js';

const mockIo = {
    to: (id: any) => ({
        emit: (event: any, data: any) => {
            console.log(`EMIT: ${event} to ${id}`);
        }
    }),
    emit: (event: any, data: any) => {
        console.log(`EMIT: ${event}`);
    }
} as any;

try {
    const room = new GameRoomV2(mockIo, 'test_room');
    console.log('Room created');
    console.log('Calling broadcastRoomState manually...');
    room.broadcastRoomState();
    console.log('Call successful');
} catch (err) {
    console.error('CATCH in debug_call:', err);
}
