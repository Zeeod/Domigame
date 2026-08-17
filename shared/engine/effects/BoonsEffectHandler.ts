import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectDefinition } from '../../types/EffectDefinition.js';
import { LogEntry } from '../../types/Log.js';

export class BoonsEffectHandler {
    static register() {
        EffectHandlerRegistry.register('RECEIVE_BOON', (state, player, effect, ctx) => {
            if (state.boonDeck.length === 0) {
                state.boonDeck = [...state.boonDiscard];
                state.boonDiscard = [];
                // shuffle
                for (let i = state.boonDeck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [state.boonDeck[i], state.boonDeck[j]] = [state.boonDeck[j], state.boonDeck[i]];
                }
            }
            if (state.boonDeck.length === 0) return { state, needsChoice: false }; // Still empty

            let boonId = (effect as any).boonId;

            if (!boonId) {
                boonId = state.boonDeck.shift();
                if (boonId) state.boonDiscard.push(boonId); // simple discard for now
            }

            if (!boonId) return { state, needsChoice: false };

            const boonDef = CardRegistry.get(boonId);
            if (boonDef && !ctx.suppressLog) {
                // Determine source for logging (if any)
                let sourceStr = '';
                if (ctx.sourceCardInstanceId) {
                    // Try to find the name of the source card
                    const allCards = player.playArea.concat(player.hand).concat(state.trash);
                    const sourceCard = allCards.find(c => c.id === ctx.sourceCardInstanceId);
                    if (sourceCard) {
                        const sourceCardId = (sourceCard as any).cardId || sourceCard.id;
                        const sourceDef = CardRegistry.get(sourceCardId);
                        if (sourceDef) sourceStr = ` (via ${sourceDef.name})`;
                    }
                }

                state.history.push({
                    id: `log_boon_${Date.now()}_${Math.random()}`,
                    timestamp: Date.now(),
                    type: 'TEXT',
                    message: `${player.name} reçoit l'Aubaine : ${boonDef.name}${sourceStr}.`,
                    playerId: player.id
                } as LogEntry);

                // Queue the boon's effects
                if (boonDef.effects) {
                    const nested = boonDef.effects.map(e => ({
                        type: 'EFFECT' as const,
                        playerId: player.id,
                        effect: e as EffectDefinition,
                        context: { ...ctx, sourceCardInstanceId: ctx.sourceCardInstanceId }
                    }));
                    state.effectStack.push(...nested.reverse());
                }
            }
            return { state, needsChoice: false };
        });

        EffectHandlerRegistry.register('DRUID_CHOOSE_BOON', (state, player) => {
            const druidSetup = state.landscapeState['druid_boons'];
            if (!druidSetup || !druidSetup.state || !druidSetup.state.boons) return { state, needsChoice: false };

            const boons: string[] = druidSetup.state.boons;

            state.pendingDecision = {
                id: `druid_choice_${Date.now()}`,
                playerId: player.id,
                type: 'SELECT_OPTION',
                message: "Choisissez une Aubaine à appliquer :",
                options: boons.map(b => {
                    const def = CardRegistry.get(b);
                    return {
                        label: def?.name || b,
                        value: b,
                        effects: [{ type: 'RECEIVE_BOON', boonId: b }] as any
                    };
                })
            };
            return { state, needsChoice: true };
        });
    }
}
