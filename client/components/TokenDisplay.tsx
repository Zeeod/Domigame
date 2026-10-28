import React from 'react';
import './TokenDisplay.css';

interface TokenDisplayProps {
    tokens: Record<string, number>;
}

/** Icon and French name of each player token. */
const TOKENS: Record<string, { icon: string; label: string }> = {
    vp: { icon: '🛡️', label: 'PV' },
    debt: { icon: '▽', label: 'Dette' },
    coffers: { icon: '⛃', label: 'Coffres' },
    villagers: { icon: '👤', label: 'Villageois' },
    favors: { icon: '🤝', label: 'Faveurs' },
    coin: { icon: '🪙', label: 'Pièces' },
    pirate: { icon: '🏴‍☠️', label: 'Pirate' },
    journey: { icon: '🧭', label: 'Voyage' },
    minuscoin: { icon: '−💰', label: '−1 💰' },
    minuscard: { icon: '−🂠', label: '−1 Carte' }
};
/** Player-level values that are not tokens a player holds (Sun tokens live on the Prophecy). */
const HIDDEN = new Set(['sun']);

/** The player's tokens: only those they actually have. */
export const TokenDisplay: React.FC<TokenDisplayProps> = ({ tokens }) => {
    const entries = Object.entries(tokens).filter(([name, count]) => !HIDDEN.has(name.toLowerCase()) && Number(count) > 0);
    if (entries.length === 0) return null;

    return (
        <div className="token-display">
            {entries.map(([name, count]) => {
                const key = name.toLowerCase();
                const info = TOKENS[key] ?? { icon: name.charAt(0).toUpperCase(), label: name };
                return (
                    <div key={name} className={`token-item token-type-${key}`} title={`${info.label} : ${count}`}>
                        <div className="token-icon">{info.icon}</div>
                        <div className="token-count">{count}</div>
                        <div className="token-label">{info.label}</div>
                    </div>
                );
            })}
        </div>
    );
};
