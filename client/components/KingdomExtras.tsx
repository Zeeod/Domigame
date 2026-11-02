import React, { useEffect, useMemo, useState } from 'react';
import { CardRegistry } from '../../shared/cards/index';
import { RECOMMENDED_SETS, RecommendedSet } from '../../shared/cards/recommendedSets';
import { getCardExpansion, EXPANSION_LABELS } from '../../shared/cards/expansions';
import { useCardInspect } from '../context/CardInspectContext';
import './KingdomExtras.css';

const nameOf = (id: string) => CardRegistry.get(id)?.name ?? id;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** A card name that shows the card on right-click */
const CardChip: React.FC<{ id: string; kind?: 'card' | 'landscape' | 'extra'; title?: string }> = ({ id, kind = 'card', title }) => {
    const { setZoomed } = useCardInspect();
    return (
        <span
            className={`kx-chip kx-${kind}`}
            title={title ?? 'Clic droit pour voir la carte'}
            onContextMenu={e => { e.preventDefault(); setZoomed(id); }}
        >
            {nameOf(id)}
        </span>
    );
};

// ============================================================================
// Recommended Kingdoms
// ============================================================================

interface RecommendedProps {
    readOnly: boolean;
    onChoose: (set: RecommendedSet) => void;
    onClose: () => void;
}

export const RecommendedSetsModal: React.FC<RecommendedProps> = ({ readOnly, onChoose, onClose }) => {
    const [search, setSearch] = useState('');
    const [rulebook, setRulebook] = useState('');
    const rulebooks = useMemo(() => [...new Set(RECOMMENDED_SETS.map(s => s.rulebook))], []);

    const shown = useMemo(() => {
        const q = norm(search.trim());
        return RECOMMENDED_SETS.filter(s => {
            if (rulebook && s.rulebook !== rulebook) return false;
            if (!q) return true;
            const ids = [...s.cards, ...(s.landscapes || [])];
            return norm(s.name).includes(q) || ids.some(id => norm(nameOf(id)).includes(q));
        });
    }, [search, rulebook]);

    return (
        <div className="picker-overlay" onClick={onClose}>
            <div className="picker-modal kx-modal" onClick={e => e.stopPropagation()}>
                <div className="picker-header">
                    <h3>Royaumes recommandés <span className="kx-count">{shown.length}</span></h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="picker-controls">
                    <input type="text" placeholder="Rechercher un royaume ou une carte…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                    <select value={rulebook} onChange={e => setRulebook(e.target.value)}>
                        <option value="">Tous les livrets</option>
                        {rulebooks.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="kx-hint">Les royaumes proposés dans les livrets de règles. Clic droit sur une carte pour la voir.</div>
                <div className="kx-list">
                    {shown.map(s => (
                        <div key={s.rulebook + s.name} className="kx-set">
                            <div className="kx-set-head">
                                <span className="kx-set-name">{s.name}</span>
                                <span className="kx-set-book">{s.rulebook}</span>
                                {!readOnly && <button className="kx-choose" onClick={() => onChoose(s)}>Choisir</button>}
                            </div>
                            <div className="kx-chips">
                                {(s.landscapes || []).map(id => <CardChip key={id} id={id} kind="landscape" />)}
                                {s.cards.map(id => <CardChip key={id} id={id} />)}
                                {s.bane && <CardChip id={s.bane} kind="extra" title="Fléau de la Jeune sorcière" />}
                                {s.approachingArmyPile && <CardChip id={s.approachingArmyPile} kind="extra" title="Pile ajoutée par Armée en approche" />}
                                {s.riverboatCard && <CardChip id={s.riverboatCard} kind="extra" title="Mise de côté pour le Bateau de Rivière" />}
                                {s.mouseCard && <CardChip id={s.mouseCard} kind="extra" title="Mise de côté pour la Voie de la Souris" />}
                                {(s.druidBoons || []).map(id => <CardChip key={id} id={id} kind="extra" title="Bienfait du Druide" />)}
                            </div>
                        </div>
                    ))}
                    {shown.length === 0 && <div className="kx-empty">Aucun royaume ne correspond.</div>}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Banned cards
// ============================================================================

interface BannedProps {
    banned: string[];
    readOnly: boolean;
    onChange: (banned: string[]) => void;
    onClose: () => void;
}

export const BannedCardsModal: React.FC<BannedProps> = ({ banned: fromRoom, readOnly, onChange, onClose }) => {
    const [search, setSearch] = useState('');
    const [expansion, setExpansion] = useState('');
    // Own copy, updated at once: several quick clicks must not wait for the server's answer
    const [banned, setBanned] = useState<string[]>(fromRoom);
    useEffect(() => { if (readOnly) setBanned(fromRoom); }, [fromRoom, readOnly]);
    const current = React.useRef(banned);
    current.current = banned;
    const bannedSet = new Set(banned);
    const update = (list: string[]) => { current.current = list; setBanned(list); onChange(list); };

    const all = useMemo(() => {
        const ids = [...CardRegistry.getKingdomCandidates(), ...CardRegistry.getLandscapeCandidates().map((c: any) => c.id)];
        return [...new Set(ids)]
            .map(id => CardRegistry.get(id))
            .filter((c): c is NonNullable<typeof c> => !!c)
            .map(c => ({ id: c.id, name: c.name, expansion: getCardExpansion(c) }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }, []);
    const expansions = useMemo(() => [...new Set(all.map(c => c.expansion))], [all]);

    const q = norm(search.trim());
    const shown = all.filter(c => (!expansion || c.expansion === expansion) && (!q || norm(c.name).includes(q)));
    const toggle = (id: string) => {
        if (readOnly) return;
        const list = current.current;
        update(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    };

    return (
        <div className="picker-overlay" onClick={onClose}>
            <div className="picker-modal kx-modal" onClick={e => e.stopPropagation()}>
                <div className="picker-header">
                    <h3>Cartes bannies <span className="kx-count">{banned.length}</span></h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="kx-hint">
                    Une carte bannie ne sort jamais au tirage aléatoire (Royaume, paysages, Fléau). Vous pouvez toujours la choisir vous-même.
                    {readOnly && ' Seul l\'hôte peut modifier la liste.'}
                </div>

                <div className="kx-banned-list">
                    {banned.length === 0 && <span className="kx-empty">Aucune carte bannie.</span>}
                    {banned.map(id => (
                        <span key={id} className="kx-chip kx-banned">
                            {nameOf(id)}
                            {!readOnly && <button onClick={() => toggle(id)} title="Ne plus bannir">✕</button>}
                        </span>
                    ))}
                    {!readOnly && banned.length > 0 && <button className="kx-clear" onClick={() => update([])}>Tout retirer</button>}
                </div>

                <div className="picker-controls">
                    <input type="text" placeholder="Rechercher une carte…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                    <select value={expansion} onChange={e => setExpansion(e.target.value)}>
                        <option value="">Toutes les extensions</option>
                        {expansions.map(x => <option key={x} value={x}>{(EXPANSION_LABELS as any)[x] ?? x}</option>)}
                    </select>
                </div>
                <div className="kx-grid">
                    {shown.map(c => (
                        <button
                            key={c.id}
                            className={`kx-toggle ${bannedSet.has(c.id) ? 'on' : ''}`}
                            onClick={() => toggle(c.id)}
                            disabled={readOnly}
                            title={bannedSet.has(c.id) ? 'Bannie : cliquer pour la remettre' : 'Cliquer pour bannir'}
                        >
                            {bannedSet.has(c.id) ? '🚫 ' : ''}{c.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
