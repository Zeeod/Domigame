import { GameState, PlayerState, EffectResult, CardInstance } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectManager } from '../EffectManager.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { ProphecyManager } from '../ProphecyManager.js';

export class TriggerEffectHandler {
    static handleRegisterTrigger(state: GameState, player: PlayerState, effect: any, sourceCardInstanceId?: string): EffectResult {
        if (!state.triggers) state.triggers = [];
        state.triggers.push({
            type: effect.trigger,
            playerId: player.id,
            effects: effect.effects,
            sourceCardInstanceId,
            filter: effect.filter,
            once: effect.duration !== 'PERMANENT' && !effect.isPermanent
        });
        return { state, needsChoice: false };
    }

    static handleMetricChange(state: GameState, player: PlayerState, metric: string, change: number): void {
        const triggers = state.triggers || [];
        const relevant = triggers.filter(t =>
            t.type === 'ON_PLAYER_METRIC_CHANGE' &&
            t.playerId === player.id &&
            (!t.filter || (t.filter.metric === metric && (t.filter.change === 'positive' ? change > 0 : true)))
        );

        if (relevant.length > 0) {
            const mapped = relevant.map((t, idx) => ({
                id: `metric_change_${metric}_${idx}_${Date.now()}`,
                sourceId: t.sourceCardInstanceId || 'SYSTEM',
                sourceType: 'DYNAMIC_TRIGGER' as any,
                description: `Changement de ${metric}`,
                effects: t.effects,
                context: { metric, change, sourceCardInstanceId: t.sourceCardInstanceId }
            }));

            EffectManager.resolveTriggers(state, player, mapped as any, `Effet sur changement de ${metric}`);

            // Clean up 'once' triggers
            state.triggers = state.triggers!.filter(t => {
                if (!t.once) return true;
                return !relevant.includes(t);
            });
        }
    }

    static handlePhaseTriggers(state: GameState, player: PlayerState, phaseTrigger: string, extraContext: any = {}): void {
        const triggers = this.scanForTriggers(state, player, phaseTrigger, extraContext);
        if (triggers.length > 0) {
            EffectManager.resolveTriggers(state, player, triggers, `Effets déclenchés (${phaseTrigger})`);
            
            // Clean up 'once' dynamic triggers that were executed
            const executedIndices = triggers.filter(t => (t as any).once && (t as any).originalIndex !== undefined).map(t => (t as any).originalIndex);
            if (executedIndices.length > 0 && state.triggers) {
                state.triggers = state.triggers.filter((_, i) => !executedIndices.includes(i));
            }
        }
    }

