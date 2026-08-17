import React from 'react';


interface HUDProps {
    phase: string;
    turnPlayerId: string;
    actions: number;
    buys: number;
    coins: number;
    vpTokens: number;
}

const PhaseLabels: Record<string, string> = {
    'ACTION': 'Phase Action',
    'BUY': 'Phase Achat',
    'CLEANUP': 'Nettoyage',
    'GAME_OVER': 'Fin de Partie'
};

const PhaseClasses: Record<string, string> = {
    'ACTION': 'phase-action',
    'BUY': 'phase-buy',
    'CLEANUP': 'phase-cleanup',
    'GAME_OVER': 'phase-cleanup'
};

export const HUD: React.FC<HUDProps> = ({ phase, turnPlayerId, actions, buys, coins, vpTokens }) => {
    const phaseLabel = PhaseLabels[phase] || phase;
    const phaseClass = PhaseClasses[phase] || '';

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className={`hud-phase ${phaseClass}`}>
                    {phaseLabel}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>
                    Tour de : <strong style={{ color: '#fff' }}>{turnPlayerId}</strong>
                </span>
            </div>

            <div className="hud-resources">
                <div className="resource-item" title="Actions disponibles">
                    <span style={{ fontSize: '1.2em' }}>⚡</span>
                    <strong>{actions}</strong>
                </div>
                <div className="resource-item" title="Achats disponibles">
                    <span style={{ fontSize: '1.2em' }}>🛒</span>
                    <strong>{buys}</strong>
                </div>
                <div className="resource-item" title="Pièces disponibles">
                    <span style={{ fontSize: '1.2em' }}>🪙</span>
                    <strong>{coins}</strong>
                </div>
                {vpTokens > 0 && (
                    <div className="resource-item" title="Jetons Victoire">
                        <span style={{ fontSize: '1.2em' }}>🛡️</span>
                        <strong style={{ color: '#2ecc71' }}>{vpTokens}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};
