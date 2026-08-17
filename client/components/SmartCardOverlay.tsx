import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { CardInstance } from '../../shared/engine/CardInstance';
import { Prompt, PromptType } from '../../shared/engine/prompts/Prompt';
import { PublicGameView } from '../../shared/view/PublicGameView';
import { CardFrame } from './CardFrame';
import './SmartCardOverlay.css';

export interface CompositeBucketDefinition {
    id: string;
    label: string;
    min?: number;
    max?: number;
    reorder?: boolean;
}

export interface SmartOverlayProps {
    cards: CardInstance[];
    sourceName: string;

    // COMPOSITE PROTOCOL
    buckets?: CompositeBucketDefinition[];
    globalConstraints?: { minTotal?: number; maxTotal?: number };

    // LEGACY ZONES (Supported for backward compatibility during migration)
    enableTrashZone?: boolean;
    enableDiscardZone?: boolean;
    enableDeckZone?: boolean;

    // INTERACTION MODE
    interactionType?: 'DRAG_SORT' | 'CLICK_SELECT';
    selectionLimit?: { min: number; max: number };

    // CENTER ZONE CONFIG
    centerBucketId?: string;
    centerLabel?: string;
    centerReorderable?: boolean;

    onConfirm: (result: any) => void;
}

export const SmartCardOverlay: React.FC<SmartOverlayProps> = ({
    cards,
    sourceName,
    buckets: propBuckets,
    globalConstraints,
    enableTrashZone = false,
    enableDiscardZone = false,
    enableDeckZone = true,
    interactionType = 'DRAG_SORT',
    selectionLimit: _selectionLimit,
    centerBucketId,
    centerLabel,
    centerReorderable = false,
    onConfirm
}) => {
    // Determine buckets: either from propBuckets or legacy flags
    const buckets = useMemo(() => propBuckets || [
        ...(enableTrashZone ? [{ id: 'trash', label: 'Écarter' }] : []),
        ...(enableDiscardZone ? [{ id: 'discard', label: 'Défausser' }] : []),
        ...(enableDeckZone ? [{ id: 'topdeck', label: 'Sur la pioche', reorder: true }] : [])
    ], [propBuckets, enableTrashZone, enableDiscardZone, enableDeckZone]);

    // --- State ---
    const [centerCards, setCenterCards] = useState<CardInstance[]>(() => [...cards]);
    const [bucketStates, setBucketStates] = useState<Record<string, CardInstance[]>>(
        () => Object.fromEntries(buckets.map((b: CompositeBucketDefinition) => [b.id, []]))
    );

    // Sync state only when the actual card set changes
    const prevCardKeyRef = useRef<string>('');
    useEffect(() => {
        const currentKey = cards.map(c => c.instanceId).sort().join(',');
        if (currentKey !== prevCardKeyRef.current) {
            prevCardKeyRef.current = currentKey;
            setCenterCards([...cards]);
            setBucketStates(Object.fromEntries(buckets.map(b => [b.id, []])));
        }
    }, [cards, buckets]);

    const zoneRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});

    useEffect(() => {
        const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
            center: React.createRef<HTMLDivElement>()
        };
        buckets.forEach((b: CompositeBucketDefinition) => {
            refs[b.id] = React.createRef<HTMLDivElement>();
        });
        zoneRefs.current = refs;
    }, [buckets]);

    // --- Helpers ---
    const isOverZone = (point: { x: number; y: number }, ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return false;
        const rect = ref.current.getBoundingClientRect();
        return (
            point.x >= rect.left &&
            point.x <= rect.right &&
            point.y >= rect.top &&
            point.y <= rect.bottom
        );
    };

    const moveCardToZone = (card: CardInstance, fromZoneId: string, targetZoneId: string) => {
        const instanceId = card.instanceId;
        const removeFrom = (list: CardInstance[]) => list.filter(c => c.instanceId !== instanceId);

        if (fromZoneId === 'center') {
            setCenterCards(prev => removeFrom(prev));
        } else {
            setBucketStates(prev => ({ ...prev, [fromZoneId]: removeFrom(prev[fromZoneId] || []) }));
        }

        if (targetZoneId === 'center') {
            setCenterCards(prev => [...prev, card]);
        } else {
            setBucketStates(prev => ({
                ...prev,
                [targetZoneId]: [...(prev[targetZoneId] || []), card]
            }));
        }
    };

    const moveWithinBucket = (bucketId: string, idx: number, direction: 'UP' | 'DOWN') => {
        const cards = bucketId === 'center' ? [...centerCards] : [...(bucketStates[bucketId] || [])];
        const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= cards.length) return;

        [cards[idx], cards[targetIdx]] = [cards[targetIdx], cards[idx]];

        if (bucketId === 'center') {
            setCenterCards(cards);
        } else {
            setBucketStates(prev => ({ ...prev, [bucketId]: cards }));
        }
    };

    // --- Validation ---
    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        let totalAssigned = 0;

        buckets.forEach((b: CompositeBucketDefinition) => {
            const count = bucketStates[b.id]?.length || 0;
            totalAssigned += count;
            if (b.min !== undefined && count < b.min) errors.push(`${b.label} : min ${b.min} carte(s)`);
            if (b.max !== undefined && count > b.max) errors.push(`${b.label} : max ${b.max} carte(s)`);
        });

        if (globalConstraints?.minTotal !== undefined && totalAssigned < globalConstraints.minTotal) {
            errors.push(`Total : min ${globalConstraints.minTotal} carte(s)`);
        }
        if (globalConstraints?.maxTotal !== undefined && totalAssigned > globalConstraints.maxTotal) {
            errors.push(`Total : max ${globalConstraints.maxTotal} carte(s)`);
        }

        // Mandatory assignment check (if centerBucketId is NOT "keep", cards must be moved out of center usually)
        if (!centerBucketId && centerCards.length > 0) {
            // By default we assume cards in center are "pending"
            // errors.push("Assignez toutes les cartes"); 
        }

        return errors;
    }, [buckets, bucketStates, globalConstraints, centerBucketId, centerCards.length]);

    const canConfirm = validationErrors.length === 0;

    const handleConfirm = () => {
        if (!canConfirm) return;

        const finalDecisions: Record<string, string[]> = {};
        for (const bucketId in bucketStates) {
            finalDecisions[bucketId] = (bucketStates[bucketId] || []).map(c => c.instanceId);
        }

        const bucketIdForCenter = centerBucketId || 'keep';
        finalDecisions[bucketIdForCenter] = [...(finalDecisions[bucketIdForCenter] || []), ...centerCards.map(c => c.instanceId)];

        onConfirm({
            type: 'COMPOSITE_RESPONSE',
            decisions: finalDecisions
        });
    };

    const handleDragEnd = (card: CardInstance, fromZoneId: string, info: PanInfo) => {
        const point = info.point;
        let targetZoneId = fromZoneId;

        for (const zoneId in zoneRefs.current) {
            if (isOverZone(point, zoneRefs.current[zoneId])) {
                targetZoneId = zoneId;
                break;
            }
        }

        if (targetZoneId !== fromZoneId) {
            moveCardToZone(card, fromZoneId, targetZoneId);
        }
    };

    const renderCardInZone = (card: CardInstance, zoneId: string, idx: number, isReorderable: boolean) => (
        <div
            key={card.instanceId}
            className="stacked-card-wrapper"
            style={{
                zIndex: idx + 10,
                transform: `translateY(${idx * 35}px)`
            }}
        >
            <motion.div
                drag={interactionType === 'DRAG_SORT'}
                onDragEnd={(_: any, info: PanInfo) => handleDragEnd(card, zoneId, info)}
                dragSnapToOrigin
                whileDrag={{ scale: 1.1, zIndex: 1000 }}
                className="draggable-card"
            >
                <CardFrame cardId={card.id} />
                {isReorderable && (
                    <div className="reorder-badges">
                        <span className="rank-badge">{idx === 0 ? 'TOP' : `#${idx + 1}`}</span>
                        <div className="reorder-arrows">
                            <button className="arrow-btn" onClick={(e) => { e.stopPropagation(); moveWithinBucket(zoneId, idx, 'UP'); }} disabled={idx === 0}>▲</button>
                            <button className="arrow-btn" onClick={(e) => { e.stopPropagation(); moveWithinBucket(zoneId, idx, 'DOWN'); }} disabled={idx === (zoneId === 'center' ? centerCards.length : bucketStates[zoneId].length) - 1}>▼</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );

    return (
        <div className="smart-overlay-window unified-mode">
            <div className="smart-header">
                <h2 className="smart-title">{sourceName}</h2>
                <div className="validation-bar">
                    {validationErrors.length > 0 ? (
                        <span className="validation-msg error">⚠️ {validationErrors[0]}</span>
                    ) : (
                        <span className="validation-msg success">✓ Prêt à valider</span>
                    )}
                </div>
            </div>

            <div className="smart-content">
                {/* LEFT BUCKETS */}
                <div className="side-zone-container">
                    {buckets.slice(0, Math.ceil(buckets.length / 2)).map((bucket: CompositeBucketDefinition) => (
                        <div
                            key={bucket.id}
                            ref={zoneRefs.current[bucket.id]}
                            className={`smart-zone side-zone ${bucket.id}-zone`}
                        >
                            <label className="zone-label">{bucket.label}</label>
                            <div className="zone-stack">
                                {(bucketStates[bucket.id] || []).map((card, idx) =>
                                    renderCardInZone(card, bucket.id, idx, !!bucket.reorder)
                                )}
                                {(bucketStates[bucket.id] || []).length === 0 && (
                                    <div className="zone-placeholder">
                                        {bucket.id === 'trash' ? '💀' : bucket.id === 'discard' ? '🗑️' : '📥'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CENTER AREA */}
                <div
                    className="smart-zone center-zone"
                    ref={zoneRefs.current['center']}
                >
                    <label className="zone-label">{centerLabel || 'Choix disponibles'}</label>
                    <div className="center-card-grid">
                        {centerCards.map((card, idx) => (
                            <motion.div
                                key={card.instanceId}
                                drag={interactionType === 'DRAG_SORT'}
                                onDragEnd={(_: any, info: PanInfo) => handleDragEnd(card, 'center', info)}
                                dragSnapToOrigin
                                whileDrag={{ scale: 1.1, zIndex: 1000 }}
                                className="draggable-card"
                            >
                                <CardFrame cardId={card.id} />
                                {centerReorderable && (
                                    <div className="reorder-arrows horizontal">
                                        <button className="arrow-btn" onClick={() => moveWithinBucket('center', idx, 'UP')}>◀</button>
                                        <button className="arrow-btn" onClick={() => moveWithinBucket('center', idx, 'DOWN')}>▶</button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {centerCards.length === 0 && (
                            <p className="all-assigned-msg">Toutes les cartes ont été assignées</p>
                        )}
                    </div>
                </div>

                {/* RIGHT BUCKETS */}
                <div className="side-zone-container">
                    {buckets.slice(Math.ceil(buckets.length / 2)).map((bucket: CompositeBucketDefinition) => (
                        <div
                            key={bucket.id}
                            ref={zoneRefs.current[bucket.id]}
                            className={`smart-zone side-zone ${bucket.id}-zone`}
                        >
                            <label className="zone-label">{bucket.label}</label>
                            <div className="zone-stack">
                                {(bucketStates[bucket.id] || []).map((card, idx) =>
                                    renderCardInZone(card, bucket.id, idx, !!bucket.reorder)
                                )}
                                {(bucketStates[bucket.id] || []).length === 0 && (
                                    <div className="zone-placeholder">📥</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="smart-footer">
                <button
                    className="confirm-btn-medieval"
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                >
                    Confirmer les choix
                </button>
            </div>
        </div>
    );
};

export function mapDecisionToOverlayProps(decision: Prompt, _gameView: PublicGameView): Omit<SmartOverlayProps, 'onConfirm'> | null {
    // We only want the SmartCardOverlay for complex, composite drag-and-drop scenarios.
    // Basic NO/YES, options, or simple card selections should return null so ChoiceModalV2 handles them.
    if (decision.type !== PromptType.COMPOSITE_FILTER && decision.type !== PromptType.SENTRY_INTERACTION) {
        return null;
    }

    let cards: CardInstance[] = [];
    if (decision.context && decision.context.cards) {
        cards = decision.context.cards;
    }

    return {
        cards,
        sourceName: decision.message || (decision.type === PromptType.SENTRY_INTERACTION ? "Sentinelle" : "Décision Composite"),
        buckets: decision.context?.buckets,
        globalConstraints: decision.context?.globalConstraints,
        interactionType: 'DRAG_SORT',
        enableTrashZone: decision.type === PromptType.SENTRY_INTERACTION && !decision.context?.buckets,
        enableDiscardZone: decision.type === PromptType.SENTRY_INTERACTION && !decision.context?.buckets,
        enableDeckZone: !decision.context?.buckets,
        centerBucketId: decision.context?.centerBucketId,
        centerLabel: decision.context?.centerLabel,
        centerReorderable: decision.context?.centerReorderable
    };
}
