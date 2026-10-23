import { GameState, PlayerState, EffectResult, CardInstance } from '../GameState.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectManager } from '../EffectManager.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { ProphecyManager } from '../ProphecyManager.js';
import { EventBus } from '../EventBus.js';
import { peekMat } from '../Mats.js';

export class TriggerEffectHandler {
    static handleRegisterTrigger(state: GameState, player: PlayerState, effect: any, sourceCardInstanceId?: string): EffectResult {
        if (!state.triggers) state.triggers = [];
        const duration = effect.isPermanent ? 'PERMANENT' : effect.duration;
        // duration: PERMANENT (never expires) | ONCE (fires once, whenever) |
        //           TURN / UNTIL_TURN_END (this turn only) | UNTIL_NEXT_TURN (until the owner's next turn)
        const expires = (duration === 'TURN' || duration === 'UNTIL_TURN_END') ? 'END_OF_TURN'
            : duration === 'UNTIL_NEXT_TURN' ? 'START_OF_NEXT_TURN'
            : undefined;
        state.triggers.push({
            type: effect.trigger,
            playerId: player.id,
            effects: effect.effects,
            sourceCardInstanceId,
            filter: effect.filter,
            once: duration !== 'PERMANENT' && duration !== 'UNTIL_NEXT_TURN' && effect.repeat !== true && !effect.expiresOnTurnOf,
            expires,
            expiresOnTurnOf: effect.expiresOnTurnOf === 'ATTACKER' ? effect.attackerId : effect.expiresOnTurnOf,
            scope: effect.scope,
            runAs: effect.runAs,
            description: effect.description
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
        }
    }

    public static scanForTriggers(state: GameState, player: PlayerState, triggerType: string, context: any = {}): any[] {
        const triggers: any[] = [];
        const timestamp = Date.now();

        // 1. Permanent/Static Triggers from cards in play & Hand & Tavern Mat (Reserve)
        const inPlay = player.playArea || [];
        const inHand = player.hand || [];
        const onTavern = peekMat(player, 'tavern');
        // A card's own triggers work while it is in play; "fromHand" ones from the hand; "call" ones
        // (Reserve cards) from the Tavern mat, where they are optional.
        const triggerSources = [
            ...inPlay.map(c => ({ c, zone: 'play' })),
            ...inHand.map(c => ({ c, zone: 'hand' })),
            ...onTavern.map(c => ({ c, zone: 'tavern' })),
        ];

        for (const { c: card, zone } of triggerSources) {
            const def = CardRegistry.get(card.id);
            if (def && def.triggers) {
                for (let i = 0; i < def.triggers.length; i++) {
                    const t: any = def.triggers[i];
                    const tZone = t.call ? 'tavern' : t.fromHand ? 'hand' : 'play';
                    if (tZone !== zone) continue;
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
                            if (t.filter.maxCost !== undefined && targetId
                                && EconomyEngine.getCardCost(state, player.id, targetId) > t.filter.maxCost) matches = false;
                            if (t.filter.minCoins !== undefined && player.coins < t.filter.minCoins) matches = false;
                            if (t.filter.excludeTypes && targetDef
                                && t.filter.excludeTypes.some((x: string) => targetDef.types.includes(x as any))) matches = false;
                        }

                        if (matches && t.call) {
                            // Reserve: "you may call this" — move it from the Tavern mat into play, then its effects
                            triggers.push({
                                id: `call_${card.instanceId}_${i}_${timestamp}`,
                                sourceId: card.id,
                                sourceInstanceId: card.instanceId,
                                sourceType: 'CARD',
                                description: `Appeler ${def.name}`,
                                effects: [{
                                    type: 'SELECT_OPTION', message: `Appeler ${def.name} ?`,
                                    options: [
                                        { label: 'Appeler', effects: [{ type: 'CALL_RESERVE', instanceId: card.instanceId, to: t.callTo }, ...t.effects.map((e: any) => ({ ...e, callContext: context }))] },
                                        { label: 'Non', effects: [] }
                                    ]
                                }],
                                context: { ...context, sourceCardInstanceId: card.instanceId }
                            });
                        } else if (matches) {
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
        //   scope:  'SELF' (default: the owner's own events) | 'OTHERS' (another player's events) | 'ANY'
        //   runAs:  'OWNER' (default) | 'ACTOR' (the player who caused the event)
        //   filter: cardTypes, cardIds, minCost, maxCost, actorId, onActorsTurn, firstPerTurn (flag key)
        //   once:   removed as soon as it fires
        if (state.triggers) {
            const fired: any[] = [];
            const actorIsCurrent = state.players[state.currentPlayerIndex]?.id === player.id;
            for (let i = 0; i < state.triggers.length; i++) {
                const t: any = state.triggers[i];
                if (t.type !== triggerType) continue;
                const scope = t.scope || (t.filter?.otherPlayers ? 'OTHERS' : 'SELF');
                const isOwner = t.playerId === player.id;
                if (scope === 'SELF' && !isOwner) continue;
                if (scope === 'OTHERS' && isOwner) continue;

                const f = t.filter || {};
                const targetId = context.cardId || context.boughtCardId || context.gainedCardId || '';
                const targetDef = targetId ? CardRegistry.get(targetId) : undefined;
                if (f.cardTypes && !(targetDef && f.cardTypes.some((type: string) => targetDef.types.includes(type as any)))) continue;
                if (f.cardIds && !f.cardIds.includes(targetId)) continue;
                if ((f.minCost !== undefined || f.maxCost !== undefined) && targetId) {
                    const cost = EconomyEngine.getCardCost(state, player.id, targetId);
                    if (f.minCost !== undefined && cost < f.minCost) continue;
                    if (f.maxCost !== undefined && cost > f.maxCost) continue;
                }
                if (f.actorId && f.actorId !== player.id) continue;
                if (f.onActorsTurn && !actorIsCurrent) continue;
                if (f.firstPerTurn) {
                    const key = 'trigger_first_' + f.firstPerTurn;
                    if (player.turnFlags?.[key]) continue;
                    if (player.turnFlags) player.turnFlags[key] = true;
                }

                const runAs = t.runAs === 'ACTOR' ? player.id : t.playerId;
                triggers.push({
                    id: `dynamic_trigger_${i}_${timestamp}`,
                    sourceId: t.sourceCardInstanceId || 'system',
                    sourceType: 'CARD',
                    description: t.description || `Effet déclenché : ${triggerType}`,
                    effects: t.effects,
                    runAsPlayerId: runAs,
                    context: { ...context, sourceCardInstanceId: t.sourceCardInstanceId, actorId: player.id, ownerId: t.playerId },
                    once: t.once
                });
                if (t.once) fired.push(t);
            }
            if (fired.length) state.triggers = state.triggers.filter(t => !fired.includes(t));
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
        const gainedInstanceId = typeof gainedCard === 'string' ? undefined : gainedCard.instanceId;
        const context = { gainedCardId, gainedInstanceId };

        // Footpad: "In games using this, when you gain a card in an Action phase, +1 Card."
        if (state.phase === 'ACTION' && state.kingdomCards?.includes('footpad')) {
            state.effectStack.push({ type: 'EFFECT', playerId: player.id, effect: { type: 'DRAW', amount: 1 } as any, context: {} });
        }

        // Messenger: cards gained in your Buy phase
        if (state.phase === 'BUY' && state.players[state.currentPlayerIndex]?.id === player.id) {
            (player as any).buyPhaseGains = ((player as any).buyPhaseGains || 0) + 1;
        }

        // Cards gained during your own turn (Smugglers looks at the previous turn of the player to its right)
        if (state.players[state.currentPlayerIndex]?.id === player.id) {
            (player.gainedThisTurn = player.gainedThisTurn || []).push(gainedCardId);
        }

        EventBus.emit(state, { type: 'CARD_GAINED', playerId: player.id, context: { gainedCardId, gainedInstanceId } });


        // "When any player gains a <type>, you may play this from your hand" (Pirate)
        for (const p of state.players) {
            for (const c of p.hand) {
                const def = CardRegistry.get(c.id) as any;
                if (!def || def.reactionTrigger !== 'ANY_GAIN') continue;
                const cond = def.reactionCondition;
                if (cond?.type === 'GAIN_TYPE' && !CardRegistry.get(gainedCardId)?.types.includes(cond.value)) continue;
                if (cond?.type === 'GAIN_ID' && gainedCardId !== cond.value) continue;
                if (cond?.othersOnly && p.id === player.id) continue;
                state.effectStack.push({
                    type: 'EFFECT',
                    playerId: p.id,
                    effect: {
                        type: 'SELECT_OPTION',
                        message: def.reactionMessage || `Voulez-vous jouer ${def.name} depuis votre main ?`,
                        options: [
                            { label: 'Oui', effects: def.reactionEffects || [{ type: 'PLAY_THIS_CARD' }] },
                            { label: 'Non', effects: [] }
                        ]
                    } as any,
                    context: { sourceCardInstanceId: c.instanceId }
                });
            }
        }

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

        // Menagerie — Exile: when you gain a card, you may discard its copies from your Exile mat
        const exiled = peekMat(player, 'exile').filter(c => c.id === gainedCardId);
        if (exiled.length > 0) {
            const name = gainedDef?.name || gainedCardId;
            state.effectStack.push({
                type: 'EFFECT',
                playerId: player.id,
                effect: {
                    type: 'SELECT_OPTION',
                    message: `Défausser ${exiled.length} ${name} de votre Exil ?`,
                    options: [
                        { label: 'Oui', effects: [{ type: 'TAKE_FROM_MAT', mat: 'exile', targetCardIds: [gainedCardId], destination: 'discardPile' }] },
                        { label: 'Non', effects: [] }
                    ]
                } as any,
                context: { gainedCardId }
            });
        }
        return { state, needsChoice: false };
    }

    public static handleOnPlayTriggers(state: GameState, player: PlayerState, cardId: string, cardInstanceId: string): EffectResult {
        const context = { cardId, cardInstanceId };
        EventBus.emit(state, { type: 'CARD_PLAYED', playerId: player.id, context });

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
        }
        return { state, needsChoice: false };
    }

    public static handleOnBuyTriggers(state: GameState, player: PlayerState, boughtCardId: string): void {
        const boughtCost = EconomyEngine.getCardCost(state, player.id, boughtCardId);
        const context = { boughtCardId, boughtCost };
        EventBus.emit(state, { type: 'CARD_BOUGHT', playerId: player.id, context });

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
