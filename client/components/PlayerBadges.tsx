import React from 'react';
import { CardRegistry } from '../../shared/cards/index';

interface PlayerBadgesProps {
    player: {
        artifacts?: string[];
        projects?: string[];
        boons?: string[];
        hexes?: string[];
        journeyTokenFaceUp?: boolean;
        minusCoinToken?: boolean;
        minusCardToken?: boolean;
    } | undefined;
}

/**
 * What a player owns outside their deck, visible to everyone: Artifacts and Projects (Renaissance),
 * Boons kept and States (Nocturne), Adventures tokens. Hover a badge to read its text.
 */
export const PlayerBadges: React.FC<PlayerBadgesProps> = ({ player }) => {
    if (!player) return null;
    const badges: { key: string; icon: string; label: string; text?: string }[] = [];
    const add = (icon: string, ids: string[] = []) => ids.forEach(id => {
        const def = CardRegistry.get(id);
        badges.push({ key: icon + id, icon, label: def?.name ?? id, text: def?.description });
    });
    add('🏺', player.artifacts);
    add('🧱', player.projects);
    add('✨', player.boons);
    add('🌀', player.hexes);
    if (player.minusCoinToken) badges.push({ key: 'minuscoin', icon: '−💰', label: '−1 💰', text: 'Le prochain 💰 reçu est perdu.' });
    if (player.minusCardToken) badges.push({ key: 'minuscard', icon: '−🂠', label: '−1 Carte', text: 'La prochaine pioche d\'une main est réduite d\'une carte.' });
    if (badges.length === 0) return null;

    return (
        <div className="player-badges">
            {badges.map(b => (
                <span key={b.key} className="player-badge" title={b.text ? `${b.label} — ${b.text}` : b.label}>
                    <span className="player-badge-icon" aria-hidden="true">{b.icon}</span>
                    {b.label}
                </span>
            ))}
        </div>
    );
};
