import React from 'react';
import './TokenDisplay.css';

interface TokenDisplayProps {
    tokens: Record<string, number>;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({ tokens }) => {
    const entries = Object.entries(tokens);
    if (entries.length === 0) return null;

    return (
        <div className="token-display">
            {entries.map(([name, count]) => {
                const tokenClass = `token-type-${name.toLowerCase()}`;
                const iconSymbol = name.toLowerCase() === 'debt' ? '▽' :
                    name.toLowerCase() === 'coffers' ? '⛃' :
                        name.toLowerCase() === 'villagers' ? '👤' :
                            name.toLowerCase() === 'vp' ? '🛡️' :
                                name.toLowerCase() === 'favors' ? '🤝' :
                                    name.charAt(0).toUpperCase();

                return (
                    <div key={name} className={`token-item ${tokenClass}`} title={name}>
                        <div className="token-icon">{iconSymbol}</div>
                        <div className="token-count">{count}</div>
                        <div className="token-label">{name}</div>
                    </div>
                );
            })}
        </div>
    );
};
