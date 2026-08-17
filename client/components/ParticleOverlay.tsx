import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vfxManager } from '../managers/VFXManager';

export interface Particle {
    id: string;
    text: string;
    x: number;
    y: number;
    color?: string;
    velocity: { x: number; y: number };
    rotation: number;
    scale: number;
    type?: 'gold' | 'vp' | 'trash' | 'attack' | 'curse';
}

export interface ParticleOverlayRef {
    addParticle: (text: string, x: number, y: number, color?: string, type?: string) => void;
}

export const ParticleOverlay = forwardRef<ParticleOverlayRef, {}>((_, ref) => {
    const [particles, setParticles] = useState<Particle[]>([]);

    const addParticle = (text: string, x: number, y: number, color = '#ffd700', type: any = 'default') => {
        const id = Math.random().toString(36).substr(2, 9);

        // Add physics-based velocity
        const velocity = {
            x: (Math.random() - 0.5) * 100, // Horizontal jitter
            y: -150 - Math.random() * 150   // Upward burst
        };

        const rotation = (Math.random() - 0.5) * 45;
        const scale = 0.8 + Math.random() * 0.6;

        setParticles(prev => [...prev.slice(-20), { id, text, x, y, color, velocity, rotation, scale, type }]);

        // Auto cleanup
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== id));
        }, 1500);
    };

    const burst = (text: string, x: number, y: number, color: string, type: string, count: number = 3) => {
        for (let i = 0; i < count; i++) {
            setTimeout(() => addParticle(text, x, y, color, type), i * 50);
        }
    };

    useImperativeHandle(ref, () => ({
        addParticle
    }));

    useEffect(() => {
        const unsubscribe = vfxManager.subscribe((event) => {
            let text = '';
            let color = '#ffd700';
            let type = 'default';
            let count = 1;

            switch (event.type) {
                case 'gold':
                    text = '💰';
                    color = '#f1c40f';
                    type = 'gold';
                    count = Math.min(5, Math.max(1, event.amount || 1));
                    break;
                case 'vp':
                    text = '💎';
                    color = '#2ecc71';
                    type = 'vp';
                    count = 3;
                    break;
                case 'curse': text = '💀'; color = '#9b59b6'; type = 'curse'; break;
                case 'attack': text = '⚔️'; color = '#e74c3c'; type = 'attack'; break;
                case 'trash': text = '🗑️'; color = '#95a5a6'; type = 'trash'; break;
                case 'draw': text = '📜'; color = '#3498db'; type = 'default'; break;
                default: text = '✨';
            }

            burst(text, event.x, event.y, event.color || color, type, count);
        });

        return unsubscribe;
    }, []);

    return (
        <div className="particle-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999
        }}>
            <AnimatePresence>
                {particles.map(p => (
                    <motion.div
                        key={p.id}
                        initial={{
                            opacity: 0,
                            y: p.y,
                            x: p.x,
                            scale: 0,
                            rotate: 0
                        }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            y: p.y + p.velocity.y,
                            x: p.x + p.velocity.x,
                            scale: [p.scale * 0.5, p.scale * 1.5, p.scale],
                            rotate: p.rotation * 2
                        }}
                        exit={{ opacity: 0, scale: 2 }}
                        transition={{
                            duration: 1.2,
                            ease: "easeOut",
                            times: [0, 0.2, 0.8, 1]
                        }}
                        style={{
                            position: 'absolute',
                            color: p.color,
                            fontWeight: 'bold',
                            fontSize: p.type === 'vp' ? '32px' : '28px',
                            textShadow: `0 0 10px ${p.color}aa, 0 4px 10px rgba(0,0,0,0.5)`,
                            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {p.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});

ParticleOverlay.displayName = 'ParticleOverlay';
