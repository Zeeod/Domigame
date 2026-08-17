import { PublicGameView } from '../../shared/view/PublicGameView';

export interface ClientState {
    view: PublicGameView | null;
    connection: 'connecting' | 'connected' | 'disconnected';
    playerId: string | null;
    roomId: string | null;
    error: string | null;
}

export const INITIAL_CLIENT_STATE: ClientState = {
    view: null,
    connection: 'connecting', // Start as connecting/lobby state usually
    playerId: null,
    roomId: null,
    error: null
};
