import { PublicGameState as PublicState, PrivatePlayerState as PrivateState, SerializedState, Intent } from "../shared/types/index.js";

export interface ServerActionResult {
    ok: boolean;
    error?: string;
}

export type { PublicState, PrivateState, SerializedState, Intent };
