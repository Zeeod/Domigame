/**
 * useSound - Hook to play game sound effects using SoundManager
 */
import { useCallback, useState, useEffect } from 'react';
import { soundManager, SoundEffect } from '../managers/SoundManager';

export type { SoundEffect };

export function useSound() {
    // Sync local state with manager for reactivity if needed (mostly for UI toggles)
    const [isMuted, setIsMuted] = useState(soundManager.getMute());

    const toggleMute = useCallback(() => {
        const newState = !soundManager.getMute();
        soundManager.setMute(newState);
        setIsMuted(newState);
    }, []);

    const playSound = useCallback((effect: SoundEffect, volume: number = 0.5) => {
        soundManager.play(effect, volume);
    }, []);

    const playCardSound = useCallback((cardId: string) => {
        soundManager.playCardSound(cardId);
    }, []);

    return { playSound, playCardSound, isMuted, toggleMute };
}
