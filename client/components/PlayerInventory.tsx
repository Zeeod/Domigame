import React, { useEffect, useRef, useState } from 'react';
import { CardRegistry } from '../../shared/cards/index';
import { CardStrip } from './CardFrame';
import { matLabel } from './ZoneContainer';
import './PlayerInventory.css';

/**
 * Everything a player has outside their deck, gathered behind one badge: tokens (Coffers, Villagers,
 * VP, Debt, Favors…), Adventures tokens, Artifacts, Projects, Boons, Hexes, States and mats (Tavern,
 * Exile, Island…). The badge shows a short summary; clicking it opens the details.
 */

interface InventoryPlayer {
    id: string;
    name: string;
    color?: string;
    tokens?: Record<string, number>;
    coffers?: number;
    villagers?: number;
    debt?: number;
    favors?: number;
    vpTokens?: number;
    journeyTokenFaceUp?: boolean;
    advTokens?: Record<string, string>;
    minusCoinToken?: boolean;
    minusCardToken?: boolean;
    artifacts?: string[];
    projects?: string[];
    boons?: string[];
    hexes?: string[];
    states?: string[];
    tavernMat?: { id: string; instanceId: string }[];
    exileMat?: { id: string; instanceId: string }[];
    mats?: Record<string, { id: string; instanceId: string }[]>;
}

interface PlayerInventoryProps {
    player: InventoryPlayer | undefined;
    /** The viewer's own badge (opens upward) or an opponent's (opens downward) */
    isMe?: boolean;
    /** Cards and landscapes in the game: the Journey token is shown only when something uses it */
    gameCardIds?: string[];
}

const TOKENS: Record<string, { icon: string; label: string; text: string }> = {
    coffers: { icon: '⛃', label: 'Coffres', text: 'En phase Achat, dépensez-en pour +1 💰 chacun.' },
    villagers: { icon: '👤', label: 'Villageois', text: 'En phase Action, dépensez-en pour +1 Action chacun.' },
    vp: { icon: '🛡️', label: 'Jetons PV', text: 'Chacun vaut 1 PV en fin de partie.' },
    debt: { icon: '▽', label: 'Dette', text: 'Remboursez-la avec vos 💰 ; vous ne pouvez rien acheter tant que vous en avez.' },
    favors: { icon: '🤝', label: 'Faveurs', text: 'À dépenser pour l\'Allié de la partie.' },
    pirate: { icon: '🏴‍☠️', label: 'Pièces du Bateau pirate', text: 'Chacune donne +1 💰 quand vous jouez un Bateau pirate.' },
    coin: { icon: '🪙', label: 'Pièces', text: '' },
};

const ADV_TOKENS: Record<string, string> = {
    plus1Card: '+1 Carte', plus1Action: '+1 Action', plus1Buy: '+1 Achat', plus1Coin: '+1 💰', minus2Cost: '−2 💰 de coût', trashing: 'Écart',
};

const JOURNEY_USERS = ['ranger', 'giant', 'pilgrimage'];
const HIDDEN_TOKENS = new Set(['sun']);

const cardName = (id: string) => CardRegistry.get(id)?.name ?? id;

interface Inventory {
    numbers: { key: string; icon: string; label: string; text: string; count: number }[];
    notes: { key: string; icon: string; label: string; text: string }[];
    cardGroups: { key: string; title: string; ids: string[] }[];
    mats: { key: string; title: string; cards: { id: string; instanceId: string }[]; hidden: boolean }[];
}

function buildInventory(p: InventoryPlayer, isMe: boolean, gameCardIds: string[]): Inventory {
    // Tokens: the player fields and the generic token store can both hold a value
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(p.tokens || {})) {
        const key = k.toLowerCase();
        if (!HIDDEN_TOKENS.has(key) && Number(v) > 0) counts[key] = Number(v);
    }
    const field = (key: string, v?: number) => { if ((v || 0) > (counts[key] || 0)) counts[key] = v!; };
    field('coffers', p.coffers); field('villagers', p.villagers); field('debt', p.debt);
    field('favors', p.favors); field('vp', p.vpTokens);
    const numbers = Object.entries(counts).map(([key, count]) => {
        const info = TOKENS[key] ?? { icon: '●', label: key, text: '' };
        return { key, count, ...info };
    });

    const notes: Inventory['notes'] = [];
    if (JOURNEY_USERS.some(id => gameCardIds.includes(id))) {
        notes.push({
            key: 'journey', icon: '🧭', label: `Jeton Voyage ${p.journeyTokenFaceUp ? 'face visible' : 'face cachée'}`,
            text: 'Retourné par le Ranger, le Géant et le Pèlerinage : leur effet dépend de sa face.',
        });
    }
    for (const [token, pile] of Object.entries(p.advTokens || {})) {
        if (!pile) continue;
        notes.push({ key: 'adv_' + token, icon: '📍', label: `${ADV_TOKENS[token] ?? token} sur ${cardName(pile)}`, text: 'Jeton d\'Aventures posé sur cette pile.' });
    }
    if (p.minusCoinToken) notes.push({ key: 'minuscoin', icon: '−💰', label: 'Jeton −1 💰', text: 'Le prochain 💰 reçu est perdu.' });
    if (p.minusCardToken) notes.push({ key: 'minuscard', icon: '−🂠', label: 'Jeton −1 Carte', text: 'La prochaine pioche d\'une main est réduite d\'une carte.' });

    const cardGroups = [
        { key: 'artifacts', title: 'Artefacts', ids: p.artifacts || [] },
        { key: 'projects', title: 'Projets', ids: p.projects || [] },
        { key: 'boons', title: 'Bienfaits gardés', ids: p.boons || [] },
        { key: 'hexes', title: 'Maléfices', ids: p.hexes || [] },
        { key: 'states', title: 'États', ids: p.states || [] },
    ].filter(g => g.ids.length > 0);

    const mats: Inventory['mats'] = [];
    if (p.tavernMat?.length) mats.push({ key: 'tavern', title: matLabel('tavern'), cards: p.tavernMat, hidden: false });
    if (p.exileMat?.length) mats.push({ key: 'exile', title: matLabel('exile'), cards: p.exileMat, hidden: false });
    for (const [name, cards] of Object.entries(p.mats || {})) {
        if (name === 'tavern' || name === 'exile' || !cards?.length) continue;
        mats.push({ key: name, title: matLabel(name), cards, hidden: !isMe && cards.every(c => c.id === 'back') });
    }
    return { numbers, notes, cardGroups, mats };
}

