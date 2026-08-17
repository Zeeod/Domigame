
/**
 * SoundManager - Singleton for Game Audio
 * Uses Web Audio API for synthesized sound effects.
 */

export type SoundEffect =
    | 'click'
    | 'card_play'
    | 'card_gain'
    | 'shuffle'
    | 'coins'
    | 'turn_start'
    | 'error'
    | 'success'
    | 'hover'
    | 'trash'
    | 'attack'
    | 'warning';

class SoundManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isMuted: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                this.masterGain.gain.value = 0.3; // Master volume
            }

            // Load mute preference
            const saved = localStorage.getItem('dominion_muted');
            this.isMuted = saved === null ? true : saved === 'true';
        }
    }

    public setMute(muted: boolean) {
        this.isMuted = muted;
        localStorage.setItem('dominion_muted', String(muted));
        if (!muted) this.resume();
    }

    public getMute(): boolean {
        return this.isMuted;
    }

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.error("Audio Context Resume failed", e));
        }
    }

    public play(effect: SoundEffect, volume: number = 0.5) {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.resume();

        // Safety check for user interaction requirements
        if (this.ctx.state === 'suspended') return;

        // Sound routing
        switch (effect) {
            case 'click':
                this.synthesizeTone(800, 'sine', 0.1, volume * 0.5, 100);
                break;
            case 'hover':
                this.synthesizeTone(400, 'triangle', 0.05, volume * 0.1, 0, 'linear');
                break;
            case 'card_play':
                this.synthesizeSlide(200, 50, 'sawtooth', 0.15, volume * 0.3);
                break;
            case 'coins':
                this.synthesizeTone(1200, 'sine', 0.5, volume * 0.4, 1200, 'exponential'); // Sustain
                this.playTone(1800, 'sine', 0.1, volume * 0.2); // Harmonic
                break;
            case 'card_gain':
                this.playTone(400, 'sine', 0.1, volume * 0.3);
                this.playTone(600, 'sine', 0.1, volume * 0.3, this.ctx.currentTime + 0.1);
                break;
            case 'trash':
                this.synthesizeSlide(150, 50, 'sawtooth', 0.2, volume * 0.5, 'linear');
                break;
            case 'shuffle':
                for (let i = 0; i < 5; i++) {
                    this.playTone(100 + Math.random() * 50, 'square', 0.05, volume * 0.2, this.ctx.currentTime + i * 0.06);
                }
                break;
            case 'turn_start':
                this.playTone(440, 'sine', 0.5, volume * 0.2);
                this.playTone(554, 'sine', 0.5, volume * 0.2);
                this.playTone(659, 'sine', 0.5, volume * 0.2);
                break;
            case 'error':
            case 'warning':
                this.synthesizeSlide(150, 100, 'sawtooth', 0.2, volume * 0.5, 'linear');
                break;
            case 'success':
                this.playTone(800, 'sine', 0.2, volume * 0.3);
                this.playTone(1200, 'sine', 0.4, volume * 0.3, this.ctx.currentTime + 0.1);
                break;
            case 'attack':
                // Dissonant chord
                this.playTone(440, 'sawtooth', 0.4, volume * 0.3);
                this.playTone(466, 'sawtooth', 0.4, volume * 0.3); // A# (minor second clash)
                break;
        }
    }

    public playCardSound(_cardId: string) {
        // Placeholder: Map card IDs to specific sounds if needed
        // For now, default to card_play
        this.play('card_play');
    }

    // --- Synthesis Helpers ---

    private playTone(freq: number, type: OscillatorType, duration: number, vol: number, startTime?: number) {
        if (!this.ctx || !this.masterGain) return;
        const t = startTime || this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        osc.start(t);
        osc.stop(t + duration);
    }

    private synthesizeTone(startFreq: number, type: OscillatorType, duration: number, vol: number, endFreq?: number, rampType: 'linear' | 'exponential' = 'exponential') {
        if (!this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, t);
        if (endFreq) {
            if (rampType === 'linear') osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
            else osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
        }

        gain.gain.setValueAtTime(vol, t);
        if (rampType === 'linear') gain.gain.linearRampToValueAtTime(0.01, t + duration);
        else gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        osc.start(t);
        osc.stop(t + duration);
    }

    private synthesizeSlide(startFreq: number, endFreq: number, type: OscillatorType, duration: number, vol: number, rampType: 'linear' | 'exponential' = 'exponential') {
        this.synthesizeTone(startFreq, type, duration, vol, endFreq, rampType);
    }
}

export const soundManager = new SoundManager();