    public static scanForTriggers(state: GameState, player: PlayerState, triggerType: string, context: any = {}): any[] {
        const triggers: any[] = [];
        const timestamp = Date.now();

        // 1. Permanent/Static Triggers from cards in play & Hand & Tavern Mat (Reserve)
        const inPlay = player.playArea || [];
        const inHand = player.hand || [];
        const onTavern = player.tavernMat || player.mats?.['tavern'] || [];
        const triggerSources = [...inPlay, ...inHand, ...onTavern];

        for (const card of triggerSources) {
            const def = CardRegistry.get(card.id);
            if (def && def.triggers) {
                for (let i = 0; i < def.triggers.length; i++) {
                    const t = def.triggers[i];
                    if (t.trigger === triggerType) {
                        // Check filter if present
                        let matches = true;
                        if (t.filter) {
                            const targetId = context.cardId || context.boughtCardId || context.gainedCardId || '';
                            const targetDef = targetId ? CardRegistry.get(targetId) : undefined;

                            if (t.filter.cardTypes) {
                                if (!targetDef || !t.filter.cardTypes.some((type: string) => targetDef.types.includes(type as any))) {
                                    matches = false;
                                }
                            }
                            if (t.filter.cardIds) {
                                if (!t.filter.cardIds.includes(targetId)) {
                                    matches = false;
                                }
                            }
                        }

                        if (matches) {
                            triggers.push({
                                id: `trigger_${card.instanceId}_${i}_${timestamp}`,
                                sourceId: card.id,
                                sourceInstanceId: card.instanceId,
                                sourceType: 'CARD',
                                description: `${def.name} : ${triggerType}`,
                                effects: t.effects,
                                context: { ...context, sourceCardInstanceId: card.instanceId }
                            });
                        }
                    }
                }
            }
        }

        // 2. Dynamic Triggers (state.triggers)
        if (state.triggers) {
            for (let i = 0; i < state.triggers.length; i++) {
                const t = state.triggers[i];
                if (t.type === triggerType && t.playerId === player.id) {
                    // Check filter if present
                    let matches = true;
                    if (t.filter) {
                        const targetId = context.cardId || context.boughtCardId || context.gainedCardId || '';
                        const targetDef = targetId ? CardRegistry.get(targetId) : undefined;

                        if (t.filter.cardTypes) {
                            if (!targetDef || !t.filter.cardTypes.some((type: string) => targetDef.types.includes(type as any))) {
                                matches = false;
                            }
                        }
                        if (t.filter.cardIds) {
                            if (!t.filter.cardIds.includes(targetId)) {
                                matches = false;
                            }
                        }
                    }

                    if (matches) {
                        triggers.push({
                            id: `dynamic_trigger_${i}_${timestamp}`,
                            sourceId: t.sourceCardInstanceId || 'system',
                            sourceType: 'CARD', // Or 'RULE' if system
                            description: `Effet déclenché : ${triggerType}`,
                            effects: t.effects,
                            context: { ...context, sourceCardInstanceId: t.sourceCardInstanceId },
                            once: t.once,
                            originalIndex: i
                        });
                    }
                }
            }
        }

        // 3. Hand Reactions & Shadows
        if (triggerType === 'ON_DRAW') {
            const shadowTriggers = this.getShadowTriggers(player, context);
            triggers.push(...shadowTriggers);
        } else {
            const reactionType = triggerType.startsWith('ON_') ? triggerType.substring(3) : triggerType;
            const handReactions = this.getHandReactionTriggers(player, reactionType, context);
            triggers.push(...handReactions);
        }

        // 5. Omen & Play triggers (Rising Sun)
        if (triggerType === 'ON_PLAY') {
            const playedCard = context.cardInstanceId ?
                player.hand.find(c => c.instanceId === context.cardInstanceId) ||
                player.playArea.find(c => c.instanceId === context.cardInstanceId) :
                null;

            if (playedCard) {
                // Return trigger if matched (we used to check prophecy fulfillment here but moved it)
            }
        }

        return triggers;
    }

    public static getHandReactionTriggers(player: PlayerState, trigger: string, context: any): any[] {
        const reactions = player.hand.filter(c => {
            const def = CardRegistry.get(c.id);
            if (!def) return false;

            const isReaction = def.types.includes('REACTION') || (def as any).isReaction;
            if (!isReaction || def.reactionTrigger !== trigger) return false;

            if (def.reactionCondition) {
                if (def.reactionCondition.type === 'GAIN_TYPE') {
                    const cardId = context.boughtCardId || context.gainedCardId;
                    const gainedDef = cardId ? CardRegistry.get(cardId) : undefined;
                    if (!gainedDef || !gainedDef.types.includes(def.reactionCondition.value as any)) return false;
                }
            }
            return true;
        });

        return reactions.map(c => {
            const def = CardRegistry.get(c.id)!;
            return {
                id: `react_${c.instanceId}_${Date.now()}`,
                sourceId: c.id,
                sourceType: 'CARD',
                description: `Réaction : ${def.name}`,
                effects: [
                    {
                        type: 'SELECT_OPTION',
                        message: `Voulez-vous utiliser la réaction de ${def.name} ?`,
                        options: [
                            { label: 'Oui', effects: def.onReaction || (def as any).reactionEffects || [] },
                            { label: 'Non', effects: [] }
                        ]
                    } as any
                ],
                context: { ...context, sourceCardInstanceId: c.instanceId }
            };
        });
    }