/** Same cards together: [{ id, count }] */
function grouped(cards: { id: string }[]): { id: string; count: number }[] {
    const m = new Map<string, number>();
    cards.forEach(c => m.set(c.id, (m.get(c.id) || 0) + 1));
    return [...m.entries()].map(([id, count]) => ({ id, count }));
}

export const PlayerInventory: React.FC<PlayerInventoryProps> = ({ player, isMe = false, gameCardIds = [] }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            // Right-click on a card inside opens the big view: keep the panel open
            if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement)?.closest?.('.big-card-view-portal')) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
    }, [open]);

    if (!player) return null;
    const inv = buildInventory(player, isMe, gameCardIds);
    const cardCount = inv.cardGroups.reduce((n, g) => n + g.ids.length, 0);
    const matCount = inv.mats.reduce((n, m) => n + m.cards.length, 0);
    if (!inv.numbers.length && !inv.notes.length && !cardCount && !matCount) return null;

    // Badge summary: token counts first, then how many cards/notes are behind it
    const summary: { key: string; icon: string; value?: number; title: string }[] = [
        ...inv.numbers.map(n => ({ key: n.key, icon: n.icon, value: n.count, title: n.label })),
        ...(cardCount ? [{ key: 'cards', icon: '🏺', value: cardCount, title: 'Artefacts, Projets, Bienfaits, États' }] : []),
        ...(matCount ? [{ key: 'mats', icon: '🗂️', value: matCount, title: 'Cartes sur les plateaux' }] : []),
        ...(inv.notes.length ? [{ key: 'notes', icon: '📍', value: inv.notes.length, title: 'Autres jetons' }] : []),
    ];

    return (
        <div ref={ref} className={`player-inventory ${isMe ? 'is-me' : 'is-opponent'} ${open ? 'open' : ''}`}>
            <button
                className="inventory-badge"
                style={player.color ? { borderColor: player.color } : undefined}
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                title={isMe ? 'Mes jetons, Artefacts et plateaux' : `Jetons, Artefacts et plateaux de ${player.name}`}
            >
                {summary.map(s => (
                    <span key={s.key} className="inventory-chip" title={s.title}>
                        <span className="inventory-chip-icon">{s.icon}</span>
                        {s.value !== undefined && <span className="inventory-chip-value">{s.value}</span>}
                    </span>
                ))}
            </button>

            {open && (
                <div className="inventory-panel" onClick={e => e.stopPropagation()}>
                    <div className="inventory-panel-title" style={player.color ? { color: player.color } : undefined}>
                        {isMe ? 'Mes jetons et plateaux' : player.name}
                    </div>

                    {inv.numbers.length > 0 && (
                        <section>
                            <h4>Jetons</h4>
                            {inv.numbers.map(n => (
                                <div key={n.key} className="inventory-line">
                                    <span className="inventory-line-icon">{n.icon}</span>
                                    <span className="inventory-line-label">{n.label}</span>
                                    <span className="inventory-line-count">{n.count}</span>
                                    {n.text && <span className="inventory-line-text">{n.text}</span>}
                                </div>
                            ))}
                        </section>
                    )}

                    {inv.notes.length > 0 && (
                        <section>
                            <h4>Autres jetons</h4>
                            {inv.notes.map(n => (
                                <div key={n.key} className="inventory-line">
                                    <span className="inventory-line-icon">{n.icon}</span>
                                    <span className="inventory-line-label">{n.label}</span>
                                    <span className="inventory-line-text">{n.text}</span>
                                </div>
                            ))}
                        </section>
                    )}

                    {inv.cardGroups.map(g => (
                        <section key={g.key}>
                            <h4>{g.title}</h4>
                            <div className="inventory-strips">
                                {g.ids.map((id, i) => <CardStrip key={id + i} cardId={id} showCost={false} />)}
                            </div>
                        </section>
                    ))}

                    {inv.mats.map(m => (
                        <section key={m.key}>
                            <h4>{m.title} <span className="inventory-mat-count">{m.cards.length}</span></h4>
                            {m.hidden ? (
                                <div className="inventory-hidden">{m.cards.length} carte{m.cards.length > 1 ? 's' : ''} face cachée</div>
                            ) : (
                                <div className="inventory-strips">
                                    {grouped(m.cards).map(c => <CardStrip key={c.id} cardId={c.id} count={c.count > 1 ? c.count : undefined} showCost={false} />)}
                                </div>
                            )}
                        </section>
                    ))}

                    <div className="inventory-hint">Clic droit sur une carte pour la voir en grand</div>
                </div>
            )}
        </div>
    );
};
