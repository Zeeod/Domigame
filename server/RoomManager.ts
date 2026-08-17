/**
 * RoomManager - Manages all game rooms
 */

import { Server } from 'socket.io';
import { GameRoomV2 } from './GameRoomV2.js';

export class RoomManager {
    private io: Server;
    private rooms: Map<string, GameRoomV2> = new Map();

    constructor(io: Server) {
        this.io = io;
    }

    /**
     * Create a new room
     */
    createRoom(roomId?: string): GameRoomV2 {
        let id = roomId;

        if (!id) {
            // Generate simple 4-char code (A-Z, 0-9) avoiding ambiguous chars
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            do {
                id = '';
                for (let i = 0; i < 4; i++) {
                    id += chars.charAt(Math.floor(Math.random() * chars.length));
                }
            } while (this.rooms.has(id));
        }

        const room = new GameRoomV2(this.io, id);
        this.rooms.set(id, room);
        return room;
    }

    /**
     * Get a room by ID, creating one if it doesn't exist
     */
    getOrCreateRoom(roomId: string): GameRoomV2 {
        let room = this.rooms.get(roomId);
        if (!room) {
            room = this.createRoom(roomId);
        }
        return room;
    }

    /**
     * Get a room by ID
     */
    getRoom(roomId: string): GameRoomV2 | undefined {
        return this.rooms.get(roomId);
    }

    /**
     * Delete a room
     */
    deleteRoom(roomId: string): void {
        this.rooms.delete(roomId);
    }

    /**
     * Clean up empty rooms
     */
    cleanup(): void {
        const ABANDONED_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        for (const [id, room] of this.rooms) {
            if (room.isEmpty() || room.isAbandoned(ABANDONED_TIMEOUT)) {
                this.rooms.delete(id);
                console.log(`[ROOM] Cleanup: Deleted ${room.isEmpty() ? 'empty' : 'abandoned'} room ${id}`);
            }
        }
    }

    /**
     * Get all room IDs
     */
    getRoomIds(): string[] {
        return Array.from(this.rooms.keys());
    }
}
