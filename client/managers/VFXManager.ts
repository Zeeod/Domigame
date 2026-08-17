
/**
 * VFXManager - Singleton for Game Visual Effects (Particles)
 */

export type ParticleType = 'gold' | 'vp' | 'curse' | 'card' | 'trash' | 'attack' | 'draw';

export interface ParticleEvent {
    x: number;
    y: number;
    type: ParticleType;
    amount?: number; // For +3 Gold popup etc.
    color?: string;
}

type VFXListener = (event: ParticleEvent) => void;

class VFXManager {
    private listeners: VFXListener[] = [];

    public subscribe(listener: VFXListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public triggerParticle(x: number, y: number, type: ParticleType, amount?: number, color?: string) {
        const event: ParticleEvent = { x, y, type, amount, color };
        this.listeners.forEach(l => l(event));
    }
}

export const vfxManager = new VFXManager();