    public static triggerOnGainEffects(state: GameState, player: PlayerState, card: CardInstance): EffectResult {
        const def = CardRegistry.get(card.id);
        if (!def) return { state, needsChoice: false };

        if (def.onGain) {
            const effects = Array.isArray(def.onGain) ? def.onGain : [def.onGain];
            for (let i = effects.length - 1; i >= 0; i--) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: effects[i],
                    context: { suppressLog: false, sourceCardInstanceId: card.instanceId }
                });
            }
        }

        this.handleOnGainTriggers(state, player, card);
        return { state, needsChoice: false };
    }

    public static handleOnGainTriggers(state: GameState, player: PlayerState, gainedCard: CardInstance | string): EffectResult {
        const gainedCardId = typeof gainedCard === 'string' ? gainedCard : gainedCard.id;
        const context = { gainedCardId };

        // Prophecy Check
        const gainedDef = CardRegistry.get(gainedCardId);
        const cardCost = EconomyEngine.getCardCost(state, player.id, gainedCardId);
        ProphecyManager.checkFulfillment(state, 'GAIN_CARD', { ...context, cardId: gainedCardId, cardType: gainedDef?.types, cardCost });

        // Plunder Trait Check: Gaining a card from a Traited pile
        const pile = state.supply[gainedCardId];
        if (pile && pile.traits) {
            for (const traitId of pile.traits) {
                // Apply flags to the instance if possible
                if (typeof gainedCard !== 'string') {
                    if (traitId === 'shy') gainedCard.shy = true;
                    if (traitId === 'inherited') {
                        gainedCard.inherited = true;
                        gainedCard.additionalTypes = [...(gainedCard.additionalTypes || []), 'HERITAGE'];
                    }
                }

                const traitDef = CardRegistry.get(traitId);
                if (traitDef?.onGain) {
                    const effects = Array.isArray(traitDef.onGain) ? traitDef.onGain : [traitDef.onGain];
                    for (let i = effects.length - 1; i >= 0; i--) {
                        state.effectStack.push({
                            type: 'EFFECT',
                            playerId: player.id,
                            effect: effects[i],
                            context: { suppressLog: false, sourceCardId: traitId, gainedCardId }
                        });
                    }
                }
            }
        }

        const triggers = this.scanForTriggers(state, player, 'ON_GAIN', context);
        if (triggers.length > 0) {
            EffectManager.resolveTriggers(state, player, triggers, "Lors du gain : choisissez l'ordre des effets");
        }
        return { state, needsChoice: false };
    }

    public static handleOnPlayTriggers(state: GameState, player: PlayerState, cardId: string, cardInstanceId: string): EffectResult {
        const context = { cardId, cardInstanceId };

        // Plunder Trait Check: Playing a card from a Traited pile
        const pile = state.supply[cardId];
        if (pile && pile.traits) {
            for (const traitId of pile.traits) {
                const traitDef = CardRegistry.get(traitId);
                if (traitDef?.onPlay) {
                    const effects = Array.isArray(traitDef.onPlay) ? traitDef.onPlay : [traitDef.onPlay];
                    for (let i = effects.length - 1; i >= 0; i--) {
                        state.effectStack.push({
                            type: 'EFFECT',
                            playerId: player.id,
                            effect: effects[i],
                            context: { suppressLog: false, sourceCardId: traitId, playedCardId: cardId, playedCardInstanceId: cardInstanceId }
                        });
                    }
                }
            }
        }

        const triggers = this.scanForTriggers(state, player, 'ON_PLAY', context);

        if (triggers.length > 0) {
            EffectManager.resolveTriggers(state, player, triggers, "Lors de la pose : choisissez l'ordre des effets");

            const dynamicTriggersIndicesToRemove = triggers
                .filter(t => t.once && t.originalIndex !== undefined)
                .map(t => t.originalIndex);

            if (dynamicTriggersIndicesToRemove.length > 0) {
                state.triggers = state.triggers.filter((_, idx) => !dynamicTriggersIndicesToRemove.includes(idx));
            }
        }
        return { state, needsChoice: false };
    }

    public static handleOnBuyTriggers(state: GameState, player: PlayerState, boughtCardId: string): void {
        const boughtCost = EconomyEngine.getCardCost(state, player.id, boughtCardId);
        const context = { boughtCardId, boughtCost };

        // Card's own onBuy effect (e.g. Mint, Farmland, Noble Brigand)
        const cardDef = CardRegistry.get(boughtCardId);
        if (cardDef?.onBuy) {
            const effects = Array.isArray(cardDef.onBuy) ? cardDef.onBuy : [cardDef.onBuy];
            for (let i = effects.length - 1; i >= 0; i--) {
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: player.id,
                    effect: effects[i],
                    context: { suppressLog: false, sourceCardId: boughtCardId }
                });
            }
        }

        // Plunder Trait Check: Buying a card from a Traited pile
        const pile = state.supply[boughtCardId];
        if (pile && pile.traits) {
            for (const traitId of pile.traits) {
                const traitDef = CardRegistry.get(traitId);
                if (traitDef?.onBuy) {
                    const effects = Array.isArray(traitDef.onBuy) ? traitDef.onBuy : [traitDef.onBuy];
                    for (let i = effects.length - 1; i >= 0; i--) {
                        state.effectStack.push({
                            type: 'EFFECT',
                            playerId: player.id,
                            effect: effects[i],
                            context: { suppressLog: false, sourceCardId: traitId, boughtCardId }
                        });
                    }
                }
            }
        }

        const triggers = this.scanForTriggers(state, player, 'ON_BUY', context);
        if (triggers.length > 0) {
            EffectManager.resolveTriggers(state, player, triggers, "À l'achat : choisissez l'ordre des effets");
        }
    }

    public static handleBuyPhaseEnd(state: GameState, player: PlayerState): void {
        const context = {};

        // Plunder Trait Check: Patient
        for (const pileId in state.supply) {
            const pile = state.supply[pileId];
            if (pile.traits?.includes('patient')) {
                const candidates = player.hand.filter(c => c.id === pileId);
                if (candidates.length > 0) {
                    state.effectStack.push({
                        type: 'EFFECT',
                        playerId: player.id,
                        effect: {
                            type: 'SELECT_OPTION',
                            message: `Patient : Voulez-vous mettre de côté un(e) ${CardRegistry.get(pileId)?.name} pour le/la jouer au début de votre prochain tour ?`,
                            options: [
                                {
                                    label: 'Oui',
                                    effects: [
                                        {
                                            type: 'CHOOSE_CARDS',
                                            message: 'Choisissez la carte à mettre de côté',
                                            constraints: { min: 1, max: 1, sourceZone: 'hand', filter: { cardIds: [pileId] } },
                                            onSelect: [
                                                { type: 'MOVE_TO_MAT', mat: 'patient_aside' },
                                                { type: 'REGISTER_TRIGGER', trigger: 'TURN_START', duration: 'ONCE', effects: [{ type: 'PLAY_FROM_MAT', mat: 'patient_aside' }] }
                                            ]
                                        } as any
                                    ]
                                },
                                { label: 'Non', effects: [] }
                            ]
                        },
                        context: { sourceCardId: 'patient', pileId }
                    });
                }
            }
        }

        const triggers = this.scanForTriggers(state, player, 'BUY_PHASE_END', context);
        if (triggers.length > 0) {
            EffectManager.resolveTriggers(state, player, triggers, "Fin de la phase d'Achat : choisissez l'ordre des effets");
        }
    }

    /**
     * Rising Sun: Shadows are played when a card is drawn.
     */
    public static handleOnDrawTriggers(state: GameState, player: PlayerState, drawnCards: CardInstance[]): void {
        if (drawnCards.length === 0) return;

        const context = { drawnIds: drawnCards.map(c => c.id) };
        const triggers = this.scanForTriggers(state, player, 'ON_DRAW', context);

        if (triggers.length > 0) {
            EffectManager.resolveTriggers(state, player, triggers, "Effets de pioche (Ombres) : choisissez l'ordre");
        }
    }

    public static getShadowTriggers(player: PlayerState, context: any): any[] {
        // Shadow cards in hand can be played when ANY card is drawn
        const shadows = player.hand.filter(c => {
            const def = CardRegistry.get(c.id);
            return def?.types.includes('SHADOW');
        });

        return shadows.map(c => {
            const def = CardRegistry.get(c.id)!;
            return {
                id: `shadow_${c.instanceId}_${Date.now()}`,
                sourceId: c.id,
                sourceInstanceId: c.instanceId,
                sourceType: 'CARD',
                description: `Ombre : ${def.name}`,
                effects: [
                    {
                        type: 'SELECT_OPTION',
                        message: `Voulez-vous jouer votre ${def.name} ?`,
                        options: [
                            {
                                label: 'Oui',
                                effects: [
                                    { type: 'PLAY_THIS_CARD' } as any
                                ]
                            },
                            { label: 'Non', effects: [] }
                        ]
                    } as any
                ],
                context: { ...context, sourceCardInstanceId: c.instanceId }
            };
        });
    }
}
